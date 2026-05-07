# Cyberwatch Hub - System Startup Script
# This script starts the backend, frontend, and opens the browser

Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "   CYBERWATCH HUB - SYSTEM STARTUP"      -ForegroundColor Green
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "Starting Backend on port 8000..."         -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command cd 'D:\lov\cyberwatch-hub\backend'; .\venv\Scripts\python.exe main.py"
Start-Sleep -Seconds 5

# Start Frontend
Write-Host "Starting Frontend on port 8080..."        -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command cd 'D:\lov\cyberwatch-hub'; npm run dev"
Start-Sleep -Seconds 5

# Open Browser
Write-Host "Opening Browser..."                       -ForegroundColor Green
Start-Process "http://localhost:8080"

Write-Host ""
Write-Host "========================================"  -ForegroundColor Green
Write-Host "SYSTEM STARTED SUCCESSFULLY!"             -ForegroundColor Green
Write-Host "========================================"  -ForegroundColor Green
Write-Host ""
Write-Host "Dashboard:  http://localhost:8080"        -ForegroundColor Cyan
Write-Host "API:        http://localhost:8000"        -ForegroundColor Cyan
Write-Host "Health:     http://localhost:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press CTRL+C in any terminal to stop"     -ForegroundColor Yellow
Write-Host ""
