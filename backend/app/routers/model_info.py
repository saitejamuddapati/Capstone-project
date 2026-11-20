import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config import settings
from app.model_service import model_service
from app.schemas import HealthResponse, ModelInfoResponse

router = APIRouter(tags=["Model Info"])

@router.get("/health", response_model=HealthResponse)
def health():
    """Health check endpoint exposing model version and key runtime parameters."""
    bundle = model_service.model_bundle
    return {
        "status": "ok",
        "model_version": bundle.get("version", "v4"),
        "model": bundle.get("model_name", "Range-aware Bayes model"),
        "classes": bundle.get("classes", []),
        "confidence_threshold": float(bundle.get("confidence_threshold", 0.6666)),
        "min_measured_tests": int(bundle.get("min_measured_tests", 3)),
        "sensitivity_strength": float(bundle.get("sensitivity_lambda", 0.55)),
    }

@router.get("/model-info", response_model=ModelInfoResponse)
def model_info():
    """Complete metadata for input forms, feature descriptions, units, ranges, and classes."""
    return model_service.get_model_info()

@router.get("/samples")
def samples():
    """Retrieve the 14 sample patients with their true diagnoses from the dataset."""
    return model_service.get_samples()

@router.get("/profiles")
def profiles():
    """Retrieve typical disease profiles and lab ranges from the training set."""
    return model_service.get_profiles()

@router.get("/figures/{name:path}")
def get_figure(name: str):
    """
    Safely serve research figure PNGs from the figures directory.
    Rejects directory traversal and disallows the 4 legacy figures that contain 'v2' in legends.
    """
    # Sanitize and validate against whitelist
    base_name = os.path.basename(name)
    if base_name != name or base_name not in settings.ALLOWED_FIGURES:
        raise HTTPException(status_code=404, detail="Figure not found or prohibited")

    figure_path = settings.ARTIFACTS_DIR / "figures" / base_name
    if not figure_path.exists():
        raise HTTPException(status_code=404, detail="Figure file does not exist")

    return FileResponse(figure_path, media_type="image/png")

@router.get("/flowcharts/{name}")
def get_flowchart(name: str):
    """Safely serve workflow flowchart PNGs if present in docs/flowcharts/."""
    base_name = os.path.basename(name)
    if base_name != name:
        raise HTTPException(status_code=404, detail="Invalid flowchart name")

    flowcharts_dir = settings.BASE_DIR / "docs" / "flowcharts"
    flowchart_path = flowcharts_dir / base_name
    
    if not flowcharts_dir.exists() or not flowchart_path.exists():
        raise HTTPException(status_code=404, detail="Flowchart not found")

    return FileResponse(flowchart_path, media_type="image/png")
