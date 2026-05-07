# Start backend server script
Push-Location $PSScriptRoot
Write-Host "Starting backend server at $PSScriptRoot..."
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --log-level info
