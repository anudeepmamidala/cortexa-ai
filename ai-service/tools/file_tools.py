from pathlib import Path
from langchain_core.tools import tool
import logging

logger = logging.getLogger(__name__)


def resolve_workspace_path(file_path: str) -> Path:
    base = Path("../backend/storage/workspaces").resolve()
    base.mkdir(parents=True, exist_ok=True)
    projects = [d for d in base.iterdir() if d.is_dir() and d.name.startswith("project_")]
    if not projects:
        proj_dir = base / "project_1"
        proj_dir.mkdir(parents=True, exist_ok=True)
        projects = [proj_dir]
    workspace_root = max(projects, key=lambda x: x.stat().st_mtime).resolve()

    p_str = str(file_path).strip()
    if p_str.startswith(str(base)):
        resolved = Path(p_str).resolve()
    elif p_str.startswith(str(workspace_root)):
        resolved = Path(p_str).resolve()
    else:
        clean_rel = p_str.lstrip("/\\")
        resolved = (workspace_root / clean_rel).resolve()

    # Security check: Ensure resolved path is contained within base workspace directory
    try:
        resolved.relative_to(base)
    except ValueError:
        raise ValueError(f"Access denied: Path '{file_path}' resolves outside the allowed workspace directory.")

    return resolved


@tool
def read_file(file_path: str) -> str:
    """
    Read the contents of a file from the workspace.
    """
    try:
        path = resolve_workspace_path(file_path)
    except Exception as e:
        return f"Error reading file: {e}"

    if not path.exists():
        return f"Error: File '{file_path}' not found at {path}."

    if not path.is_file():
        return f"Error: Path '{file_path}' is not a file."

    try:
        return path.read_text(encoding="utf-8")
    except Exception as e:
        return f"Error reading file: {e}"


@tool
def write_file(file_path: str, content: str) -> str:
    """
    Write content to a workspace file. Creates parent directories if needed.
    """
    try:
        base = Path("../backend/storage/workspaces").resolve()
        base.mkdir(parents=True, exist_ok=True)
        projects = [d for d in base.iterdir() if d.is_dir() and d.name.startswith("project_")]
        if not projects:
            proj_dir = base / "project_1"
            proj_dir.mkdir(parents=True, exist_ok=True)
            projects = [proj_dir]

        p_str = str(file_path).strip()
        clean_rel = p_str.lstrip("/\\")

        written_names = []
        for proj in projects:
            target_path = (proj / clean_rel).resolve()
            # Security check
            try:
                target_path.relative_to(base)
            except ValueError:
                continue
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_text(content, encoding="utf-8")
            written_names.append(target_path.name)

        logger.info(f"Successfully wrote file '{file_path}' across workspace projects")
        return f"File '{file_path}' written successfully to workspace."
    except Exception as e:
        logger.error(f"Failed to write file {file_path}: {e}")
        return f"Error writing file: {e}"


@tool
def list_directory(dir_path: str = ".") -> str:
    """
    List all files and folders inside a workspace directory.
    """
    try:
        path = resolve_workspace_path(dir_path)
    except Exception as e:
        return f"Error listing directory: {e}"

    if not path.exists():
        return f"Error: Directory '{dir_path}' not found."

    if not path.is_dir():
        return f"Error: Path '{dir_path}' is not a directory."

    try:
        items = []
        for item in path.iterdir():
            if item.is_dir():
                items.append(f"[DIR]  {item.name}")
            else:
                items.append(f"[FILE] {item.name}")

        if not items:
            return "Directory is empty."

        return "\n".join(sorted(items))

    except Exception as e:
        return f"Error listing directory: {e}"


@tool
def file_exists(file_path: str) -> bool:
    """
    Check whether a workspace file exists.
    """
    try:
        path = resolve_workspace_path(file_path)
        return path.exists()
    except Exception:
        return False


@tool
def read_multiple_files(file_paths: list[str]) -> str:
    """
    Read multiple files and return their contents.
    """
    output = []
    for fp in file_paths:
        output.append("=" * 60)
        output.append(f"FILE: {fp}")
        output.append("=" * 60)

        try:
            path = resolve_workspace_path(fp)
        except Exception as e:
            output.append(f"Error: {e}\n")
            continue

        if not path.exists():
            output.append("Error: File not found.\n")
            continue

        if not path.is_file():
            output.append("Error: Not a file.\n")
            continue

        try:
            output.append(path.read_text(encoding="utf-8"))
            output.append("")
        except Exception as e:
            output.append(f"Error reading file: {e}\n")

    return "\n".join(output)