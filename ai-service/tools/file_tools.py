from pathlib import Path
from langchain_core.tools import tool


@tool
def read_file(file_path: str) -> str:
    """
    Read the contents of a file.
    """

    path = Path(file_path)

    if not path.exists():
        return "Error: File not found."

    if not path.is_file():
        return "Error: Path is not a file."

    try:
        return path.read_text(encoding="utf-8")
    except Exception as e:
        return f"Error reading file: {e}"


@tool
def write_file(file_path: str, content: str) -> str:
    """
    Write content to a file. Creates parent directories if needed.
    """

    path = Path(file_path)

    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return "File written successfully."
    except Exception as e:
        return f"Error writing file: {e}"


@tool
def list_directory(dir_path: str) -> str:
    """
    List all files and folders inside a directory.
    """

    path = Path(dir_path)

    if not path.exists():
        return "Error: Directory not found."

    if not path.is_dir():
        return "Error: Path is not a directory."

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
    Check whether a file exists.
    """

    return Path(file_path).exists()


@tool
def read_multiple_files(file_paths: list[str]) -> str:
    """
    Read multiple files and return their contents.
    """

    output = []

    for file_path in file_paths:
        path = Path(file_path)

        output.append("=" * 60)
        output.append(f"FILE: {file_path}")
        output.append("=" * 60)

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