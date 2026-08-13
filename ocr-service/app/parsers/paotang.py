"""Paotang / G-Wallet slip parser."""

from __future__ import annotations

import re

from app.models.schemas import SlipData
from app.parsers.base import BankParser


class PaotangParser(BankParser):
    """Parser for Paotang (เป๋าตัง / G-Wallet / ถุงเงิน) slips.

    Detection keywords: ``เป๋าตัง``, ``G-Wallet``, ``ถุงเงิน``, ``ไทยช่วยไทย``.
    """

    bank_name = "Paotang"

    _PAOTANG_REF_PATTERNS = [
        r"(?:รหัสอ้างอิง|ref(?:erence)?\s*(?:no\.?)?)[:\s]*([a-f0-9\-]{8,40})",
        r"\b([0-9a-f]{8}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{12})\b",
    ]

    def parse(self, text: str) -> SlipData:
        """Parse Paotang slip text."""
        # Amount: "จำนวนเงินที่ชำระ 71.60 บาท" OR "ค่าสินค้า/บริการ 179 บาท"
        amount = None
        m = re.search(r"จำนวนเงินที่ชำระ\s*([\d,]+\.?\d{0,2})\s*บาท", text)
        if m:
            try:
                amount = float(m.group(1).replace(",", ""))
            except ValueError:
                amount = None

        if not amount:
            m = re.search(r"ค่าสินค้า/บริการ\s*([\d,]+\.?\d{0,2})\s*บาท", text)
            if m:
                try:
                    amount = float(m.group(1).replace(",", ""))
                except ValueError:
                    amount = None

        if not amount:
            amount = self._extract_amount(text)

        # Date & Time: "10 ส.ค. 2569 12:01 น."
        date = None
        time = None
        short_th_months = {
            "ม.ค.": "01", "ก.พ.": "02", "มี.ค.": "03", "เม.ย.": "04",
            "พ.ค.": "05", "มิ.ย.": "06", "ก.ค.": "07", "ส.ค.": "08",
            "ก.ย.": "09", "ต.ค.": "10", "พ.ย.": "11", "ธ.ค.": "12",
            "ม.ค": "01", "ก.พ": "02", "มี.ค": "03", "เม.ย": "04",
            "พ.ค": "05", "มิ.ย": "06", "ก.ค": "07", "ส.ค": "08",
            "ก.ย": "09", "ต.ค": "10", "พ.ย": "11", "ธ.ค": "12",
        }
        month_keys = "|".join(re.escape(k) for k in short_th_months.keys())
        dt_match = re.search(r"(\d{1,2})\s*(" + month_keys + r")\s*(\d{4})\s*(\d{2}:\d{2})(?:\s*น\.)?", text)
        if dt_match:
            day, month_str, year, time_str = dt_match.groups()
            y = int(year)
            if y > 2400:
                y -= 543
            m_num = short_th_months.get(month_str, "01")
            date = f"{y}-{m_num}-{int(day):02d}"
            time = time_str
        else:
            date = self._extract_date(text)
            time = self._extract_time(text)

        # Receiver / Merchant: e.g. "ไก่อ่างห้าดาวสาขาโนนม่วง1"
        receiver = self._extract_name_after_label(text, ["ร้านค้า", "ผู้รับ"])
        if not receiver:
            lines = [l.strip() for l in text.split("\n") if l.strip()]
            for l in lines:
                if "สาขา" in l or "ร้าน" in l or "ไก่" in l or "ถุงเงิน" in l:
                    receiver = l
                    break

        sender = self._extract_name_after_label(text, ["ผู้โอน", "G-Wallet ID"])
        reference = self._extract_reference(text, self._PAOTANG_REF_PATTERNS)
        filled = sum(v is not None for v in [sender, receiver, amount, date, time, reference])
        confidence = round(0.35 + filled / 6 * 0.6, 2)

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
