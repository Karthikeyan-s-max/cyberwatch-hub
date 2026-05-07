"""Validators and sanitizers for URLs, phones, emails and files."""
from __future__ import annotations

import re
from typing import Optional

RTSP_RE = re.compile(r"^rtsp://", re.IGNORECASE)
PHONE_RE = re.compile(r"^\+?[1-9]\d{1,14}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
FILENAME_RE = re.compile(r"[^A-Za-z0-9._-]")


def validate_rtsp_url(url: str) -> bool:
    return bool(RTSP_RE.match(url))


def validate_phone_number(phone: str) -> bool:
    return bool(PHONE_RE.match(phone))


def validate_email_address(email: str) -> bool:
    return bool(EMAIL_RE.match(email))


def validate_video_file(filename: str) -> bool:
    return filename.lower().endswith((".mp4", ".avi", ".mov"))


def validate_file_size(file_size: int, max_size_mb: int = 500) -> bool:
    return file_size <= max_size_mb * 1024 * 1024


def validate_confidence_threshold(threshold: int) -> bool:
    return 50 <= int(threshold) <= 100


def sanitize_filename(filename: str) -> str:
    return FILENAME_RE.sub("_", filename)
