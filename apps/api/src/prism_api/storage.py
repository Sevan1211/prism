from __future__ import annotations

import json
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from prism_api.config import Settings
from prism_api.models import (
    CloudPolicy,
    ImportJob,
    JobState,
    RightsStatus,
    SourceStatus,
    SourceSummary,
)


def utc_now() -> str:
    return datetime.now(UTC).isoformat()


class Store:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def initialize(self) -> None:
        self.settings.data_dir.mkdir(parents=True, exist_ok=True)
        self.settings.object_dir.mkdir(parents=True, exist_ok=True)
        self.settings.upload_dir.mkdir(parents=True, exist_ok=True)
        self.settings.visual_cache_dir.mkdir(parents=True, exist_ok=True)
        with self.connection() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version INTEGER PRIMARY KEY,
                    applied_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS sources (
                    id TEXT PRIMARY KEY,
                    content_hash TEXT NOT NULL UNIQUE,
                    original_name TEXT NOT NULL,
                    stored_path TEXT NOT NULL,
                    size_bytes INTEGER NOT NULL,
                    page_count INTEGER,
                    status TEXT NOT NULL,
                    rights_status TEXT NOT NULL,
                    cloud_policy TEXT NOT NULL DEFAULT 'local_only',
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS import_jobs (
                    id TEXT PRIMARY KEY,
                    source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
                    state TEXT NOT NULL,
                    progress_current INTEGER NOT NULL DEFAULT 0,
                    progress_total INTEGER,
                    error_class TEXT,
                    error_message TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS elements (
                    id TEXT PRIMARY KEY,
                    source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
                    page_number INTEGER NOT NULL,
                    reading_order INTEGER NOT NULL,
                    kind TEXT NOT NULL,
                    text TEXT NOT NULL,
                    bbox_json TEXT NOT NULL,
                    status TEXT NOT NULL,
                    confidence_json TEXT NOT NULL,
                    parser_version TEXT NOT NULL,
                    document_region TEXT NOT NULL DEFAULT 'body',
                    playback_eligible INTEGER NOT NULL DEFAULT 1,
                    UNIQUE(source_id, page_number, reading_order)
                );

                CREATE VIRTUAL TABLE IF NOT EXISTS elements_fts USING fts5(
                    element_id UNINDEXED,
                    source_id UNINDEXED,
                    text,
                    tokenize='unicode61'
                );

                CREATE TABLE IF NOT EXISTS lessons (
                    id TEXT PRIMARY KEY,
                    source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
                    page_start INTEGER NOT NULL,
                    page_end INTEGER NOT NULL,
                    package_hash TEXT NOT NULL,
                    package_json TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS research_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    lesson_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    frame_id TEXT,
                    occurred_at TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    schema_version INTEGER NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_elements_source_page
                    ON elements(source_id, page_number, reading_order);
                CREATE INDEX IF NOT EXISTS idx_jobs_state_created
                    ON import_jobs(state, created_at);
                CREATE INDEX IF NOT EXISTS idx_events_session
                    ON research_events(session_id, occurred_at);
                """
            )
            connection.execute(
                "INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES(1, ?)",
                (utc_now(),),
            )
            source_columns = {
                str(row["name"])
                for row in connection.execute("PRAGMA table_info(sources)").fetchall()
            }
            if "cloud_policy" not in source_columns:
                connection.execute(
                    "ALTER TABLE sources ADD COLUMN cloud_policy TEXT NOT NULL DEFAULT 'local_only'"
                )
            connection.execute(
                "INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES(2, ?)",
                (utc_now(),),
            )
            element_columns = {
                str(row["name"])
                for row in connection.execute("PRAGMA table_info(elements)").fetchall()
            }
            if "document_region" not in element_columns:
                connection.execute(
                    "ALTER TABLE elements ADD COLUMN document_region TEXT NOT NULL DEFAULT 'body'"
                )
            if "playback_eligible" not in element_columns:
                connection.execute(
                    "ALTER TABLE elements ADD COLUMN playback_eligible INTEGER NOT NULL DEFAULT 1"
                )
            connection.execute(
                "INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES(3, ?)",
                (utc_now(),),
            )
            connection.commit()

    @contextmanager
    def connection(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.settings.database_path, timeout=30)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("PRAGMA synchronous=NORMAL")
        try:
            yield connection
        finally:
            connection.close()

    def recover_interrupted_jobs(self) -> int:
        with self.connection() as connection:
            cursor = connection.execute(
                """
                UPDATE import_jobs
                SET state = ?, error_class = 'process_interrupted', updated_at = ?
                WHERE state = ?
                """,
                (JobState.QUEUED, utc_now(), JobState.RUNNING),
            )
            connection.commit()
            return cursor.rowcount

    def source_by_hash(self, content_hash: str) -> SourceSummary | None:
        with self.connection() as connection:
            row = connection.execute(
                "SELECT * FROM sources WHERE content_hash = ?", (content_hash,)
            ).fetchone()
        return self._source_from_row(row) if row else None

    def source(self, source_id: str) -> SourceSummary | None:
        with self.connection() as connection:
            row = connection.execute("SELECT * FROM sources WHERE id = ?", (source_id,)).fetchone()
        return self._source_from_row(row) if row else None

    def source_path(self, source_id: str) -> Path | None:
        with self.connection() as connection:
            row = connection.execute(
                "SELECT stored_path FROM sources WHERE id = ?", (source_id,)
            ).fetchone()
        return Path(str(row["stored_path"])) if row else None

    def list_sources(self) -> list[SourceSummary]:
        with self.connection() as connection:
            rows = connection.execute("SELECT * FROM sources ORDER BY created_at DESC").fetchall()
        return [self._source_from_row(row) for row in rows]

    def source_parser_versions(self, source_id: str) -> set[str]:
        with self.connection() as connection:
            rows = connection.execute(
                "SELECT DISTINCT parser_version FROM elements WHERE source_id = ?",
                (source_id,),
            ).fetchall()
        return {str(row["parser_version"]) for row in rows}

    def insert_source(
        self,
        *,
        source_id: str,
        content_hash: str,
        original_name: str,
        stored_path: Path,
        size_bytes: int,
        rights_status: RightsStatus,
    ) -> SourceSummary:
        created_at = utc_now()
        with self.connection() as connection:
            connection.execute(
                """
                INSERT INTO sources(
                    id, content_hash, original_name, stored_path, size_bytes, page_count,
                    status, rights_status, cloud_policy, created_at
                ) VALUES(?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
                """,
                (
                    source_id,
                    content_hash,
                    original_name,
                    str(stored_path),
                    size_bytes,
                    SourceStatus.SOURCE_READY,
                    rights_status,
                    CloudPolicy.LOCAL_ONLY,
                    created_at,
                ),
            )
            connection.commit()
        source = self.source(source_id)
        if source is None:
            raise RuntimeError("source insert did not persist")
        return source

    def update_source_status(
        self, source_id: str, status: SourceStatus, *, page_count: int | None = None
    ) -> None:
        with self.connection() as connection:
            if page_count is None:
                connection.execute(
                    "UPDATE sources SET status = ? WHERE id = ?", (status, source_id)
                )
            else:
                connection.execute(
                    "UPDATE sources SET status = ?, page_count = ? WHERE id = ?",
                    (status, page_count, source_id),
                )
            connection.commit()

    def create_job(
        self,
        job_id: str,
        source_id: str,
        *,
        state: JobState = JobState.QUEUED,
        progress_current: int = 0,
        progress_total: int | None = None,
    ) -> ImportJob:
        timestamp = utc_now()
        with self.connection() as connection:
            connection.execute(
                """
                INSERT INTO import_jobs(
                    id, source_id, state, progress_current, progress_total,
                    error_class, error_message, created_at, updated_at
                ) VALUES(?, ?, ?, ?, ?, NULL, NULL, ?, ?)
                """,
                (
                    job_id,
                    source_id,
                    state,
                    progress_current,
                    progress_total,
                    timestamp,
                    timestamp,
                ),
            )
            connection.commit()
        job = self.job(job_id)
        if job is None:
            raise RuntimeError("job insert did not persist")
        return job

    def job(self, job_id: str) -> ImportJob | None:
        with self.connection() as connection:
            row = connection.execute("SELECT * FROM import_jobs WHERE id = ?", (job_id,)).fetchone()
        return self._job_from_row(row) if row else None

    def next_queued_job(self) -> ImportJob | None:
        with self.connection() as connection:
            row = connection.execute(
                """
                SELECT * FROM import_jobs
                WHERE state = ?
                ORDER BY created_at
                LIMIT 1
                """,
                (JobState.QUEUED,),
            ).fetchone()
        return self._job_from_row(row) if row else None

    def update_job(
        self,
        job_id: str,
        state: JobState,
        *,
        progress_current: int | None = None,
        progress_total: int | None = None,
        error_class: str | None = None,
        error_message: str | None = None,
    ) -> None:
        updates = ["state = ?", "updated_at = ?", "error_class = ?", "error_message = ?"]
        values: list[Any] = [state, utc_now(), error_class, error_message]
        if progress_current is not None:
            updates.append("progress_current = ?")
            values.append(progress_current)
        if progress_total is not None:
            updates.append("progress_total = ?")
            values.append(progress_total)
        values.append(job_id)
        with self.connection() as connection:
            connection.execute(f"UPDATE import_jobs SET {', '.join(updates)} WHERE id = ?", values)
            connection.commit()

    def resume_job(self, job_id: str) -> ImportJob | None:
        job = self.job(job_id)
        if job is None:
            return None
        if job.state not in {JobState.RETRYABLE_FAILURE, JobState.NEEDS_REVIEW}:
            return job
        self.update_job(
            job_id,
            JobState.QUEUED,
            progress_current=job.progress_current,
            progress_total=job.progress_total,
        )
        return self.job(job_id)

    def replace_page_elements(
        self,
        *,
        source_id: str,
        page_number: int,
        elements: list[dict[str, Any]],
        job_id: str,
        progress_current: int,
        progress_total: int,
    ) -> None:
        with self.connection() as connection:
            existing = connection.execute(
                "SELECT id FROM elements WHERE source_id = ? AND page_number = ?",
                (source_id, page_number),
            ).fetchall()
            for row in existing:
                connection.execute("DELETE FROM elements_fts WHERE element_id = ?", (row["id"],))
            connection.execute(
                "DELETE FROM elements WHERE source_id = ? AND page_number = ?",
                (source_id, page_number),
            )
            for element in elements:
                connection.execute(
                    """
                    INSERT INTO elements(
                        id, source_id, page_number, reading_order, kind, text,
                        bbox_json, status, confidence_json, parser_version,
                        document_region, playback_eligible
                    ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        element["id"],
                        source_id,
                        page_number,
                        element["reading_order"],
                        element["kind"],
                        element["text"],
                        json.dumps(element["bbox_normalized"]),
                        element["status"],
                        json.dumps(element["confidence"]),
                        element["parser_version"],
                        element["document_region"],
                        int(element["playback_eligible"]),
                    ),
                )
                connection.execute(
                    "INSERT INTO elements_fts(element_id, source_id, text) VALUES(?, ?, ?)",
                    (element["id"], source_id, element["text"]),
                )
            connection.execute(
                """
                UPDATE import_jobs
                SET progress_current = ?, progress_total = ?, updated_at = ?
                WHERE id = ?
                """,
                (progress_current, progress_total, utc_now(), job_id),
            )
            connection.commit()

    def elements_for_range(
        self, source_id: str, page_start: int, page_end: int
    ) -> list[dict[str, Any]]:
        with self.connection() as connection:
            rows = connection.execute(
                """
                SELECT * FROM elements
                WHERE source_id = ? AND page_number BETWEEN ? AND ?
                ORDER BY page_number, reading_order
                """,
                (source_id, page_start, page_end),
            ).fetchall()
        return [
            {
                "id": str(row["id"]),
                "page_number": int(row["page_number"]),
                "reading_order": int(row["reading_order"]),
                "kind": str(row["kind"]),
                "text": str(row["text"]),
                "bbox_normalized": json.loads(str(row["bbox_json"])),
                "status": str(row["status"]),
                "confidence": json.loads(str(row["confidence_json"])),
                "document_region": str(row["document_region"]),
                "playback_eligible": bool(row["playback_eligible"]),
            }
            for row in rows
        ]

    def visual_element(self, source_id: str, element_id: str) -> dict[str, Any] | None:
        with self.connection() as connection:
            row = connection.execute(
                """
                SELECT id, page_number, kind, text, bbox_json, confidence_json, parser_version
                FROM elements
                WHERE source_id = ? AND id = ? AND kind IN ('figure', 'table')
                """,
                (source_id, element_id),
            ).fetchone()
        if row is None:
            return None
        return {
            "id": str(row["id"]),
            "page_number": int(row["page_number"]),
            "kind": str(row["kind"]),
            "text": str(row["text"]),
            "bbox_normalized": json.loads(str(row["bbox_json"])),
            "confidence": json.loads(str(row["confidence_json"])),
            "parser_version": str(row["parser_version"]),
        }

    def save_lesson(self, package: dict[str, Any]) -> None:
        with self.connection() as connection:
            connection.execute(
                """
                INSERT OR REPLACE INTO lessons(
                    id, source_id, page_start, page_end, package_hash, package_json, created_at
                ) VALUES(?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    package["id"],
                    package["source"]["id"],
                    package["page_start"],
                    package["page_end"],
                    package["package_hash"],
                    json.dumps(package, ensure_ascii=False),
                    package["created_at"],
                ),
            )
            connection.commit()

    def lesson(self, lesson_id: str) -> dict[str, Any] | None:
        with self.connection() as connection:
            row = connection.execute(
                "SELECT package_json FROM lessons WHERE id = ?", (lesson_id,)
            ).fetchone()
        return json.loads(str(row["package_json"])) if row else None

    def append_event(self, event: dict[str, Any]) -> None:
        with self.connection() as connection:
            connection.execute(
                """
                INSERT INTO research_events(
                    session_id, lesson_id, event_type, frame_id,
                    occurred_at, payload_json, schema_version
                ) VALUES(?, ?, ?, ?, ?, ?, 1)
                """,
                (
                    event["session_id"],
                    event["lesson_id"],
                    event["event_type"],
                    event.get("frame_id"),
                    event["occurred_at"],
                    json.dumps(event.get("payload", {}), separators=(",", ":")),
                ),
            )
            connection.commit()

    def events_for_lesson(self, lesson_id: str) -> list[dict[str, Any]]:
        with self.connection() as connection:
            rows = connection.execute(
                """
                SELECT id, session_id, lesson_id, event_type, frame_id,
                       occurred_at, payload_json, schema_version
                FROM research_events
                WHERE lesson_id = ?
                ORDER BY occurred_at, id
                """,
                (lesson_id,),
            ).fetchall()
        return [
            {
                "id": int(row["id"]),
                "session_id": str(row["session_id"]),
                "lesson_id": str(row["lesson_id"]),
                "event_type": str(row["event_type"]),
                "frame_id": str(row["frame_id"]) if row["frame_id"] else None,
                "occurred_at": str(row["occurred_at"]),
                "payload": json.loads(str(row["payload_json"])),
                "schema_version": int(row["schema_version"]),
            }
            for row in rows
        ]

    @staticmethod
    def _source_from_row(row: sqlite3.Row) -> SourceSummary:
        return SourceSummary(
            id=str(row["id"]),
            content_hash=str(row["content_hash"]),
            original_name=str(row["original_name"]),
            size_bytes=int(row["size_bytes"]),
            page_count=int(row["page_count"]) if row["page_count"] is not None else None,
            status=SourceStatus(str(row["status"])),
            rights_status=RightsStatus(str(row["rights_status"])),
            cloud_policy=CloudPolicy(str(row["cloud_policy"])),
            created_at=datetime.fromisoformat(str(row["created_at"])),
        )

    @staticmethod
    def _job_from_row(row: sqlite3.Row) -> ImportJob:
        return ImportJob(
            id=str(row["id"]),
            source_id=str(row["source_id"]),
            state=JobState(str(row["state"])),
            progress_current=int(row["progress_current"]),
            progress_total=(
                int(row["progress_total"]) if row["progress_total"] is not None else None
            ),
            error_class=str(row["error_class"]) if row["error_class"] else None,
            created_at=datetime.fromisoformat(str(row["created_at"])),
            updated_at=datetime.fromisoformat(str(row["updated_at"])),
        )
