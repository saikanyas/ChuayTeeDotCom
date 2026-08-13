"""TrueMoney Wallet slip parser."""

from __future__ import annotations

import re

from app.models.schemas import SlipData
from app.parsers.base import BankParser


class TrueMoneyParser(BankParser):
    """Parser for TrueMoney Wallet (ทรูมันนี่ วอลเล็ท) slips & receipts.

    Detection keywords: ``truemoney``, ``ทรูมันนี่``, ``วอลเล็ท``.
    """

    bank_name = "TrueMoney"

    _TRUEMONEY_REF_PATTERNS = [
        r"(?:เลขที่รายการ|หมายเลขการสั่งซื้อ|หมายเลขอ้างอิงร้านค้า|ref(?:erence)?\s*(?:no\.?)?)[:\s]*([A-Z0-9]{8,35})",
        r"\b(APF[A-Z0-9]{10,})\b",
    ]

    def parse(self, text: str) -> SlipData:
        """Parse TrueMoney slip text."""
        # Amount: "ยอดรวมทั้งหมด ฿ 61.00" or "฿ 61.00" or "61.00"
        amount = None
        m = re.search(r"(?:ยอดรวมทั้งหมด|ยอดชำระ|จำนวนเงิน)?\s*(?:฿)?\s*([\d,]+\.\d{2})", text, re.IGNORECASE)
        if m:
            try:
                amount = float(m.group(1).replace(",", ""))
            except ValueError:
                amount = None
        if not amount:
            amount = self._extract_amount(text)

        # Date & Time: "21 ก.ค. 2569 16:09:20" or "วันที่ทำรายการ 21 ก.ค. 2569 16:09:20"
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
        dt_match = re.search(r"(\d{1,2})\s*(" + month_keys + r")\s*(\d{4})\s*(\d{2}:\d{2}(?::\d{2})?)", text)
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

        # Merchant / Receiver: e.g. "CJ 2172 ถนนหลังมอ ขอนแก่น"
        receiver = self._extract_name_after_label(text, ["ร้านค้า", "รับเงินโดย", "รายการ"])
        if not receiver:
            lines = [l.strip() for l in text.split("\n") if l.strip()]
            for l in lines:
                if "CJ " in l or "ร้าน" in l or "สาขา" in l:
                    receiver = l
                    break

        sender = "TrueMoney Wallet"
        reference = self._extract_reference(text, self._TRUEMONEY_REF_PATTERNS)
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
