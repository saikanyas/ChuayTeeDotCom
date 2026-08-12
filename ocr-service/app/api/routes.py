"""FastAPI route definitions for the OCR service."""

from __future__ import annotations

import logging
import os

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.models.schemas import HealthResponse, OCRResponse, SlipData
from app.services import ocr as ocr_service

logger = logging.getLogger(__name__)

router = APIRouter()

_MAX_MB = float(os.getenv("MAX_IMAGE_SIZE_MB", "10"))
_MAX_BYTES = int(_MAX_MB * 1024 * 1024)

_ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff",
}


@router.get("/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    """Return service liveness status.

    Returns:
        HealthResponse with ``status='ok'``.
    """
    return HealthResponse()


@router.post(
    "/ocr/process",
    response_model=OCRResponse,
    status_code=status.HTTP_200_OK,
    tags=["ocr"],
    summary="Process a Thai bank slip image",
    description=(
        "Upload a bank slip image (JPEG/PNG/WebP). "
        "The service runs OCR and returns structured transfer data."
    ),
)
async def process_slip(
    file: UploadFile = File(..., description="Bank slip image file"),
) -> OCRResponse:
    """Accept an image, run OCR, and return parsed slip data.

    Args:
        file: Multipart-uploaded image file.

    Returns:
        OCRResponse containing a SlipData object.

    Raises:
        HTTPException 415: Unsupported media type.
        HTTPException 413: Image exceeds size limit.
        HTTPException 422: OCR or parsing error.
    """
    # --- Content-type guard -----------------------------------------------
    content_type = (file.content_type or "").lower().split(";")[0].strip()
    if content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{content_type}'. Accepted: {sorted(_ALLOWED_CONTENT_TYPES)}",
        )

    # --- Size guard -------------------------------------------------------
    image_bytes = await file.read()
    if len(image_bytes) > _MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds {_MAX_MB} MB limit ({len(image_bytes) / 1024 / 1024:.1f} MB received).",
        )

    # --- Process ----------------------------------------------------------
    try:
        slip_data: SlipData = ocr_service.process_image(image_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.exception("OCR runtime error")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    return OCRResponse(data=slip_data)
