"""Pydantic v2 schemas for detection, alerts, settings, and notifications."""
from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr


class RTSPDetectionRequest(BaseModel):
    rtsp_url: str = Field(..., description="RTSP stream URL")
    timeout: Optional[int] = Field(5, description="Connection timeout seconds")


class DetectionResult(BaseModel):
    violence: bool
    confidence: float
    bbox: Optional[List[int]] = None
    label: Optional[str] = None


class LiveDetectionResponse(BaseModel):
    result: DetectionResult
    timestamp: str


class UploadDetectionResponse(BaseModel):
    events: List[DetectionResult]
    processed_frames: int


class WebcamDetectionRequest(BaseModel):
    image_base64: str


class AlertCreateRequest(BaseModel):
    camera: Optional[str]
    timestamp: str
    confidence: float
    label: str
    image_base64: Optional[str]
    rtsp_url: Optional[str]


class AlertResponse(BaseModel):
    id: int
    camera: Optional[str]
    timestamp: str
    confidence: float
    label: str
    image_base64: Optional[str]
    rtsp_url: Optional[str]
    created_at: str


class AlertsListResponse(BaseModel):
    alerts: List[AlertResponse]


class AlertCreateResponse(BaseModel):
    alert_id: int


class SettingsRequest(BaseModel):
    confidence_threshold: int = Field(75, ge=50, le=100)
    notify_sms: bool = False
    notify_email: bool = False
    sms_recipients: Optional[List[str]] = None
    email_recipients: Optional[List[EmailStr]] = None
    twilio_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[str] = None
    smtp_sender_email: Optional[str] = None
    smtp_password: Optional[str] = None


class SettingsResponse(SettingsRequest):
    updated_at: Optional[str]


class SettingsUpdateResponse(BaseModel):
    ok: bool


class SMSRequest(BaseModel):
    to: str
    message: str


class EmailRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str


class SMSResponse(BaseModel):
    status: str
    message_id: Optional[str] = None
    error: Optional[str] = None


class EmailResponse(BaseModel):
    status: str
    error: Optional[str] = None


class NotificationAlert(BaseModel):
    alert_id: int
    summary: str


class NotificationResponse(BaseModel):
    sms: Optional[SMSResponse]
    email: Optional[EmailResponse]
