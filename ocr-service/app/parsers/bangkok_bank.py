"""Bangkok Bank (BBL) slip parser."""

from __future__ import annotations

import re

from app.models.schemas import SlipData
from app.parsers.base import BankParser


class BangkokBankParser(BankParser):
    """Parser for Bangkok Bank (กรุงเทพ / BBL) transfer slips.

    Detection keywords: ``BBL``, ``กรุงเทพ``, ``Bangkok Bank``, ``Bualuang``.
    """

    bank_name = "Bangkok Bank"

    _BBL_REF_PATTERNS = [
        r"(?:reference\s*(?:no\.?)?|เลขที่อ้างอิง)[:\s]*([A-Z0-9]{8,25})",
        r"(?:slip\s*(?:no\.?|id|number))[:\s]*([A-Z0-9\-]{6,25})",
        r"\b(BBL\d{10,})\b",
        r"\b(BU\d{12,})\b",  # Bualuang ibanking format
    ]

    def parse(self, text: str) -> SlipData:
        """Parse a Bangkok Bank slip.

        Args:
            text: Raw OCR text from the slip image.

        Returns:
            SlipData populated with BBL-specific field extraction.
        """
        # --- Sender -------------------------------------------------------
        sender = self._extract_name_after_label(
            text,
            ["ผู้โอน", "from", "จาก", "debit account name", "ชื่อบัญชีผู้โอน"],
        )
        if not sender:
            m = re.search(
                r"(?:debit account name|ชื่อบัญชีผู้โอน)[:\s]*([A-Za-zก-๙\s\.]{3,50})",
                text,
                re.IGNORECASE,
            )
            if m:
                sender = m.group(1).strip()

        # --- Receiver -----------------------------------------------------
        receiver = self._extract_name_after_label(
            text,
            ["ผู้รับ", "to", "ถึง", "credit account name", "ชื่อบัญชีผู้รับ"],
        )
        if not receiver:
            m = re.search(
                r"(?:credit account name|ชื่อบัญชีผู้รับ)[:\s]*([A-Za-zก-๙\s\.]{3,50})",
                text,
                re.IGNORECASE,
            )
            if m:
                receiver = m.group(1).strip()

        # --- Amount -------------------------------------------------------
        # BBL format: "Amount  THB 1,234.00" or "จำนวนเงิน 1,234.00 บาท"
        amount = None
        m = re.search(r"(?:amount|จำนวนเงิน)[^\d]*([\d,]+\.\d{2})", text, re.IGNORECASE)
        if m:
            amount = float(m.group(1).replace(",", ""))
        else:
            amount = self._extract_amount(text)

        # --- Date / Time --------------------------------------------------
        # BBL iBanking format: "12 Aug 2024  23:16:00"  or Thai format
        date = None
        time = None
        eng_months = {
            "jan": "01", "feb": "02", "mar": "03", "apr": "04",
            "may": "05", "jun": "06", "jul": "07", "aug": "08",
            "sep": "09", "oct": "10", "nov": "11", "dec": "12",
        }
        dt_match = re.search(
            r"(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})"
            r"(?:\s+(\d{2}:\d{2}(?::\d{2})?))?",
            text,
            re.IGNORECASE,
        )
        if dt_match:
            day, month_en, year, time_str = dt_match.groups()
            month_num = eng_months[month_en.lower()]
            date = f"{int(year)}-{month_num}-{int(day):02d}"
            time = time_str
        else:
            date = self._extract_date(text)
            time = self._extract_time(text)

        # --- Reference ----------------------------------------------------
        reference = self._extract_reference(text, self._BBL_REF_PATTERNS)

        # --- Confidence ---------------------------------------------------
        filled = sum(v is not None for v in [sender, receiver, amount, date, time, reference])
        confidence = round(0.3 + filled / 6 * 0.65, 2)

        return SlipData(
            bank_name=self.bank_name,
            amount=amount,
            sender_name=sender,
            receiver_name=receiver,
            reference_number=reference,
            transaction_date=date,
            transaction_time=time,
            confidence=min(confidence, 0.95),
            raw_text=text,
        )
