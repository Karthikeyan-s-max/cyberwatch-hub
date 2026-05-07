"""Alerts management endpoints."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException

from models.schemas import AlertsListResponse, AlertCreateRequest, AlertCreateResponse
from services.alerts_service import save_alert, get_alerts, delete_alert, get_alert_count, get_alerts_by_date

router = APIRouter()


@router.get("/", response_model=AlertsListResponse)
async def list_alerts(limit: int = 100, min_confidence: float = 0.0, date: Optional[str] = None) -> Any:
    if date:
        rows = get_alerts_by_date(date)
    else:
        rows = get_alerts(limit=limit, min_confidence=min_confidence)
    return {"alerts": rows}


@router.post("/", response_model=AlertCreateResponse)
async def create_alert(payload: AlertCreateRequest) -> Any:
    alert = payload.dict()
    alert_id = save_alert(alert)
    return {"alert_id": alert_id}


@router.delete("/{alert_id}")
async def remove_alert(alert_id: int):
    ok = delete_alert(alert_id)
    if not ok:
        raise HTTPException(404, "Alert not found")
    return {"ok": True}


@router.get("/count")
async def count_alerts() -> Any:
    return {"count": get_alert_count()}
