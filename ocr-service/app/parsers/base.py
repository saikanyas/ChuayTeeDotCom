"""Abstract base class for Thai bank slip parsers."""

from __future__ import annotations

from abc import ABC, abstractmethod
import re
from typing import Optional

from app.models.schemas import SlipData


class BankParser(ABC):
    """Abstract parser. Subclasses implement :meth:`parse` for a specific bank."""

    # Subclasses set this to identify themselves
    bank_name: str = "Unknown"

    @abstractmethod
    def parse(self, text: str) -> SlipData:
        """Parse OCR text and return a :class:`SlipData` instance.

        Args:
            text: Raw OCR text extracted from the slip image.

        Returns:
            SlipData with as many fields populated as the parser can extract.
        """

    # ------------------------------------------------------------------ #
    # Shared regex helpers available to all parsers
    # ------------------------------------------------------------------ #

    _AMOUNT_PATTERNS = [
        # 1,234.56  or  1234.56  with optional THB / บาท suffix
        r"(?:จำนวน|amount|total|ยอด)[^\d]*?([\d,]+\.\d{2})",
        r"([\d,]+\.\d{2})\s*(?:บาท|THB|baht)",
        r"([\d,]+\.\d{2})",  # fallback: first decimal number
    ]

    _DATE_PATTERNS = [
        # DD/MM/YYYY or DD-MM-YYYY (Buddhist or Gregorian)
        r"(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})",
        # YYYY-MM-DD
        r"(\d{4})-(\d{2})-(\d{2})",
        # DD MMM YYYY (Thai month names handled in subclasses)
        r"(\d{1,2})\s+(\w+)\s+(\d{4})",
    ]

    _TIME_PATTERNS = [
        r"(\d{2}:\d{2}:\d{2})",
        r"(\d{2}:\d{2})",
    ]

    _REF_PATTERNS = [
        r"(?:ref(?:erence)?(?:\s*no\.?)?|หมายเลข(?:อ้างอิง)?|เลขที่(?:อ้างอิง)?)[:\s]*([A-Z0-9\-]{6,})",
        r"(?:slip\s*(?:no\.?|id)|สลิป)[:\s]*([A-Z0-9\-]{6,})",
        r"\b([A-Z]{2,4}\d{8,})\b",  # generic alphanumeric ref
    ]

    def _extract_amount(self, text: str) -> Optional[float]:
        """Return the first match for any amount pattern."""
        for pattern in self._AMOUNT_PATTERNS:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                raw = m.group(1).replace(",", "")
                try:
                    return float(raw)
                except ValueError:
                    continue
        return None

    def _extract_date(self, text: str) -> Optional[str]:
        """Return the first date-like string found."""
        # Try HH:MM:SS first to avoid confusing time with date
        for pattern in self._DATE_PATTERNS:
            m = re.search(pattern, text)
            if m:
                return m.group(0).strip()
        return None

    def _extract_time(self, text: str) -> Optional[str]:
        """Return the first time-like string found."""
        for pattern in self._TIME_PATTERNS:
            m = re.search(pattern, text)
            if m:
                return m.group(1)
        return None

    def _extract_reference(self, text: str, extra_patterns: Optional[list] = None) -> Optional[str]:
        """Return the first reference number found."""
        patterns = (extra_patterns or []) + self._REF_PATTERNS
        for pattern in patterns:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                return m.group(1).strip()
        return None

    def _extract_name_after_label(self, text: str, labels: list[str]) -> Optional[str]:
        """Extract a name appearing on the line after one of the given Thai/English labels."""
        for label in labels:
            pattern = rf"{re.escape(label)}[:\s]*(.+)"
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                name = m.group(1).strip()
                # Trim trailing noise
                name = re.split(r"\s{2,}|\t|\n", name)[0].strip()
                if name:
                    return name
        return None
