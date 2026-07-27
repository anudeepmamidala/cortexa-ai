from langchain_openai import ChatOpenAI

from config import (
    API_KEY,
    BASE_URL,
    MODEL,
    TEMPERATURE,
)

from providers.base import BaseProvider


class GroqProvider(BaseProvider):

    def get_chat_model(self):

        return ChatOpenAI(
            api_key=API_KEY,
            base_url=BASE_URL,
            model=MODEL,
            temperature=TEMPERATURE,
            streaming=True,
        )