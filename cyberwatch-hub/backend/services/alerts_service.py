"""SQLite-backed alerts service."""
from __future__ import annotations

import os
import sqlite3
from typing import Dict, List, Optional
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "alerts.db")
DB_PATH = os.path.abspath(DB_PATH)
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def _get_conn():
    return sqlite3.connect(DB_PATH, check_same_thread=False)


def init_db() -> None:
    conn = _get_conn()
    c = conn.cursor()
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            camera TEXT,
            confidence REAL,
            label TEXT,
            image_base64 TEXT,
            rtsp_url TEXT,
            created_at TEXT
        )
        """
    )
    conn.commit()
    conn.close()


def save_alert(alert_data: Dict) -> int:
    conn = _get_conn()
    c = conn.cursor()
    created_at = datetime.utcnow().isoformat()
    c.execute(
        "INSERT INTO alerts (timestamp, camera, confidence, label, image_base64, rtsp_url, created_at) VALUES (?,?,?,?,?,?,?)",
        (
            alert_data.get("timestamp"),
            alert_data.get("camera"),
            alert_data.get("confidence"),
            alert_data.get("label"),
            alert_data.get("image_base64"),
            alert_data.get("rtsp_url"),
            created_at,
        ),
    )
    alert_id = c.lastrowid
    conn.commit()
    conn.close()
    return alert_id


def get_alerts(limit: int = 100, min_confidence: float = 0.0) -> List[Dict]:
    conn = _get_conn()
    c = conn.cursor()
    c.execute(
        "SELECT id, timestamp, camera, confidence, label, image_base64, rtsp_url, created_at FROM alerts WHERE confidence >= ? ORDER BY id DESC LIMIT ?",
        (min_confidence, limit),
    )
    rows = c.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "timestamp": r[1],
            "camera": r[2],
            "confidence": r[3],
            "label": r[4],
            "image_base64": r[5],
            "rtsp_url": r[6],
            "created_at": r[7],
        }
        for r in rows
    ]


def get_alerts_by_date(date_str: str) -> List[Dict]:
    conn = _get_conn()
    c = conn.cursor()
    like_pattern = f"{date_str}%"
    c.execute(
        "SELECT id, timestamp, camera, confidence, label, image_base64, rtsp_url, created_at FROM alerts WHERE timestamp LIKE ? ORDER BY id DESC",
        (like_pattern,),
    )
    rows = c.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "timestamp": r[1],
            "camera": r[2],
            "confidence": r[3],
            "label": r[4],
            "image_base64": r[5],
            "rtsp_url": r[6],
            "created_at": r[7],
        }
        for r in rows
    ]


def delete_alert(alert_id: int) -> bool:
    conn = _get_conn()
    c = conn.cursor()
    c.execute("DELETE FROM alerts WHERE id = ?", (alert_id,))
    changed = c.rowcount
    conn.commit()
    conn.close()
    return changed > 0


def clear_all_alerts() -> None:
    conn = _get_conn()
    c = conn.cursor()
    c.execute("DELETE FROM alerts")
    conn.commit()
    conn.close()


def get_alert_count() -> int:
    conn = _get_conn()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM alerts")
    count = c.fetchone()[0]
    conn.close()
    return int(count)
