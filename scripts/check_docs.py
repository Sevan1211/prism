"""Repository documentation gate: Markdown links, code fences, and conflict markers.

Runs anywhere Python runs (local Windows, CI). Replaces the former
PowerShell-only check-docs.ps1. Skips dependency, cache, and data directories,
and tolerates unreadable directories instead of aborting the whole gate.
"""

from __future__ import annotations

import re
import urllib.parse
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {
    ".git",
    ".mypy_cache",
    ".pytest-cache",
    ".pytest_cache",
    ".pytest-tmp",
    ".prism-data",
    ".ruff_cache",
    ".venv",
    ".vite",
    "__pycache__",
    "dist",
    "node_modules",
    "tmp",
}
LINK_PATTERN = re.compile(r"\[[^\]]+\]\((?P<target>[^)]+)\)")
FENCE_PATTERN = re.compile(r"^\s*```")
CONFLICT_PATTERN = re.compile(r"^(<{7}|={7}|>{7})( |$)")


def markdown_files(root: Path) -> list[Path]:
    found: list[Path] = []
    pending = [root]
    while pending:
        directory = pending.pop()
        try:
            entries = sorted(directory.iterdir())
        except OSError:
            continue
        for entry in entries:
            if entry.is_dir():
                if entry.name not in SKIP_DIRS:
                    pending.append(entry)
            elif entry.suffix.lower() == ".md":
                found.append(entry)
    return found


def check_file(path: Path, problems: list[str]) -> None:
    relative = path.relative_to(PROJECT_ROOT)
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()

    fence_count = sum(bool(FENCE_PATTERN.match(line)) for line in lines)
    if fence_count % 2 != 0:
        problems.append(f"{relative}: unbalanced code fences")

    for line_number, line in enumerate(lines, start=1):
        if CONFLICT_PATTERN.match(line):
            problems.append(f"{relative}:{line_number}: merge conflict marker")
        for match in LINK_PATTERN.finditer(line):
            target = match.group("target").strip().strip("<>")
            if re.match(r"^(https?://|mailto:|#)", target):
                continue
            path_part = urllib.parse.unquote(target.split("#", 1)[0])
            if not path_part:
                continue
            candidate = (
                Path(path_part)
                if Path(path_part).is_absolute()
                else path.parent / path_part
            )
            if not candidate.exists():
                problems.append(f"{relative}:{line_number}: broken link -> {target}")


def main() -> int:
    files = markdown_files(PROJECT_ROOT)
    problems: list[str] = []
    for path in files:
        check_file(path, problems)
    if problems:
        print("Documentation validation failed:")
        for problem in problems:
            print(f"- {problem}")
        return 1
    print(
        f"Documentation OK: {len(files)} Markdown files, no broken local links, "
        "unbalanced fences, or conflict markers."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
