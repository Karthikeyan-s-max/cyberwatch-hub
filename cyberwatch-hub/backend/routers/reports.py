"""Generate PDF reports and summaries."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Response

from services.alerts_service import get_alerts, get_alerts_by_date
from services.pdf_generator import generate_report_pdf

router = APIRouter()


@router.get("/pdf")
async def get_pdf(min_confidence: float = 0.0, date_from: Optional[str] = None, date_to: Optional[str] = None) -> Any:
    # For simplicity, ignore date range parsing complexity and filter by date_from prefix if provided
    if date_from:
        alerts = get_alerts_by_date(date_from)
    else:
        alerts = get_alerts(limit=1000, min_confidence=min_confidence)

    pdf_bytes = generate_report_pdf(alerts)
    return Response(content=pdf_bytes, media_type="application/pdf")


@router.get("/summary")
async def get_summary(min_confidence: float = 0.0) -> Dict[str, Any]:
    alerts = get_alerts(limit=1000, min_confidence=min_confidence)
    total = len(alerts)
    critical = sum(1 for a in alerts if a.get("confidence", 0) >= 0.9)
    high = sum(1 for a in alerts if 0.75 <= a.get("confidence", 0) < 0.9)
    medium = sum(1 for a in alerts if 0.6 <= a.get("confidence", 0) < 0.75)
    low = total - (critical + high + medium)
    return {"total": total, "critical": critical, "high": high, "medium": medium, "low": low}
