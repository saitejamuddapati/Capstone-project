import os
from pathlib import Path
from typing import List, Dict, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Explainable AI for Rheumatic and Autoimmune Diseases"
    API_V1_STR: str = "/api"
    
    # Base workspace directory
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    
    # Path to artifacts folder (auto-detects project_artifacts_v4 or project_artifacts)
    ARTIFACTS_DIR: Optional[Path] = None
    
    # Allowed CORS origins
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    # Verified SHA-256 hashes of core model artifacts
    VERIFIED_HASHES: Dict[str, str] = {
        "artifacts/model_bundle.pkl": "17da4d3ee2cb4760fd8bb0d55b30ebd14a7af3d33a7f31fb74e8415b60005a53",
        "artifacts/inference.py": "03c5f9fb2e7a3edbde831ecdaff17777a43cd73451bab81b5b7fd0aa143b14ae",
        "artifacts/class_profiles.json": "b441e6fd51297914310596ffd1c19cc35edcf89815c8538983bbe18ab57bead8",
        "artifacts/sample_patients.json": "7473782b589d8f0be9e5538c7b4bfb496971377c4d1a53e1b6ccb6de9fed8db1",
    }
    
    # Allowed figures to prevent directory traversal
    ALLOWED_FIGURES: List[str] = [
        "accuracy_by_missing_tests.png",
        "calibration_curve.png",
        "confidence_gated_accuracy.png",
        "confusion_matrix.png",
        "head_to_head.png",
        "per_class_f1.png",
        "roc_curves.png",
        "sensitivity_mode_tradeoff.png",
        "shap_beeswarm_AS.png",
        "shap_beeswarm_RA.png",
        "shap_beeswarm_ReA.png",
        "shap_beeswarm_SLE.png",
        "shap_global_importance.png",
        "subgroup_accuracy.png",
    ]

    def model_post_init(self, __context):
        if self.ARTIFACTS_DIR is None:
            # Check for candidate artifact directories across local and Vercel services deployment paths
            candidates = [
                self.BASE_DIR / "project_artifacts_v4",
                Path(__file__).resolve().parent.parent / "project_artifacts_v4",
                Path(__file__).resolve().parent.parent.parent / "project_artifacts_v4",
                Path.cwd() / "project_artifacts_v4",
                Path.cwd() / "backend" / "project_artifacts_v4",
                self.BASE_DIR / "project_artifacts",
            ]
            for c in candidates:
                if c.exists() and (c / "artifacts" / "model_bundle.pkl").exists():
                    self.ARTIFACTS_DIR = c
                    break
            if self.ARTIFACTS_DIR is None:
                self.ARTIFACTS_DIR = self.BASE_DIR / "project_artifacts_v4"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
