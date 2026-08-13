"""OCR service: image → text → parsed SlipData using EasyOCR."""

from __future__ import annotations

import io
import logging
from functools import lru_cache

import numpy as np
from PIL import Image

from app.models.schemas import SlipData
from app.parsers.bangkok_bank import BangkokBankParser
from app.parsers.generic import GenericParser
from app.parsers.kbank import KBankParser
from app.parsers.krungthai import KrungthaiParser
from app.parsers.paotang import PaotangParser
from app.parsers.scb import SCBParser
from app.parsers.truemoney import TrueMoneyParser

logger = logging.getLogger(__name__)

_BANK_SIGNATURES: dict[str, list[str]] = {
    "kbank": ["KBANK", "กสิกรไทย", "K PLUS", "Kasikorn", "K-BANK"],
    "scb": ["SCB", "ไทยพาณิชย์", "SCB Easy", "easy net"],
    "krungthai": ["KTB", "กรุงไทย", "Krungthai", "NEXT", "PromptPay KTB"],
    "bangkok_bank": ["BBL", "กรุงเทพ", "Bangkok Bank", "Bualuang", "bualuang"],
    "truemoney": ["TRUEMONEY", "ทรูมันนี่", "วอลเล็ท", "WALLET"],
    "paotang": ["เป๋าตัง", "PAOTANG", "G-WALLET", "ถุงเงิน", "ไทยช่วยไทย"],
}

_PARSERS = {
    "kbank": KBankParser(),
    "scb": SCBParser(),
    "krungthai": KrungthaiParser(),
    "bangkok_bank": BangkokBankParser(),
    "truemoney": TrueMoneyParser(),
    "paotang": PaotangParser(),
    "generic": GenericParser(),
}


@lru_cache(maxsize=1)
def _get_reader():
    """Load EasyOCR reader once and cache (pre-downloaded at Docker build time)."""
    import easyocr
    return easyocr.Reader(['th', 'en'], gpu=False)


def detect_bank(text: str) -> str:
    upper = text.upper()
    for bank_key, keywords in _BANK_SIGNATURES.items():
        for kw in keywords:
            if kw.upper() in upper:
                return bank_key
    return "generic"


def process_image(image_bytes: bytes) -> SlipData:
    """Run EasyOCR on image_bytes and return parsed SlipData."""
    try:
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise ValueError(f"Cannot decode image: {exc}") from exc

    img_array = np.array(pil_image)

    try:
        reader = _get_reader()
        results = reader.readtext(img_array, detail=0, paragraph=False)
        raw_text = "\n".join(str(r) for r in results)
    except Exception as exc:
        logger.exception("EasyOCR failed: %s", exc)
        raw_text = ""

    bank_key = detect_bank(raw_text)
    parser = _PARSERS[bank_key]
    slip_data = parser.parse(raw_text)
    return slip_data
