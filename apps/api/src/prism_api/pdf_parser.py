from __future__ import annotations

import hashlib
import json
import math
import re
from dataclasses import dataclass
from pathlib import Path
from statistics import median
from types import TracebackType
from typing import Any, Self

import pypdfium2 as pdfium

from prism_api.models import DocumentRegion, ElementKind, PageStatus

PARSER_VERSION = "native-pdfium-v9-soft-hyphen-line-joins"
SECTION_HEADING = re.compile(r"^(?:chapter\s+\d+|\d+(?:\.\d+)+\.?)\s+\S", re.IGNORECASE)
NUMBERED_HEADING = re.compile(r"^\d+\.\s+[A-Z][^.!?]{0,70}$")
FRONT_MATTER_HEADING = re.compile(
    r"(?:\d+\s+)?(?:"
    r"(?:table of )?contents|list of (?:figures|tables)|preface|foreword|"
    r"acknowledg(?:e)?ments?|about (?:this book|the authors?)|copyright"
    r")(?:\s+\d+)?"
)
CHAPTER_ORDINAL = (
    r"(?:\d+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten|"
    r"eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)"
)
CHAPTER_BOUNDARY = re.compile(
    rf"chapter\s+{CHAPTER_ORDINAL}(?:\s*[:\-\u2013\u2014]\s*[A-Z][^.!?]{{0,90}})?",
    re.IGNORECASE,
)
CHAPTER_ORDINAL_LINE = re.compile(CHAPTER_ORDINAL, re.IGNORECASE)
SECTION_BOUNDARY = re.compile(r"\d+(?:\.\d+)+\.?\s+[A-Z][^.!?]{0,100}$")
CAPTION_PATTERN = re.compile(
    r"^(?:figure|fig\.|table)\s+(?>[A-Z]?\d+(?:[.\-]\d+)*)(?:\.:|:|\.)\s*",
    re.IGNORECASE,
)
CODE_MARKERS = ("->", " - > ", ":=", "{", "}", " end if", " send (")
TOC_ROW = re.compile(
    r"(?:\.{2,}\s*\d+\s*$|^\d+(?:\.\d+)*\s+[A-Za-z][A-Za-z0-9 ,:'()&+\-/]{2,}\s+\d+\s*$)"
)
INDEX_ROW = re.compile(r"^[A-Z][^,]{1,45},\s*(?:\d+[a-z]?(?:[-,]\s*)?){2,}$")
REFERENCE_ROW = re.compile(r"^(?:\[?\d+\]?\s+|.*\b(?:19|20)\d{2}[a-z]?\b.*)")
MAX_VISUALS_PER_PAGE = 8


@dataclass(slots=True)
class TextLine:
    text: str
    left: float
    bottom: float
    right: float
    top: float

    @property
    def height(self) -> float:
        return self.top - self.bottom

    @property
    def center_y(self) -> float:
        return (self.top + self.bottom) / 2


@dataclass(frozen=True, slots=True)
class VisualCandidate:
    bbox_normalized: list[float]
    object_type: int
    confidence: float


class PdfParseSession:
    """One bounded document handle reused across sequential page extraction."""

    def __init__(self, path: Path, *, parser_version: str) -> None:
        self.document: Any = pdfium.PdfDocument(path)
        self.parser_version = parser_version
        self._region_cache: dict[int, DocumentRegion] = {}

    def __enter__(self) -> Self:
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        self.document.close()

    @property
    def page_count(self) -> int:
        return len(self.document)

    def parse_page(self, source_hash: str, page_index: int) -> list[dict[str, Any]]:
        page = self.document[page_index]
        try:
            width, height = page.get_size()
            text_page = page.get_textpage()
            try:
                raw_lines = NativePdfParser._extract_lines(text_page)
            finally:
                text_page.close()

            grouped_lines = NativePdfParser._group_paragraphs(raw_lines)
            raw_text = [normalize_text(line.text) for line in raw_lines]
            document_region = self._resolve_document_region(raw_text, page_index)
            typical_line_height = (
                median([line.height for line in raw_lines if line.height > 0]) if raw_lines else 1.0
            )

            records = build_text_records(
                grouped_lines,
                width,
                height,
                document_region,
                typical_line_height,
            )
            records.extend(detect_visual_records(page, records, width, height, document_region))
        finally:
            page.close()

        return finalize_page_records(
            records,
            source_hash=source_hash,
            page_index=page_index,
            parser_version=self.parser_version,
        )

    def _resolve_document_region(self, raw_text: list[str], page_index: int) -> DocumentRegion:
        if has_front_matter_heading(raw_text):
            self._region_cache[page_index] = DocumentRegion.FRONT_MATTER
            return DocumentRegion.FRONT_MATTER

        local_region = classify_document_region(raw_text, page_index, self.page_count)
        body_boundary = has_body_boundary(raw_text)
        if local_region != DocumentRegion.BODY:
            if body_boundary:
                self._region_cache[page_index] = DocumentRegion.BODY
                return DocumentRegion.BODY
            self._region_cache[page_index] = local_region
            return local_region
        if body_boundary:
            self._region_cache[page_index] = DocumentRegion.BODY
            return DocumentRegion.BODY

        near_front = self.page_count >= 20 and page_index < max(
            12, math.ceil(self.page_count * 0.08)
        )
        near_back = self.page_count >= 20 and page_index >= self.page_count - max(
            14, math.ceil(self.page_count * 0.1)
        )
        if near_front or near_back:
            for previous_index in range(page_index - 1, max(-1, page_index - 4), -1):
                previous_region = self._region_cache.get(previous_index)
                if previous_region is None:
                    previous_region = self._local_region_for_page(previous_index)
                if previous_region != DocumentRegion.BODY:
                    self._region_cache[page_index] = previous_region
                    return previous_region
                if self._page_has_body_boundary(previous_index):
                    break

        self._region_cache[page_index] = local_region
        return local_region

    def _local_region_for_page(self, page_index: int) -> DocumentRegion:
        lines = self._raw_text_for_page(page_index)
        return classify_document_region(lines, page_index, self.page_count)

    def _page_has_body_boundary(self, page_index: int) -> bool:
        return has_body_boundary(self._raw_text_for_page(page_index))

    def _raw_text_for_page(self, page_index: int) -> list[str]:
        page = self.document[page_index]
        try:
            text_page = page.get_textpage()
            try:
                return [
                    normalize_text(line.text) for line in NativePdfParser._extract_lines(text_page)
                ]
            finally:
                text_page.close()
        finally:
            page.close()


class NativePdfParser:
    """Deterministic clean-PDF parser with lazy, source-faithful visual regions."""

    version = PARSER_VERSION

    def open(self, path: Path) -> PdfParseSession:
        return PdfParseSession(path, parser_version=self.version)

    def page_count(self, path: Path) -> int:
        with self.open(path) as session:
            return session.page_count

    def parse_page(self, path: Path, source_hash: str, page_index: int) -> list[dict[str, Any]]:
        with self.open(path) as session:
            return session.parse_page(source_hash, page_index)

    def render_region(
        self,
        path: Path,
        page_index: int,
        bbox_normalized: list[float],
        output_path: Path,
    ) -> None:
        """Render one bounded source region to a cached WebP without loading the full PDF."""

        document: Any = pdfium.PdfDocument(path)
        try:
            page = document[page_index]
            try:
                width, height = page.get_size()
                left = bbox_normalized[0] * width
                top = (1 - bbox_normalized[1]) * height
                right = bbox_normalized[2] * width
                bottom = (1 - bbox_normalized[3]) * height
                padding = min(width, height) * 0.005
                region_width = max(1.0, right - left + padding * 2)
                region_height = max(1.0, top - bottom + padding * 2)
                scale = max(1.0, min(2.25, 1200 / region_width, 1000 / region_height))
                crop = (
                    max(0.0, left - padding),
                    max(0.0, bottom - padding),
                    max(0.0, width - right - padding),
                    max(0.0, height - top - padding),
                )
                bitmap = page.render(
                    scale=scale,
                    crop=crop,
                    rev_byteorder=True,
                    fill_color=(246, 242, 233, 255),
                )
                try:
                    source_image = bitmap.to_pil()
                    rendered = source_image.convert("RGB")
                    try:
                        output_path.parent.mkdir(parents=True, exist_ok=True)
                        temporary_path = output_path.with_suffix(".tmp")
                        rendered.save(
                            temporary_path,
                            format="WEBP",
                            quality=86,
                            method=4,
                        )
                        temporary_path.replace(output_path)
                    finally:
                        rendered.close()
                        source_image.close()
                finally:
                    bitmap.close()
            finally:
                page.close()
        finally:
            document.close()

    @staticmethod
    def _extract_lines(text_page: Any) -> list[TextLine]:
        rectangles: list[TextLine] = []
        for index in range(text_page.count_rects(0, -1)):
            left, bottom, right, top = text_page.get_rect(index)
            text = text_page.get_text_bounded(left, bottom, right, top)
            if text and text.strip():
                rectangles.append(TextLine(text, left, bottom, right, top))

        lines: list[TextLine] = []
        for rectangle in rectangles:
            if lines and same_visual_line(lines[-1], rectangle):
                previous = lines[-1]
                previous.text = join_text(previous.text, rectangle.text, dehyphenate=True)
                previous.left = min(previous.left, rectangle.left)
                previous.bottom = min(previous.bottom, rectangle.bottom)
                previous.right = max(previous.right, rectangle.right)
                previous.top = max(previous.top, rectangle.top)
            else:
                lines.append(rectangle)
        return lines

    @staticmethod
    def _group_paragraphs(lines: list[TextLine]) -> list[TextLine]:
        paragraphs: list[TextLine] = []
        previous_line: TextLine | None = None
        for line in lines:
            if paragraphs and previous_line and not paragraph_boundary(previous_line, line):
                previous = paragraphs[-1]
                previous.text = join_text(
                    previous.text.rstrip(), line.text.lstrip(), dehyphenate=True
                )
                previous.left = min(previous.left, line.left)
                previous.bottom = min(previous.bottom, line.bottom)
                previous.right = max(previous.right, line.right)
                previous.top = max(previous.top, line.top)
            else:
                paragraphs.append(line)
            previous_line = line
        return paragraphs


def finalize_page_records(
    records: list[dict[str, Any]],
    *,
    source_hash: str,
    page_index: int,
    parser_version: str,
) -> list[dict[str, Any]]:
    """Return deterministic, unique elements without preserving duplicated PDF artifacts.

    PDF object streams can expose the same visual text rectangle more than once.  The
    source region is still one region, so keeping an exact duplicate would both repeat
    the text in a lesson and collide with the durable element identity.  Distinct
    records that happen to share a text/bounds hash receive a stable occurrence suffix
    instead of relying on an implicit SQLite constraint failure.
    """

    unique_by_signature: dict[str, dict[str, Any]] = {}
    for record in records:
        signature = record_signature(record)
        unique_by_signature.setdefault(signature, record)

    ordered = sorted(
        unique_by_signature.values(),
        key=lambda item: (
            item["bbox_normalized"][1],
            item["bbox_normalized"][0],
            0 if item["kind"] == ElementKind.HEADING else 1,
            record_signature(item),
        ),
    )
    occurrences: dict[str, int] = {}
    for reading_order, record in enumerate(ordered):
        identity = (
            f"{parser_version}:{record['kind']}:{record['bbox_normalized']}:{record['text']}"
        )
        element_hash = hashlib.sha256(identity.encode("utf-8")).hexdigest()[:12]
        occurrence = occurrences.get(element_hash, 0)
        occurrences[element_hash] = occurrence + 1
        suffix = "" if occurrence == 0 else f"_{occurrence + 1}"
        record["id"] = f"el_{source_hash[:12]}_{page_index + 1:04d}_{element_hash}{suffix}"
        record["reading_order"] = reading_order
        record["parser_version"] = parser_version
    return ordered


def record_signature(record: dict[str, Any]) -> str:
    """Stable semantic identity used only for exact duplicate detection and ordering."""

    return json.dumps(
        {
            "bbox_normalized": record["bbox_normalized"],
            "confidence": record["confidence"],
            "document_region": str(record["document_region"]),
            "kind": str(record["kind"]),
            "playback_eligible": bool(record["playback_eligible"]),
            "status": str(record["status"]),
            "text": str(record["text"]),
        },
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    )


def build_text_records(
    lines: list[TextLine],
    width: float,
    height: float,
    document_region: DocumentRegion,
    typical_line_height: float,
) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for line in lines:
        cleaned = normalize_text(line.text)
        if not cleaned:
            continue
        bbox = normalize_bbox(line, width, height)
        kind = classify_kind(cleaned, bbox, line.height, typical_line_height)
        status = page_status(cleaned)
        records.append(
            {
                "kind": kind,
                "text": cleaned,
                "bbox_normalized": bbox,
                "status": status,
                "document_region": document_region,
                "playback_eligible": (
                    document_region == DocumentRegion.BODY and kind != ElementKind.FURNITURE
                ),
                "confidence": {
                    "text": 0.98 if status == PageStatus.TRUSTED_FOR_TRANSFORM else 0.62,
                    "order": 0.86,
                    "structure": 0.76 if kind != ElementKind.FURNITURE else 0.95,
                },
            }
        )
    return records


def detect_visual_records(
    page: Any,
    text_records: list[dict[str, Any]],
    width: float,
    height: float,
    document_region: DocumentRegion,
) -> list[dict[str, Any]]:
    captions = [record for record in text_records if record["kind"] == ElementKind.CAPTION]
    candidates: list[VisualCandidate] = []
    seen_boxes: set[tuple[float, float, float, float]] = set()
    object_types = [pdfium.raw.FPDF_PAGEOBJ_IMAGE, pdfium.raw.FPDF_PAGEOBJ_PATH]
    for page_object in page.get_objects(filter=object_types):
        try:
            raw_bbox = page_object.get_bounds()
        except Exception:
            continue
        if not all(math.isfinite(value) for value in raw_bbox):
            continue
        left, bottom, right, top = raw_bbox
        normalized = normalize_raw_bbox(left, bottom, right, top, width, height)
        visual_width = normalized[2] - normalized[0]
        visual_height = normalized[3] - normalized[1]
        area = visual_width * visual_height
        is_image = page_object.type == pdfium.raw.FPDF_PAGEOBJ_IMAGE
        meaningful = (
            0.12 <= visual_width <= 0.94
            and 0.05 <= visual_height <= 0.75
            and 0.008 <= area <= 0.55
            and normalized[1] > 0.045
            and normalized[3] < 0.955
            and (is_image or area >= 0.035)
        )
        if not meaningful:
            continue
        box_key = (
            round(normalized[0], 3),
            round(normalized[1], 3),
            round(normalized[2], 3),
            round(normalized[3], 3),
        )
        if box_key in seen_boxes:
            continue
        seen_boxes.add(box_key)
        candidates.append(
            VisualCandidate(
                bbox_normalized=normalized,
                object_type=page_object.type,
                confidence=0.95 if is_image else 0.86,
            )
        )

    candidates = merge_visual_candidates(candidates)
    candidates.sort(
        key=lambda candidate: (
            candidate.bbox_normalized[1],
            candidate.bbox_normalized[0],
        )
    )
    records: list[dict[str, Any]] = []
    matched_caption_ids: set[int] = set()
    for candidate in candidates[:MAX_VISUALS_PER_PAGE]:
        caption = nearest_caption(candidate.bbox_normalized, captions)
        if (
            caption is None
            and candidate.object_type == pdfium.raw.FPDF_PAGEOBJ_PATH
            and overlapping_text_length(candidate.bbox_normalized, text_records) > 80
        ):
            continue
        caption_text = str(caption["text"]) if caption else ""
        if caption is not None:
            matched_caption_ids.add(id(caption))
        kind = (
            ElementKind.TABLE
            if caption_text.casefold().startswith("table ")
            else ElementKind.FIGURE
        )
        records.append(
            visual_record(
                kind,
                caption_text,
                candidate.bbox_normalized,
                document_region,
                candidate.confidence,
            )
        )

    for caption in captions:
        if id(caption) in matched_caption_ids or len(records) >= MAX_VISUALS_PER_PAGE:
            continue
        caption_text = str(caption["text"])
        kind = (
            ElementKind.TABLE
            if caption_text.casefold().startswith("table ")
            else ElementKind.FIGURE
        )
        records.append(
            visual_record(
                kind,
                caption_text,
                caption_guided_bbox(caption["bbox_normalized"], kind, text_records),
                document_region,
                0.72,
            )
        )
    return records


def overlapping_text_length(visual_bbox: list[float], text_records: list[dict[str, Any]]) -> int:
    total = 0
    for record in text_records:
        if record["kind"] in {ElementKind.CAPTION, ElementKind.FURNITURE}:
            continue
        text_bbox = record["bbox_normalized"]
        text_area = rectangle_area(text_bbox)
        if text_area > 0 and rectangle_intersection(visual_bbox, text_bbox) / text_area >= 0.35:
            total += len(str(record["text"]))
    return total


def merge_visual_candidates(candidates: list[VisualCandidate]) -> list[VisualCandidate]:
    merged: list[VisualCandidate] = []
    for candidate in sorted(
        candidates,
        key=lambda item: rectangle_area(item.bbox_normalized),
        reverse=True,
    ):
        for index, existing in enumerate(merged):
            overlap = rectangle_intersection(candidate.bbox_normalized, existing.bbox_normalized)
            smaller_area = min(
                rectangle_area(candidate.bbox_normalized),
                rectangle_area(existing.bbox_normalized),
            )
            if smaller_area > 0 and overlap / smaller_area >= 0.45:
                merged[index] = VisualCandidate(
                    bbox_normalized=[
                        min(candidate.bbox_normalized[0], existing.bbox_normalized[0]),
                        min(candidate.bbox_normalized[1], existing.bbox_normalized[1]),
                        max(candidate.bbox_normalized[2], existing.bbox_normalized[2]),
                        max(candidate.bbox_normalized[3], existing.bbox_normalized[3]),
                    ],
                    object_type=existing.object_type,
                    confidence=max(candidate.confidence, existing.confidence),
                )
                break
        else:
            merged.append(candidate)
    return merged[:MAX_VISUALS_PER_PAGE]


def rectangle_area(bbox: list[float]) -> float:
    return max(0.0, bbox[2] - bbox[0]) * max(0.0, bbox[3] - bbox[1])


def rectangle_intersection(left: list[float], right: list[float]) -> float:
    width = max(0.0, min(left[2], right[2]) - max(left[0], right[0]))
    height = max(0.0, min(left[3], right[3]) - max(left[1], right[1]))
    return width * height


def visual_record(
    kind: ElementKind,
    caption: str,
    bbox: list[float],
    document_region: DocumentRegion,
    confidence: float,
) -> dict[str, Any]:
    return {
        "kind": kind,
        "text": caption,
        "bbox_normalized": bbox,
        "status": PageStatus.TRUSTED_FOR_TRANSFORM,
        "document_region": document_region,
        "playback_eligible": document_region == DocumentRegion.BODY,
        "confidence": {
            "text": 0.98 if caption else 0.0,
            "order": 0.82,
            "structure": confidence,
        },
    }


def nearest_caption(
    visual_bbox: list[float], captions: list[dict[str, Any]]
) -> dict[str, Any] | None:
    best: tuple[float, dict[str, Any]] | None = None
    for caption in captions:
        caption_bbox = caption["bbox_normalized"]
        horizontal_overlap = max(
            0.0,
            min(visual_bbox[2], caption_bbox[2]) - max(visual_bbox[0], caption_bbox[0]),
        )
        if horizontal_overlap <= 0:
            continue
        if caption_bbox[1] >= visual_bbox[3]:
            distance = caption_bbox[1] - visual_bbox[3]
        elif visual_bbox[1] >= caption_bbox[3]:
            distance = visual_bbox[1] - caption_bbox[3]
        else:
            distance = 0.0
        if distance > 0.13:
            continue
        score = distance - horizontal_overlap * 0.04
        if best is None or score < best[0]:
            best = (score, caption)
    return best[1] if best else None


def caption_guided_bbox(
    caption_bbox: list[float],
    kind: ElementKind,
    text_records: list[dict[str, Any]],
) -> list[float]:
    if kind == ElementKind.TABLE:
        content_bottom = caption_bbox[3]
        started = False
        for record in sorted(text_records, key=lambda item: item["bbox_normalized"][1]):
            if record["kind"] in {ElementKind.CAPTION, ElementKind.FURNITURE}:
                continue
            record_bbox = record["bbox_normalized"]
            if record_bbox[1] < caption_bbox[3]:
                continue
            gap = record_bbox[1] - content_bottom
            if (started and gap > 0.045) or (not started and gap > 0.08):
                break
            started = True
            content_bottom = max(content_bottom, record_bbox[3])
        if started:
            return [
                0.08,
                caption_bbox[3] + 0.005,
                0.92,
                min(0.94, content_bottom + 0.015),
            ]
        return [0.08, caption_bbox[3] + 0.01, 0.92, min(0.94, caption_bbox[3] + 0.36)]
    return [0.08, max(0.06, caption_bbox[1] - 0.39), 0.92, caption_bbox[1] - 0.01]


def classify_document_region(
    raw_lines: list[str], page_index: int, page_count: int
) -> DocumentRegion:
    lines = [line.strip() for line in raw_lines if line.strip()]
    if not lines:
        return DocumentRegion.BODY
    lowered_lines = [line.casefold() for line in lines]
    joined = " ".join(lowered_lines)
    early = page_count >= 20 and page_index < max(12, math.ceil(page_count * 0.08))
    late = page_count >= 20 and page_index >= page_count - max(14, math.ceil(page_count * 0.1))
    front_heading = has_front_matter_heading(lines)
    toc_rows = sum(bool(TOC_ROW.search(line)) for line in lines)
    copyright_evidence = any(
        marker in joined
        for marker in ("all rights reserved", "library of congress", "isbn ", "copyright ©")
    )
    title_page_evidence = (
        ("pearson" in joined or "global edition" in joined)
        and "edition" in joined
    )
    if page_count >= 20 and page_index == 0 and len(joined.split()) < 90:
        return DocumentRegion.FRONT_MATTER
    if (
        early and (front_heading or toc_rows >= 4 or copyright_evidence or title_page_evidence)
    ) or (
        front_heading and page_index < max(20, page_count // 5)
    ):
        return DocumentRegion.FRONT_MATTER

    back_heading = any(
        re.fullmatch(r"index|bibliography|references|glossary|about this book", line)
        for line in lowered_lines
    )
    index_rows = sum(bool(INDEX_ROW.match(line)) for line in lines)
    reference_rows = sum(bool(REFERENCE_ROW.match(line)) for line in lines)
    if late and (back_heading or index_rows >= 6 or reference_rows >= 8):
        return DocumentRegion.BACK_MATTER
    return DocumentRegion.BODY


def has_front_matter_heading(raw_lines: list[str]) -> bool:
    return any(
        FRONT_MATTER_HEADING.fullmatch(line.strip().casefold())
        for line in raw_lines
        if line.strip()
    )


def has_body_boundary(raw_lines: list[str]) -> bool:
    """Recognize a chapter/section opening, not a table-of-contents entry.

    A table of contents and a preface can contain the same strings as a chapter
    opening (for example, ``Chapter 3: ...``).  They are not a safe reason to
    override a locally detected front-matter page.  Actual boundary headings are
    short, appear at the start of a page, and do not include a prose sentence or
    trailing page number.
    """

    lines = [raw_line.strip() for raw_line in raw_lines if raw_line.strip()]
    if (
        len(lines) >= 2
        and lines[0].casefold() == "chapter"
        and CHAPTER_ORDINAL_LINE.fullmatch(lines[1])
    ):
        return True

    for index, line in enumerate(lines[:4]):
        if CHAPTER_BOUNDARY.fullmatch(line):
            return True
        if (
            index < 3
            and SECTION_BOUNDARY.fullmatch(line)
            and not re.search(r"\s\d{1,4}$", line)
        ):
            return True
    return False


def same_visual_line(previous: TextLine, current: TextLine) -> bool:
    tolerance = max(previous.height, current.height) * 0.65
    vertical_match = abs(previous.center_y - current.center_y) <= tolerance
    moves_right = current.left >= previous.left - 2
    close_enough = current.left <= previous.right + max(previous.height, current.height) * 4
    return vertical_match and moves_right and close_enough


def join_text(left: str, right: str, *, dehyphenate: bool = False) -> str:
    if not left:
        return right
    if (
        dehyphenate
        and right
        and right[0].islower()
        and left.endswith(("\x02", "\u00ad", "\u2010", "-"))
    ):
        return left[:-1] + right.lstrip()
    if left[-1].isspace() or not right or right[0].isspace() or right[0] in ",.;:!?)]}":
        return left + right
    return left + " " + right


def paragraph_boundary(previous: TextLine, current: TextLine) -> bool:
    previous_height = max(previous.height, 1.0)
    current_height = max(current.height, 1.0)
    center_gap = abs(previous.center_y - current.center_y)
    typical_height = max(previous_height, current_height)
    vertical_jump = center_gap > typical_height * 2.05
    moves_up_page = current.center_y > previous.center_y + typical_height
    current_text = normalize_text(current.text)
    previous_text = normalize_text(previous.text)
    current_hint = classify_kind(current_text, [0.1, 0.2, 0.9, 0.3])
    previous_hint = classify_kind(previous_text, [0.1, 0.2, 0.9, 0.3])
    structural_change = current_hint in {
        ElementKind.HEADING,
        ElementKind.CAPTION,
        ElementKind.CODE,
    } or previous_hint in {ElementKind.HEADING, ElementKind.CAPTION, ElementKind.CODE}
    return vertical_jump or moves_up_page or structural_change


def normalize_text(text: str) -> str:
    replacements = {
        "\u00ad": "",
        "\u2010": "-",
        "\r": " ",
        "\n": " ",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_bbox(line: TextLine, width: float, height: float) -> list[float]:
    return normalize_raw_bbox(line.left, line.bottom, line.right, line.top, width, height)


def normalize_raw_bbox(
    left: float,
    bottom: float,
    right: float,
    top: float,
    width: float,
    height: float,
) -> list[float]:
    values = [left / width, 1 - (top / height), right / width, 1 - (bottom / height)]
    return [round(min(1.0, max(0.0, value)), 6) for value in values]


def classify_kind(
    text: str,
    bbox: list[float],
    line_height: float | None = None,
    typical_line_height: float | None = None,
) -> ElementKind:
    top, bottom = bbox[1], bbox[3]
    if top < 0.065 or bottom > 0.94:
        return ElementKind.FURNITURE
    if CAPTION_PATTERN.match(text):
        return ElementKind.CAPTION
    lowered = f" {text.lower()} "
    if any(marker in lowered for marker in CODE_MARKERS):
        return ElementKind.CODE
    visibly_large = (
        line_height is not None
        and typical_line_height is not None
        and line_height >= typical_line_height * 1.18
        and line_height <= typical_line_height * 1.8
    )
    if len(text) <= 90 and (
        SECTION_HEADING.match(text)
        or NUMBERED_HEADING.match(text)
        or text.isupper()
        or visibly_large
    ):
        return ElementKind.HEADING
    return ElementKind.PARAGRAPH


def page_status(text: str) -> PageStatus:
    if not text:
        return PageStatus.SOURCE_ONLY
    printable = sum(character.isprintable() for character in text)
    replacement_like = text.count("�") + text.count("\x00")
    ratio = printable / len(text)
    if ratio >= 0.98 and replacement_like == 0:
        return PageStatus.TRUSTED_FOR_TRANSFORM
    if ratio >= 0.9 and replacement_like <= math.ceil(len(text) * 0.01):
        return PageStatus.TRANSFORM_WITH_WARNING
    return PageStatus.SOURCE_ONLY
