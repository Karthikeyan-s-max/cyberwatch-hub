# Violence Detection Backend (Phase 4)

Backend API using FastAPI, YOLOv8, Twilio SMS, SMTP email, and PDF reports.

Quick start
1. Create a virtualenv and install dependencies:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and fill credentials.

3. Start the app:

```powershell
python main.py
```

API overview
- `GET /` - basic info
- `GET /health` - health check
- `/detect` - detection endpoints (live/upload/webcam)
- `/alerts` - manage alerts
- `/settings` - read/update settings
- `/notify` - send/test notifications
- `/reports` - PDF generation and summaries

Configuration
- Use `.env` to configure YOLO model, device, Twilio, SMTP, and CORS origins.

Security
- Do not commit `.env` or secrets to source control.
- Run behind a reverse proxy in production and use TLS.
