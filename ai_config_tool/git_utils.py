"""Git helper utilities."""
from __future__ import annotations

import logging
import subprocess
from pathlib import Path
from typing import Iterable, List, Optional

LOGGER = logging.getLogger(__name__)


def run_git(args: List[str], cwd: Optional[Path] = None) -> subprocess.CompletedProcess:
    """Run a git command and return the completed process."""
    LOGGER.debug("Running git command: %s (cwd=%s)", " ".join(args), cwd)
    return subprocess.run(
        args,
        cwd=str(cwd) if cwd else None,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )


def clone_repo(
    repo_url: str,
    destination: Path,
    *,
    branch: Optional[str] = None,
    ref: Optional[str] = None,
    depth: Optional[int] = 1,
) -> None:
    """Clone a repository with optional branch/ref/depth selection."""
    destination = destination.expanduser().resolve()
    destination.parent.mkdir(parents=True, exist_ok=True)
    clone_args = ["git", "clone"]
    if depth:
        clone_args.extend(["--depth", str(depth)])
    if branch:
        clone_args.extend(["--branch", branch, "--single-branch"])
    clone_args.extend([repo_url, str(destination)])
    try:
        run_git(clone_args)
    except subprocess.CalledProcessError as err:
        if depth:
            LOGGER.debug(
                "Shallow clone failed for %s, retrying full clone.", repo_url
            )
            clone_repo(
                repo_url,
                destination,
                branch=branch,
                ref=ref,
                depth=None,
            )
            return
        raise RuntimeError(err.stderr.strip() or err.stdout.strip()) from err
    if ref and ref != branch:
        run_git(["git", "checkout", ref], cwd=destination)


def get_repo_root(path: Path) -> Optional[Path]:
    """Return git repo root for provided path or None."""
    try:
        result = run_git(["git", "rev-parse", "--show-toplevel"], cwd=path)
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    return Path(result.stdout.strip()).resolve()


def has_uncommitted_changes(
    target: Path, directories: Iterable[str]
) -> bool:
    """Return True if directories have pending git changes."""
    root = get_repo_root(target)
    if not root:
        return False
    rel_paths: List[str] = []
    for directory in directories:
        directory_path = (target / directory).resolve()
        if not directory_path.exists():
            continue
        try:
            rel = directory_path.relative_to(root)
        except ValueError:
            continue
        rel_paths.append(str(rel))
    if not rel_paths:
        return False
    try:
        result = run_git(
            ["git", "status", "--porcelain", "--", *rel_paths], cwd=root
        )
    except subprocess.CalledProcessError:
        return False
    return bool(result.stdout.strip())
