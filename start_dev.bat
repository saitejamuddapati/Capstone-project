@echo off
echo ========================================================
echo Starting Explainable AI Autoimmune CDSS (Development Mode)
echo Backend API:  http://localhost:8000
echo Frontend Dev: http://localhost:5173
echo ========================================================

:: Start backend in a separate terminal window
start "RheumaAI Backend (:8000)" cmd /k "cd backend && .venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

:: Start frontend dev server
cd frontend
npm run dev
