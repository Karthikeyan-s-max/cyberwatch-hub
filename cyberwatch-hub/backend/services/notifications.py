"""Notifications (Twilio SMS and SMTP email)."""
from __future__ import annotations

import logging
import re
import smtplib
from email.message import EmailMessage
from typing import Dict, Optional

from twilio.rest import Client

logger = logging.getLogger("notifications")


PHONE_RE = re.compile(r"^\+?[1-9]\d{1,14}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_phone(phone: str) -> bool:
    return bool(PHONE_RE.match(phone))


def validate_email(email: str) -> bool:
    return bool(EMAIL_RE.match(email))


def send_sms(to: str, message: str, settings: Dict) -> Dict:
    try:
        sid = settings.get("twilio_sid") or settings.get("TWILIO_SID")
        token = settings.get("twilio_auth_token") or settings.get("TWILIO_AUTH_TOKEN")
        from_phone = settings.get("twilio_phone") or settings.get("TWILIO_PHONE")
        
        # Test mode: log instead of sending
        if not sid or not token or not from_phone:
            logger.warning(f"[TEST MODE] SMS to {to}: {message}")
            print(f"\n=======================================================")
            print(f"✅ [SUCCESS] SIMULATED SMS SENT TO {to}")
            print(f"📩 Message: {message}")
            print(f"=======================================================\n")
            return {"status": "test_logged", "message": f"[TEST] SMS logged to {to}"}
        
        client = Client(sid, token)
        msg = client.messages.create(body=message, from_=from_phone, to=to)
        logger.info(f"SMS sent to {to}, SID: {getattr(msg, 'sid', 'unknown')}")
        print(f"\n=======================================================")
        print(f"✅ [SUCCESS] ACTUAL SMS SENT TO {to}")
        print(f"📩 Message: {message}")
        print(f"=======================================================\n")
        return {"status": "sent", "message_id": getattr(msg, "sid", None)}
    except Exception as exc:
        logger.exception("Failed to send SMS: %s", exc)
        print(f"\n❌ [ERROR] FAILED TO SEND SMS TO {to}: {exc}\n")
        return {"status": "failed", "error": str(exc)}


def send_email(to: str, subject: str, body: str, settings: Dict) -> Dict:
    try:
        host = settings.get("SMTP_HOST")
        port = int(settings.get("SMTP_PORT", 587))
        user = settings.get("SMTP_USER")
        password = settings.get("SMTP_PASSWORD")
        
        # Test mode: log instead of sending
        if not host or not user or not password:
            logger.warning(f"[TEST MODE] Email to {to}, subject: {subject}")
            print(f"\n=======================================================")
            print(f"✅ [SUCCESS] SIMULATED EMAIL SENT TO {to}")
            print(f"📋 Subject: {subject}")
            print(f"=======================================================\n")
            return {"status": "test_logged", "message": f"[TEST] Email logged to {to}"}

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = user
        msg["To"] = to
        msg.set_content(body)

        with smtplib.SMTP(host, port, timeout=10) as s:
            s.starttls()
            s.login(user, password)
            s.send_message(msg)

        logger.info(f"Email sent to {to}, subject: {subject}")
        print(f"\n=======================================================")
        print(f"✅ [SUCCESS] ACTUAL EMAIL SENT TO {to}")
        print(f"📋 Subject: {subject}")
        print(f"=======================================================\n")
        return {"status": "sent"}
    except Exception as exc:
        logger.exception("Failed to send email: %s", exc)
        print(f"\n❌ [ERROR] FAILED TO SEND EMAIL TO {to}: {exc}\n")
        return {"status": "failed", "error": str(exc)}


def notify_alert(alert: Dict, settings: Dict) -> Dict:
    sms_resp = None
    email_resp = None
    message = f"Alert {alert.get('label')} at {alert.get('timestamp')} (confidence={alert.get('confidence')})"
    if settings.get("notify_sms") and settings.get("sms_recipients"):
        for to in settings.get("sms_recipients", []):
            sms_resp = send_sms(to, message, settings)
    if settings.get("notify_email") and settings.get("email_recipients"):
        for to in settings.get("email_recipients", []):
            email_resp = send_email(to, f"Violence Alert: {alert.get('label')}", message, settings)
    return {"sms": sms_resp, "email": email_resp}
