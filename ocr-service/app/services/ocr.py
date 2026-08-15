"""OCR service: image → text → parsed SlipData using EasyOCR with memory optimization."""

from __future__ import annotations

import io
import gc
import logging
from functools import lru_cache

import numpy as np
import torch
from PIL import Image

# Enforce single-thread execution to keep memory strictly under Render's 512MB RAM cap
torch.set_num_threads(1)

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
    # Thai & English models on CPU
    return easyocr.Reader(['th', 'en'], gpu=False, quantize=True)


def detect_bank(text: str) -> str:
    upper = text.upper()
    for bank_key, keywords in _BANK_SIGNATURES.items():
        for kw in keywords:
            if kw.upper() in upper:
                return bank_key
    return "generic"


def process_image(image_bytes: bytes) -> SlipData:
    """Run EasyOCR on image_bytes and return parsed SlipData with strict memory management."""
    pil_image = None
    img_array = None
    try:
        try:
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as exc:
            raise ValueError(f"Cannot decode image: {exc}") from exc

        # Memory safeguard: Downscale large mobile images (e.g. 4000x3000 -> 1200px)
        # Keeps text crystal clear for OCR while slashing tensor RAM usage by >70%
        max_dim = 1200
        w, h = pil_image.size
        if max(w, h) > max_dim:
            scale = max_dim / float(max(w, h))
            new_w = int(w * scale)
            new_h = int(h * scale)
            pil_image = pil_image.resize((new_w, new_h), Image.Resampling.BILINEAR)

        img_array = np.array(pil_image)

        try:
            reader = _get_reader()
            with torch.no_grad():
                results = reader.readtext(
                    img_array,
                    detail=0,
                    paragraph=False,
                    canvas_size=1280,
                    mag_ratio=1.0,
                )
            raw_text = "\n".join(str(r) for r in results)
        except Exception as exc:
            logger.exception("EasyOCR failed: %s", exc)
            raw_text = ""

        bank_key = detect_bank(raw_text)
        parser = _PARSERS[bank_key]
        slip_data = parser.parse(raw_text)
        return slip_data

    finally:
        # Explicitly cleanup memory buffers and trigger garbage collection
        del img_array
        del pil_image
        gc.collect()
