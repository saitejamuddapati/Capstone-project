#!/usr/bin/env bash
set -e

echo "========================================================"
echo "Starting Explainable AI Autoimmune CDSS (Single Demo Mode)"
echo "Serving complete application on: http://localhost:8000"
echo "========================================================"

# Build frontend production bundle
echo "Building frontend production assets..."
(
    cd frontend
    npm run build
)

# Start unified FastAPI server
echo "Starting production server on http://localhost:8000..."
cd backend
source .venv/bin/activate
uvicorn app.main:app --port 8000
