"""KBank (Kasikorn Bank) slip parser."""

from __future__ import annotations

import re

from app.models.schemas import SlipData
from app.parsers.base import BankParser


class KBankParser(BankParser):
    """Parser for KBank (กสิกรไทย / KBANK) transfer slips.

    Detection keywords: ``KBANK``, ``กสิกรไทย``, ``K PLUS``, ``Kasikorn``.
    """

    bank_name = "KBank"

    # KBank-specific reference patterns (K+ format)
    _KBANK_REF_PATTERNS = [
        r"(?:หมายเลขรายการ|transaction\s*id|ref\.?\s*no\.?)[:\s]*([A-Z0-9]{10,20})",
        r"(?:เลขที่อ้างอิง)[:\s]*(\d{10,20})",
        r"\b(K\d{15,})\b",
    ]

    def parse(self, text: str) -> SlipData:
        """Parse a KBank slip.

        Args:
            text: Raw OCR text from the slip image.

        Returns:
            SlipData populated with KBank-specific field extraction.
        """
        # --- Sender -------------------------------------------------------
        sender = self._extract_name_after_label(
            text,
            ["จาก", "ผู้โอน", "จากบัญชี", "from account", "sender"],
        )
        # KBank sometimes renders sender on same line as last-4 digits
        if not sender:
            m = re.search(r"จาก\s+(.+?)\s+[Xx*]{4,}\d{4}", text)
            if m:
                sender = m.group(1).strip()

        # --- Receiver -----------------------------------------------------
        receiver = self._extract_name_after_label(
            text,
            ["ถึง", "ผู้รับ", "ไปยังบัญชี", "to account", "receiver"],
        )

        # --- Amount -------------------------------------------------------
        # KBank puts amount prominently, often "฿1,234.00" or "1,234.00 บาท"
        amount = None
        m = re.search(r"฿\s*([\d,]+\.\d{2})", text)
        if m:
            amount = float(m.group(1).replace(",", ""))
        else:
            amount = self._extract_amount(text)

        # --- Date / Time --------------------------------------------------
        # KBank format: "12 ส.ค. 2567  23:16"
        date = None
        time = None
        dt_match = re.search(
            r"(\d{1,2})\s+"
            r"(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)"
            r"\s+(\d{4})\s+(\d{2}:\d{2}(?::\d{2})?)",
            text,
        )
        if dt_match:
            day, month_th, year, time_str = dt_match.groups()
            month_map = {
                "ม.ค.": "01", "ก.พ.": "02", "มี.ค.": "03", "เม.ย.": "04",
                "พ.ค.": "05", "มิ.ย.": "06", "ก.ค.": "07", "ส.ค.": "08",
                "ก.ย.": "09", "ต.ค.": "10", "พ.ย.": "11", "ธ.ค.": "12",
            }
            # Convert Buddhist year to Gregorian
            try:
                year_ad = int(year) - 543
            except ValueError:
                year_ad = int(year)
            month_num = month_map.get(month_th, "00")
            date = f"{year_ad}-{month_num}-{int(day):02d}"
            time = time_str
        else:
            date = self._extract_date(text)
            time = self._extract_time(text)

        # --- Reference ----------------------------------------------------
        reference = self._extract_reference(text, self._KBANK_REF_PATTERNS)

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
