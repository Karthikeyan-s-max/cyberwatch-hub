"""YOLO service: model loading and inference helpers."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np
import torch
from ultralytics import YOLO
import base64
import timm
from torchvision import transforms
from PIL import Image

logger = logging.getLogger("yolo_service")


def _detect_device(pref: str = "auto") -> str:
    if pref and pref.lower() in ("cpu", "cuda"):
        return pref.lower()
    if pref.lower() == "auto":
        return "cuda" if torch.cuda.is_available() else "cpu"
    return "cpu"

# Global ViT verification variables
VIT_VERIFIER = None
VIT_TRANSFORMS = None

def _init_vit_verifier(vit_path: str = r"D:\lov\90percent_model.pth"):
    """Initialize the global ViT model for verification."""
    global VIT_VERIFIER, VIT_TRANSFORMS
    if VIT_VERIFIER is not None:
        return
    try:
        logger.info(f"Initializing ViT verification model from {vit_path}...")
        state_dict = torch.load(vit_path, map_location='cpu')
        model = timm.create_model('vit_base_patch16_224', pretrained=False, num_classes=2)
        model.load_state_dict(state_dict, strict=False)
        model.eval()
        
        # Standard ImageNet/ViT transforms
        VIT_TRANSFORMS = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        VIT_VERIFIER = model
        logger.info("ViT verification model loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load ViT verification model: {e}")
        VIT_VERIFIER = False  # Mark as failed to avoid retrying


def load_yolo_model(model_path: str, device_pref: str = "auto") -> Tuple[Any, str]:
    """Load a YOLOv8 model using ultralytics.YOLO.

    Supports both .pt (PyTorch) and .pkl (pickle) model files.
    Includes fallback to YOLOv8m for compatibility issues.
    Returns (model, device)
    """
    import os
    
    device = _detect_device(device_pref)
    device_arg = "cuda:0" if device == "cuda" else "cpu"
    
    # Check if model path exists and log accordingly
    if not os.path.exists(model_path):
        logger.warning("Model file not found at %s, attempting to load anyway", model_path)
    
    logger.info("Loading YOLO model from %s on %s", model_path, device_arg)
    
    # Handle both .pt and .pkl model formats
    if model_path.endswith('.pkl'):
        import pickle
        try:
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
            logger.info("Loaded pickle model: %s", model_path)
        except Exception as exc:
            logger.error("Failed to load pickle model %s: %s", model_path, exc)
            raise
    else:
        # Standard YOLO .pt model loading with fallback for compatibility
        try:
            model = YOLO(model_path)
            logger.info("Successfully loaded YOLO model: %s", model_path)
        except Exception as exc:
            # Catch ALL errors (ModuleNotFoundError, AttributeError like DFLoss, etc)
            logger.warning("Failed to load model %s. Error: %s. Falling back to yolov8n...", model_path, exc)
            try:
                # Fallback to the standard lightweight yolov8n model which is guaranteed to work
                logger.info("Loading yolov8n.pt as fallback model...")
                model = YOLO('yolov8n.pt')
                logger.info("Successfully loaded yolov8n.pt fallback model")
            except Exception as fallback_exc:
                logger.error("Failed to load fallback yolov8n model: %s", fallback_exc)
                raise RuntimeError(f"Could not load model {model_path} or fallback yolov8n: {fallback_exc}")
    
    try:
        model.to(device_arg)
    except Exception:
        # Some ultralytics versions handle device via predict; ignore if not supported
        logger.debug("Model.to(device) not available; continuing")
    
    return model, device


def detect_frame(model: Any, frame: np.ndarray, conf_thresh: float = 0.5) -> Dict[str, Any]:
    """Run inference on a single frame (numpy BGR image).

    Returns a dict: {violence: bool, confidence: float, bbox: [x1,y1,x2,y2], label: str}
    """
    try:
        results = model.predict(source=frame, conf=conf_thresh, verbose=False)
        # results is a list-like; take first
        if not results:
            return {"violence": False, "confidence": 0.0, "bbox": None, "label": None}
        r = results[0]
        boxes = getattr(r, "boxes", None)
        if boxes is None or len(boxes) == 0:
            return {"violence": False, "confidence": 0.0, "bbox": None, "label": None}
        # pick highest confidence
        best = boxes.data.cpu().numpy().max(axis=0) if hasattr(boxes, "data") else None
        # Fallback parse: iterate boxes
        best_box = None
        best_conf = 0.0
        best_label = None
        try:
            for b in boxes:
                conf = float(getattr(b, "conf", 0.0))
                cls = int(getattr(b, "cls", 0))
                xyxy = getattr(b, "xyxy", None)
                if xyxy is None:
                    xyxy = getattr(b, "xyxyn", None)
                if conf > best_conf:
                    best_conf = conf
                    best_label = str(cls)
                    if xyxy is not None:
                        try:
                            # Handle different tensor shapes safely
                            if hasattr(xyxy, "tolist"):
                                xyxy_list = xyxy.tolist()
                                if len(xyxy_list) > 0 and isinstance(xyxy_list[0], list):
                                    xyxy_list = xyxy_list[0]
                                best_box = [int(x) for x in xyxy_list]
                            else:
                                best_box = [int(x) for x in xyxy]
                        except Exception as e:
                            logger.error(f"Failed to extract bbox: {e}")
                            pass
        except Exception:
            # Best-effort fallback
            pass

        violence = best_conf >= conf_thresh
        
        # --- ViT VERIFICATION LAYER ---
        if violence:
            try:
                # Initialize ViT lazily
                if VIT_VERIFIER is None:
                    _init_vit_verifier()
                
                # If ViT loaded successfully, verify the overall frame
                if VIT_VERIFIER:
                    # Convert cv2 (BGR) to PIL (RGB)
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    pil_img = Image.fromarray(rgb_frame)
                    
                    # Preprocess and forward pass
                    input_tensor = VIT_TRANSFORMS(pil_img).unsqueeze(0)
                    with torch.no_grad():
                        output = VIT_VERIFIER(input_tensor)
                        probs = torch.nn.functional.softmax(output[0], dim=0)
                        prob_0 = float(probs[0])
                        prob_1 = float(probs[1])
                        
                    logger.debug(f"ViT Probs - Class0 (Safe): {prob_0:.2f}, Class1 (Violence): {prob_1:.2f}")
                    
                    # Assume Class 1 is Violence. If Class 0 is higher, or Class 1 is weak, reject it.
                    is_violence_vit = prob_1 > prob_0
                    
                    if not is_violence_vit or prob_1 < 0.50:
                        logger.info(f"ViT OVERRIDE: Rejected YOLO person detection. (C0/Safe: {prob_0:.2f}, C1/Viol: {prob_1:.2f})")
                        violence = False
                        best_box = None
                        best_label = None
                    else:
                        logger.info(f"ViT CONFIRMED: Violence detected with confidence {prob_1:.2f}")
            except Exception as vit_exc:
                logger.error(f"ViT verification failed: {vit_exc}")
                # If ViT crashes for some reason, don't show a false positive.
                violence = False
                best_box = None
                best_label = None
        # ------------------------------

        return {"violence": violence, "confidence": float(best_conf), "bbox": best_box, "label": best_label}
    except Exception as exc:
        logger.exception("Error running detection: %s", exc)
        return {"violence": False, "confidence": 0.0, "bbox": None, "label": None}


def process_video_file(model: Any, video_path: str, fps: int = 1, conf_thresh: float = 0.5) -> List[Dict[str, Any]]:
    """Process a video file, sampling `fps` frames per second and returning detections with timestamps."""
    cap = cv2.VideoCapture(video_path)
    detections = []
    if not cap.isOpened():
        raise RuntimeError("Cannot open video file: %s" % video_path)

    video_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    step = max(int(video_fps // max(1, fps)), 1)
    frame_index = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_index % step == 0:
            res = detect_frame(model, frame, conf_thresh=conf_thresh)
            if res.get("violence"):
                timestamp = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
                res["timestamp"] = float(timestamp)
                # create a small JPEG snapshot for the alert (base64 string)
                try:
                    ok, buf = cv2.imencode('.jpg', frame)
                    if ok:
                        jpg_bytes = buf.tobytes()
                        b64 = base64.b64encode(jpg_bytes).decode('utf-8')
                        res["image_base64"] = b64
                    else:
                        res["image_base64"] = None
                except Exception:
                    res["image_base64"] = None
                detections.append(res)
        frame_index += 1

    cap.release()
    return detections
