# Explainable AI for Early Differential Diagnosis of Rheumatic and Autoimmune Diseases

A clinical decision-support system (CDSS) built around a temperature-calibrated **Range-aware Bayes machine learning model** (T = 1.069). Evaluated on 1,813 frozen test patients from Harvard Dataverse (12,085 total patients), achieving **86.10% accuracy** (95% CI 84.4–87.6%), ROC-AUC 0.989, and Expected Calibration Error (ECE) of 0.015.

---

## Academic Context & Team Credits

- **Capstone Project**: Explainable AI for Early Differential Diagnosis of Rheumatic and Autoimmune Diseases
- **Department**: Department of Computer Science and Engineering, School of Computer Science and Engineering (SCOPE), VIT-AP University
- **Academic Year**: 2026–2027
- **Project Team**:
  - **M. Sai Teja** – Machine Learning Engineer
  - **V. Jahnavi Sai** – Data Engineer
  - **B. Varsha Sree** – XAI & Evaluation Lead
  - **G. Jaswa Preethi** – Backend & Dashboard Developer
- **Faculty Guide**: Dr. Sandipan Maiti, Assistant Professor, Department of Computer Science and Engineering, VIT-AP University

---

## Key Features

1. **Range-Aware Bayes Formulation**: Native handling of unmeasured tests without data imputation; histogram bins aligned to disease reference boundaries.
2. **Safe Mode Decision Gating**: At confidence threshold 0.667, the system answers 75.6% of patients at **96.6% accuracy**.
3. **Exact Likelihood Ratio Explanations**: Exact multiplicative evidence factors (log likelihood ratios) for every measured test comparing the predicted condition against any differential candidate.
4. **Next-Best-Test Recommendation**: Ranks unmeasured laboratory/antibody tests by information gain and the probability of reaching a confident diagnosis.
5. **Rare-Disease Sensitivity Mode**: Optional re-weighting prioritizing rare conditions (boosting Reactive Arthritis recall from 66% to 86%).
6. **Zero-Persistence Privacy**: Patient data is never stored on the server; session history is maintained locally in the browser (`sessionStorage`).

---

## Prerequisites

- **Python 3.12** (`py -3.12` on Windows, `python3.12` on macOS/Linux). Pinned C-extension wheels (`numpy==2.0.2`, `scipy==1.16.3`, `scikit-learn==1.6.1`) require Python 3.12.
- **Node.js 20+** and `npm`.

---

## Quick Start: One-Command Demo

To build the frontend and serve everything from a single FastAPI server on `http://localhost:8000`:

### Windows
```cmd
start_demo.bat
```

### macOS / Linux
```bash
chmod +x start_demo.sh
./start_demo.sh
```

Then open your browser at: **[http://localhost:8000](http://localhost:8000)**

---

## Development Setup

To run the backend with hot-reload and the frontend Vite development server concurrently:

### Option A: Using Start Scripts
- **Windows**: `start_dev.bat`
- **macOS / Linux**: `./start_dev.sh`

### Option B: Manual Setup

#### 1. Backend (:8000)
```bash
cd backend
py -3.12 -m venv .venv          # macOS/Linux: python3.12 -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Swagger API docs will be at: [http://localhost:8000/docs](http://localhost:8000/docs)

#### 2. Frontend (:5173)
```bash
cd frontend
npm install
npm run dev
```
Web application will be at: [http://localhost:5173](http://localhost:5173)

---

## Running the Automated Test Suites

### Backend Tests (pytest)
```bash
cd backend
pytest -v tests/
```
Validates:
- SHA-256 integrity hashes of core model bundle and inference scripts
- Exact reference outputs for Sample 3 (tolerance < 1e-4)
- 11 of 14 benchmark sample patients correctly predicted
- 3-test minimum enforcement on all diagnostic endpoints
- Strict schema validation (422 errors on invalid inputs or unknown keys)
- Figure access whitelist and path traversal prevention
- Sanitized model display labels without version tags

### Frontend Tests (Vitest & TypeScript)
```bash
cd frontend
npm run lint    # Verifies zero TypeScript errors (tsc --noEmit)
npm test        # Runs Vitest unit tests for formatting, counting, and templates
```

---

## Troubleshooting

- **`numpy` fails to install**:
  Verify your Python runtime is 3.12:
  ```bash
  py -3.12 --version
  ```
  Python 3.13 and 3.14 do not have pre-built wheels for `numpy==2.0.2`.
- **Port 8000 or 5173 already in use**:
  Free the port or specify another port using `--port <PORT>`.
- **Backend not reachable from UI**:
  Ensure the backend is running on `http://localhost:8000`. The top navbar displays a green status badge when the backend is connected.
- **PowerShell script execution policy error on Windows**:
  Run npm using `npm.cmd` or launch from command prompt `cmd`.

---

## Clinical Disclaimer

> **Decision support for research and education only.** A model prediction, confidence percentage, or recommendation is not a medical diagnosis. A qualified clinician must make the final clinical decision. Missing tests are never imputed.
