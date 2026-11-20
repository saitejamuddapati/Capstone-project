# Backend: Explainable AI Rheumatic & Autoimmune Disease CDSS

FastAPI backend wrapping a calibrated Range-aware Bayes machine learning model (trained on 12,085 Harvard Dataverse patients, T=1.069, test accuracy 86.10%, ROC-AUC 0.989, ECE 0.015).

## Setup & Running

Prerequisite: Python 3.12 (exact pinned wheel support for numpy 2.0.2, scipy 1.16.3, scikit-learn 1.6.1).

```bash
# 1. Create virtual environment
py -3.12 -m venv .venv          # On macOS/Linux: python3.12 -m venv .venv

# 2. Activate virtual environment
.venv\Scripts\activate          # On macOS/Linux: source .venv/bin/activate

# 3. Install pinned dependencies
pip install -r requirements.txt

# 4. Start backend server
uvicorn app.main:app --reload --port 8000
```

API documentation is interactively available at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Testing

Run all verification and integrity tests:
```bash
pytest -v tests/
```

Tests verify:
- SHA-256 integrity hashes of core model bundle and inference code
- Exact reference predictions, recommendations, and likelihood ratio explanations (tolerance < 1e-4)
- 11 of 14 demo patient accuracy
- Strict input validation, 3-test minimum enforcement, and 422 error handlers
- Safe batch processing with per-row fault isolation
- Prohibited version tag cleaning on metrics
- Static and figure access security
