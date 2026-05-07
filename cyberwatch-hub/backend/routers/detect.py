"""Detection endpoints: live RTSP, upload video, webcam image, model status."""
from __future__ import annotations

import base64
import io
import logging
from typing import Any, Dict, List

import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi import Request

from models.schemas import (
    RTSPDetectionRequest,
    LiveDetectionResponse,
    UploadDetectionResponse,
    WebcamDetectionRequest,
    DetectionResult,
)
from services.yolo_service import detect_frame, process_video_file
from services.alerts_service import save_alert
from datetime import datetime

logger = logging.getLogger("routers.detect")
router = APIRouter()


def _notify_alert_sync(alert_data: Dict[str, Any]) -> None:
    """Synchronously send notification for an alert if confidence >= 85%."""
    confidence = alert_data.get("confidence", 0.0)
    # Convert to 0-1 scale if provided as percentage (0-100)
    if confidence > 1.0:
        confidence = confidence / 100.0
    
    CONFIDENCE_THRESHOLD = 0.85
    
    logger.info(f"[NOTIFY CHECK] Confidence: {confidence:.2%}, Threshold: {CONFIDENCE_THRESHOLD:.0%}")
    
    if confidence < CONFIDENCE_THRESHOLD:
        logger.info(f"[NOTIFY SKIPPED] Alert confidence {confidence:.2%} below threshold {CONFIDENCE_THRESHOLD:.0%}")
        return
    
    logger.info(f"[NOTIFY TRIGGERED] Confidence {confidence:.2%} >= threshold {CONFIDENCE_THRESHOLD:.0%}")
    
    try:
        from services.notifications import send_sms, send_email
        from services.settings_service import load_settings
        
        settings = load_settings()
        logger.info(f"[NOTIFY SETTINGS] SMS enabled: {settings.get('notify_sms')}, Email enabled: {settings.get('notify_email')}")
        logger.info(f"[NOTIFY RECIPIENTS] SMS: {settings.get('sms_recipients')}, Email: {settings.get('email_recipients')}")
        
        # Send SMS if enabled
        if settings.get("notify_sms"):
            sms_recipients = settings.get("sms_recipients") or []
            if sms_recipients:
                logger.info(f"[SMS] Sending to {len(sms_recipients)} recipients")
                for recipient in sms_recipients:
                    msg = f"ALERT: Violence detected with {confidence*100:.1f}% confidence at {alert_data.get('timestamp', 'unknown time')}"
                    try:
                        result = send_sms(recipient, msg, settings)
                        logger.info(f"[SMS SUCCESS] to {recipient}: {result}")
                    except Exception as e:
                        logger.warning(f"[SMS FAILED] to {recipient}: {e}")
            else:
                logger.warning("[SMS] No recipients configured")
        
        # Send email if enabled
        if settings.get("notify_email"):
            email_recipients = settings.get("email_recipients") or []
            if email_recipients:
                logger.info(f"[EMAIL] Sending to {len(email_recipients)} recipients")
                for recipient in email_recipients:
                    subject = f"Violence Detection Alert ({confidence*100:.1f}%)"
                    body = f"""
Violence has been detected with {confidence*100:.1f}% confidence.

Details:
- Timestamp: {alert_data.get('timestamp', 'unknown')}
- Camera: {alert_data.get('camera', 'unknown')}
- Label: {alert_data.get('label', 'violence')}
- Confidence: {confidence*100:.1f}%

Please review immediately.
"""
                    try:
                        result = send_email(recipient, subject, body, settings)
                        logger.info(f"[EMAIL SUCCESS] to {recipient}: {result}")
                    except Exception as e:
                        logger.warning(f"[EMAIL FAILED] to {recipient}: {e}")
            else:
                logger.warning("[EMAIL] No recipients configured")
    except Exception as e:
        logger.exception(f"[NOTIFY ERROR] Error triggering notifications: {e}")


@router.post("/live", response_model=LiveDetectionResponse)
async def detect_live(req: RTSPDetectionRequest, request: Request) -> Any:
    """Detect violence in a single frame from RTSP stream."""
    model = getattr(request.app.state, "model", None)
    if model is None:
        raise HTTPException(503, "Model not loaded")
    
    # Connect to RTSP and capture a single frame
    try:
        cap = cv2.VideoCapture(req.rtsp_url)
        if not cap.isOpened():
            logger.error(f"Cannot open RTSP stream: {req.rtsp_url}")
            raise HTTPException(400, f"Cannot open RTSP stream: {req.rtsp_url}")
        
        ret, frame = cap.read()
        cap.release()
        
        if not ret or frame is None:
            logger.error(f"Failed to read frame from RTSP: {req.rtsp_url}")
            raise HTTPException(400, f"Failed to read frame from RTSP stream")
        
        if frame.size == 0:
            logger.error("Received empty frame from RTSP")
            raise HTTPException(400, "Received empty frame from RTSP stream")
    except cv2.error as exc:
        logger.exception(f"OpenCV error reading RTSP stream: {exc}")
        raise HTTPException(400, f"Error reading RTSP stream: {str(exc)}")
    except Exception as exc:
        logger.exception(f"Unexpected error with RTSP stream: {exc}")
        raise HTTPException(400, f"Error connecting to RTSP stream: {str(exc)}")
    
    try:
        res = detect_frame(model, frame, conf_thresh=0.5)
    except Exception as exc:
        logger.exception(f"Detection error: {exc}")
        raise HTTPException(500, f"Detection failed: {str(exc)}")
    
    # If violence detected, save as alert with frame snapshot
    if res.get("violence"):
        try:
            ok, buf = cv2.imencode('.jpg', frame)
            img_base64 = None
            if ok:
                jpg_bytes = buf.tobytes()
                img_base64 = base64.b64encode(jpg_bytes).decode('utf-8')
            
            alert_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "camera": "rtsp",
                "confidence": res.get("confidence", 0.0),
                "label": res.get("label", "violence"),
                "image_base64": img_base64,
                "rtsp_url": req.rtsp_url,
            }
            alert_id = save_alert(alert_data)
            logger.info(f"Saved alert {alert_id} from live RTSP detection with confidence {res.get('confidence')}")
            
            # Trigger notifications if confidence >= 85%
            _notify_alert_sync(alert_data)
        except Exception as exc:
            logger.exception("Failed to save alert from live detection: %s", exc)
    
    return {"result": res, "timestamp": datetime.utcnow().isoformat()}


@router.post("/upload", response_model=UploadDetectionResponse)
async def detect_upload(file: UploadFile = File(...), request: Request = None) -> Any:
    """Detect violence in uploaded video file."""
    # Validate video format
    valid_extensions = ('.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm')
    valid_mimetypes = (
        'video/mp4', 'video/x-msvideo', 'video/quicktime', 
        'video/x-matroska', 'video/x-flv', 'video/x-ms-wmv', 'video/webm'
    )
    
    filename_lower = (file.filename or '').lower()
    is_valid_ext = any(filename_lower.endswith(ext) for ext in valid_extensions)
    is_valid_mime = (file.content_type or '').lower() in valid_mimetypes
    
    if not (is_valid_ext or is_valid_mime):
        logger.warning(f"Unsupported file format: {file.filename} (mime: {file.content_type})")
        raise HTTPException(400, f"Unsupported video format. Supported: {', '.join(valid_extensions)}")
    
    model = getattr(request.app.state, "model", None)
    if model is None:
        raise HTTPException(503, "Model not loaded")

    try:
        contents = await file.read()
        if not contents:
            logger.error("Received empty file")
            raise HTTPException(400, "Uploaded file is empty")
        
        # Create temp directory and save file
        import os
        os.makedirs("temp", exist_ok=True)
        tmp_path = f"temp/{file.filename}"
        
        with open(tmp_path, "wb") as fh:
            fh.write(contents)
        
        logger.info(f"Processing video file: {file.filename}")
        detections = process_video_file(model, tmp_path, fps=1)
        
        # Save each detection as an alert to the database
        for det in detections:
            alert_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "camera": file.filename,
                "confidence": det.get("confidence", 0.0),
                "label": det.get("label", "violence"),
                "image_base64": det.get("image_base64"),
                "rtsp_url": None,
            }
            alert_id = save_alert(alert_data)
            logger.info(f"Saved alert {alert_id} from detection with confidence {det.get('confidence')}")
            
            # Trigger notifications if confidence >= 85%
            _notify_alert_sync(alert_data)
        
        # Clean up temp file
        try:
            os.remove(tmp_path)
        except Exception as e:
            logger.warning(f"Failed to delete temp file {tmp_path}: {e}")
        
        return {"events": detections, "processed_frames": len(detections)}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Error processing uploaded video: {exc}")
        raise HTTPException(500, f"Error processing video: {str(exc)}")


@router.post("/webcam", response_model=DetectionResult)
async def detect_webcam(payload: WebcamDetectionRequest, request: Request) -> Any:
    """Detect violence in webcam image."""
    model = getattr(request.app.state, "model", None)
    if model is None:
        raise HTTPException(503, "Model not loaded")
    
    try:
        if not payload.image_base64:
            logger.error("Received empty base64 image")
            raise HTTPException(400, "No image data provided")
        
        # Decode base64 image
        try:
            b = base64.b64decode(payload.image_base64)
            nparr = np.frombuffer(b, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None or img.size == 0:
                logger.error("Failed to decode image from base64")
                raise HTTPException(400, "Invalid or corrupted image data")
        except Exception as dec_exc:
            logger.exception(f"Base64 decode error: {dec_exc}")
            raise HTTPException(400, f"Invalid base64 image: {str(dec_exc)}")
        
        # Run detection
        res = detect_frame(model, img, conf_thresh=0.5)
        
        # If violence detected, save as alert
        if res.get("violence"):
            alert_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "camera": "webcam",
                "confidence": res.get("confidence", 0.0),
                "label": res.get("label", "violence"),
                "image_base64": payload.image_base64,
                "rtsp_url": None,
            }
            try:
                alert_id = save_alert(alert_data)
                logger.info(f"Saved alert {alert_id} from webcam detection with confidence {res.get('confidence')}")
                
                # Trigger notifications if confidence >= 85%
                _notify_alert_sync(alert_data)
            except Exception as save_exc:
                logger.exception(f"Failed to save alert: {save_exc}")
        
        return res
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Webcam detection error: {exc}")
        raise HTTPException(500, f"Detection failed: {str(exc)}")


@router.get("/model-status")
async def model_status(request: Request) -> Dict[str, Any]:
    model = getattr(request.app.state, "model", None)
    return {"status": "loaded" if model is not None else "not_loaded", "device": getattr(request.app.state, "device", "cpu"), "model_path": getattr(request.app.state, "model_path", None)}
