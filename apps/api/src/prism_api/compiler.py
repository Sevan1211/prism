from __future__ import annotations

import hashlib
import json
import math
import re
from datetime import UTC, datetime
from typing import Any, Literal

from prism_api.models import (
    CanonicalClaim,
    LessonPackage,
    PacingFeatures,
    SemanticFrame,
    SourceSpan,
    SourceSummary,
    SourceVisual,
    TextRepresentation,
)

COMPILER_VERSION = "source-visual-semantic-v5-source-furniture-trim"
SENTENCE_BOUNDARY = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9])")
TECHNICAL_TERM = re.compile(r"\b(?:[A-Z]{2,}|[A-Za-z]+[A-Z][A-Za-z]*|\w+_\w+|\w+\(\))\b")
RUNNING_HEADER_PREFIX = re.compile(
    r"^\d+\s+(?i:chapter|section)\s+\d+(?:\.\d+)*\s+"
    r"(?:(?:[A-Z][A-Za-z0-9:/&+\-]*|of|the|and|for|in|to|a|an)\s+){1,14}"
    r"(?=(?:A|An|The|This|These|It|They|We|You|In|For|To|When|While|Because)\s+[a-z])"
)
QUALIFIER = re.compile(
    r"\b(?:not|only|unless|except|however|although|if|when|must|may|might|cannot|never)\b",
    re.IGNORECASE,
)
CAPABILITY_NOTES = [
    "Body frames are source-verbatim; front matter and back matter are skipped in playback.",
    "Source figures and tables are lazy-rendered from exact PDF regions and remain inspectable.",
    "Uncaptioned visuals retain source provenance but require review "
    "for an accessible description.",
    "Draft status does not establish comprehension or retention.",
]


class PackageValidationError(ValueError):
    """A deterministic compiler candidate is unsafe to publish or persist."""

    def __init__(self, issues: list[str]) -> None:
        self.issues = tuple(sorted(set(issues)))
        detail = "\n- ".join(self.issues)
        super().__init__(f"Compiled lesson package failed validation:\n- {detail}")


def compile_lesson(
    *,
    source: SourceSummary,
    elements: list[dict[str, Any]],
    page_start: int,
    page_end: int,
    title: str | None,
) -> LessonPackage:
    eligible = [
        element
        for element in elements
        if element["playback_eligible"]
        and element["status"] == "trusted_for_transform"
        and element["kind"] in {"heading", "paragraph", "figure", "table"}
    ]
    if not any(element["kind"] in {"heading", "paragraph"} for element in eligible):
        raise ValueError(
            "No body text in this page range is trusted for transformation. "
            "Front matter and back matter remain available in Source and search."
        )

    visuals = [source_visual(source, element) for element in eligible if is_visual(element)]
    claims: list[CanonicalClaim] = []
    frames: list[SemanticFrame] = []
    previous_frame_id: str | None = None
    active_visual_id: str | None = None
    section_title: str | None = None

    element_index = 0
    while element_index < len(eligible):
        element = eligible[element_index]
        element_kind = str(element["kind"])
        if element_kind == "heading":
            heading_elements = [element]
            while (
                element_index + len(heading_elements) < len(eligible)
                and eligible[element_index + len(heading_elements)]["kind"] == "heading"
            ):
                heading_elements.append(eligible[element_index + len(heading_elements)])
            section_title = join_heading_text(heading_elements)
            active_visual_id = None
            previous_frame_id = append_heading_frame(
                source=source,
                elements=heading_elements,
                text=section_title,
                claims=claims,
                frames=frames,
                previous_frame_id=previous_frame_id,
            )
            element_index += len(heading_elements)
            continue
        elif element_kind in {"figure", "table"}:
            active_visual_id = str(element["id"])
            caption = str(element["text"]).strip()
            if caption:
                previous_frame_id = append_frame(
                    source=source,
                    element=element,
                    chunk=caption,
                    start_offset=0,
                    end_offset=len(caption),
                    claims=claims,
                    frames=frames,
                    previous_frame_id=previous_frame_id,
                    active_visual_id=active_visual_id,
                    section_title=section_title,
                    explicit_type="integration",
                    visual_inspection=True,
                )
            element_index += 1
            continue

        for chunk, start_offset, end_offset in semantic_chunks(str(element["text"])):
            if start_offset == 0:
                chunk, start_offset = trim_running_header_prefix(chunk, start_offset)
                end_offset = start_offset + len(chunk)
            if not chunk:
                continue
            previous_frame_id = append_frame(
                source=source,
                element=element,
                chunk=chunk,
                start_offset=start_offset,
                end_offset=end_offset,
                claims=claims,
                frames=frames,
                previous_frame_id=previous_frame_id,
                active_visual_id=active_visual_id,
                section_title=section_title,
                explicit_type="section" if element_kind == "heading" else None,
            )
        element_index += 1

    created_at = datetime.now(UTC)
    display_title = title or f"{source.original_name} - pages {page_start}-{page_end}"
    package_hash = lesson_package_hash(
        schema_version=2,
        source_hash=source.content_hash,
        page_start=page_start,
        page_end=page_end,
        compiler_version=COMPILER_VERSION,
        title=display_title,
        verification_status="draft",
        capability_notes=CAPABILITY_NOTES,
        claims=claims,
        visuals=visuals,
        frames=frames,
    )
    return LessonPackage(
        id=f"lesson_{package_hash[:20]}",
        package_hash=package_hash,
        title=display_title,
        source=source,
        page_start=page_start,
        page_end=page_end,
        compiler_version=COMPILER_VERSION,
        capability_notes=CAPABILITY_NOTES,
        claims=claims,
        visuals=visuals,
        frames=frames,
        created_at=created_at,
    )


def is_visual(element: dict[str, Any]) -> bool:
    return element["kind"] in {"figure", "table"}


def source_visual(source: SourceSummary, element: dict[str, Any]) -> SourceVisual:
    caption = str(element["text"]).strip() or None
    kind: Literal["figure", "table"] = "table" if element["kind"] == "table" else "figure"
    accessible_text = caption or (
        f"Uncaptioned source {kind} extracted from page {element['page_number']}. "
        "Open Source view for the complete page context."
    )
    return SourceVisual(
        id=str(element["id"]),
        element_id=str(element["id"]),
        page_number=int(element["page_number"]),
        kind=kind,
        bbox_normalized=element["bbox_normalized"],
        caption=caption,
        accessible_text=accessible_text,
        extraction_confidence=float(element["confidence"]["structure"]),
    )


def join_heading_text(elements: list[dict[str, Any]]) -> str:
    """Join consecutive source headings into one meaningful, source-verbatim title unit."""

    return " ".join(str(element["text"]).strip() for element in elements if element["text"].strip())


def append_heading_frame(
    *,
    source: SourceSummary,
    elements: list[dict[str, Any]],
    text: str,
    claims: list[CanonicalClaim],
    frames: list[SemanticFrame],
    previous_frame_id: str | None,
) -> str:
    spans = [
        SourceSpan(
            element_id=str(element["id"]),
            page_number=int(element["page_number"]),
            bbox_normalized=element["bbox_normalized"],
            start_offset=0,
            end_offset=len(str(element["text"])),
            extracted_text=str(element["text"]),
        )
        for element in elements
    ]
    heading_ids = ":".join(str(element["id"]) for element in elements)
    stable_seed = f"{source.content_hash}:heading:{heading_ids}:{text}"
    stable_hash = hashlib.sha256(stable_seed.encode("utf-8")).hexdigest()
    claim_id = f"claim_{stable_hash[:18]}"
    frame_id = f"frame_{stable_hash[18:36]}"
    representation_id = f"repr_{stable_hash[36:54]}"
    qualifiers = sorted({match.group(0).lower() for match in QUALIFIER.finditer(text)})
    terms = persistent_terms(text)
    features = pacing_features(text, terms, previous_frame_id is not None)
    minimum_dwell, initial_dwell = dwell_policy(text, features)
    claims.append(
        CanonicalClaim(
            id=claim_id,
            proposition=text,
            source_spans=spans,
            qualifiers=qualifiers,
            concepts=terms[:4],
        )
    )
    frames.append(
        SemanticFrame(
            id=frame_id,
            claim_ids=[claim_id],
            type="section",
            prerequisite_frame_ids=[previous_frame_id] if previous_frame_id else [],
            representation=TextRepresentation(
                id=representation_id,
                content=text,
                persistent_terms=terms,
                accessible_text=text,
            ),
            section_title=text,
            source_spans=spans,
            pacing_features=features,
            minimum_dwell_ms=minimum_dwell,
            initial_dwell_ms=initial_dwell,
            auto_advance_allowed=True,
        )
    )
    return frame_id


def append_frame(
    *,
    source: SourceSummary,
    element: dict[str, Any],
    chunk: str,
    start_offset: int,
    end_offset: int,
    claims: list[CanonicalClaim],
    frames: list[SemanticFrame],
    previous_frame_id: str | None,
    active_visual_id: str | None,
    section_title: str | None,
    explicit_type: Literal[
        "section", "definition", "proposition", "contrast", "causal", "process", "integration"
    ]
    | None = None,
    visual_inspection: bool = False,
) -> str:
    span = SourceSpan(
        element_id=str(element["id"]),
        page_number=int(element["page_number"]),
        bbox_normalized=element["bbox_normalized"],
        start_offset=start_offset,
        end_offset=end_offset,
        extracted_text=chunk,
    )
    stable_seed = f"{source.content_hash}:{element['id']}:{start_offset}:{end_offset}:{chunk}"
    stable_hash = hashlib.sha256(stable_seed.encode("utf-8")).hexdigest()
    claim_id = f"claim_{stable_hash[:18]}"
    frame_id = f"frame_{stable_hash[18:36]}"
    representation_id = f"repr_{stable_hash[36:54]}"
    qualifiers = sorted({match.group(0).lower() for match in QUALIFIER.finditer(chunk)})
    terms = persistent_terms(chunk)
    features = pacing_features(chunk, terms, previous_frame_id is not None)
    minimum_dwell, initial_dwell = dwell_policy(chunk, features)
    if visual_inspection:
        minimum_dwell = max(minimum_dwell, 5000)
        initial_dwell = max(initial_dwell, 9000)
    claims.append(
        CanonicalClaim(
            id=claim_id,
            proposition=chunk,
            source_spans=[span],
            qualifiers=qualifiers,
            concepts=terms[:4],
        )
    )
    frames.append(
        SemanticFrame(
            id=frame_id,
            claim_ids=[claim_id],
            type=explicit_type or frame_type(chunk),
            prerequisite_frame_ids=[previous_frame_id] if previous_frame_id else [],
            representation=TextRepresentation(
                id=representation_id,
                content=chunk,
                persistent_terms=terms,
                accessible_text=chunk,
            ),
            active_visual_id=active_visual_id,
            section_title=section_title,
            source_spans=[span],
            pacing_features=features,
            minimum_dwell_ms=minimum_dwell,
            initial_dwell_ms=initial_dwell,
            auto_advance_allowed=not visual_inspection,
        )
    )
    return frame_id


def lesson_package_hash(
    *,
    schema_version: int,
    source_hash: str,
    page_start: int,
    page_end: int,
    compiler_version: str,
    title: str,
    verification_status: str,
    capability_notes: list[str],
    claims: list[CanonicalClaim],
    visuals: list[SourceVisual],
    frames: list[SemanticFrame],
) -> str:
    """Hash every stable instructional field while excluding creation time and storage IDs."""

    identity_payload = {
        "schema_version": schema_version,
        "source_hash": source_hash,
        "page_start": page_start,
        "page_end": page_end,
        "compiler_version": compiler_version,
        "title": title,
        "verification_status": verification_status,
        "capability_notes": capability_notes,
        "claims": [claim.model_dump(mode="json") for claim in claims],
        "visuals": [visual.model_dump(mode="json") for visual in visuals],
        "frames": [frame.model_dump(mode="json") for frame in frames],
    }
    return hashlib.sha256(canonical_json(identity_payload).encode("utf-8")).hexdigest()


def validate_lesson_package(
    package: LessonPackage,
    source_elements: list[dict[str, Any]],
    *,
    expected_source: SourceSummary,
) -> None:
    """Fail closed when compiled content cannot be traced to the indexed source."""

    issues: list[str] = []
    element_by_id: dict[str, dict[str, Any]] = {}
    for element in source_elements:
        element_id = str(element["id"])
        if element_id in element_by_id:
            issues.append(f"elements.{element_id}: duplicate_element_id")
        element_by_id[element_id] = element

    if package.page_end < package.page_start:
        issues.append("package.page_range: reversed_page_range")
    if package.schema_version != 2:
        issues.append("package.schema_version: unsupported_compiler_schema")
    if package.compiler_version != COMPILER_VERSION:
        issues.append("package.compiler_version: unexpected_compiler_version")
    if package.verification_status != "draft":
        issues.append("package.verification_status: compiler_cannot_approve_content")
    if package.source != expected_source:
        issues.append("package.source: source_snapshot_mismatch")
    if not package.frames:
        issues.append("package.frames: empty_frame_sequence")

    claim_by_id = _unique_models(package.claims, "claims", issues)
    visual_by_id = _unique_models(package.visuals, "visuals", issues)
    frame_by_id = _unique_models(package.frames, "frames", issues)
    _unique_representation_ids(package, issues)

    for claim_index, claim in enumerate(package.claims):
        path = f"claims[{claim_index}]"
        if not claim.source_spans:
            issues.append(f"{path}.source_spans: missing_source_support")
        for span_index, span in enumerate(claim.source_spans):
            _validate_span(
                span,
                f"{path}.source_spans[{span_index}]",
                element_by_id,
                package,
                issues,
            )
        if claim.status == "explicit" and claim.proposition != joined_span_text(claim.source_spans):
            issues.append(f"{path}.proposition: explicit_claim_not_source_verbatim")
        expected_qualifiers = sorted(
            {match.group(0).lower() for match in QUALIFIER.finditer(claim.proposition)}
        )
        if claim.qualifiers != expected_qualifiers:
            issues.append(f"{path}.qualifiers: qualifier_extraction_mismatch")

    for visual_index, visual in enumerate(package.visuals):
        path = f"visuals[{visual_index}]"
        visual_element = element_by_id.get(visual.element_id)
        if visual.id != visual.element_id:
            issues.append(f"{path}.id: visual_id_must_equal_source_element_id")
        if visual_element is None:
            issues.append(f"{path}.element_id: missing_source_element")
        else:
            expected_kind = "table" if visual_element["kind"] == "table" else "figure"
            expected_caption = str(visual_element["text"]).strip() or None
            if visual_element["kind"] not in {"figure", "table"} or visual.kind != expected_kind:
                issues.append(f"{path}.kind: source_visual_kind_mismatch")
            if visual.page_number != int(visual_element["page_number"]):
                issues.append(f"{path}.page_number: source_page_mismatch")
            if visual.bbox_normalized != visual_element["bbox_normalized"]:
                issues.append(f"{path}.bbox_normalized: source_region_mismatch")
            if visual.caption != expected_caption:
                issues.append(f"{path}.caption: source_caption_mismatch")
        if not _valid_bbox(visual.bbox_normalized):
            issues.append(f"{path}.bbox_normalized: invalid_normalized_region")
        if not visual.accessible_text.strip():
            issues.append(f"{path}.accessible_text: missing_accessible_equivalent")
        if not math.isfinite(visual.extraction_confidence) or not (
            0 <= visual.extraction_confidence <= 1
        ):
            issues.append(f"{path}.extraction_confidence: invalid_confidence")

    referenced_claim_ids: set[str] = set()
    seen_frame_ids: set[str] = set()
    for frame_index, frame in enumerate(package.frames):
        path = f"frames[{frame_index}]"
        if not frame.claim_ids:
            issues.append(f"{path}.claim_ids: missing_claim_reference")
        if len(frame.claim_ids) != len(set(frame.claim_ids)):
            issues.append(f"{path}.claim_ids: duplicate_claim_reference")
        for claim_id in frame.claim_ids:
            referenced_claim_ids.add(claim_id)
            if claim_id not in claim_by_id:
                issues.append(f"{path}.claim_ids.{claim_id}: orphan_claim_reference")
        for prerequisite_id in frame.prerequisite_frame_ids:
            if prerequisite_id not in frame_by_id:
                issues.append(
                    f"{path}.prerequisite_frame_ids.{prerequisite_id}: orphan_prerequisite"
                )
            elif prerequisite_id not in seen_frame_ids:
                issues.append(
                    f"{path}.prerequisite_frame_ids.{prerequisite_id}: forward_prerequisite"
                )
        if len(frame.prerequisite_frame_ids) != len(set(frame.prerequisite_frame_ids)):
            issues.append(f"{path}.prerequisite_frame_ids: duplicate_prerequisite")
        if frame.active_visual_id is not None and frame.active_visual_id not in visual_by_id:
            issues.append(f"{path}.active_visual_id: orphan_visual_reference")
        if not frame.source_spans:
            issues.append(f"{path}.source_spans: missing_source_support")
        for span_index, span in enumerate(frame.source_spans):
            _validate_span(
                span,
                f"{path}.source_spans[{span_index}]",
                element_by_id,
                package,
                issues,
            )
        if frame.representation.content != joined_span_text(frame.source_spans):
            issues.append(f"{path}.representation.content: source_text_mismatch")
        if len(frame.claim_ids) == 1 and frame.claim_ids[0] in claim_by_id:
            frame_claim = claim_by_id[frame.claim_ids[0]]
            if frame_claim.proposition != frame.representation.content:
                issues.append(f"{path}.claim_ids: claim_representation_mismatch")
            if frame_claim.source_spans != frame.source_spans:
                issues.append(f"{path}.claim_ids: claim_source_support_mismatch")
        expected_terms = persistent_terms(frame.representation.content)
        if frame.representation.persistent_terms != expected_terms:
            issues.append(f"{path}.representation.persistent_terms: term_extraction_mismatch")
        if not frame.representation.accessible_text.strip():
            issues.append(f"{path}.representation.accessible_text: missing_accessible_equivalent")
        if frame.minimum_dwell_ms <= 0 or frame.initial_dwell_ms < frame.minimum_dwell_ms:
            issues.append(f"{path}.dwell: invalid_dwell_order")
        if frame.verification_status != "draft":
            issues.append(f"{path}.verification_status: compiler_cannot_approve_content")
        if (
            frame.type == "integration"
            and frame.active_visual_id is not None
            and frame.auto_advance_allowed
        ):
            issues.append(f"{path}.auto_advance_allowed: high_inspection_frame_cannot_autoplay")
        seen_frame_ids.add(frame.id)

    for orphan_claim_id in sorted(set(claim_by_id) - referenced_claim_ids):
        issues.append(f"claims.{orphan_claim_id}: unreferenced_claim")

    expected_hash = lesson_package_hash(
        schema_version=package.schema_version,
        source_hash=package.source.content_hash,
        page_start=package.page_start,
        page_end=package.page_end,
        compiler_version=package.compiler_version,
        title=package.title,
        verification_status=package.verification_status,
        capability_notes=package.capability_notes,
        claims=package.claims,
        visuals=package.visuals,
        frames=package.frames,
    )
    if package.package_hash != expected_hash:
        issues.append("package.package_hash: content_hash_mismatch")
    if package.id != f"lesson_{package.package_hash[:20]}":
        issues.append("package.id: package_identity_mismatch")

    if issues:
        raise PackageValidationError(issues)


def _unique_models(models: list[Any], path: str, issues: list[str]) -> dict[str, Any]:
    by_id: dict[str, Any] = {}
    for index, model in enumerate(models):
        if model.id in by_id:
            issues.append(f"{path}[{index}].id: duplicate_id")
        by_id[model.id] = model
    return by_id


def joined_span_text(spans: list[SourceSpan]) -> str:
    return " ".join(span.extracted_text.strip() for span in spans if span.extracted_text.strip())


def _unique_representation_ids(package: LessonPackage, issues: list[str]) -> None:
    representation_ids: set[str] = set()
    for frame_index, frame in enumerate(package.frames):
        representation_id = frame.representation.id
        if representation_id in representation_ids:
            issues.append(f"frames[{frame_index}].representation.id: duplicate_id")
        representation_ids.add(representation_id)


def _validate_span(
    span: SourceSpan,
    path: str,
    element_by_id: dict[str, dict[str, Any]],
    package: LessonPackage,
    issues: list[str],
) -> None:
    element = element_by_id.get(span.element_id)
    if element is None:
        issues.append(f"{path}.element_id: missing_source_element")
        return
    if span.page_number != int(element["page_number"]):
        issues.append(f"{path}.page_number: source_page_mismatch")
    if not package.page_start <= span.page_number <= package.page_end:
        issues.append(f"{path}.page_number: outside_package_page_range")
    if span.bbox_normalized != element["bbox_normalized"]:
        issues.append(f"{path}.bbox_normalized: source_region_mismatch")
    if not _valid_bbox(span.bbox_normalized):
        issues.append(f"{path}.bbox_normalized: invalid_normalized_region")

    source_text = str(element["text"])
    if span.start_offset < 0 or span.end_offset <= span.start_offset:
        issues.append(f"{path}.offsets: invalid_source_range")
        return
    if span.end_offset > len(source_text):
        issues.append(f"{path}.offsets: source_range_out_of_bounds")
        return
    if source_text[span.start_offset : span.end_offset] != span.extracted_text:
        issues.append(f"{path}.extracted_text: source_text_mismatch")


def _valid_bbox(bbox: list[float]) -> bool:
    if len(bbox) != 4 or not all(math.isfinite(value) for value in bbox):
        return False
    left, top, right, bottom = bbox
    return 0 <= left < right <= 1 and 0 <= top < bottom <= 1


def semantic_chunks(text: str) -> list[tuple[str, int, int]]:
    sentences = SENTENCE_BOUNDARY.split(text)
    chunks: list[tuple[str, int, int]] = []
    cursor = 0
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        start = text.find(sentence, cursor)
        if start < 0:
            start = cursor
        parts = split_long_sentence(sentence)
        local_cursor = start
        for part in parts:
            part_start = text.find(part, local_cursor)
            if part_start < 0:
                part_start = local_cursor
            part_end = part_start + len(part)
            chunks.append((part, part_start, part_end))
            local_cursor = part_end
        cursor = start + len(sentence)
    return chunks or [(text, 0, len(text))]


def trim_running_header_prefix(chunk: str, start_offset: int) -> tuple[str, int]:
    """Remove a repeated page header only when its title ends before a real sentence.

    Some born-digital textbooks merge a running header and first paragraph into one
    extraction record. The header is still in the immutable source, but it should not
    become the beginning of a proposition frame. The returned text remains an exact
    substring of the source element, with its offset adjusted for provenance.
    """

    match = RUNNING_HEADER_PREFIX.match(chunk)
    if match is None:
        return chunk, start_offset
    remainder = chunk[match.end() :]
    trimmed = remainder.lstrip()
    if not trimmed:
        return chunk, start_offset
    return trimmed, start_offset + match.end() + len(remainder) - len(trimmed)


def split_long_sentence(sentence: str) -> list[str]:
    words = sentence.split()
    if len(words) <= 46:
        return [sentence]
    parts = [part.strip() for part in re.split(r"(?<=[;:])\s+", sentence) if part.strip()]
    if len(parts) > 1 and all(len(part.split()) <= 52 for part in parts):
        return parts
    return [" ".join(words[index : index + 42]) for index in range(0, len(words), 42)]


def persistent_terms(text: str) -> list[str]:
    seen: set[str] = set()
    terms: list[str] = []
    for match in TECHNICAL_TERM.finditer(text):
        term = match.group(0)
        normalized = term.casefold()
        if normalized not in seen:
            seen.add(normalized)
            terms.append(term)
    return terms[:6]


def pacing_features(text: str, terms: list[str], has_previous_frame: bool) -> PacingFeatures:
    words = text.split()
    long_words = sum(len(word.strip(".,;:()[]")) >= 9 for word in words)
    lexical = min(1.0, (long_words + len(terms) * 1.5) / max(8, len(words)))
    propositions = 1 + text.count(";") + min(2, text.count(",") // 3)
    return PacingFeatures(
        lexical_difficulty=round(lexical, 3),
        proposition_count=propositions,
        novelty=0.65,
        integration_distance=1 if has_previous_frame else 0,
        technical_term_count=len(terms),
    )


def dwell_policy(text: str, features: PacingFeatures) -> tuple[int, int]:
    word_count = max(1, len(text.split()))
    punctuation_pause = sum(text.count(symbol) for symbol in (",", ";", ":")) * 120
    qualifier_pause = len(QUALIFIER.findall(text)) * 180
    complexity_pause = int(features.lexical_difficulty * 900)
    minimum = max(1800, word_count * 150)
    initial = max(
        minimum,
        word_count * 235 + punctuation_pause + qualifier_pause + complexity_pause,
    )
    return min(minimum, 9000), min(initial, 16000)


def frame_type(
    text: str,
) -> Literal["definition", "proposition", "contrast", "causal", "process", "integration"]:
    lowered = text.lower()
    if any(marker in lowered for marker in (" is defined as ", " means ", " is called ")):
        return "definition"
    if any(
        marker in lowered
        for marker in ("however", "in contrast", "rather than", "on the other hand")
    ):
        return "contrast"
    if any(
        marker in lowered for marker in ("because", "therefore", "causes", "as a result", "so that")
    ):
        return "causal"
    if re.match(r"^(?:first|second|third|finally|\d+[.)])\b", lowered):
        return "process"
    return "proposition"


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
