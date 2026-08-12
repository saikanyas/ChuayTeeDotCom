"""OCR service: image → text → parsed SlipData."""

from __future__ import annotations

import io
import logging
import re
from typing import Optional

import numpy as np
from PIL import Image

from app.models.schemas import SlipData
from app.parsers.base import BankParser
from app.parsers.bangkok_bank import BangkokBankParser
from app.parsers.generic import GenericParser
from app.parsers.kbank import KBankParser
from app.parsers.krungthai import KrungthaiParser
from app.parsers.scb import SCBParser

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy-initialise PaddleOCR so startup is fast when running tests/health checks
# ---------------------------------------------------------------------------
_ocr_engine = None


def _get_ocr_engine():
    """Return the singleton PaddleOCR instance, initialising on first call."""
    global _ocr_engine
    if _ocr_engine is None:
        try:
            from paddleocr import PaddleOCR  # noqa: PLC0415

            _ocr_engine = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
            logger.info("PaddleOCR engine initialised (lang=en, angle_cls=True)")
        except Exception as exc:
            logger.error("Failed to initialise PaddleOCR: %s", exc)
            raise
    return _ocr_engine


# ---------------------------------------------------------------------------
# Bank detection
# ---------------------------------------------------------------------------

_BANK_SIGNATURES: dict[str, list[str]] = {
    "kbank": ["KBANK", "กสิกรไทย", "K PLUS", "Kasikorn", "K-BANK"],
    "scb": ["SCB", "ไทยพาณิชย์", "SCB Easy", "easy net"],
    "krungthai": ["KTB", "กรุงไทย", "Krungthai", "NEXT", "PromptPay KTB"],
    "bangkok_bank": ["BBL", "กรุงเทพ", "Bangkok Bank", "Bualuang", "bualuang"],
}

_PARSERS: dict[str, BankParser] = {
    "kbank": KBankParser(),
    "scb": SCBParser(),
    "krungthai": KrungthaiParser(),
    "bangkok_bank": BangkokBankParser(),
    "generic": GenericParser(),
}


def detect_bank(text: str) -> str:
    """Return a bank key from ``_PARSERS`` based on keyword matching.

    Args:
        text: Raw OCR text.

    Returns:
        Bank key string (``'kbank'``, ``'scb'``, etc.) or ``'generic'``.
    """
    upper = text.upper()
    for bank_key, keywords in _BANK_SIGNATURES.items():
        for kw in keywords:
            if kw.upper() in upper:
                logger.debug("Bank detected: %s (keyword: %s)", bank_key, kw)
                return bank_key
    return "generic"


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------


def process_image(image_bytes: bytes) -> SlipData:
    """Run OCR on *image_bytes* and return parsed :class:`SlipData`.

    Args:
        image_bytes: Raw bytes of the uploaded image (JPEG, PNG, WebP, etc.).

    Returns:
        SlipData with all extractable fields populated.

    Raises:
        ValueError: If the image cannot be decoded.
        RuntimeError: If OCR fails.
    """
    # --- Decode image -----------------------------------------------------
    try:
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise ValueError(f"Cannot decode image: {exc}") from exc

    img_array = np.array(pil_image)

    # --- Run PaddleOCR ----------------------------------------------------
    try:
        ocr = _get_ocr_engine()
        result = ocr.ocr(img_array, cls=True)
    except Exception as exc:
        raise RuntimeError(f"OCR engine error: {exc}") from exc

    # --- Flatten result lines ---------------------------------------------
    lines: list[str] = []
    if result:
        for page in result:
            if page:
                for line in page:
                    # line = [box_coords, (text, confidence)]
                    if line and len(line) >= 2:
                        text_conf = line[1]
                        if text_conf and len(text_conf) >= 1:
                            lines.append(str(text_conf[0]))

    raw_text = "\n".join(lines)
    logger.debug("OCR raw text (%d lines):\n%s", len(lines), raw_text[:500])

    # --- Detect bank and parse --------------------------------------------
    bank_key = detect_bank(raw_text)
    parser = _PARSERS[bank_key]
    slip_data = parser.parse(raw_text)

    return slip_data
