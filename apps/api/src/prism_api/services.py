from __future__ import annotations

import hashlib
import shutil
import threading
import time
import uuid
from pathlib import Path
from typing import BinaryIO

from prism_api.compiler import compile_lesson, validate_lesson_package
from prism_api.config import Settings
from prism_api.models import (
    CompileLessonRequest,
    ImportResponse,
    JobState,
    LessonPackage,
    RightsStatus,
    SourceStatus,
)
from prism_api.pdf_parser import NativePdfParser
from prism_api.storage import Store


class InvalidUploadError(ValueError):
    pass


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
            parser_is_current = self.store.source_parser_versions(existing.id) == {
                self.parser.version
            }
            state = (
                JobState.SUCCEEDED
                if existing.status == SourceStatus.STRUCTURE_READY and parser_is_current
                else JobState.QUEUED
            )
            job = self.store.create_job(
                f"job_{uuid.uuid4().hex}",
                existing.id,
                state=state,
                progress_current=existing.page_count or 0 if state == JobState.SUCCEEDED else 0,
                progress_total=existing.page_count,
            )
            return ImportResponse(source=existing, job=job)

        object_dir = self.settings.object_dir / content_hash[:2]
        object_dir.mkdir(parents=True, exist_ok=True)
        object_path = object_dir / f"{content_hash}.pdf"
        if object_path.exists():
            temporary_path.unlink(missing_ok=True)
        else:
            shutil.move(str(temporary_path), object_path)

        source = self.store.insert_source(
            source_id=f"src_{content_hash[:20]}",
            content_hash=content_hash,
            original_name=safe_name,
            stored_path=object_path,
            size_bytes=size,
            rights_status=rights_status,
        )
        job = self.store.create_job(f"job_{uuid.uuid4().hex}", source.id)
        return ImportResponse(source=source, job=job)

    def process_job(self, job_id: str, *, fail_after_page: int | None = None) -> None:
        job = self.store.job(job_id)
        if job is None:
            raise LookupError("Import job not found.")
        source = self.store.source(job.source_id)
        source_path = self.store.source_path(job.source_id)
        if source is None or source_path is None:
            raise LookupError("Import source not found.")

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
                    elements = document.parse_page(source.content_hash, page_index)
                    self.store.replace_page_elements(
                        source_id=source.id,
                        page_number=page_index + 1,
                        elements=elements,
                        job_id=job.id,
                        progress_current=page_index + 1,
                        progress_total=total,
                    )
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
            self.store.update_job(
                job.id,
                JobState.RETRYABLE_FAILURE,
                error_class=type(error).__name__,
                error_message=str(error)[:500],
            )
            raise

    def compile(self, source_id: str, request: CompileLessonRequest) -> LessonPackage:
        source = self.store.source(source_id)
        if source is None:
            raise LookupError("Source not found.")
        if source.status != SourceStatus.STRUCTURE_READY:
            raise ValueError("Source indexing must finish before section compilation.")
        if request.page_end < request.page_start:
            raise ValueError("Page end must be greater than or equal to page start.")
        if source.page_count and request.page_end > source.page_count:
            raise ValueError(f"Page end exceeds the source page count of {source.page_count}.")
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
        cache_key = hashlib.sha256(cache_identity.encode("utf-8")).hexdigest()
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
                time.sleep(min(1.0, self.poll_seconds * 2))
