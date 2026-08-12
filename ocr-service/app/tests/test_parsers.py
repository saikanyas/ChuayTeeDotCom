"""Unit tests for bank-specific parsers."""

from __future__ import annotations

import pytest

from app.parsers.bangkok_bank import BangkokBankParser
from app.parsers.generic import GenericParser
from app.parsers.kbank import KBankParser
from app.parsers.krungthai import KrungthaiParser
from app.parsers.scb import SCBParser
from app.services.ocr import detect_bank


# ---------------------------------------------------------------------------
# detect_bank
# ---------------------------------------------------------------------------


class TestDetectBank:
    def test_kbank_english(self):
        assert detect_bank("KBANK Transfer Confirmation") == "kbank"

    def test_kbank_thai(self):
        assert detect_bank("ธนาคารกสิกรไทย โอนเงิน") == "kbank"

    def test_scb_english(self):
        assert detect_bank("SCB Easy Transfer slip") == "scb"

    def test_scb_thai(self):
        assert detect_bank("ธนาคารไทยพาณิชย์") == "scb"

    def test_krungthai_english(self):
        assert detect_bank("KTB NEXT Mobile Banking") == "krungthai"

    def test_krungthai_thai(self):
        assert detect_bank("ธนาคารกรุงไทย โอนเงิน") == "krungthai"

    def test_bangkok_bank_english(self):
        assert detect_bank("Bangkok Bank BBL transfer") == "bangkok_bank"

    def test_bangkok_bank_thai(self):
        assert detect_bank("ธนาคารกรุงเทพ") == "bangkok_bank"

    def test_generic_fallback(self):
        assert detect_bank("Unknown Bank Slip") == "generic"


# ---------------------------------------------------------------------------
# KBankParser
# ---------------------------------------------------------------------------

_KBANK_SLIP = """
KBANK K PLUS
โอนเงิน
จาก SOMCHAI WONGWIT  XXX-X-X1234-X
ถึง SUPAPORN KANCHAN  XXX-X-X5678-X
จำนวน ฿1,500.00
12 ส.ค. 2567  23:16:45
หมายเลขรายการ K20240812231645001
"""


class TestKBankParser:
    def setup_method(self):
        self.parser = KBankParser()

    def test_bank_name(self):
        result = self.parser.parse(_KBANK_SLIP)
        assert result.bank_name == "KBank"

    def test_amount(self):
        result = self.parser.parse(_KBANK_SLIP)
        assert result.amount == pytest.approx(1500.00)

    def test_sender(self):
        result = self.parser.parse(_KBANK_SLIP)
        assert result.sender_name is not None
        assert "SOMCHAI" in result.sender_name

    def test_receiver(self):
        result = self.parser.parse(_KBANK_SLIP)
        assert result.receiver_name is not None
        assert "SUPAPORN" in result.receiver_name

    def test_date(self):
        result = self.parser.parse(_KBANK_SLIP)
        assert result.transaction_date == "2024-08-12"

    def test_time(self):
        result = self.parser.parse(_KBANK_SLIP)
        assert result.transaction_time is not None
        assert "23:16" in result.transaction_time

    def test_reference(self):
        result = self.parser.parse(_KBANK_SLIP)
        assert result.reference_number is not None

    def test_confidence_above_threshold(self):
        result = self.parser.parse(_KBANK_SLIP)
        assert result.confidence >= 0.5

    def test_raw_text_preserved(self):
        result = self.parser.parse(_KBANK_SLIP)
        assert result.raw_text == _KBANK_SLIP


# ---------------------------------------------------------------------------
# SCBParser
# ---------------------------------------------------------------------------

_SCB_SLIP = """
SCB Easy
โอนเงิน สำเร็จ
ผู้โอน
PRANEE SUKSAWAT
XXX-X-X9012-X
ผู้รับ
WANCHAI RATTANA
XXX-X-X3456-X
จำนวนเงิน  2,300.50 บาท
12/08/2567  23:16:00
เลขที่รายการ SCB20240812231600ABC
"""


class TestSCBParser:
    def setup_method(self):
        self.parser = SCBParser()

    def test_bank_name(self):
        assert self.parser.parse(_SCB_SLIP).bank_name == "SCB"

    def test_amount(self):
        assert self.parser.parse(_SCB_SLIP).amount == pytest.approx(2300.50)

    def test_date_buddhist_conversion(self):
        result = self.parser.parse(_SCB_SLIP)
        assert result.transaction_date == "2024-08-12"

    def test_confidence(self):
        assert self.parser.parse(_SCB_SLIP).confidence > 0.3


# ---------------------------------------------------------------------------
# KrungthaiParser
# ---------------------------------------------------------------------------

_KTB_SLIP = """
Krungthai NEXT
โอนเงิน
วันที่ 12 สิงหาคม 2567 เวลา 23:16:00
โอนจาก: APIRAK JAIDEE
โอนให้: MALEE SOMBOON
จำนวน ฿750.00
เลขที่อ้างอิง KTB20240812231600XYZ
"""


class TestKrungthaiParser:
    def setup_method(self):
        self.parser = KrungthaiParser()

    def test_bank_name(self):
        assert self.parser.parse(_KTB_SLIP).bank_name == "Krungthai"

    def test_amount(self):
        assert self.parser.parse(_KTB_SLIP).amount == pytest.approx(750.00)

    def test_date(self):
        result = self.parser.parse(_KTB_SLIP)
        assert result.transaction_date == "2024-08-12"


# ---------------------------------------------------------------------------
# BangkokBankParser
# ---------------------------------------------------------------------------

_BBL_SLIP = """
Bangkok Bank BBL
Transfer Confirmation
Debit Account Name: JOHN DOE
Credit Account Name: JANE SMITH
Amount  THB 5,000.00
12 Aug 2024  23:16:00
Reference No: BBL20240812231600001
"""


class TestBangkokBankParser:
    def setup_method(self):
        self.parser = BangkokBankParser()

    def test_bank_name(self):
        assert self.parser.parse(_BBL_SLIP).bank_name == "Bangkok Bank"

    def test_amount(self):
        assert self.parser.parse(_BBL_SLIP).amount == pytest.approx(5000.00)

    def test_date(self):
        result = self.parser.parse(_BBL_SLIP)
        assert result.transaction_date == "2024-08-12"

    def test_sender(self):
        result = self.parser.parse(_BBL_SLIP)
        assert result.sender_name is not None
        assert "JOHN" in result.sender_name

    def test_receiver(self):
        result = self.parser.parse(_BBL_SLIP)
        assert result.receiver_name is not None
        assert "JANE" in result.receiver_name


# ---------------------------------------------------------------------------
# GenericParser
# ---------------------------------------------------------------------------

_GENERIC_SLIP = """
Some Unknown Bank
จาก UNKNOWN SENDER
ถึง UNKNOWN RECEIVER
1,000.00 บาท
12/08/2024  10:30:00
ref: UNKN123456
"""


class TestGenericParser:
    def setup_method(self):
        self.parser = GenericParser()

    def test_bank_name(self):
        assert self.parser.parse(_GENERIC_SLIP).bank_name == "Unknown"

    def test_amount(self):
        assert self.parser.parse(_GENERIC_SLIP).amount == pytest.approx(1000.00)

    def test_confidence_capped(self):
        result = self.parser.parse(_GENERIC_SLIP)
        assert result.confidence <= 0.6
