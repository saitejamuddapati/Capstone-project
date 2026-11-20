from fastapi import APIRouter
from app.metrics_service import metrics_service

router = APIRouter(tags=["Metrics"])

@router.get("/metrics")
def get_metrics():
    """
    Returns aggregated research metrics, per-class evaluations, interactive comparison data,
    safe mode calibration tables, and robustness metrics with clean display labels.
    """
    return metrics_service.get_metrics()
