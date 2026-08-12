"""Pydantic v2 models for OCR service."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class SlipData(BaseModel):
    """Extracted data from a Thai bank transfer slip."""

    bank_name: Optional[str] = Field(None, description="Detected bank name")
    amount: Optional[float] = Field(None, description="Transfer amount in THB")
    sender_name: Optional[str] = Field(None, description="Sender account name")
    receiver_name: Optional[str] = Field(None, description="Receiver account name")
    reference_number: Optional[str] = Field(None, description="Transaction reference / slip number")
    transaction_date: Optional[str] = Field(None, description="Date string (YYYY-MM-DD or as-parsed)")
    transaction_time: Optional[str] = Field(None, description="Time string (HH:MM or HH:MM:SS)")
    confidence: float = Field(0.0, ge=0.0, le=1.0, description="Parser confidence score 0-1")
    raw_text: str = Field("", description="Raw OCR output text")


class OCRResponse(BaseModel):
    """Response envelope for /ocr/process."""

    success: bool = True
    data: SlipData
    message: str = "OK"


class HealthResponse(BaseModel):
    """Response for /health."""

    status: str = "ok"
    service: str = "ocr-service"
    version: str = "1.0.0"
