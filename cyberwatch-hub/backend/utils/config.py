"""
utils/config.py - Configuration management
"""
import os
from dataclasses import dataclass, field
from typing import List
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
    """Application configuration."""

    # FastAPI
    FASTAPI_ENV: str = os.getenv("FASTAPI_ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # YOLO
    YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", "yolo last update.pt")
    DEVICE: str = os.getenv("DEVICE", "auto")

    # Twilio
    TWILIO_SID: str = os.getenv("TWILIO_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE: str = os.getenv("TWILIO_PHONE", "")

    # SMTP
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")

    # CORS
    CORS_ORIGINS: List[str] = field(
        default_factory=lambda: os.getenv("CORS_ORIGINS", "*").split(",")
    )

    @staticmethod
    def validate() -> None:
        """Validate configuration (optional checks)."""
        # Add lightweight checks if you want, or leave empty for now
        return


def get_config() -> Config:
    """Get configuration instance."""
    return Config()
