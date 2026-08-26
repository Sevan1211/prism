from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, Field


class RightsStatus(StrEnum):
    PUBLIC_DOMAIN = "public_domain"
    OPEN_LICENSE = "open_license"
    PRIVATE_AUTHORIZED = "private_authorized"
    UNKNOWN = "unknown"


class CloudPolicy(StrEnum):
    LOCAL_ONLY = "local_only"


class SourceStatus(StrEnum):
    SOURCE_READY = "source_ready"
    INDEXING = "indexing"
    STRUCTURE_READY = "structure_ready"
    NEEDS_REVIEW = "needs_review"
    FAILED = "failed"


class JobState(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    RETRYABLE_FAILURE = "retryable_failure"
    NEEDS_REVIEW = "needs_review"
    FAILED = "failed"


class ElementKind(StrEnum):
    HEADING = "heading"
    PARAGRAPH = "paragraph"
    CODE = "code"
    CAPTION = "caption"
    FIGURE = "figure"
    TABLE = "table"
    FURNITURE = "furniture"


class DocumentRegion(StrEnum):
    BODY = "body"
    FRONT_MATTER = "front_matter"
    BACK_MATTER = "back_matter"


class PageStatus(StrEnum):
    TRUSTED_FOR_TRANSFORM = "trusted_for_transform"
    TRANSFORM_WITH_WARNING = "transform_with_warning"
    SOURCE_ONLY = "source_only"


class SourceSummary(BaseModel):
    id: str
    content_hash: str
    original_name: str
    size_bytes: int
    page_count: int | None
    status: SourceStatus
    rights_status: RightsStatus
    cloud_policy: CloudPolicy
    created_at: datetime


class ImportJob(BaseModel):
    id: str
    source_id: str
    state: JobState
    progress_current: int
    progress_total: int | None
    error_class: str | None = None
    error_message: str | None = None
    parser_version: str | None = None
    created_at: datetime
    updated_at: datetime


class ImportResponse(BaseModel):
    source: SourceSummary
    job: ImportJob


class SectionReadiness(BaseModel):
    """Inspectable readiness evidence for one requested PDF page range."""

    page_start: int
    page_end: int
    status: Literal["ready", "indexing", "needs_attention", "source_only", "invalid_range"]
    can_compile: bool
    trusted_text_characters: int = 0
    warning_text_characters: int = 0
    source_only_text_characters: int = 0
    body_pages: int = 0
    excluded_non_body_elements: int = 0
    message: str


class SourceReadiness(BaseModel):
    """Source-level capability and recovery state exposed to the local library."""

    source_id: str
    source_status: SourceStatus
    phase: Literal["indexing", "ready", "needs_attention", "source_only"]
    parser_current: bool
    latest_job: ImportJob | None = None
    trusted_body_pages: int = 0
    source_only_body_pages: int = 0
    recommended_range: SectionReadiness | None = None
    selected_range: SectionReadiness | None = None
    capability_notes: list[str] = Field(default_factory=list)


NormalizedBBox = Annotated[list[float], Field(min_length=4, max_length=4)]


class SourceSpan(BaseModel):
    element_id: str
    page_number: int
    bbox_normalized: NormalizedBBox
    start_offset: int
    end_offset: int
    extracted_text: str


class CanonicalClaim(BaseModel):
    id: str
    proposition: str
    source_spans: list[SourceSpan]
    status: Literal["explicit", "inferred", "added_explanation"] = "explicit"
    qualifiers: list[str] = Field(default_factory=list)
    concepts: list[str] = Field(default_factory=list)


class PacingFeatures(BaseModel):
    lexical_difficulty: float
    proposition_count: int
    novelty: float
    integration_distance: int
    technical_term_count: int


class TextRepresentation(BaseModel):
    id: str
    type: Literal["text"] = "text"
    content: str
    persistent_terms: list[str]
    accessible_text: str


class SourceVisual(BaseModel):
    id: str
    element_id: str
    page_number: int
    kind: Literal["figure", "table"]
    bbox_normalized: NormalizedBBox
    caption: str | None = None
    accessible_text: str
    provenance: Literal["source_region"] = "source_region"
    extraction_confidence: float


class SemanticFrame(BaseModel):
    id: str
    claim_ids: list[str]
    type: Literal[
        "section",
        "definition",
        "proposition",
        "contrast",
        "causal",
        "process",
        "integration",
    ]
    prerequisite_frame_ids: list[str]
    representation: TextRepresentation
    active_visual_id: str | None = None
    section_title: str | None = None
    source_spans: list[SourceSpan]
    pacing_features: PacingFeatures
    minimum_dwell_ms: int
    initial_dwell_ms: int
    auto_advance_allowed: bool
    verification_status: Literal["draft", "reviewed", "verified"] = "draft"


class LessonPackage(BaseModel):
    schema_version: int = 2
    id: str
    package_hash: str
    title: str
    source: SourceSummary
    page_start: int
    page_end: int
    compiler_version: str
    verification_status: Literal["draft", "reviewed", "verified"] = "draft"
    capability_notes: list[str]
    claims: list[CanonicalClaim]
    visuals: list[SourceVisual]
    frames: list[SemanticFrame]
    created_at: datetime


class CompileLessonRequest(BaseModel):
    page_start: Annotated[int, Field(ge=1)]
    page_end: Annotated[int, Field(ge=1)]
    title: Annotated[str | None, Field(max_length=180)] = None


class ResearchEventIn(BaseModel):
    session_id: Annotated[str, Field(min_length=8, max_length=80)]
    lesson_id: Annotated[str, Field(min_length=8, max_length=80)]
    event_type: Literal[
        "session_started",
        "frame_shown",
        "play",
        "pause",
        "step_forward",
        "step_back",
        "source_opened",
        "source_closed",
        "pace_changed",
        "focus_paused",
        "study_submitted",
        "session_ended",
    ]
    frame_id: str | None = None
    occurred_at: datetime
    payload: dict[str, str | int | float | bool | None] = Field(default_factory=dict)


class ResearchEventRecord(ResearchEventIn):
    id: int
    schema_version: int


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    version: str
