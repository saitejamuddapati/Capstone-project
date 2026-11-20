# Walkthrough: Explainable AI for Early Differential Diagnosis of Rheumatic and Autoimmune Diseases

## 1. Project Overview

We built and verified the complete full-stack clinical decision-support web application for the Capstone Project: **"Explainable AI for Early Differential Diagnosis of Rheumatic and Autoimmune Diseases"**.

The application wraps a calibrated **Range-aware Bayes machine learning model** (T = 1.069, test accuracy 86.10%, ROC-AUC 0.989, ECE 0.015) trained on 12,085 patients from Harvard Dataverse.

```
                    ┌───────────────────────────────────────────────┐
                    │               Patient Data                    │
                    │   (Age, Sex, 6 Routine Labs, 6 Antibodies)    │
                    └───────────────────────┬───────────────────────┘
                                            │
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │         Range-Aware Bayes Formulation         │
                    │   • Native missing test handling (no impute)  │
                    │   • Disease-specific reference bin edges      │
                    │   • Calibrated temperature scaling (T=1.069)  │
                    └───────┬───────────────┬───────────────┬───────┘
                            │               │               │
                            ▼               ▼               ▼
                 ┌────────────────┐ ┌───────────────┐ ┌────────────────┐
                 │ Differential   │ │ Exact         │ │ Next-Best-Test │
                 │ Probabilities  │ │ Likelihood    │ │ Recommendation │
                 │ (7 Conditions) │ │ Ratios        │ │ (Info Gain)    │
                 └────────────────┘ └───────────────┘ └────────────────┘
```

---

## 2. What Was Built

### 2.1 Backend Architecture (`backend/`)
- **FastAPI with Pydantic v2**: High-performance, strictly typed REST API.
- **Model Integrity Protection**: Automated SHA-256 hash checks on startup against all 4 core model bundle and inference files.
- **Dynamic Model Service**: Loads `project_artifacts_v4/artifacts/inference.py` dynamically; strictly adheres to mathematical routines without retraining.
- **Strict Clinical Validation**:
  - Enforces ≥3 measured tests out of the 12 clinical markers across `/api/analyze`, `/api/predict`, `/api/explain`, and `/api/recommend`.
  - Rejects invalid `mode` ("default" | "sensitive") with HTTP 422.
  - Validates `compare_with` disease names against the 7 target classes with HTTP 422.
  - Rejects unknown attributes with `extra="forbid"`.
  - Parses unreadable inputs into clinical `warnings` without failing requests.
- **In-Memory Batch Evaluation**: Processes up to 2,000 patient rows with per-row error handling and JSON or downloadable CSV outputs (`?format=csv`).
- **Research Metrics & Sanitzation**: Strips all legacy version tags (`v\d`) from model names and serves research figures with strict path-traversal prevention.

### 2.2 Frontend Architecture (`frontend/`)
- **React 18, Vite & TypeScript**: Built with strict typing (`noUnusedLocals`, `strict: true`) and zero TypeScript compiler warnings.
- **Clinical Design System**:
  - Primary Teal (`#0f766e` / `#14b8a6`) for Bayes actions.
  - Green (`#15803d` / `#22c55e`) for confident answers (≥66.7%).
  - Amber (`#b45309` / `#f59e0b`) for clinical review triggers.
  - Slate (`#475569` / `#94a3b8`) for unmeasured tests / neutral states.
  - Red (`#b91c1c` / `#ef4444`) for errors and input range warnings.
  - Both Light and Dark theme modes with smooth CSS variable transitions.
  - Responsive design from 360 px to 1440 px+ with dedicated mobile navigation.
  - Print stylesheet for clean, one-page clinical consultation reports.
- **Diagnose Page (`/`)**:
  - Grouped cards: Patient Demographics (with note), Inflammatory Markers, RA Antibodies, Complement System, and Serological Antibodies with 3-way segmented toggles (Positive / Negative / Not tested).
  - Live test counter: *"X of 12 tests entered – at least 3 needed"*.
  - 14 verified demo patient cases dropdown with true benchmark match indicator.
  - Rare-disease sensitivity mode toggle with comparative suggestion display.
  - Calibrated horizontal probability bar chart with 66.7% safe threshold marker.
  - Exact Likelihood Ratios diverging horizontal bar chart with interactive "Compare with" selector.
  - Next-Best-Test information-gain recommendations with hypothetical simulation helper.
  - Local browser session history (`sessionStorage`) with one-click restore and clear.
- **Model Performance Page (`/performance`)**:
  - 6 KPI tiles (Accuracy 86.10%, Macro-F1 0.860, Balanced Acc 84.6%, ROC-AUC 0.989, Top-2 98.9%, ECE 0.015).
  - Interactive per-disease evaluation table with color-coded performance tiers.
  - Interactive model comparison bar chart with 86.18% dataset ceiling line.
  - Repeated splits table and paired statistical tests (Bayes wins 9 of 10 splits).
  - Safe mode gating table (thresholds for 90%, 95%, 97% targets).
  - Robustness stress test table (clean, 5% lab error, 10% lab error, shifts, missingness).
  - Published literature protocol comparison highlighting the data leakage audit.
  - Figure gallery with high-resolution lightbox modal and tabbed SHAP beeswarms.
- **Batch Evaluation Page (`/batch`)**:
  - Drag-and-drop CSV upload with downloadable standard template.
  - In-memory processing with disease distribution breakdown charts.
  - Paginated, filterable patient results table with downloadable results CSV.
- **How It Works (`/how-it-works`) & About (`/about`)**:
  - 7-step pipeline narrative, 5 core architectural rationales, Sample 3 walkthrough, limitations disclosure, team roles, and VIT-AP university credits.

---

## 3. Automated Test Verification Results

### 3.1 Backend Tests (`backend/tests/`)
All **15 pytest unit and integration tests passed** successfully:

```
collected 15 items

backend/tests/test_batch.py::test_batch_prediction_with_bad_row PASSED   [  6%]
backend/tests/test_batch.py::test_batch_csv_export PASSED                [ 13%]
backend/tests/test_hashes.py::test_file_hashes PASSED                    [ 20%]
backend/tests/test_metrics.py::test_metrics_no_version_tags PASSED       [ 26%]
backend/tests/test_metrics.py::test_figure_access_and_path_traversal_blocked PASSED [ 33%]
backend/tests/test_reference_outputs.py::test_sample_3_reference_outputs PASSED [ 40%]
backend/tests/test_reference_outputs.py::test_14_sample_patients_accuracy PASSED [ 46%]
backend/tests/test_reference_outputs.py::test_sample_7_sensitivity_mode PASSED [ 53%]
backend/tests/test_validation.py::test_insufficient_data_empty_patient PASSED [ 60%]
backend/tests/test_validation.py::test_insufficient_data_two_tests PASSED [ 66%]
backend/tests/test_validation.py::test_invalid_mode_returns_422 PASSED   [ 73%]
backend/tests/test_validation.py::test_invalid_compare_with_returns_422 PASSED [ 80%]
backend/tests/test_validation.py::test_compare_with_same_as_explained_returns_422 PASSED [ 86%]
backend/tests/test_validation.py::test_unknown_field_returns_422 PASSED  [ 93%]
backend/tests/test_validation.py::test_unreadable_values_produce_warnings_not_500 PASSED [100%]

======================= 15 passed in 1.48s ========================
```

### 3.2 Frontend Tests (`frontend/src/test/`)
All **9 Vitest unit tests passed** and `npm run lint` (`tsc --noEmit`) compiled with zero errors:

```
 ✓ src/test/formatters.test.ts (9 tests)
   • formatProbability: extreme high (>99.9%), extreme low (<0.1%), never 100% or 0%
   • countMeasuredTests: clinical test counting, demographic exclusion, blank ignoring
   • generateCSVTemplate: 14 headers and example rows

Test Files  1 passed (1)
     Tests  9 passed (9)
```

---

## 4. Visual Verification & Browser Screenshots

The application was verified in an automated browser subagent across all required diagnostic conditions:

### 4.1 Sample 1 – Confident Diagnosis (Ankylosing Spondylitis)
![Sample 1 Confident Result](file:///C:/Users/tejbo/.gemini/antigravity-ide/brain/164e22df-b25d-42bc-a658-4043c5cb3275/sample_1_ankylosing_spondylitis_1792228207283.png)
- **Top Diagnosis**: Ankylosing Spondylitis (`AS`).
- **Confidence**: `> 99.9%`.
- **Status Banner**: Confident Differential Suggestion (Green).

### 4.2 Sample 3 – Needs Clinical Review & Recommendations
![Sample 3 Review & Next Best Test](file:///C:/Users/tejbo/.gemini/antigravity-ide/brain/164e22df-b25d-42bc-a658-4043c5cb3275/sample_3_loaded_1792227921258.png)
- **Top Diagnosis**: Normal (51.0%), Runner-up: Sjögren's Syndrome (49.0%).
- **Status Banner**: Needs Clinical Review – Confidence Below 66.7% (Amber).
- **Exact Evidence**: Anti-CCP (2.1×) & RF (2.0×) push toward Normal; ANA & Anti-Ro push toward Sjögren's.
- **Next-Best-Test**: Recommends Anti-La (26% chance of confident answer, expected confidence 74%).

### 4.3 Sample 7 – Rare-Disease Sensitivity Mode Switch
![Sample 7 Sensitivity Mode](file:///C:/Users/tejbo/.gemini/antigravity-ide/brain/164e22df-b25d-42bc-a658-4043c5cb3275/sample_7_rare_disease_mode_1792228599906.png)
- **Default Mode**: Predicts Ankylosing Spondylitis.
- **Sensitive Mode**: Re-weights toward rare conditions, switching the prediction to **Reactive Arthritis**.
- **Display**: Explicitly displays both *"Sensitive-mode suggestion: Reactive Arthritis"* and *"Most probable calibrated disease: Ankylosing Spondylitis (41.4%)"*.

### 4.4 Dark Mode Theme
![Dark Mode View](file:///C:/Users/tejbo/.gemini/antigravity-ide/brain/164e22df-b25d-42bc-a658-4043c5cb3275/dark_mode_final_1792228796510.png)
- Complete dark palette with high-contrast borders and clinical badges.

### 4.5 Mobile Responsive Viewport (390 px)
![Mobile Viewport 390px](file:///C:/Users/tejbo/.gemini/antigravity-ide/brain/164e22df-b25d-42bc-a658-4043c5cb3275/mobile_view_390x844_1792228833451.png)
- Clean vertical stacking with horizontal scroll navigation and zero layout overflow.

### 4.6 Model Performance Page
![Model Performance Dashboard](file:///C:/Users/tejbo/.gemini/antigravity-ide/brain/164e22df-b25d-42bc-a658-4043c5cb3275/model_performance_page_1792228905935.png)
- Real numbers from `results.json` and paper CSVs: 86.10% test accuracy, 86.18% ceiling line, clean sanitized model labels without version tags.

### 4.7 Batch Cohort Evaluation
![Batch Evaluation Screen](file:///C:/Users/tejbo/.gemini/antigravity-ide/brain/164e22df-b25d-42bc-a658-4043c5cb3275/batch_page_1792227976687.png)
- CSV upload, template download, and memory-only processing guarantee.

---

## 5. How to Run the Application

### 5.1 One-Command Unified Demo (Production Port 8000)
```cmd
start_demo.bat
```
*(On macOS/Linux: `./start_demo.sh`)*

Open: **[http://localhost:8000](http://localhost:8000)**

### 5.2 Development Mode (Hot-Reload)
```cmd
start_dev.bat
```
*(On macOS/Linux: `./start_dev.sh`)*
- Backend API & Swagger: **[http://localhost:8000/docs](http://localhost:8000/docs)**
- Frontend Dev Server: **[http://localhost:5173](http://localhost:5173)**

### 5.3 Running the Tests
```bash
# Backend pytest suite (15 tests)
cd backend
pytest -v tests/

# Frontend Vitest suite (9 tests) & linter
cd frontend
npm run lint
npm test
```
