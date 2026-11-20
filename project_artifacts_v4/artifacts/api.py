
# Run:  pip install -r requirements.txt
#       uvicorn api:app --reload --port 8000
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import inference
app = FastAPI(title="Autoimmune Diagnosis CDSS")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
@app.get("/health")
def health():
    b = inference.load()
    return {"status": "ok", "model_version": b.get("version"), "model": b.get("model_name"), "classes": b["classes"],
            "confidence_threshold": b.get("confidence_threshold"), "min_measured_tests": b.get("min_measured_tests"),
            "sensitivity_strength": b.get("sensitivity_lambda")}
@app.post("/predict")
def predict(patient: dict, mode: str = "default"): return inference.predict(patient, mode=mode)[0]
@app.post("/explain")
def explain(patient: dict, top_k: int = 8, compare_with: str = None): return inference.explain(patient, top_k=top_k, compare_with=compare_with)
@app.post("/recommend")
def recommend(patient: dict, top: int = 3): return inference.recommend(patient, top=top)
@app.get("/profiles")
def profiles():
    import json, os
    return json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "class_profiles.json"), encoding="utf-8"))
