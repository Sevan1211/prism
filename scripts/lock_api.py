"""Regenerate apps/api/pylock.toml as an installable third-party lock.

``pip lock`` includes the local project as a directory entry, which ``pip
install -r pylock.toml`` refuses because a directory cannot be hash-verified.
This script locks the project with its dev extras, then removes the local
project block so the file installs cleanly with::

    python -m pip install -r apps/api/pylock.toml
    python -m pip install -e apps/api --no-deps

The lock is resolved for the interpreter and platform that run this script.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
API_DIR = PROJECT_ROOT / "apps" / "api"
LOCK_PATH = API_DIR / "pylock.toml"
LOCAL_PROJECT_BLOCK = re.compile(
    r"\n\[\[packages\]\]\nname = \"prism-api\"\n(?:.*?\n)*?(?=\[\[packages\]\]|\Z)"
)


def main() -> int:
    subprocess.run(
        [sys.executable, "-m", "pip", "lock", "-e", f"{API_DIR}[dev]", "-o", str(LOCK_PATH)],
        check=True,
        cwd=PROJECT_ROOT,
    )
    original = LOCK_PATH.read_text(encoding="utf-8")
    stripped, removals = LOCAL_PROJECT_BLOCK.subn("", original)
    if removals != 1:
        print(f"error: expected one local prism-api entry, found {removals}", file=sys.stderr)
        return 1
    LOCK_PATH.write_text(stripped, encoding="utf-8")
    print(f"Wrote {LOCK_PATH.relative_to(PROJECT_ROOT)} ({removals} local entry removed)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
