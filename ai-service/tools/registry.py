from tools.file_tools import (
    read_file,
    write_file,
    list_directory,
    file_exists,
    read_multiple_files,
)
from tools.rag_tools import search_documents
from tools.url_tools import analyze_url

FILE_TOOLS = [
    read_file,
    write_file,
    list_directory,
    file_exists,
    read_multiple_files,
]


TOOLS = [
    *FILE_TOOLS,
    search_documents,
    analyze_url,
]

TOOL_MAP = {
    tool.name: tool
    for tool in TOOLS
}