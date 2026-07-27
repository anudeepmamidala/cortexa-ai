from abc import ABC, abstractmethod

class BaseProvider(ABC):
    @abstractmethod
    def get_chat_model(self):
        """Return the configured chat model."""
        pass