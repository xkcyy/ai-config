"""Push local AI IDE configuration back to the canonical repository."""
from __future__ import annotations

import logging
import shutil
import tempfile
from pathlib import Path
from typing import Iterable, List

from .constants import (
    DEFAULT_BRANCH,
    DEFAULT_REMOTE_DIR,
    DEFAULT_REPO_URL,
    SUPPORTED_DIRECTORIES,
)
from .git_utils import clone_repo, run_git
from .path_utils import normalize_remote_dir

LOGGER = logging.getLogger(__name__)


def _existing_local_dirs(target: Path) -> List[Path]:
    present: List[Path] = []
    for directory in SUPPORTED_DIRECTORIES:
        path = target / directory
        if path.exists():
            present.append(path)
    return present


def _copy_directories(
    source_root: Path, dest_root: Path, directories: Iterable[str]
) -> None:
    if dest_root.exists():
        shutil.rmtree(dest_root)
    dest_root.mkdir(parents=True, exist_ok=True)
    for directory in directories:
        src = source_root / directory
        dest = dest_root / directory
        if src.exists():
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(src, dest)


def run_push(
    target: Path,
    repo_url: str = DEFAULT_REPO_URL,
    branch: str = DEFAULT_BRANCH,
    remote_dir: str = DEFAULT_REMOTE_DIR,
    commit_message: str = "chore: sync ai IDE config",
) -> None:
    target = target.expanduser().resolve()
    if not target.exists():
        raise FileNotFoundError(f"Target path {target} does not exist")
    local_dirs = _existing_local_dirs(target)
    if not local_dirs:
        raise RuntimeError(
            "No local .cursor/.claude directories found. Nothing to push."
        )
    remote_dir_path = normalize_remote_dir(remote_dir)
    with tempfile.TemporaryDirectory(prefix="ai-config-push-") as tmpdir:
        repo_path = Path(tmpdir) / "repo"
        LOGGER.info(
            "Cloning %s (branch %s) to prepare push into %s",
            repo_url,
            branch,
            remote_dir_path,
        )
        clone_repo(
            repo_url=repo_url,
            destination=repo_path,
            branch=branch,
            depth=None,
        )
        remote_root = repo_path / remote_dir_path
        if remote_dir_path == Path("."):
            for directory in SUPPORTED_DIRECTORIES:
                dest = repo_path / directory
                if dest.exists():
                    shutil.rmtree(dest)
                src = target / directory
                if src.exists():
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copytree(src, dest)
        else:
            _copy_directories(target, remote_root, SUPPORTED_DIRECTORIES)
        status = run_git(["git", "status", "--porcelain"], cwd=repo_path)
        if not status.stdout.strip():
            LOGGER.info("Remote repository already matches local configuration.")
            return
        if remote_dir_path == Path("."):
            for directory in SUPPORTED_DIRECTORIES:
                run_git(["git", "add", directory], cwd=repo_path)
        else:
            run_git(["git", "add", str(remote_dir_path)], cwd=repo_path)
        run_git(["git", "commit", "-m", commit_message], cwd=repo_path)
        LOGGER.info("Pushing changes to origin/%s", branch)
        run_git(["git", "push", "origin", branch], cwd=repo_path)
        LOGGER.info("Push completed successfully.")
