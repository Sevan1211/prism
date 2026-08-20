from __future__ import annotations

import hashlib
import json
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

COMPILER_VERSION = "source-visual-semantic-v2"
SENTENCE_BOUNDARY = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9])")
TECHNICAL_TERM = re.compile(r"\b(?:[A-Z]{2,}|[A-Za-z]+[A-Z][A-Za-z]*|\w+_\w+|\w+\(\))\b")
QUALIFIER = re.compile(
    r"\b(?:not|only|unless|except|however|although|if|when|must|may|might|cannot|never)\b",
    re.IGNORECASE,
)


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
        and element["status"] != "source_only"
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

    for element in eligible:
        element_kind = str(element["kind"])
        if element_kind == "heading":
            section_title = str(element["text"])
            active_visual_id = None
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
            continue

        for chunk, start_offset, end_offset in semantic_chunks(str(element["text"])):
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

    created_at = datetime.now(UTC)
    display_title = title or f"{source.original_name} - pages {page_start}-{page_end}"
    identity_payload = {
        "source_hash": source.content_hash,
        "page_start": page_start,
        "page_end": page_end,
        "compiler": COMPILER_VERSION,
        "frame_ids": [frame.id for frame in frames],
        "visual_ids": [visual.id for visual in visuals],
    }
    package_hash = hashlib.sha256(canonical_json(identity_payload).encode("utf-8")).hexdigest()
    return LessonPackage(
        id=f"lesson_{package_hash[:20]}",
        package_hash=package_hash,
        title=display_title,
        source=source,
        page_start=page_start,
        page_end=page_end,
        compiler_version=COMPILER_VERSION,
        capability_notes=[
            "Body frames are source-verbatim; front matter and back matter "
            "are skipped in playback.",
            "Source figures and tables are lazy-rendered from exact PDF regions "
            "and remain inspectable.",
            "Uncaptioned visuals retain source provenance but require review "
            "for an accessible description.",
            "Draft status does not establish comprehension or retention.",
        ],
        claims=claims,
        visuals=visuals,
        frames=frames,
        created_at=created_at,
    )


def is_visual(element: dict[str, Any]) -> bool:
    return element["kind"] in {"figure", "table"}


def source_visual(source: SourceSummary, element: dict[str, Any]) -> SourceVisual:
    caption = str(element["text"]).strip() or None
    kind: Literal["figure", "table"] = (
        "table" if element["kind"] == "table" else "figure"
    )
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
            auto_advance_allowed=True,
        )
    )
    return frame_id


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
