"""FastAPI application factory for the Thai Bank Slip OCR service."""

from __future__ import annotations

import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()  # load .env before any config reads

from app.api.routes import router  # noqa: E402 (needs dotenv loaded first)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        A configured :class:`FastAPI` instance.
    """
    app = FastAPI(
        title="Thai Bank Slip OCR Service",
        description=(
            "Microservice that accepts Thai bank transfer slip images, "
            "runs PaddleOCR, and returns structured JSON data."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # --- CORS -------------------------------------------------------------
    raw_origins = os.getenv("CORS_ORIGINS", "*")
    origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if origins != ["*"] else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Routes -----------------------------------------------------------
    app.include_router(router)

    @app.on_event("startup")
    async def _startup() -> None:
        logger.info("OCR service started. CORS origins: %s", origins)

    return app


app = create_app()
