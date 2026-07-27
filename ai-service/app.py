import logging
from core.handler import register_exception_handlers
from fastapi import FastAPI
from api.routes import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

app = FastAPI(
    title="AI Workspace AI Service"
)
register_exception_handlers(app)
app.include_router(router)