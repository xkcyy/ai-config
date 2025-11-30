"""Synchronization orchestration."""
from __future__ import annotations

import hashlib
import logging
import shutil
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

from .backup import create_backup
from .constants import (
    DEFAULT_BRANCH,
    DEFAULT_REMOTE_DIR,
    DEFAULT_REPO_URL,
    SUPPORTED_DIRECTORIES,
)
from .git_utils import clone_repo, has_uncommitted_changes
from .path_utils import normalize_remote_dir

LOGGER = logging.getLogger(__name__)


@dataclass
class DirectoryPlan:
    name: str
    source: Optional[Path]
    destination: Path
    added: List[str]
    modified: List[str]
    removed: List[str]

    @property
    def needs_change(self) -> bool:
        if self.source is None:
            return self.destination.exists()
        if not self.destination.exists():
            return True
        return bool(self.added or self.modified or self.removed)


def hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def snapshot_directory(path: Path) -> Dict[str, str]:
    if not path.exists():
        return {}
    return {
        str(file.relative_to(path)): hash_file(file)
        for file in path.rglob("*")
        if file.is_file()
    }


def snapshot_paths_only(path: Path) -> List[str]:
    if not path.exists():
        return []
    return sorted(
        str(file.relative_to(path))
        for file in path.rglob("*")
        if file.is_file()
    )


def build_plan(source_root: Path, target: Path) -> List[DirectoryPlan]:
    plans: List[DirectoryPlan] = []
    for directory in SUPPORTED_DIRECTORIES:
        src = source_root / directory
        dest = target / directory
        if src.exists():
            src_snapshot = snapshot_directory(src)
            dest_snapshot = snapshot_directory(dest)
            added = sorted(set(src_snapshot) - set(dest_snapshot))
            removed = sorted(set(dest_snapshot) - set(src_snapshot))
            modified = sorted(
                path
                for path in set(src_snapshot).intersection(dest_snapshot)
                if src_snapshot[path] != dest_snapshot[path]
            )
            plans.append(
                DirectoryPlan(
                    name=directory,
                    source=src,
                    destination=dest,
                    added=added,
                    modified=modified,
                    removed=removed,
                )
            )
        else:
            plans.append(
                DirectoryPlan(
                    name=directory,
                    source=None,
                    destination=dest,
                    added=[],
                    modified=[],
                    removed=snapshot_paths_only(dest),
                )
            )
    return plans


def describe_plan(plan: DirectoryPlan) -> None:
    if plan.source is None:
        if plan.destination.exists():
            LOGGER.info(
                "Directory %s missing in remote. %s files would be removed.",
                plan.name,
                len(plan.removed),
            )
        else:
            LOGGER.info("Directory %s absent both locally and remotely.", plan.name)
        return
    if not plan.destination.exists():
        LOGGER.info(
            "Directory %s will be created with %s files.",
            plan.name,
            len(plan.added) + len(plan.modified),
        )
        return
    if not plan.needs_change:
        LOGGER.info("Directory %s already up to date.", plan.name)
        return
    LOGGER.info(
        "Directory %s changes -> add:%d modify:%d remove:%d",
        plan.name,
        len(plan.added),
        len(plan.modified),
        len(plan.removed),
    )


def apply_plan(plans: List[DirectoryPlan], dry_run: bool) -> None:
    if dry_run:
        return
    for plan in plans:
        if not plan.needs_change:
            continue
        if plan.source is None:
            if plan.destination.exists():
                shutil.rmtree(plan.destination)
            continue
        if plan.destination.exists():
            shutil.rmtree(plan.destination)
        plan.destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(plan.source, plan.destination)


def run_sync(
    target: Path,
    repo_url: str = DEFAULT_REPO_URL,
    ref: Optional[str] = None,
    dry_run: bool = False,
    force: bool = False,
    remote_dir: str = DEFAULT_REMOTE_DIR,
    branch: str = DEFAULT_BRANCH,
) -> None:
    target = target.expanduser().resolve()
    if not target.exists():
        raise FileNotFoundError(f"Target path {target} does not exist")
    if not force and has_uncommitted_changes(target, SUPPORTED_DIRECTORIES):
        raise RuntimeError(
            "Local changes detected in .cursor/.claude. Commit or stash, or rerun with --force."
        )
    remote_dir_path = normalize_remote_dir(remote_dir)
    with tempfile.TemporaryDirectory(prefix="ai-config-sync-") as tmpdir:
        repo_path = Path(tmpdir) / "repo"
        LOGGER.info(
            "Fetching configuration from %s (%s -> %s)",
            repo_url,
            branch,
            remote_dir_path,
        )
        clone_repo(
            repo_url=repo_url,
            destination=repo_path,
            branch=branch,
            ref=ref,
            depth=1,
        )
        source_root = repo_path / remote_dir_path
        if not source_root.exists():
            raise FileNotFoundError(
                f"Remote directory '{remote_dir_path}' not found in repository. "
                "Use 'ai-config push' to initialize it first."
            )
        plans = build_plan(source_root, target)
        for plan in plans:
            describe_plan(plan)
        if not any(plan.needs_change for plan in plans):
            LOGGER.info("No changes detected. You're already up to date.")
            return
        if dry_run:
            LOGGER.info("Dry run complete. No files were changed.")
            return
        backup_path = create_backup(target, SUPPORTED_DIRECTORIES)
        if backup_path:
            LOGGER.info("Created backup at %s", backup_path)
        apply_plan(plans, dry_run=False)
        LOGGER.info("Synchronization completed successfully.")
