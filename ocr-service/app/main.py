"""FastAPI application factory for the Thai Bank Slip OCR service."""

from __future__ import annotations

import asyncio
import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

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
            "runs EasyOCR, and returns structured JSON data."
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

    # --- Root redirect to /docs -------------------------------------------
    @app.get("/", include_in_schema=False)
    async def root_redirect():
        return RedirectResponse(url="/docs")

    # --- Routes -----------------------------------------------------------
    app.include_router(router)

    @app.on_event("startup")
    async def _startup() -> None:
        logger.info("OCR service started. CORS origins: %s", origins)
        # Background pre-warm model without blocking server boot
        def _warmup():
            try:
                from app.services.ocr import _get_reader
                _get_reader()
                logger.info("EasyOCR model pre-warmed successfully.")
            except Exception as e:
                logger.warning("EasyOCR model background pre-warm postponed to first request: %s", e)

        asyncio.get_event_loop().run_in_executor(None, _warmup)

    return app


app = create_app()
