from __future__ import annotations

import asyncio
from pathlib import Path

from httpx import ASGITransport, AsyncClient

from prism_api.config import Settings
from prism_api.main import create_app


def test_api_runs_local_import_compile_source_and_event_path(
    tmp_path: Path, sample_pdf: Path
) -> None:
    settings = Settings(data_dir=tmp_path / "api-data", worker_poll_seconds=0.01)
    app = create_app(settings, start_worker=False)

    async def exercise_api() -> None:
        transport = ASGITransport(app=app)
        async with (
            app.router.lifespan_context(app),
            AsyncClient(transport=transport, base_url="http://prism.local") as client,
        ):
            imported = await client.post(
                "/api/sources",
                files={"file": (sample_pdf.name, sample_pdf.read_bytes(), "application/pdf")},
                data={
                    "rights_status": "open_license",
                    # A stale client cannot turn cloud access on during import.
                    "cloud_allowed": "true",
                },
            )
            assert imported.status_code == 202
            import_payload = imported.json()
            assert import_payload["source"]["cloud_policy"] == "local_only"

            job_id = import_payload["job"]["id"]
            app.state.source_service.process_job(job_id)
            job = await client.get(f"/api/imports/{job_id}")
            assert job.status_code == 200
            assert job.json()["state"] == "succeeded"

            source_id = import_payload["source"]["id"]
            readiness = await client.get(
                f"/api/sources/{source_id}/readiness?page_start=1&page_end=2"
            )
            assert readiness.status_code == 200
            readiness_payload = readiness.json()
            assert readiness_payload["phase"] == "ready"
            assert readiness_payload["selected_range"]["can_compile"] is True
            assert readiness_payload["latest_job"]["parser_version"]

            compiled = await client.post(
                f"/api/sources/{source_id}/lessons",
                json={"page_start": 1, "page_end": 2, "title": "TCP slow start"},
            )
            assert compiled.status_code == 200
            lesson = compiled.json()
            assert lesson["frames"]
            assert all(frame["verification_status"] == "draft" for frame in lesson["frames"])
            assert all(frame["source_spans"] for frame in lesson["frames"])
            assert lesson["visuals"]

            visual_response = await client.get(
                f"/api/sources/{source_id}/visuals/{lesson['visuals'][0]['id']}"
            )
            assert visual_response.status_code == 200
            assert visual_response.headers["content-type"] == "image/webp"
            assert visual_response.headers["cache-control"].endswith("immutable")

            source_response = await client.get(f"/api/sources/{source_id}/file")
            assert source_response.status_code == 200
            assert source_response.headers["content-type"] == "application/pdf"
            assert source_response.headers["content-disposition"].startswith("inline;")

            event = await client.post(
                "/api/events",
                json={
                    "session_id": "session_fixture",
                    "lesson_id": lesson["id"],
                    "event_type": "frame_shown",
                    "frame_id": lesson["frames"][0]["id"],
                    "occurred_at": "2026-08-19T12:00:00Z",
                    "payload": {"frame_index": 0},
                },
            )
            assert event.status_code == 204

            exported_events = await client.get(f"/api/lessons/{lesson['id']}/events")
            assert exported_events.status_code == 200
            event_payload = exported_events.json()
            assert event_payload == [
                {
                    "id": 1,
                    "session_id": "session_fixture",
                    "lesson_id": lesson["id"],
                    "event_type": "frame_shown",
                    "frame_id": lesson["frames"][0]["id"],
                    "occurred_at": "2026-08-19T12:00:00Z",
                    "payload": {"frame_index": 0},
                    "schema_version": 1,
                }
            ]

    asyncio.run(exercise_api())

    with app.state.store.connection() as connection:
        event_count = connection.execute("SELECT COUNT(*) FROM research_events").fetchone()[0]
    assert event_count == 1
