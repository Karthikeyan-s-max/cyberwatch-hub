"""Settings endpoints to read and update settings."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from models.schemas import SettingsRequest, SettingsResponse, SettingsUpdateResponse
from services.settings_service import load_settings, save_settings, validate_settings, get_public_settings

router = APIRouter()


@router.get("/", response_model=SettingsResponse)
async def get_settings() -> Any:
    s = get_public_settings()
    return s


@router.post("/", response_model=SettingsUpdateResponse)
async def update_settings(payload: SettingsRequest) -> Any:
    data = payload.dict()
    try:
        validate_settings(data)
    except Exception as exc:
        raise HTTPException(400, str(exc))
    save_settings(data)
    return {"ok": True}
