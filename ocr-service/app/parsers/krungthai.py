"""Krungthai Bank (KTB) slip parser."""

from __future__ import annotations

import re

from app.models.schemas import SlipData
from app.parsers.base import BankParser


class KrungthaiParser(BankParser):
    """Parser for Krungthai Bank (กรุงไทย / KTB) transfer slips.

    Detection keywords: ``KTB``, ``กรุงไทย``, ``Krungthai``, ``NEXT``.
    """

    bank_name = "Krungthai"

    _KTB_REF_PATTERNS = [
        r"(?:เลขที่อ้างอิง|ref(?:erence)?\s*(?:no\.?)?)[:\s]*([A-Z0-9]{8,25})",
        r"(?:transaction\s*id)[:\s]*([A-Z0-9\-]{6,25})",
        r"\b(KTB\d{10,})\b",
    ]

    def parse(self, text: str) -> SlipData:
        """Parse a Krungthai slip.

        Args:
            text: Raw OCR text from the slip image.

        Returns:
            SlipData populated with KTB-specific field extraction.
        """
        # --- Sender -------------------------------------------------------
        sender = self._extract_name_after_label(
            text,
            ["ผู้โอน", "จาก", "from", "โอนจาก"],
        )
        if not sender:
            m = re.search(r"โอนจาก\s*:?\s*([A-Za-zก-๙\s\.]{3,40})", text)
            if m:
                sender = m.group(1).strip()

        # --- Receiver -----------------------------------------------------
        receiver = self._extract_name_after_label(
            text,
            ["ผู้รับ", "ถึง", "to", "โอนให้"],
        )
        if not receiver:
            m = re.search(r"โอนให้\s*:?\s*([A-Za-zก-๙\s\.]{3,40})", text)
            if m:
                receiver = m.group(1).strip()

        # --- Amount -------------------------------------------------------
        # KTB NEXT format: "จำนวนเงิน 200.00 บาท" or "จำนวน  ฿1,234.00" or "1,234.00 บาท"
        amount = None
        m = re.search(r"(?:จำนวนเงิน|จำนวนเงินที่ชำระ|จำนวน)[^\d฿]*?(?:฿)?\s*([\d,]+\.?\d{0,2})", text, re.IGNORECASE)
        if m:
            try:
                amount = float(m.group(1).replace(",", ""))
            except ValueError:
                amount = None

        if not amount:
            amount = self._extract_amount(text)

        # --- Date / Time --------------------------------------------------
        # KTB NEXT format: "วันที่ 12 สิงหาคม 2567  เวลา 23:16:00" or "10 ส.ค. 2569 - 12:16"
        date = None
        time = None
        th_months = {
            "มกราคม": "01", "กุมภาพันธ์": "02", "มีนาคม": "03", "เมษายน": "04",
            "พฤษภาคม": "05", "มิถุนายน": "06", "กรกฎาคม": "07", "สิงหาคม": "08",
            "กันยายน": "09", "ตุลาคม": "10", "พฤศจิกายน": "11", "ธันวาคม": "12",
            "ม.ค.": "01", "ก.พ.": "02", "มี.ค.": "03", "เม.ย.": "04",
            "พ.ค.": "05", "มิ.ย.": "06", "ก.ค.": "07", "ส.ค.": "08",
            "ก.ย.": "09", "ต.ค.": "10", "พ.ย.": "11", "ธ.ค.": "12",
            "ม.ค": "01", "ก.พ": "02", "มี.ค": "03", "เม.ย": "04",
            "พ.ค": "05", "มิ.ย": "06", "ก.ค": "07", "ส.ค": "08",
            "ก.ย": "09", "ต.ค": "10", "พ.ย": "11", "ธ.ค": "12",
        }
        month_keys = "|".join(re.escape(k) for k in th_months.keys())
        dt_match = re.search(
            r"(?:วันที่(?:ทำรายการ)?\s*)?(\d{1,2})\s*(" + month_keys + r")\s*(\d{4})\s*[-–\s]*\s*(\d{2}:\d{2}(?::\d{2})?)",
            text,
            re.IGNORECASE,
        )
        if dt_match:
            day, month_th, year, time_str = dt_match.groups()
            year_int = int(year)
            if year_int > 2400:
                year_int -= 543
            month_num = th_months.get(month_th, "01")
            date = f"{year_int}-{month_num}-{int(day):02d}"
            time = time_str
        else:
            date = self._extract_date(text)
            time = self._extract_time(text)

        # --- Reference ----------------------------------------------------
        reference = self._extract_reference(text, self._KTB_REF_PATTERNS)

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
