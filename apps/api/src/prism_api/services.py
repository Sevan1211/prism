from __future__ import annotations

import hashlib
import logging
import shutil
import sqlite3
import threading
import time
import uuid
from pathlib import Path
from typing import BinaryIO, Literal

from prism_api.compiler import compile_lesson, validate_lesson_package
from prism_api.config import Settings
from prism_api.models import (
    CompileLessonRequest,
    ImportJob,
    ImportResponse,
    JobState,
    LessonPackage,
    RightsStatus,
    SectionReadiness,
    SourceReadiness,
    SourceStatus,
    SourceSummary,
)
from prism_api.pdf_parser import NativePdfParser
from prism_api.storage import Store

logger = logging.getLogger(__name__)


class InvalidUploadError(ValueError):
    pass


class PageImportError(RuntimeError):
    """Names the page that failed without leaking an opaque database error to the learner."""

    def __init__(self, page_number: int, cause: Exception) -> None:
        self.page_number = page_number
        self.cause = cause
        super().__init__(f"Could not index PDF page {page_number}: {cause}")


MINIMUM_TRUSTED_PARAGRAPH_CHARACTERS = 120


class SourceService:
    def __init__(self, settings: Settings, store: Store, parser: NativePdfParser) -> None:
        self.settings = settings
        self.store = store
        self.parser = parser
        self._visual_render_lock = threading.Lock()

    def import_pdf(
        self,
        stream: BinaryIO,
        *,
        original_name: str,
        rights_status: RightsStatus,
    ) -> ImportResponse:
        safe_name = Path(original_name).name[:240] or "source.pdf"
        temporary_path = self.settings.upload_dir / f"{uuid.uuid4().hex}.upload"
        digest = hashlib.sha256()
        size = 0
        first_bytes = b""
        try:
            with temporary_path.open("wb") as destination:
                while chunk := stream.read(1024 * 1024):
                    if not first_bytes:
                        first_bytes = chunk[:8]
                    size += len(chunk)
                    if size > self.settings.max_upload_bytes:
                        raise InvalidUploadError("PDF exceeds the configured 512 MB local limit.")
                    digest.update(chunk)
                    destination.write(chunk)
        except Exception:
            temporary_path.unlink(missing_ok=True)
            raise

        if size == 0 or not first_bytes.startswith(b"%PDF-"):
            temporary_path.unlink(missing_ok=True)
            raise InvalidUploadError("The uploaded file is not a valid PDF signature.")

        content_hash = digest.hexdigest()
        existing = self.store.source_by_hash(content_hash)
        if existing:
            temporary_path.unlink(missing_ok=True)
            return self._existing_source_response(existing)

        object_dir = self.settings.object_dir / content_hash[:2]
        object_dir.mkdir(parents=True, exist_ok=True)
        object_path = object_dir / f"{content_hash}.pdf"
        if object_path.exists():
            temporary_path.unlink(missing_ok=True)
        else:
            shutil.move(str(temporary_path), object_path)

        try:
            source = self.store.insert_source(
                source_id=f"src_{content_hash[:20]}",
                content_hash=content_hash,
                original_name=safe_name,
                stored_path=object_path,
                size_bytes=size,
                rights_status=rights_status,
            )
        except sqlite3.IntegrityError:
            # A concurrent upload of the same bytes registered the source first.
            racing = self.store.source_by_hash(content_hash)
            if racing is None:
                raise
            logger.info("import dedupe after concurrent insert for source %s", racing.id)
            return self._existing_source_response(racing)
        job = self.store.create_job(
            f"job_{uuid.uuid4().hex}", source.id, parser_version=self.parser.version
        )
        logger.info(
            "imported source %s (%d bytes) as job %s", source.id, size, job.id
        )
        return ImportResponse(source=source, job=job)

    def _existing_source_response(self, existing: SourceSummary) -> ImportResponse:
        """Reuse the stored source, requeueing indexing only when its artifacts are stale."""

        parser_versions = self.store.source_parser_versions(existing.id)
        parser_is_current = not parser_versions or parser_versions == {self.parser.version}
        state = (
            JobState.SUCCEEDED
            if existing.status == SourceStatus.STRUCTURE_READY and parser_is_current
            else JobState.QUEUED
        )
        if state == JobState.QUEUED:
            self.store.update_source_status(
                existing.id,
                SourceStatus.INDEXING,
                page_count=existing.page_count,
            )
        job = self.store.create_job(
            f"job_{uuid.uuid4().hex}",
            existing.id,
            state=state,
            progress_current=existing.page_count or 0 if state == JobState.SUCCEEDED else 0,
            progress_total=existing.page_count,
            parser_version=self.parser.version,
        )
        refreshed = self.store.source(existing.id)
        return ImportResponse(source=refreshed or existing, job=job)

    def sweep_stale_uploads(self) -> int:
        """Remove orphaned temporary upload files left behind by an interrupted process."""

        removed = 0
        for stale in self.settings.upload_dir.glob("*.upload"):
            try:
                stale.unlink()
                removed += 1
            except OSError:
                logger.warning("could not remove stale upload %s", stale.name)
        if removed:
            logger.info("removed %d stale upload file(s)", removed)
        return removed

    def process_job(self, job_id: str, *, fail_after_page: int | None = None) -> None:
        job = self.store.job(job_id)
        if job is None:
            raise LookupError("Import job not found.")
        source = self.store.source(job.source_id)
        source_path = self.store.source_path(job.source_id)
        if source is None or source_path is None:
            raise LookupError("Import source not found.")

        if job.parser_version != self.parser.version:
            self.restart_import(job.id)
            return

        try:
            with self.parser.open(source_path) as document:
                total = document.page_count
                self.store.update_source_status(source.id, SourceStatus.INDEXING, page_count=total)
                self.store.update_job(
                    job.id,
                    JobState.RUNNING,
                    progress_current=job.progress_current,
                    progress_total=total,
                )
                for page_index in range(job.progress_current, total):
                    try:
                        elements = document.parse_page(source.content_hash, page_index)
                        self.store.replace_page_elements(
                            source_id=source.id,
                            page_number=page_index + 1,
                            elements=elements,
                            job_id=job.id,
                            progress_current=page_index + 1,
                            progress_total=total,
                        )
                    except Exception as error:
                        raise PageImportError(page_index + 1, error) from error
                    if fail_after_page is not None and page_index + 1 >= fail_after_page:
                        raise RuntimeError("simulated_parser_interruption")
            self.store.update_source_status(
                source.id, SourceStatus.STRUCTURE_READY, page_count=total
            )
            self.store.update_job(
                job.id,
                JobState.SUCCEEDED,
                progress_current=total,
                progress_total=total,
            )
        except Exception as error:
            logger.exception(
                "import job %s failed for source %s", job.id, source.id
            )
            self.store.update_source_status(
                source.id,
                SourceStatus.NEEDS_REVIEW,
                page_count=source.page_count,
            )
            self.store.update_job(
                job.id,
                JobState.RETRYABLE_FAILURE,
                error_class=type(error).__name__,
                error_message=str(error)[:500],
            )
            raise

    def restart_import(self, job_id: str) -> ImportJob:
        """Resume a current job or begin a full, deterministic reindex after a parser upgrade."""

        job = self.store.job(job_id)
        if job is None:
            raise LookupError("Import job not found.")
        source = self.store.source(job.source_id)
        if source is None:
            raise LookupError("Import source not found.")

        parser_versions = self.store.source_parser_versions(source.id)
        needs_full_reindex = (
            job.parser_version != self.parser.version
            or (bool(parser_versions) and parser_versions != {self.parser.version})
        )
        if not needs_full_reindex:
            resumed = self.store.resume_job(job.id)
            if resumed is not None and resumed.state == JobState.QUEUED:
                self.store.update_source_status(
                    source.id,
                    SourceStatus.INDEXING,
                    page_count=source.page_count,
                )
            return resumed or job

        self.store.update_job(
            job.id,
            JobState.NEEDS_REVIEW,
            error_class="parser_version_stale",
            error_message=(
                "A parser upgrade requires a clean local reindex. The original PDF is retained."
            ),
        )
        self.store.update_source_status(
            source.id,
            SourceStatus.INDEXING,
            page_count=source.page_count,
        )
        return self.store.create_job(
            f"job_{uuid.uuid4().hex}",
            source.id,
            progress_current=0,
            progress_total=source.page_count,
            parser_version=self.parser.version,
        )

    def readiness(
        self,
        source_id: str,
        *,
        page_start: int | None = None,
        page_end: int | None = None,
    ) -> SourceReadiness:
        source = self.store.source(source_id)
        if source is None:
            raise LookupError("Source not found.")

        latest_job = self.store.latest_job_for_source(source.id)
        parser_versions = self.store.source_parser_versions(source.id)
        parser_current = not parser_versions or parser_versions == {self.parser.version}
        inventory = self.store.page_inventory(source.id)
        trusted_body_pages = sum(
            item["trusted_text_characters"] > 0 for item in inventory
        )
        source_only_body_pages = sum(
            item["source_only_text_characters"] > 0 for item in inventory
        )
        source_ready = source.status == SourceStatus.STRUCTURE_READY and parser_current
        recommended_range = recommended_section(inventory, source.page_count, source_ready)
        selected_range = (
            section_readiness(
                inventory,
                page_start=page_start,
                page_end=page_end,
                page_count=source.page_count,
                source_ready=source_ready,
                parser_current=parser_current,
                source_status=source.status,
            )
            if page_start is not None and page_end is not None
            else None
        )

        phase: Literal["indexing", "ready", "needs_attention", "source_only"]
        if latest_job and latest_job.state in {JobState.QUEUED, JobState.RUNNING}:
            phase = "indexing"
        elif not parser_current or source.status in {
            SourceStatus.NEEDS_REVIEW,
            SourceStatus.FAILED,
        }:
            phase = "needs_attention"
        elif source_ready and trusted_body_pages > 0:
            phase = "ready"
        elif source_ready:
            phase = "source_only"
        else:
            phase = "indexing"

        notes = [
            (
                "PRISM currently transforms only trusted, embedded body text; "
                "the original PDF stays local."
            ),
            (
                "Figures and tables retain exact source regions; unsupported content "
                "remains in Source mode."
            ),
        ]
        if not parser_current:
            notes.append(
                "This local index was created by an older parser and must be rebuilt "
                "before streaming."
            )
        if source_only_body_pages:
            notes.append(
                f"{source_only_body_pages} body page(s) contain source-only text that "
                "will not enter a stream."
            )
        if source_ready and trusted_body_pages == 0:
            notes.append(
                "No trusted body text was recovered; use the original PDF while this "
                "source remains source-only."
            )

        return SourceReadiness(
            source_id=source.id,
            source_status=source.status,
            phase=phase,
            parser_current=parser_current,
            latest_job=latest_job,
            trusted_body_pages=trusted_body_pages,
            source_only_body_pages=source_only_body_pages,
            recommended_range=recommended_range,
            selected_range=selected_range,
            capability_notes=notes,
        )

    def compile(self, source_id: str, request: CompileLessonRequest) -> LessonPackage:
        source = self.store.source(source_id)
        if source is None:
            raise LookupError("Source not found.")
        if source.status != SourceStatus.STRUCTURE_READY:
            raise ValueError("Source indexing must finish before section compilation.")
        parser_versions = self.store.source_parser_versions(source.id)
        if parser_versions and parser_versions != {self.parser.version}:
            raise ValueError(
                "The local index uses an older parser. Rebuild the local index before "
                "creating a stream."
            )
        if request.page_end < request.page_start:
            raise ValueError("Page end must be greater than or equal to page start.")
        if source.page_count and request.page_end > source.page_count:
            raise ValueError(f"Page end exceeds the source page count of {source.page_count}.")
        readiness = section_readiness(
            self.store.page_inventory(source_id),
            page_start=request.page_start,
            page_end=request.page_end,
            page_count=source.page_count,
            source_ready=True,
            parser_current=True,
            source_status=source.status,
        )
        if not readiness.can_compile:
            raise ValueError(readiness.message)
        elements = self.store.elements_for_range(source_id, request.page_start, request.page_end)
        package = compile_lesson(
            source=source,
            elements=elements,
            page_start=request.page_start,
            page_end=request.page_end,
            title=request.title,
        )
        validate_lesson_package(package, elements, expected_source=source)
        payload = package.model_dump(mode="json")
        self.store.save_lesson(payload)
        return package

    def visual_asset(self, source_id: str, visual_id: str) -> Path:
        source = self.store.source(source_id)
        source_path = self.store.source_path(source_id)
        element = self.store.visual_element(source_id, visual_id)
        if source is None or source_path is None or element is None:
            raise LookupError("Source visual not found.")

        cache_identity = f"{source.content_hash}:{element['parser_version']}:{element['id']}"
        # 24 hex characters keep collisions implausible while leaving headroom under
        # the Windows 260-character path limit for deep PRISM_DATA_DIR locations.
        cache_key = hashlib.sha256(cache_identity.encode("utf-8")).hexdigest()[:24]
        output_path = (
            self.settings.visual_cache_dir / source.content_hash[:16] / f"{cache_key}.webp"
        )
        if output_path.exists():
            return output_path

        with self._visual_render_lock:
            if not output_path.exists():
                self.parser.render_region(
                    source_path,
                    int(element["page_number"]) - 1,
                    element["bbox_normalized"],
                    output_path,
                )
        return output_path


def recommended_section(
    inventory: list[dict[str, int]],
    page_count: int | None,
    source_ready: bool,
) -> SectionReadiness | None:
    """Choose the earliest small body window instead of blindly starting at PDF page one."""

    if not source_ready or page_count is None:
        return None
    first_body_page = next(
        (
            item["page_number"]
            for item in inventory
            if item["trusted_paragraph_characters"] >= MINIMUM_TRUSTED_PARAGRAPH_CHARACTERS
        ),
        None,
    )
    if first_body_page is None:
        return None
    return section_readiness(
        inventory,
        page_start=first_body_page,
        page_end=min(page_count, first_body_page + 2),
        page_count=page_count,
        source_ready=True,
        parser_current=True,
        source_status=SourceStatus.STRUCTURE_READY,
    )


def section_readiness(
    inventory: list[dict[str, int]],
    *,
    page_start: int,
    page_end: int,
    page_count: int | None,
    source_ready: bool,
    parser_current: bool,
    source_status: SourceStatus,
) -> SectionReadiness:
    if (
        page_count is None
        or page_start < 1
        or page_end < page_start
        or page_end > page_count
    ):
        return SectionReadiness(
            page_start=page_start,
            page_end=page_end,
            status="invalid_range",
            can_compile=False,
            message="Choose a page range inside this PDF before preparing a stream.",
        )

    if not source_ready:
        if not parser_current:
            message = (
                "This source needs a local reindex after the parser upgrade before a "
                "stream can be made."
            )
        elif source_status in {SourceStatus.NEEDS_REVIEW, SourceStatus.FAILED}:
            message = "The local index needs attention before this section can be prepared."
        else:
            message = "PRISM is still building the local index for this source."
        return SectionReadiness(
            page_start=page_start,
            page_end=page_end,
            status=(
                "indexing"
                if parser_current
                and source_status in {SourceStatus.SOURCE_READY, SourceStatus.INDEXING}
                else "needs_attention"
            ),
            can_compile=False,
            message=message,
        )

    selected = [
        item
        for item in inventory
        if page_start <= item["page_number"] <= page_end
    ]
    trusted_characters = sum(item["trusted_text_characters"] for item in selected)
    trusted_paragraph_characters = sum(item["trusted_paragraph_characters"] for item in selected)
    warning_characters = sum(item["warning_text_characters"] for item in selected)
    source_only_characters = sum(item["source_only_text_characters"] for item in selected)
    body_pages = sum(item["body_text_elements"] > 0 for item in selected)
    excluded = sum(item["excluded_non_body_elements"] for item in selected)
    common = {
        "page_start": page_start,
        "page_end": page_end,
        "trusted_text_characters": trusted_characters,
        "warning_text_characters": warning_characters,
        "source_only_text_characters": source_only_characters,
        "body_pages": body_pages,
        "excluded_non_body_elements": excluded,
    }
    if trusted_paragraph_characters >= MINIMUM_TRUSTED_PARAGRAPH_CHARACTERS:
        return SectionReadiness(
            **common,
            status="ready",
            can_compile=True,
            message=(
                "This range contains trusted body text and is ready for a draft semantic stream."
            ),
        )
    if trusted_characters > 0:
        return SectionReadiness(
            **common,
            status="source_only",
            can_compile=False,
            message=(
                "This range has headings or page furniture but not enough trusted explanatory "
                "body text for a coherent stream. Extend the range or use the original PDF."
            ),
        )
    if warning_characters > 0:
        return SectionReadiness(
            **common,
            status="needs_attention",
            can_compile=False,
            message=(
                "This range has only warning-level extraction, so PRISM will keep it in Source "
                "until it is reviewed."
            ),
        )
    return SectionReadiness(
        **common,
        status="source_only",
        can_compile=False,
        message=(
            "This range has no trusted body text for transformation. Front and back matter remain "
            "available in the original PDF."
        ),
    )


class DurableImportWorker:
    def __init__(self, service: SourceService, store: Store, poll_seconds: float) -> None:
        self.service = service
        self.store = store
        self.poll_seconds = poll_seconds
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._run, name="prism-import-worker", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=3)

    def _run(self) -> None:
        while not self._stop.is_set():
            job = self.store.next_queued_job()
            if job is None:
                self._stop.wait(self.poll_seconds)
                continue
            try:
                self.service.process_job(job.id)
            except Exception:
                # process_job already recorded and logged the failure; keep the
                # worker alive and back off briefly before polling again.
                time.sleep(min(1.0, self.poll_seconds * 2))
