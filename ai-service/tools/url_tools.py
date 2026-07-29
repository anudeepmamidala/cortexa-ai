import logging
import requests
from bs4 import BeautifulSoup
from langchain_core.tools import tool

logger = logging.getLogger(__name__)


@tool
def analyze_url(url: str) -> str:
    """
    Fetch and analyze text content, documentation, GitHub repositories, or code from a given URL web page.
    """
    try:
        url = url.strip()
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "https://" + url

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Remove script and style elements
        for element in soup(["script", "style", "nav", "footer", "header", "noscript"]):
            element.decompose()

        title = soup.title.string.strip() if soup.title and soup.title.string else "No Title"

        text = soup.get_text(separator="\n")

        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        clean_text = "\n".join(chunk for chunk in chunks if chunk)

        if len(clean_text) > 4000:
            clean_text = clean_text[:4000] + "\n\n[... content truncated ...]"

        return f"# Title: {title}\n# URL: {url}\n\n{clean_text}"

    except Exception as e:
        logger.error(f"Error fetching URL '{url}': {e}")
        return f"Error fetching or analyzing URL '{url}': {str(e)}"
