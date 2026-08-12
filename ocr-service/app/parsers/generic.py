"""Generic fallback parser for unknown or unsupported Thai banks."""

from __future__ import annotations

from app.models.schemas import SlipData
from app.parsers.base import BankParser


class GenericParser(BankParser):
    """Fallback parser that applies broad patterns to any Thai bank slip."""

    bank_name = "Unknown"

    def parse(self, text: str) -> SlipData:
        """Extract fields using generic patterns.

        Args:
            text: Raw OCR text from the slip image.

        Returns:
            SlipData with whatever fields could be extracted.
        """
        sender = self._extract_name_after_label(
            text,
            ["จาก", "ผู้โอน", "from", "sender", "ชื่อผู้โอน"],
        )
        receiver = self._extract_name_after_label(
            text,
            ["ถึง", "ผู้รับ", "to", "receiver", "ชื่อผู้รับ"],
        )
        amount = self._extract_amount(text)
        date = self._extract_date(text)
        time = self._extract_time(text)
        reference = self._extract_reference(text)

        # Confidence: count how many fields we extracted
        filled = sum(
            v is not None
            for v in [sender, receiver, amount, date, time, reference]
        )
        confidence = round(filled / 6 * 0.6, 2)  # cap at 0.6 for generic

        return SlipData(
            bank_name=self.bank_name,
            amount=amount,
            sender_name=sender,
            receiver_name=receiver,
            reference_number=reference,
            transaction_date=date,
            transaction_time=time,
            confidence=confidence,
            raw_text=text,
        )
