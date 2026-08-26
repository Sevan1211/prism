from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from prism_api import __version__
from prism_api.config import Settings
from prism_api.models import (
    CompileLessonRequest,
    HealthResponse,
    ImportJob,
    ImportResponse,
    LessonPackage,
    ResearchEventIn,
    ResearchEventRecord,
    RightsStatus,
    SourceReadiness,
    SourceSummary,
)
from prism_api.pdf_parser import NativePdfParser
from prism_api.services import DurableImportWorker, InvalidUploadError, SourceService
from prism_api.storage import Store


def configure_logging() -> None:
    """Attach one console handler for the local API without duplicating uvicorn's."""

    prism_logger = logging.getLogger("prism_api")
    if prism_logger.handlers:
        return
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
    )
    prism_logger.addHandler(handler)
    prism_logger.setLevel(logging.INFO)


def create_app(settings: Settings | None = None, *, start_worker: bool = True) -> FastAPI:
    configure_logging()
    resolved_settings = settings or Settings.from_environment()
    store = Store(resolved_settings)
    parser = NativePdfParser()
    service = SourceService(resolved_settings, store, parser)
    worker = DurableImportWorker(service, store, resolved_settings.worker_poll_seconds)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        store.initialize()
        store.recover_interrupted_jobs()
        service.sweep_stale_uploads()
        if start_worker:
            worker.start()
        yield
        worker.stop()

    app = FastAPI(
        title="PRISM local API",
        version=__version__,
        lifespan=lifespan,
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
    )
    app.state.store = store
    app.state.source_service = service
    app.state.import_worker = worker
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    @app.get("/api/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse(version=__version__)

    @app.get("/api/sources", response_model=list[SourceSummary])
    def list_sources() -> list[SourceSummary]:
        return store.list_sources()

    @app.post("/api/sources", response_model=ImportResponse, status_code=status.HTTP_202_ACCEPTED)
    def import_source(
        file: Annotated[UploadFile, File(description="Clean born-digital PDF")],
        rights_status: Annotated[RightsStatus, Form()],
    ) -> ImportResponse:
        filename = file.filename or "source.pdf"
        if not filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=415, detail="Only PDF files are accepted in this slice."
            )
        try:
            return service.import_pdf(
                file.file,
                original_name=filename,
                rights_status=rights_status,
            )
        except InvalidUploadError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error

    @app.get("/api/imports/{job_id}", response_model=ImportJob)
    def import_status(job_id: str) -> ImportJob:
        job = store.job(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="Import job not found.")
        return job

    @app.post("/api/imports/{job_id}/resume", response_model=ImportJob)
    def resume_import(job_id: str) -> ImportJob:
        try:
            return service.restart_import(job_id)
        except LookupError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error

    @app.get("/api/sources/{source_id}/readiness", response_model=SourceReadiness)
    def source_readiness(
        source_id: str,
        page_start: Annotated[int | None, Query(ge=1)] = None,
        page_end: Annotated[int | None, Query(ge=1)] = None,
    ) -> SourceReadiness:
        if (page_start is None) != (page_end is None):
            raise HTTPException(
                status_code=422,
                detail="page_start and page_end must be supplied together.",
            )
        try:
            return service.readiness(
                source_id,
                page_start=page_start,
                page_end=page_end,
            )
        except LookupError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error

    @app.get("/api/sources/{source_id}/file")
    def source_file(source_id: str) -> FileResponse:
        source = store.source(source_id)
        path = store.source_path(source_id)
        if source is None or path is None or not path.exists():
            raise HTTPException(status_code=404, detail="Source file not found.")
        return FileResponse(
            path,
            media_type="application/pdf",
            filename=source.original_name,
            content_disposition_type="inline",
        )

    @app.get("/api/sources/{source_id}/visuals/{visual_id}")
    def source_visual(source_id: str, visual_id: str) -> FileResponse:
        try:
            path = service.visual_asset(source_id, visual_id)
        except LookupError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error
        return FileResponse(
            path,
            media_type="image/webp",
            headers={"Cache-Control": "public, max-age=31536000, immutable"},
        )

    @app.post("/api/sources/{source_id}/lessons", response_model=LessonPackage)
    def compile_source(source_id: str, compile_request: CompileLessonRequest) -> LessonPackage:
        try:
            return service.compile(source_id, compile_request)
        except LookupError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error
        except ValueError as error:
            raise HTTPException(status_code=409, detail=str(error)) from error

    @app.get("/api/lessons/{lesson_id}", response_model=LessonPackage)
    def lesson(lesson_id: str) -> LessonPackage:
        payload = store.lesson(lesson_id)
        if payload is None:
            raise HTTPException(status_code=404, detail="Lesson not found.")
        return LessonPackage.model_validate(payload)

    @app.post("/api/events", status_code=status.HTTP_204_NO_CONTENT)
    def append_event(event: ResearchEventIn) -> None:
        lesson_payload = store.lesson(event.lesson_id)
        if lesson_payload is None:
            raise HTTPException(status_code=404, detail="Lesson not found for research event.")
        frame_ids = {frame["id"] for frame in lesson_payload["frames"]}
        if event.frame_id is not None and event.frame_id not in frame_ids:
            raise HTTPException(status_code=409, detail="Frame does not belong to the lesson.")
        store.append_event(event.model_dump(mode="json"))

    @app.get(
        "/api/lessons/{lesson_id}/events",
        response_model=list[ResearchEventRecord],
    )
    def lesson_events(lesson_id: str) -> list[ResearchEventRecord]:
        if store.lesson(lesson_id) is None:
            raise HTTPException(status_code=404, detail="Lesson not found.")
        return [
            ResearchEventRecord.model_validate(event)
            for event in store.events_for_lesson(lesson_id)
        ]

    return app


app = create_app()
