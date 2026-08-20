from __future__ import annotations

import hashlib
from pathlib import Path

import pytest

from prism_api.config import Settings
from prism_api.models import (
    CompileLessonRequest,
    DocumentRegion,
    ElementKind,
    JobState,
    RightsStatus,
    SourceStatus,
)
from prism_api.pdf_parser import (
    NativePdfParser,
    classify_document_region,
    classify_kind,
    has_body_boundary,
    join_text,
    normalize_text,
)
from prism_api.services import SourceService
from prism_api.storage import Store


def make_service(tmp_path: Path) -> tuple[Store, SourceService]:
    settings = Settings(data_dir=tmp_path / "prism-data", worker_poll_seconds=0.01)
    store = Store(settings)
    store.initialize()
    return store, SourceService(settings, store, NativePdfParser())


def import_fixture(service: SourceService, sample_pdf: Path) -> str:
    with sample_pdf.open("rb") as stream:
        response = service.import_pdf(
            stream,
            original_name=sample_pdf.name,
            rights_status=RightsStatus.OPEN_LICENSE,
        )
    return response.job.id


def test_parser_preserves_page_regions_and_filters_furniture(sample_pdf: Path) -> None:
    parser = NativePdfParser()
    digest = hashlib.sha256(sample_pdf.read_bytes()).hexdigest()
    elements = parser.parse_page(sample_pdf, digest, 0)

    assert elements
    assert any(element["kind"] == "furniture" for element in elements)
    assert any(element["kind"] == "heading" for element in elements)
    body = next(element for element in elements if "small congestion window" in element["text"])
    assert body["status"] == "trusted_for_transform"
    assert all(0 <= coordinate <= 1 for coordinate in body["bbox_normalized"])
    assert body["bbox_normalized"][1] < body["bbox_normalized"][3]
    assert all("\x02" not in element["text"] for element in elements)


def test_normalization_removes_hidden_pdf_control_characters() -> None:
    assert normalize_text("window continues throughout the life\x02") == (
        "window continues throughout the life"
    )


def test_line_reconstruction_dehyphenates_and_does_not_misclassify_prose() -> None:
    assert join_text("throughout the life\x02", "time of the connection", dehyphenate=True) == (
        "throughout the lifetime of the connection"
    )
    assert (
        classify_kind("Figure 6.11 traces the congestion window.", [0.1, 0.2, 0.9, 0.3])
        == ElementKind.PARAGRAPH
    )
    assert classify_kind("state - > CongestionWindow;", [0.1, 0.2, 0.9, 0.3]) == (
        ElementKind.CODE
    )
    assert (
        classify_kind("The value is plotted as a function of time.", [0.1, 0.2, 0.9, 0.3])
        == ElementKind.PARAGRAPH
    )


def test_structure_classifier_keeps_navigation_searchable_but_out_of_flow() -> None:
    contents = [
        "Table of Contents",
        "1 Foundations ........ 1",
        "2 Transport ........ 31",
        "3 Routing ........ 87",
        "4 Security ........ 141",
    ]
    assert classify_document_region(contents, page_index=4, page_count=480) == (
        DocumentRegion.FRONT_MATTER
    )
    assert (
        classify_document_region(
            ["6.3.2 Slow Start", "TCP begins with a small congestion window."],
            page_index=307,
            page_count=480,
        )
        == DocumentRegion.BODY
    )
    assert (
        classify_document_region(
            ["ABOUT THIS BOOK", "Contribution guidelines"],
            page_index=486,
            page_count=489,
        )
        == DocumentRegion.BACK_MATTER
    )
    assert has_body_boundary(["9.4. Overlay Networks 485"]) is False


def test_parser_detects_a_source_visual_without_rasterizing_the_book(sample_pdf: Path) -> None:
    parser = NativePdfParser()
    digest = hashlib.sha256(sample_pdf.read_bytes()).hexdigest()
    elements = parser.parse_page(sample_pdf, digest, 1)

    visual = next(element for element in elements if element["kind"] == "figure")
    assert visual["text"].startswith("Figure 1.1.")
    assert visual["playback_eligible"] is True
    assert visual["confidence"]["structure"] >= 0.72

    table_elements = parser.parse_page(sample_pdf, digest, 2)
    table = next(element for element in table_elements if element["kind"] == "table")
    assert table["text"].startswith("Table 1.1.")
    assert table["bbox_normalized"][1] < table["bbox_normalized"][3]


def test_import_is_local_only_even_for_openly_licensed_source(
    tmp_path: Path, sample_pdf: Path
) -> None:
    store, service = make_service(tmp_path)
    job_id = import_fixture(service, sample_pdf)
    job = store.job(job_id)
    source = store.source(job.source_id) if job else None

    assert source is not None
    assert source.cloud_policy == "local_only"


def test_reimport_requeues_when_parser_artifacts_are_stale(
    tmp_path: Path, sample_pdf: Path
) -> None:
    store, service = make_service(tmp_path)
    first_job_id = import_fixture(service, sample_pdf)
    service.process_job(first_job_id)
    first_job = store.job(first_job_id)
    assert first_job is not None

    with store.connection() as connection:
        connection.execute(
            "UPDATE elements SET parser_version = 'obsolete-parser' WHERE source_id = ?",
            (first_job.source_id,),
        )
        connection.commit()

    second_job_id = import_fixture(service, sample_pdf)
    second_job = store.job(second_job_id)
    assert second_job is not None
    assert second_job.source_id == first_job.source_id
    assert second_job.state == JobState.QUEUED
    assert second_job.progress_current == 0


def test_interrupted_import_resumes_without_duplicate_elements(
    tmp_path: Path, sample_pdf: Path
) -> None:
    store, service = make_service(tmp_path)
    job_id = import_fixture(service, sample_pdf)

    with pytest.raises(RuntimeError, match="simulated_parser_interruption"):
        service.process_job(job_id, fail_after_page=1)

    failed_job = store.job(job_id)
    assert failed_job is not None
    assert failed_job.state == JobState.RETRYABLE_FAILURE
    assert failed_job.progress_current == 1

    resumed = store.resume_job(job_id)
    assert resumed is not None
    assert resumed.state == JobState.QUEUED
    service.process_job(job_id)

    complete_job = store.job(job_id)
    source = store.source(complete_job.source_id) if complete_job else None
    assert complete_job is not None
    assert complete_job.state == JobState.SUCCEEDED
    assert complete_job.progress_current == 3
    assert source is not None
    assert source.status == SourceStatus.STRUCTURE_READY
    with store.connection() as connection:
        page_count = connection.execute(
            "SELECT COUNT(DISTINCT page_number) FROM elements WHERE source_id = ?",
            (source.id,),
        ).fetchone()[0]
        duplicate_count = connection.execute(
            """
            SELECT COUNT(*) FROM (
                SELECT source_id, page_number, reading_order, COUNT(*) AS copies
                FROM elements
                WHERE source_id = ?
                GROUP BY source_id, page_number, reading_order
                HAVING copies > 1
            )
            """,
            (source.id,),
        ).fetchone()[0]
    assert page_count == 3
    assert duplicate_count == 0


def test_compiler_is_deterministic_and_source_verbatim(tmp_path: Path, sample_pdf: Path) -> None:
    store, service = make_service(tmp_path)
    job_id = import_fixture(service, sample_pdf)
    service.process_job(job_id)
    job = store.job(job_id)
    assert job is not None

    request = CompileLessonRequest(page_start=1, page_end=2, title="TCP Slow Start")
    first = service.compile(job.source_id, request)
    second = service.compile(job.source_id, request)

    assert first.package_hash == second.package_hash
    assert first.id == second.id
    assert len(first.frames) >= 4
    assert len(first.visuals) == 1
    assert any(frame.active_visual_id == first.visuals[0].id for frame in first.frames)
    for frame in first.frames:
        assert frame.verification_status == "draft"
        assert frame.representation.content == frame.source_spans[0].extracted_text
        assert frame.minimum_dwell_ms <= frame.initial_dwell_ms
        assert frame.source_spans[0].page_number in {1, 2}


def test_visual_is_lazy_rendered_to_a_bounded_cached_asset(
    tmp_path: Path, sample_pdf: Path
) -> None:
    store, service = make_service(tmp_path)
    job_id = import_fixture(service, sample_pdf)
    service.process_job(job_id)
    job = store.job(job_id)
    assert job is not None
    lesson = service.compile(
        job.source_id,
        CompileLessonRequest(page_start=1, page_end=2, title="Visual fixture"),
    )

    asset = service.visual_asset(job.source_id, lesson.visuals[0].id)
    first_modified = asset.stat().st_mtime_ns
    cached = service.visual_asset(job.source_id, lesson.visuals[0].id)

    assert asset == cached
    assert cached.stat().st_mtime_ns == first_modified
    assert cached.suffix == ".webp"
    assert cached.stat().st_size > 0
