# Start Backend
Write-Host "Starting Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command cd 'D:\lov\cyberwatch-hub\backend'; .\venv\Scripts\python.exe main.py"
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command cd 'D:\lov\cyberwatch-hub'; npm run dev"
Start-Sleep -Seconds 3

# Open Browser
Write-Host "Opening Browser..." -ForegroundColor Green
Start-Process "http://localhost:8080"

Write-Host ""
Write-Host "✅ System Started!" -ForegroundColor Green
Write-Host "📊 Dashboard: http://localhost:8080" -ForegroundColor Cyan
Write-Host "🔌 API: http://localhost:8000" -ForegroundColor Cyan
