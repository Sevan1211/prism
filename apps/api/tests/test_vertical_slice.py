from __future__ import annotations

import hashlib
import json
import sqlite3
from pathlib import Path
from typing import Any

import pytest

import prism_api.services as services_module
from prism_api.compiler import (
    PackageValidationError,
    compile_lesson,
    trim_running_header_prefix,
    validate_lesson_package,
)
from prism_api.config import Settings
from prism_api.models import (
    CompileLessonRequest,
    DocumentRegion,
    ElementKind,
    JobState,
    LessonPackage,
    RightsStatus,
    SourceStatus,
)
from prism_api.pdf_parser import (
    NativePdfParser,
    classify_document_region,
    classify_kind,
    finalize_page_records,
    has_body_boundary,
    join_text,
    normalize_text,
)
from prism_api.services import SourceService, recommended_section, section_readiness
from prism_api.storage import Store

GOLDEN_COMPILER_MANIFEST = (
    Path(__file__).parent / "fixtures" / "compiler" / "tcp_slow_start_v2.json"
)


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


def compile_fixture(
    tmp_path: Path,
    sample_pdf: Path,
) -> tuple[Store, SourceService, str, LessonPackage, list[dict[str, Any]]]:
    store, service = make_service(tmp_path)
    job_id = import_fixture(service, sample_pdf)
    service.process_job(job_id)
    job = store.job(job_id)
    assert job is not None
    lesson = service.compile(
        job.source_id,
        CompileLessonRequest(page_start=1, page_end=2, title="TCP Slow Start"),
    )
    elements = store.elements_for_range(job.source_id, 1, 2)
    return store, service, job.source_id, lesson, elements


def compiler_manifest(lesson: LessonPackage) -> dict[str, Any]:
    return {
        "fixture_schema_version": 1,
        "source_sha256": lesson.source.content_hash,
        "schema_version": lesson.schema_version,
        "compiler_version": lesson.compiler_version,
        "package_id": lesson.id,
        "package_hash": lesson.package_hash,
        "title": lesson.title,
        "page_range": [lesson.page_start, lesson.page_end],
        "verification_status": lesson.verification_status,
        "claim_count": len(lesson.claims),
        "frame_count": len(lesson.frames),
        "visuals": [
            {
                "id": visual.id,
                "page_number": visual.page_number,
                "kind": visual.kind,
                "bbox_normalized": visual.bbox_normalized,
                "caption": visual.caption,
                "accessible_text": visual.accessible_text,
            }
            for visual in lesson.visuals
        ],
        "frames": [
            {
                "id": frame.id,
                "type": frame.type,
                "text": frame.representation.content,
                "active_visual_id": frame.active_visual_id,
                "page_number": frame.source_spans[0].page_number,
                "auto_advance_allowed": frame.auto_advance_allowed,
            }
            for frame in lesson.frames
        ],
    }


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
    assert join_text("to\x02", "gether", dehyphenate=True) == "together"
    assert (
        classify_kind("Figure 6.11 traces the congestion window.", [0.1, 0.2, 0.9, 0.3])
        == ElementKind.PARAGRAPH
    )
    assert classify_kind("state - > CongestionWindow;", [0.1, 0.2, 0.9, 0.3]) == (ElementKind.CODE)
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
    assert (
        classify_document_region(
            ["Computer Systems", "Third Global Edition", "Pearson"],
            page_index=0,
            page_count=1122,
        )
        == DocumentRegion.FRONT_MATTER
    )
    assert (
        classify_document_region(["Preface 33", "Acknowledgments"], page_index=33, page_count=1122)
        == DocumentRegion.FRONT_MATTER
    )
    assert (
        classify_document_region(
            [
                "10 Contents",
                "3.9 Heterogeneous Data Structures 301",
                "3.9.1 Structures 301",
                "3.9.2 Unions 305",
            ],
            page_index=10,
            page_count=1122,
        )
        == DocumentRegion.FRONT_MATTER
    )
    assert (
        classify_document_region(
            [
                "Section 1.1 Information Is Bits + Context 39",
                "35 105 110 99 108 117 100 101 32 60 115 116 100 105 111 46",
                "104 62 10 10 105 110 116 32 109 97 105 110 40 41 10 123",
                "10 32 32 32 32 112 114 105 110 116 102 40 34 104 101 108",
                "108 111 44 32 119 111 114 108 100 92 110 34 41 59 10 32",
            ],
            page_index=39,
            page_count=1122,
        )
        == DocumentRegion.BODY
    )
    assert has_body_boundary(["CHAPTER 1", "A Tour of Computer Systems"])
    assert has_body_boundary(["CHAPTER", "ONE", "FOUNDATION"])
    assert has_body_boundary(
        ["Chapter 1: A Tour of Computer Systems. This chapter introduces the major ideas"]
    ) is False
    assert has_body_boundary(["Chapter Topic", "1 Tour of systems"]) is False
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


def test_parser_deduplicates_exact_pdf_artifacts_and_disambiguates_real_collisions() -> None:
    base = {
        "kind": ElementKind.PARAGRAPH,
        "text": "0 0",
        "bbox_normalized": [0.23, 0.42, 0.24, 0.43],
        "status": "trusted_for_transform",
        "document_region": DocumentRegion.BODY,
        "playback_eligible": True,
        "confidence": {"text": 0.98, "order": 0.86, "structure": 0.76},
    }
    exact_duplicate = base.copy()
    distinct_collision = {
        **base,
        "confidence": {"text": 0.98, "order": 0.87, "structure": 0.76},
    }

    records = finalize_page_records(
        [base, exact_duplicate, distinct_collision],
        source_hash="a" * 64,
        page_index=677,
        parser_version="parser-test",
    )

    assert len(records) == 2
    assert [record["reading_order"] for record in records] == [0, 1]
    assert len({record["id"] for record in records}) == 2
    assert any(record["id"].endswith("_2") for record in records)


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
    assert failed_job.error_message == "simulated_parser_interruption"
    failed_source = store.source(failed_job.source_id)
    assert failed_source is not None
    assert failed_source.status == SourceStatus.NEEDS_REVIEW

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


def test_parser_upgrade_restarts_from_page_one_without_reuploading(
    tmp_path: Path, sample_pdf: Path
) -> None:
    store, service = make_service(tmp_path)
    initial_job_id = import_fixture(service, sample_pdf)
    service.process_job(initial_job_id)
    initial_job = store.job(initial_job_id)
    assert initial_job is not None

    with store.connection() as connection:
        connection.execute(
            "UPDATE elements SET parser_version = 'obsolete-parser' WHERE source_id = ?",
            (initial_job.source_id,),
        )
        connection.commit()
    stale_job = store.create_job(
        "job_stale_parser",
        initial_job.source_id,
        state=JobState.RETRYABLE_FAILURE,
        progress_current=2,
        progress_total=3,
        parser_version="obsolete-parser",
    )

    restarted = service.restart_import(stale_job.id)

    assert restarted.id != stale_job.id
    assert restarted.state == JobState.QUEUED
    assert restarted.progress_current == 0
    assert restarted.parser_version == service.parser.version
    source_during_reindex = store.source(initial_job.source_id)
    assert source_during_reindex is not None
    assert source_during_reindex.status == SourceStatus.INDEXING

    service.process_job(restarted.id)
    final_source = store.source(initial_job.source_id)
    assert final_source is not None
    assert final_source.status == SourceStatus.STRUCTURE_READY
    assert store.source_parser_versions(final_source.id) == {service.parser.version}


def test_existing_database_gets_a_recoverable_backup_before_parser_job_migration(
    tmp_path: Path,
) -> None:
    settings = Settings(data_dir=tmp_path / "prism-data")
    settings.data_dir.mkdir(parents=True)
    with sqlite3.connect(settings.database_path) as connection:
        connection.execute(
            """
            CREATE TABLE import_jobs (
                id TEXT PRIMARY KEY,
                source_id TEXT NOT NULL,
                state TEXT NOT NULL,
                progress_current INTEGER NOT NULL DEFAULT 0,
                progress_total INTEGER,
                error_class TEXT,
                error_message TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

    store = Store(settings)
    store.initialize()

    with store.connection() as connection:
        columns = {
            str(row["name"])
            for row in connection.execute("PRAGMA table_info(import_jobs)").fetchall()
        }
    assert "parser_version" in columns
    backups = list((settings.data_dir / "backups").glob("prism-before-v4-*.sqlite3"))
    assert len(backups) == 1


def test_section_readiness_chooses_body_content_and_blocks_front_matter() -> None:
    inventory = [
        {
            "page_number": 1,
            "trusted_text_characters": 0,
            "trusted_paragraph_characters": 0,
            "warning_text_characters": 0,
            "source_only_text_characters": 0,
            "body_text_elements": 0,
            "excluded_non_body_elements": 8,
        },
        {
            "page_number": 2,
            "trusted_text_characters": 0,
            "trusted_paragraph_characters": 0,
            "warning_text_characters": 0,
            "source_only_text_characters": 0,
            "body_text_elements": 0,
            "excluded_non_body_elements": 11,
        },
        {
            "page_number": 24,
            "trusted_text_characters": 721,
            "trusted_paragraph_characters": 681,
            "warning_text_characters": 0,
            "source_only_text_characters": 0,
            "body_text_elements": 5,
            "excluded_non_body_elements": 1,
        },
    ]

    recommendation = recommended_section(inventory, 400, source_ready=True)
    front_matter = section_readiness(
        inventory,
        page_start=1,
        page_end=3,
        page_count=400,
        source_ready=True,
        parser_current=True,
        source_status=SourceStatus.STRUCTURE_READY,
    )

    assert recommendation is not None
    assert recommendation.page_start == 24
    assert recommendation.page_end == 26
    assert recommendation.can_compile is True
    assert front_matter.can_compile is False
    assert front_matter.status == "source_only"


def test_compiler_is_deterministic_and_source_verbatim(tmp_path: Path, sample_pdf: Path) -> None:
    store, service = make_service(tmp_path)
    job_id = import_fixture(service, sample_pdf)
    service.process_job(job_id)
    job = store.job(job_id)
    assert job is not None

    request = CompileLessonRequest(page_start=1, page_end=2, title="TCP Slow Start")
    first = service.compile(job.source_id, request)
    second = service.compile(job.source_id, request)
    renamed = service.compile(
        job.source_id,
        CompileLessonRequest(page_start=1, page_end=2, title="TCP Slow Start - renamed"),
    )

    assert first.package_hash == second.package_hash
    assert first.id == second.id
    assert renamed.package_hash != first.package_hash
    assert renamed.id != first.id
    assert len(first.frames) >= 4
    assert first.frames[0].representation.content == "1. TCP Slow Start"
    assert len(first.frames[0].source_spans) == 1
    assert first.claims[0].proposition == "1. TCP Slow Start"
    assert first.claims[0].source_spans == first.frames[0].source_spans
    assert len(first.visuals) == 1
    assert any(frame.active_visual_id == first.visuals[0].id for frame in first.frames)
    assert all(
        not frame.auto_advance_allowed
        for frame in first.frames
        if frame.type == "integration" and frame.active_visual_id is not None
    )
    for frame in first.frames:
        assert frame.verification_status == "draft"
        assert frame.representation.content == frame.source_spans[0].extracted_text
        assert frame.minimum_dwell_ms <= frame.initial_dwell_ms
        assert frame.source_spans[0].page_number in {1, 2}


def test_compiler_groups_consecutive_heading_fragments_into_one_source_linked_frame(
    tmp_path: Path, sample_pdf: Path
) -> None:
    store, service = make_service(tmp_path)
    job_id = import_fixture(service, sample_pdf)
    service.process_job(job_id)
    job = store.job(job_id)
    source = store.source(job.source_id) if job else None
    assert source is not None

    elements = [
        {
            "id": "heading_chapter",
            "page_number": 1,
            "bbox_normalized": [0.1, 0.1, 0.4, 0.15],
            "kind": "heading",
            "text": "CHAPTER",
            "status": "trusted_for_transform",
            "playback_eligible": True,
            "confidence": {"text": 0.99, "order": 0.9, "structure": 0.9},
        },
        {
            "id": "heading_one",
            "page_number": 1,
            "bbox_normalized": [0.1, 0.16, 0.4, 0.21],
            "kind": "heading",
            "text": "ONE",
            "status": "trusted_for_transform",
            "playback_eligible": True,
            "confidence": {"text": 0.99, "order": 0.9, "structure": 0.9},
        },
        {
            "id": "heading_foundation",
            "page_number": 1,
            "bbox_normalized": [0.1, 0.22, 0.6, 0.27],
            "kind": "heading",
            "text": "FOUNDATION",
            "status": "trusted_for_transform",
            "playback_eligible": True,
            "confidence": {"text": 0.99, "order": 0.9, "structure": 0.9},
        },
        {
            "id": "body_network",
            "page_number": 1,
            "bbox_normalized": [0.1, 0.32, 0.9, 0.43],
            "kind": "paragraph",
            "text": "A network connects computers so they can exchange information.",
            "status": "trusted_for_transform",
            "playback_eligible": True,
            "confidence": {"text": 0.99, "order": 0.9, "structure": 0.9},
        },
    ]

    lesson = compile_lesson(
        source=source,
        elements=elements,
        page_start=1,
        page_end=1,
        title="Heading fragments",
    )

    assert lesson.frames[0].representation.content == "CHAPTER ONE FOUNDATION"
    assert [span.element_id for span in lesson.frames[0].source_spans] == [
        "heading_chapter",
        "heading_one",
        "heading_foundation",
    ]
    assert lesson.claims[0].proposition == "CHAPTER ONE FOUNDATION"
    validate_lesson_package(lesson, elements, expected_source=source)


def test_compiler_trims_only_a_recognized_running_header_from_a_source_span() -> None:
    source_text = (
        "38 Chapter 1 A Tour of Computer Systems A computer system consists of hardware "
        "and systems software."
    )

    trimmed, start_offset = trim_running_header_prefix(source_text, 0)

    assert trimmed == "A computer system consists of hardware and systems software."
    assert source_text[start_offset:] == trimmed
    assert trim_running_header_prefix("Chapter 1", 0) == ("Chapter 1", 0)
    assert trim_running_header_prefix(
        "Chapter 1 A Tour of Computer Systems A computer system begins here.", 0
    ) == ("Chapter 1 A Tour of Computer Systems A computer system begins here.", 0)


def test_compiler_matches_frozen_golden_manifest(tmp_path: Path, sample_pdf: Path) -> None:
    _, _, _, lesson, _ = compile_fixture(tmp_path, sample_pdf)
    expected = json.loads(GOLDEN_COMPILER_MANIFEST.read_text(encoding="utf-8"))

    assert compiler_manifest(lesson) == expected


def test_validator_rejects_broken_source_and_graph_references(
    tmp_path: Path,
    sample_pdf: Path,
) -> None:
    _, _, _, lesson, elements = compile_fixture(tmp_path, sample_pdf)
    corrupted = lesson.model_copy(deep=True)
    corrupted.frames[0].source_spans[0].extracted_text = "unsupported replacement"
    corrupted.frames[1].claim_ids = ["claim_missing"]
    corrupted.frames[1].prerequisite_frame_ids = ["frame_missing"]
    corrupted.frames[1].representation.persistent_terms = []
    corrupted.frames[-1].auto_advance_allowed = True
    corrupted.claims[3].qualifiers = []
    corrupted.visuals[0].accessible_text = ""
    corrupted.source.original_name = "wrong-source.pdf"

    with pytest.raises(PackageValidationError) as error:
        validate_lesson_package(corrupted, elements, expected_source=lesson.source)

    assert "frames[0].source_spans[0].extracted_text: source_text_mismatch" in error.value.issues
    assert "frames[1].claim_ids.claim_missing: orphan_claim_reference" in error.value.issues
    assert "frames[1].prerequisite_frame_ids.frame_missing: orphan_prerequisite" in (
        error.value.issues
    )
    assert "visuals[0].accessible_text: missing_accessible_equivalent" in error.value.issues
    assert "claims[3].qualifiers: qualifier_extraction_mismatch" in error.value.issues
    assert "frames[1].representation.persistent_terms: term_extraction_mismatch" in (
        error.value.issues
    )
    assert "frames[10].auto_advance_allowed: high_inspection_frame_cannot_autoplay" in (
        error.value.issues
    )
    assert "package.source: source_snapshot_mismatch" in error.value.issues
    assert "package.package_hash: content_hash_mismatch" in error.value.issues


def test_invalid_compiler_candidate_does_not_replace_last_valid_lesson(
    tmp_path: Path,
    sample_pdf: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store, service, source_id, lesson, _ = compile_fixture(tmp_path, sample_pdf)
    saved_before_failure = store.lesson(lesson.id)
    corrupted = lesson.model_copy(deep=True)
    corrupted.frames[0].representation.content = "unsupported replacement"

    monkeypatch.setattr(services_module, "compile_lesson", lambda **_: corrupted)

    with pytest.raises(PackageValidationError):
        service.compile(
            source_id,
            CompileLessonRequest(page_start=1, page_end=2, title="TCP Slow Start"),
        )

    assert store.lesson(lesson.id) == saved_before_failure


def test_outline_pdf_produces_hierarchical_sections(tmp_path: Path) -> None:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen.canvas import Canvas

    pdf_path = tmp_path / "outline-fixture.pdf"
    canvas = Canvas(str(pdf_path), pagesize=letter, invariant=1, pageCompression=0)
    outline_plan = [
        ("Chapter 1 Recursion", 0, "k1"),
        ("1.1 Towers of Hanoi", 1, "k2"),
        ("Chapter 2 Backtracking", 0, "k3"),
    ]
    for page_number, (title, level, key) in enumerate(outline_plan, start=1):
        canvas.setFont("Times-Roman", 12)
        canvas.drawString(72, 700, f"Body text for {title} on page {page_number}.")
        canvas.bookmarkPage(key)
        canvas.addOutlineEntry(title, key, level)
        canvas.showPage()
    canvas.save()

    _, service = make_service(tmp_path)
    with pdf_path.open("rb") as stream:
        response = service.import_pdf(
            stream, original_name=pdf_path.name, rights_status=RightsStatus.OPEN_LICENSE
        )
    service.process_job(response.job.id)

    structure = service.structure(response.source.id)
    assert structure.origin == "outline"
    titles = [section.title for section in structure.sections]
    assert titles == ["Chapter 1 Recursion", "1.1 Towers of Hanoi", "Chapter 2 Backtracking"]
    chapter_one, subsection, chapter_two = structure.sections
    assert (chapter_one.page_start, chapter_one.page_end) == (1, 2)
    assert (subsection.page_start, subsection.page_end) == (2, 2)
    assert (chapter_two.page_start, chapter_two.page_end) == (3, 3)
    assert subsection.parent_id == chapter_one.id
    assert chapter_one.parent_id is None


def test_computed_sections_fall_back_to_detected_headings() -> None:
    from prism_api.services import computed_sections, fts_query

    headings = [
        {"page_number": 5, "text": "Chapter 1: A Tour of Computer Systems"},
        {"page_number": 9, "text": "1.2 Programs Are Translated by Other Programs"},
        {"page_number": 14, "text": "Chapter 2: Representing Information"},
        {"page_number": 14, "text": "2.1 Information Storage"},
    ]
    sections = computed_sections(headings, page_count=30)

    assert [section["title"][:9] for section in sections] == [
        "Chapter 1",
        "1.2 Progr",
        "Chapter 2",
    ]
    assert sections[0]["page_start"] == 5
    assert sections[0]["page_end"] == 13
    assert sections[1]["parent_id"] == sections[0]["id"]
    assert sections[2]["page_end"] == 30

    assert fts_query('congestion OR NEAR("') == '"congestion" "OR" "NEAR("'
    assert fts_query("   ") is None


def test_reading_state_tracks_furthest_page_and_clamps(
    tmp_path: Path, sample_pdf: Path
) -> None:
    store, service = make_service(tmp_path)
    job_id = import_fixture(service, sample_pdf)
    service.process_job(job_id)
    job = store.job(job_id)
    assert job is not None

    initial = service.reading_state(job.source_id)
    assert (initial.last_page, initial.furthest_page) == (1, 1)

    service.update_reading_state(job.source_id, last_page=99, last_scroll_ratio=0.4)
    state = service.reading_state(job.source_id)
    assert state.last_page == 3  # clamped to the page count
    assert state.furthest_page == 3

    service.update_reading_state(job.source_id, last_page=1, last_scroll_ratio=0.0)
    revisited = service.reading_state(job.source_id)
    assert revisited.last_page == 1
    assert revisited.furthest_page == 3


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
