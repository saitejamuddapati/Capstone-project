@echo off
echo ========================================================
echo Starting Explainable AI Autoimmune CDSS (Single Demo Mode)
echo Serving complete application on: http://localhost:8000
echo ========================================================

:: Build frontend bundle once
echo Building frontend production assets...
cd frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Frontend build failed!
    exit /b %ERRORLEVEL%
)

:: Run unified FastAPI server
cd ..\backend
echo Starting production server on http://localhost:8000...
.venv\Scripts\activate && uvicorn app.main:app --port 8000
