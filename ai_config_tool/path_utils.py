"""Helpers for working with paths that must stay within project boundaries."""
from __future__ import annotations

from pathlib import Path


def normalize_remote_dir(remote_dir: str) -> Path:
    """Normalize remote directory input and ensure it stays relative."""
    candidate = Path(remote_dir.strip()) if remote_dir else Path(".")
    if candidate.is_absolute():
        raise ValueError("Remote directory must be relative to repository root")
    parts = [part for part in candidate.parts if part not in ("", ".")]
    if any(part == ".." for part in candidate.parts):
        raise ValueError("Remote directory cannot traverse parent folders")
    return Path(*parts) if parts else Path(".")
