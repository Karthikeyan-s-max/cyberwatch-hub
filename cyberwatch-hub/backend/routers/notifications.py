"""Notification endpoints for SMS and email testing."""
from __future__ import annotations

from typing import Any
import logging

from fastapi import APIRouter, HTTPException, Request

from models.schemas import SMSRequest, EmailRequest, SMSResponse, EmailResponse
from services.notifications import send_sms, send_email
from services.settings_service import load_settings

logger = logging.getLogger("routers.notifications")
router = APIRouter()


@router.post("/sms", response_model=SMSResponse)
async def post_sms(payload: SMSRequest, request: Request) -> Any:
    settings = load_settings()
    s = send_sms(payload.to, payload.message, settings)
    return s


@router.post("/email", response_model=EmailResponse)
async def post_email(payload: EmailRequest, request: Request) -> Any:
    settings = load_settings()
    s = send_email(str(payload.to), payload.subject, payload.body, settings)
    return s


@router.post("/alert")
async def notify_alert(alert: dict, request: Request) -> Any:
    """Send notifications for an alert if confidence >= 85%."""
    confidence = alert.get("confidence", 0.0)
    CONFIDENCE_THRESHOLD = 0.85
    
    if confidence < CONFIDENCE_THRESHOLD:
        logger.debug(f"Alert confidence {confidence} below threshold {CONFIDENCE_THRESHOLD}; skipping notifications")
        return {"status": "skipped", "reason": f"confidence {confidence} < {CONFIDENCE_THRESHOLD}"}
    
    settings = load_settings()
    results = {"sms": None, "email": None}
    
    # Send SMS if enabled
    if settings.get("notify_sms"):
        sms_recipients = settings.get("sms_recipients") or []
        for recipient in sms_recipients:
            msg = f"ALERT: Violence detected with {confidence*100:.1f}% confidence at {alert.get('timestamp', 'unknown time')}"
            try:
                sms_result = send_sms(recipient, msg, settings)
                results["sms"] = sms_result
                logger.info(f"SMS notification sent to {recipient}")
            except Exception as e:
                logger.exception(f"Failed to send SMS: {e}")
    
    # Send email if enabled
    if settings.get("notify_email"):
        email_recipients = settings.get("email_recipients") or []
        for recipient in email_recipients:
            subject = f"Violence Detection Alert ({confidence*100:.1f}%)"
            body = f"""
Violence has been detected with {confidence*100:.1f}% confidence.

Details:
- Timestamp: {alert.get('timestamp', 'unknown')}
- Camera: {alert.get('camera', 'unknown')}
- Label: {alert.get('label', 'violence')}
- Confidence: {confidence*100:.1f}%

Please review immediately.
"""
            try:
                email_result = send_email(recipient, subject, body, settings)
                results["email"] = email_result
                logger.info(f"Email notification sent to {recipient}")
            except Exception as e:
                logger.exception(f"Failed to send email: {e}")
    
    return {"status": "sent", "sms": results.get("sms"), "email": results.get("email")}


@router.post("/test-sms")
async def test_sms(request: Request) -> Any:
    settings = load_settings()
    recipients = settings.get("sms_recipients") or []
    if not recipients:
        raise HTTPException(400, "No sms_recipients configured")
    resp = send_sms(recipients[0], "Test message from Violence Detection Backend", settings)
    return resp


@router.post("/test-email")
async def test_email(request: Request) -> Any:
    settings = load_settings()
    recipients = settings.get("email_recipients") or []
    if not recipients:
        raise HTTPException(400, "No email_recipients configured")
    resp = send_email(recipients[0], "Test Email", "This is a test email from Violence Detection Backend", settings)
    return resp
