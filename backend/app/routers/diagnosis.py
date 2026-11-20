from typing import Optional
from fastapi import APIRouter, Query, HTTPException

from app.model_service import model_service
from app.schemas import PatientInput, AnalyzeRequest, AnalysisResponse, PredictionResult

router = APIRouter(tags=["Diagnosis"])

@router.post("/analyze", response_model=AnalysisResponse)
def analyze(request: AnalyzeRequest):
    """
    Main diagnostic endpoint: returns calibrated prediction, exact likelihood ratio explanation,
    and missing test recommendations in a single call.
    """
    patient_dict = request.patient.to_original_dict()
    return model_service.analyze(
        patient_dict=patient_dict,
        mode=request.mode,
        compare_with=request.compare_with,
        target_class=request.target_class
    )

@router.post("/predict")
def predict(
    patient: PatientInput,
    mode: str = Query(default="default", description="'default' or 'sensitive'")
):
    """Predict endpoint (compatible with reference api.py, with strict validation)."""
    if mode not in ("default", "sensitive"):
        raise HTTPException(status_code=422, detail="mode must be 'default' or 'sensitive'")
    patient_dict = patient.to_original_dict()
    return model_service.predict(patient_dict=patient_dict, mode=mode)

@router.post("/explain")
def explain(
    patient: PatientInput,
    top_k: int = Query(default=12, ge=1, le=14),
    compare_with: Optional[str] = Query(default=None),
    target_class: Optional[str] = Query(default=None)
):
    """Exact likelihood ratio explanation endpoint."""
    patient_dict = patient.to_original_dict()
    return model_service.explain(
        patient_dict=patient_dict,
        top_k=top_k,
        compare_with=compare_with,
        target_class=target_class
    )

@router.post("/recommend")
def recommend(
    patient: PatientInput,
    top: int = Query(default=3, ge=1, le=12)
):
    """Ranked missing test recommendations endpoint."""
    patient_dict = patient.to_original_dict()
    return model_service.recommend(patient_dict=patient_dict, top=top)
