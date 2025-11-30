"""Backup and rollback helpers."""
from __future__ import annotations

import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Optional

from .constants import BACKUP_ROOT_NAME


def create_backup(target: Path, directories: Iterable[str]) -> Optional[Path]:
    """Create timestamped backup for provided directories."""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    backup_root = target / BACKUP_ROOT_NAME / timestamp
    copied = False
    for directory in directories:
        src = target / directory
        if not src.exists():
            continue
        dest = backup_root / directory
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(src, dest)
        copied = True
    if not copied:
        return None
    return backup_root


def rollback_snapshot(target: Path, snapshot: str, directories: Iterable[str]) -> Path:
    """Restore directories from snapshot timestamp."""
    backup_root = target / BACKUP_ROOT_NAME / snapshot
    if not backup_root.exists():
        raise FileNotFoundError(f"Backup snapshot {snapshot} not found at {backup_root}")
    for directory in directories:
        src = backup_root / directory
        dest = target / directory
        if dest.exists():
            shutil.rmtree(dest)
        if src.exists():
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(src, dest)
    return backup_root
