from tools.file_tools import (
    read_file,
    write_file,
    list_directory,
    file_exists,
    read_multiple_files,
)
from tools.rag_tools import search_documents
FILE_TOOLS = [
    read_file,
    write_file,
    list_directory,
    file_exists,
    read_multiple_files,
]


TOOLS = [
    *FILE_TOOLS,
    search_documents
]

TOOL_MAP = {
    tool.name: tool
    for tool in TOOLS
}