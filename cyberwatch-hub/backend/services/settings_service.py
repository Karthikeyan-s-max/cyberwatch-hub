"""Settings persistence as JSON file in data/settings.json"""
from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Dict, Any

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)
SETTINGS_PATH = os.path.join(DATA_DIR, "settings.json")


DEFAULTS: Dict[str, Any] = {
    "confidence_threshold": 75,
    "notify_sms": False,
    "notify_email": False,
    "sms_recipients": [],
    "email_recipients": [],
}


def load_settings() -> Dict[str, Any]:
    if not os.path.exists(SETTINGS_PATH):
        save_settings(DEFAULTS)
        return DEFAULTS.copy()
    with open(SETTINGS_PATH, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    return {**DEFAULTS, **data}


def save_settings(settings: Dict[str, Any]) -> None:
    settings_copy = settings.copy()
    settings_copy["updated_at"] = datetime.utcnow().isoformat()
    with open(SETTINGS_PATH, "w", encoding="utf-8") as fh:
        json.dump(settings_copy, fh, indent=2)


def validate_settings(settings: Dict[str, Any]) -> None:
    conf = int(settings.get("confidence_threshold", 75))
    if conf < 50 or conf > 100:
        raise ValueError("confidence_threshold must be between 50 and 100")


def get_public_settings() -> Dict[str, Any]:
    s = load_settings()
    # Do not expose credentials if present
    s.pop("TWILIO_AUTH_TOKEN", None)
    s.pop("SMTP_PASSWORD", None)
    return s
