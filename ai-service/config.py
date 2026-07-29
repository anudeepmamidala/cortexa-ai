from dotenv import load_dotenv
import os

load_dotenv()

MODEL = os.getenv("MODEL", "openai/gpt-oss-120b")
BASE_URL = os.getenv("BASE_URL", "https://api.groq.com/openai/v1")
API_KEY = os.getenv("API_KEY", "")
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.2"))
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "2048"))

EMBEDDINGS_URL = os.getenv("EMBEDDINGS_URL", "http://localhost:11434")