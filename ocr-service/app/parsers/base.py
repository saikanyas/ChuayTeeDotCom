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
        r"(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})",
        # YYYY-MM-DD
        r"(\d{4})-(\d{2})-(\d{2})",
        # DD MMM YYYY (Thai month names handled in subclasses)
        r"(\d{1,2})\s+(\w+)\s+(\d{4})",
    ]

    _TIME_PATTERNS = [
        r"(\d{2}:\d{2}:\d{2})",
        r"(\d{2}:\d{2})",
    ]

    _THAI_MONTHS = {
        "มกราคม": "01", "ม.ค.": "01", "ม.ค": "01",
        "กุมภาพันธ์": "02", "ก.พ.": "02", "ก.พ": "02",
        "มีนาคม": "03", "มี.ค.": "03", "มี.ค": "03",
        "เมษายน": "04", "เม.ย.": "04", "เม.ย": "04",
        "พฤษภาคม": "05", "พ.ค.": "05", "พ.ค": "05",
        "มิถุนายน": "06", "มิ.ย.": "06", "มิ.ย": "06",
        "กรกฎาคม": "07", "ก.ค.": "07", "ก.ค": "07",
        "สิงหาคม": "08", "ส.ค.": "08", "ส.ค": "08",
        "กันยายน": "09", "ก.ย.": "09", "ก.ย": "09",
        "ตุลาคม": "10", "ต.ค.": "10", "ต.ค": "10",
        "พฤศจิกายน": "11", "พ.ย.": "11", "พ.ย": "11",
        "ธันวาคม": "12", "ธ.ค.": "12", "ธ.ค": "12",
    }

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
        month_pattern = "|".join(
            re.escape(month) for month in sorted(self._THAI_MONTHS, key=len, reverse=True)
        )
        thai_match = re.search(
            rf"(\d{{1,2}})\s*({month_pattern})\s*(\d{{2,4}})",
            text,
        )
        if thai_match:
            day, month, raw_year = thai_match.groups()
            year = int(raw_year)
            year = year - 543 if year > 2400 else (year + 2500 - 543 if year < 100 else year)
            return f"{year:04d}-{self._THAI_MONTHS[month]}-{int(day):02d}"

        for pattern in self._DATE_PATTERNS:
            m = re.search(pattern, text)
            if m:
                groups = m.groups()
                if len(groups) == 3:
                    first, second, third = groups
                    if len(first) == 4:
                        year, month, day = int(first), int(second), int(third)
                    else:
                        day, month, year = int(first), int(second), int(third)
                    year = year - 543 if year > 2400 else (year + 2500 - 543 if year < 100 else year)
                    return f"{year:04d}-{month:02d}-{day:02d}"
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
