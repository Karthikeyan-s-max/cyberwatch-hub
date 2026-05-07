# Cyberwatch Hub - Automated Violence Detection System (AVDS)

## Overview

Cyberwatch Hub is an advanced Automated Violence Detection System (AVDS) designed to monitor video feeds and automatically detect violent activities in real-time. By leveraging state-of-the-art computer vision models and an intuitive web dashboard, Cyberwatch Hub provides rapid alerts and comprehensive reporting for enhanced security monitoring.

## Key Features

- **Real-Time Detection:** Analyze live webcam feeds, video uploads, and RTSP streams for violent behavior.
- **Advanced AI Model:** Powered by custom-trained YOLOv8 models optimized for accurate and fast violence detection.
- **Instant Alerts:** Automated notifications sent via Twilio (SMS) and SMTP (Email) to security personnel when violence is detected.
- **Comprehensive Reporting:** Generate downloadable PDF reports detailing incidents, confidence scores, and timestamps.
- **Modern Dashboard:** A responsive, sleek web interface built with React, Vite, Tailwind CSS, and shadcn/ui.
- **Robust Backend:** Fast and scalable backend powered by FastAPI and Python.

## Technologies Used

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query (TanStack)
- React Router

### Backend
- Python 3.10+
- FastAPI
- YOLOv8 (Ultralytics)
- OpenCV
- Twilio API
- SQLite (for alert logging)
- Uvicorn

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone <YOUR_GIT_URL>
   cd cyberwatch-hub
   ```

2. **Frontend Setup:**
   ```bash
   # Install dependencies
   npm install

   # Start the development server
   npm run dev
   ```

3. **Backend Setup:**
   ```bash
   cd backend

   # Create a virtual environment
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   # source venv/bin/activate

   # Install Python dependencies
   pip install -r requirements.txt

   # Configure environment variables
   cp .env.example .env
   # Edit .env to add your Twilio credentials, SMTP details, etc.

   # Start the FastAPI server
   python main.py
   ```

## Usage

1. Open the frontend dashboard (usually `http://localhost:8080`).
2. Navigate to the **Detection** tab to upload a video or connect a webcam.
3. Configure notification preferences in the **Settings** tab.
4. Review past incidents and download PDF summaries in the **Reports** tab.

## Security & Privacy
- **Do not commit `.env` files** containing sensitive API keys or passwords.
- Large model weight files (`*.pt`) are ignored via `.gitignore`. You will need to download or train the model weights separately and place them in the `backend/` directory to run inference.

## License

This project is licensed under the MIT License.
