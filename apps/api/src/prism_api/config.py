from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class Settings:
    data_dir: Path
    max_upload_bytes: int = 512 * 1024 * 1024
    worker_poll_seconds: float = 0.35

    @classmethod
    def from_environment(cls) -> Settings:
        configured = os.environ.get("PRISM_DATA_DIR")
        if configured:
            data_dir = Path(configured).expanduser().resolve()
        else:
            local_app_data = os.environ.get("LOCALAPPDATA")
            base = Path(local_app_data) if local_app_data else Path.home() / ".local" / "share"
            data_dir = (base / "PRISM").resolve()
        return cls(data_dir=data_dir)

    @property
    def database_path(self) -> Path:
        return self.data_dir / "prism.sqlite3"

    @property
    def object_dir(self) -> Path:
        return self.data_dir / "objects" / "sha256"

    @property
    def upload_dir(self) -> Path:
        return self.data_dir / "uploads"

    @property
    def visual_cache_dir(self) -> Path:
        return self.data_dir / "cache" / "visuals"
