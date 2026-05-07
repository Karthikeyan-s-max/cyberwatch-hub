"""
main.py

Entry point for the Violence Detection Backend (Phase 4).

Run with `python main.py` from the `backend/` directory.
"""
from __future__ import annotations

import asyncio
import os
from typing import Any, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from utils.config import get_config
from services.logger import setup_logger
from services.alerts_service import init_db
from services.yolo_service import load_yolo_model

# Routers
from routers.detect import router as detect_router
from routers.alerts import router as alerts_router
from routers.settings import router as settings_router
from routers.notifications import router as notifications_router
from routers.reports import router as reports_router

config = get_config()
logger = setup_logger("violence_detection_backend")

app = FastAPI(
    title="Violence Detection API",
    version="1.0.0",
    description="Backend API for real-time violence detection (YOLOv8 + notifications + reports)",
    redirect_slashes=False,  # Disable automatic trailing slash redirect to avoid 307 issues
)

# Read CORS origins from environment or config. Prefer an explicit origin
# when credentials are enabled because '*' is not allowed with credentials.
cors_env = os.getenv('CORS_ORIGINS')
if cors_env:
    origins = [o.strip() for o in cors_env.split(',') if o.strip()]
else:
    origins = getattr(config, 'CORS_ORIGINS', None) or ["http://localhost:8080"]

logger.debug(f"CORS origins configured: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event() -> None:
    logger.info("Starting Violence Detection API...")

    try:
        init_db()
        logger.info("Alerts database initialized.")
    except Exception as exc:
        logger.exception("Failed to initialize database: %s", exc)
        raise

    model_path = getattr(config, "YOLO_MODEL_PATH", None) or os.getenv("YOLO_MODEL_PATH", "yolo last update.pt")
    device_pref = getattr(config, "DEVICE", "auto")

    async def _load_model() -> None:
        try:
            logger.info("Loading YOLO model from %s (device=%s)...", model_path, device_pref)
            loop = asyncio.get_event_loop()
            model, device = await loop.run_in_executor(None, load_yolo_model, model_path, device_pref)
            app.state.model = model
            app.state.device = device
            app.state.model_path = model_path
            logger.info("YOLO model loaded on device: %s", device)
        except Exception as exc:
            app.state.model = None
            app.state.device = "cpu"
            app.state.model_path = model_path
            logger.exception("Failed to load YOLO model: %s", exc)

    await _load_model()


@app.on_event("shutdown")
async def shutdown_event() -> None:
    logger.info("Shutting down Violence Detection API...")
    try:
        model = getattr(app.state, "model", None)
        if model is not None:
            close_fn = getattr(model, "close", None)
            if callable(close_fn):
                try:
                    close_fn()
                    logger.debug("YOLO model closed gracefully.")
                except Exception:
                    logger.debug("YOLO model close() failed; continuing shutdown.")
    except Exception:
        logger.exception("Error during shutdown cleanup.")


# Register routers
app.include_router(detect_router, prefix="/detect", tags=["detect"])
app.include_router(alerts_router, prefix="/alerts", tags=["alerts"])
app.include_router(settings_router, prefix="/settings", tags=["settings"])
app.include_router(notifications_router, prefix="/notify", tags=["notifications"])
app.include_router(reports_router, prefix="/reports", tags=["reports"])


@app.get("/", summary="Root")
async def root() -> Dict[str, Any]:
    model_loaded = getattr(app.state, "model", None) is not None
    return {
        "service": "Violence Detection API",
        "version": "1.0.0",
        "model_loaded": model_loaded,
        "model_path": getattr(app.state, "model_path", None),
        "device": getattr(app.state, "device", "unknown"),
    }


@app.get("/health", summary="Health check")
async def health() -> Dict[str, Any]:
    model_loaded = getattr(app.state, "model", None) is not None
    status = "ok" if model_loaded else "degraded"
    return {
        "status": status,
        "model_loaded": model_loaded,
        "device": getattr(app.state, "device", "cpu"),
        "model_path": getattr(app.state, "model_path", None),
    }


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug_env = os.getenv("DEBUG", "false").lower() in ("1", "true", "yes")
    workers = int(os.getenv("UVICORN_WORKERS", "1"))

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug_env,
        workers=workers,
        log_level="info",
    )
