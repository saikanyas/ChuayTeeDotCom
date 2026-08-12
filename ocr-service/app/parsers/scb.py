"""SCB (Siam Commercial Bank) slip parser."""

from __future__ import annotations

import re

from app.models.schemas import SlipData
from app.parsers.base import BankParser


class SCBParser(BankParser):
    """Parser for SCB (ไทยพาณิชย์ / SCB) transfer slips.

    Detection keywords: ``SCB``, ``ไทยพาณิชย์``, ``Easy``, ``SCB Easy``.
    """

    bank_name = "SCB"

    _SCB_REF_PATTERNS = [
        r"(?:เลขที่รายการ|transaction\s*no\.?|ref\.?\s*no\.?)[:\s]*([A-Z0-9]{8,20})",
        r"(?:รหัสอ้างอิง)[:\s]*([A-Z0-9\-]{6,20})",
        r"\b(SCB\d{12,})\b",
    ]

    def parse(self, text: str) -> SlipData:
        """Parse an SCB slip.

        Args:
            text: Raw OCR text from the slip image.

        Returns:
            SlipData populated with SCB-specific field extraction.
        """
        # --- Sender -------------------------------------------------------
        sender = self._extract_name_after_label(
            text,
            ["ผู้โอน", "จาก", "from", "sender name"],
        )
        # SCB Easy format: "ผู้โอน\nFIRST LAST\nXXX-X-X1234-X"
        if not sender:
            m = re.search(r"ผู้โอน\s*\n?\s*([A-Za-zก-๙\s]{3,40})\n", text)
            if m:
                sender = m.group(1).strip()

        # --- Receiver -----------------------------------------------------
        receiver = self._extract_name_after_label(
            text,
            ["ผู้รับ", "ถึง", "to", "receiver name"],
        )
        if not receiver:
            m = re.search(r"ผู้รับ\s*\n?\s*([A-Za-zก-๙\s]{3,40})\n", text)
            if m:
                receiver = m.group(1).strip()

        # --- Amount -------------------------------------------------------
        # SCB format: "จำนวนเงิน  1,234.00 บาท"
        amount = None
        m = re.search(r"จำนวนเงิน[^\d]*([\d,]+\.\d{2})", text)
        if m:
            amount = float(m.group(1).replace(",", ""))
        else:
            amount = self._extract_amount(text)

        # --- Date / Time --------------------------------------------------
        # SCB format: "12/08/2567  23:16:00" or "12/08/67"
        date = None
        time = None
        dt_match = re.search(
            r"(\d{1,2})/(\d{2})/(\d{2,4})\s+(\d{2}:\d{2}(?::\d{2})?)", text
        )
        if dt_match:
            day, month, year, time_str = dt_match.groups()
            year_int = int(year)
            if year_int > 2400:  # Buddhist year (4-digit)
                year_int -= 543
            elif year_int < 100:  # 2-digit Buddhist year shorthand
                year_int = year_int + 2500 - 543
            date = f"{year_int}-{month}-{int(day):02d}"
            time = time_str
        else:
            date = self._extract_date(text)
            time = self._extract_time(text)

        # --- Reference ----------------------------------------------------
        reference = self._extract_reference(text, self._SCB_REF_PATTERNS)

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
