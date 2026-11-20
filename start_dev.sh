#!/usr/bin/env bash
set -e

echo "========================================================"
echo "Starting Explainable AI Autoimmune CDSS (Development Mode)"
echo "Backend API:  http://localhost:8000"
echo "Frontend Dev: http://localhost:5173"
echo "========================================================"

cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start backend
(
    cd backend
    source .venv/bin/activate
    uvicorn app.main:app --reload --port 8000
) &

# Start frontend
(
    cd frontend
    npm run dev
) &

wait
