import hashlib
import importlib.util
import json
import logging
import os
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import pandas as pd
from fastapi import HTTPException

from app.config import settings
from app.explanation_service import generate_explanations

logger = logging.getLogger(__name__)

class ModelService:
    def __init__(self):
        self.artifacts_dir: Path = settings.ARTIFACTS_DIR
        self.inference_module = None
        self.model_bundle = None
        self.sample_patients: List[Dict[str, Any]] = []
        self.class_profiles: Dict[str, Any] = {}
        self._initialized = False

    def verify_hashes(self) -> None:
        """Verify the SHA-256 integrity hashes of core model artifacts."""
        for rel_path, expected_hash in settings.VERIFIED_HASHES.items():
            full_path = self.artifacts_dir / rel_path
            if not full_path.exists():
                raise RuntimeError(f"Artifact not found: {full_path}")
            
            with open(full_path, "rb") as f:
                computed_hash = hashlib.sha256(f.read()).hexdigest()
                
            if computed_hash != expected_hash:
                raise RuntimeError(
                    f"Integrity check failed for {rel_path}!\n"
                    f"Expected: {expected_hash}\n"
                    f"Computed: {computed_hash}"
                )
        logger.info("All model artifact SHA-256 hashes verified successfully.")

    def initialize(self) -> None:
        """Load and verify inference module, model bundle, and reference JSON files."""
        if self._initialized:
            return

        self.verify_hashes()

        # Load inference.py dynamically
        inference_path = self.artifacts_dir / "artifacts" / "inference.py"
        spec = importlib.util.spec_from_file_location("artifacts.inference", inference_path)
        if spec is None or spec.loader is None:
            raise RuntimeError(f"Could not load inference module from {inference_path}")
        
        module = importlib.util.module_from_spec(spec)
        sys.modules["artifacts.inference"] = module
        spec.loader.exec_module(module)
        self.inference_module = module

        # Load model bundle
        bundle_path = self.artifacts_dir / "artifacts" / "model_bundle.pkl"
        self.model_bundle = self.inference_module.load(str(bundle_path))

        # Load sample patients
        samples_path = self.artifacts_dir / "artifacts" / "sample_patients.json"
        with open(samples_path, "r", encoding="utf-8") as f:
            self.sample_patients = json.load(f)

        # Load class profiles
        profiles_path = self.artifacts_dir / "artifacts" / "class_profiles.json"
        with open(profiles_path, "r", encoding="utf-8") as f:
            self.class_profiles = json.load(f)

        self._initialized = True
        logger.info("ModelService initialized successfully with Range-aware Bayes model.")

    def _ensure_initialized(self) -> None:
        """Ensure the model and artifacts are loaded (self-healing for serverless cold starts)."""
        if not self._initialized:
            self.initialize()

    def check_min_tests(self, patient_dict: Dict[str, Any]) -> Tuple[int, List[str], List[str]]:
        """Count measured clinical tests and list missing tests and issues."""
        self._ensure_initialized()
        raw_df = self.inference_module._frame([patient_dict])
        X, issues = self.inference_module.encode_raw(raw_df, return_issues=True)
        tests = self.inference_module.TESTS
        miss = [c for c in tests if pd.isna(X.iloc[0][c])]
        measured = len(tests) - len(miss)
        warn = issues[0] + self.inference_module._range_warnings(self.model_bundle, X.iloc[0])
        return measured, miss, warn

    def predict(self, patient_dict: Dict[str, Any], mode: str = "default") -> Dict[str, Any]:
        """Run prediction with status and optional recommended tests."""
        self._ensure_initialized()
        if mode not in ("default", "sensitive"):
            raise HTTPException(status_code=422, detail="mode must be 'default' or 'sensitive'")
        
        preds = self.inference_module.predict(patient_dict, mode=mode)
        res = preds[0]
        
        # When in sensitive mode, determine if the suggested disease differs from calibrated most probable
        if res.get("status") != "insufficient_data" and res.get("probabilities"):
            probs = res["probabilities"]
            most_probable = max(probs.items(), key=lambda kv: kv[1])[0]
            res["most_probable_disease"] = most_probable
        
        return res

    def explain(
        self,
        patient_dict: Dict[str, Any],
        top_k: int = 12,
        compare_with: Optional[str] = None,
        target_class: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate exact likelihood ratio explanation comparing target disease with runner-up/comparison."""
        measured, miss, warn = self.check_min_tests(patient_dict)
        min_tests = self.model_bundle.get("min_measured_tests", 3)
        if measured < min_tests:
            return {
                "status": "insufficient_data",
                "message": f"Only {measured} of {len(self.inference_module.TESTS)} tests were measured; at least {min_tests} are needed.",
                "missing_tests": miss,
                "n_missing_tests": len(miss),
                "warnings": warn,
                "recommended_tests": []
            }

        classes = self.model_bundle["classes"]
        
        # Get prediction to know default explained class
        pred = self.predict(patient_dict, mode="default")
        default_class = pred["predicted_disease"]
        runner_up = pred["runner_up"]

        actual_target = target_class if target_class else default_class
        if actual_target not in classes:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid target_class '{actual_target}'. Must be one of: {classes}"
            )

        # Validate compare_with
        if compare_with is not None:
            if compare_with not in classes:
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid compare_with '{compare_with}'. Must be one of: {classes}"
                )
            if compare_with == actual_target:
                raise HTTPException(
                    status_code=422,
                    detail=f"compare_with cannot be the same as the explained disease ({actual_target})."
                )
            target_compare = compare_with
        else:
            target_compare = runner_up if actual_target != runner_up else [c for c in classes if c != actual_target][0]

        raw_exp = self.inference_module.explain(
            patient_dict,
            top_k=top_k,
            target_class=actual_target,
            compare_with=target_compare
        )
        return generate_explanations(
            raw_exp,
            patient_dict,
            pred,
            model_bundle=self.model_bundle,
            inference_module=self.inference_module
        )

    def recommend(self, patient_dict: Dict[str, Any], top: int = 3) -> Any:
        """Recommend ranked list of missing tests."""
        measured, miss, warn = self.check_min_tests(patient_dict)
        min_tests = self.model_bundle.get("min_measured_tests", 3)
        if measured < min_tests:
            return {
                "status": "insufficient_data",
                "message": f"Only {measured} of {len(self.inference_module.TESTS)} tests were measured; at least {min_tests} are needed.",
                "missing_tests": miss,
                "n_missing_tests": len(miss),
                "warnings": warn,
                "recommended_tests": []
            }

        recs = self.inference_module.recommend(patient_dict, top=top)
        return recs

    def analyze(
        self,
        patient_dict: Dict[str, Any],
        mode: str = "default",
        compare_with: Optional[str] = None,
        target_class: Optional[str] = None
    ) -> Dict[str, Any]:
        """Comprehensive endpoint: prediction, exact explanation, and next-best-test recommendations."""
        if mode not in ("default", "sensitive"):
            raise HTTPException(status_code=422, detail="mode must be 'default' or 'sensitive'")

        pred = self.predict(patient_dict, mode=mode)
        
        if pred["status"] == "insufficient_data":
            return {
                "prediction": pred,
                "explanation": None,
                "recommendations": []
            }

        # Generate enriched explanation
        exp = self.explain(
            patient_dict=patient_dict,
            top_k=12,
            compare_with=compare_with,
            target_class=target_class
        )

        recs = pred.get("recommended_tests", [])
        return {
            "prediction": pred,
            "explanation": exp,
            "recommendations": recs
        }

    def get_model_info(self) -> Dict[str, Any]:
        """Return model metadata, input definitions, ranges and descriptions."""
        self._ensure_initialized()
        inputs = [
            # Demographic
            {
                "name": "Age",
                "label": "Age",
                "group": "Patient",
                "type": "demographic",
                "unit": "years",
                "training_range": [20.0, 80.0],
                "description": "Patient age in years (recorded, does not change the Bayes prediction)."
            },
            {
                "name": "Gender",
                "label": "Sex",
                "group": "Patient",
                "type": "demographic",
                "unit": None,
                "training_range": None,
                "description": "Biological sex (recorded, does not change the Bayes prediction)."
            },
            # Inflammation
            {
                "name": "ESR",
                "label": "ESR",
                "group": "Inflammation",
                "type": "lab",
                "unit": "mm/h",
                "training_range": [0.0, 49.0],
                "description": "Erythrocyte sedimentation rate."
            },
            {
                "name": "CRP",
                "label": "CRP",
                "group": "Inflammation",
                "type": "lab",
                "unit": "mg/L",
                "training_range": [0.1, 30.0],
                "description": "C-reactive protein acute-phase reactant."
            },
            # RA antibodies
            {
                "name": "RF",
                "label": "RF",
                "group": "RA antibodies",
                "type": "lab",
                "unit": "IU/mL",
                "training_range": [0.0, 40.0],
                "description": "Rheumatoid Factor."
            },
            {
                "name": "Anti-CCP",
                "label": "Anti-CCP",
                "group": "RA antibodies",
                "type": "lab",
                "unit": "U/mL",
                "training_range": [0.0, 40.0],
                "description": "Anti-cyclic citrullinated peptide antibody."
            },
            # Complement
            {
                "name": "C3",
                "label": "C3",
                "group": "Complement",
                "type": "lab",
                "unit": "mg/dL",
                "training_range": [50.0, 205.0],
                "description": "Complement component 3."
            },
            {
                "name": "C4",
                "label": "C4",
                "group": "Complement",
                "type": "lab",
                "unit": "mg/dL",
                "training_range": [5.0, 74.0],
                "description": "Complement component 4."
            },
            # Serology / Antibody tests
            {
                "name": "HLA-B27",
                "label": "HLA-B27",
                "group": "Antibody tests",
                "type": "antibody",
                "unit": None,
                "training_range": None,
                "description": "Human leukocyte antigen B27 (spondyloarthritis marker)."
            },
            {
                "name": "ANA",
                "label": "ANA",
                "group": "Antibody tests",
                "type": "antibody",
                "unit": None,
                "training_range": None,
                "description": "Antinuclear antibody screening."
            },
            {
                "name": "Anti-Ro",
                "label": "Anti-Ro (SSA)",
                "group": "Antibody tests",
                "type": "antibody",
                "unit": None,
                "training_range": None,
                "description": "Anti-Ro / SSA antibody."
            },
            {
                "name": "Anti-La",
                "label": "Anti-La (SSB)",
                "group": "Antibody tests",
                "type": "antibody",
                "unit": None,
                "training_range": None,
                "description": "Anti-La / SSB antibody."
            },
            {
                "name": "Anti-dsDNA",
                "label": "Anti-dsDNA",
                "group": "Antibody tests",
                "type": "antibody",
                "unit": None,
                "training_range": None,
                "description": "Anti-double stranded DNA antibody (SLE specific)."
            },
            {
                "name": "Anti-Sm",
                "label": "Anti-Sm",
                "group": "Antibody tests",
                "type": "antibody",
                "unit": None,
                "training_range": None,
                "description": "Anti-Smith antibody (SLE specific)."
            },
        ]
        
        short_names = ["AS", "Normal", "PsA", "ReA", "RA", "Sjogren", "SLE"]

        return {
            "model_name": self.model_bundle.get("model_name", "Range-aware Bayes model"),
            "classes": self.model_bundle["classes"],
            "short_names": short_names,
            "confidence_threshold": float(self.model_bundle.get("confidence_threshold", 0.6666)),
            "min_measured_tests": int(self.model_bundle.get("min_measured_tests", 3)),
            "sensitivity_lambda": float(self.model_bundle.get("sensitivity_lambda", 0.55)),
            "inputs": inputs,
            "mode_descriptions": {
                "default": "Calibrated standard mode (86.10% test accuracy, 0.015 ECE). Best overall diagnostic performance.",
                "sensitive": "Rare-disease sensitivity mode. Boosts recall for rare conditions like Reactive Arthritis from 66% to 86% at the cost of ~1.2 points of overall accuracy."
            }
        }

    def get_samples(self) -> List[Dict[str, Any]]:
        """Return the 14 sample patients with true_disease."""
        self._ensure_initialized()
        return self.sample_patients

    def get_profiles(self) -> Dict[str, Any]:
        """Return class typical profiles."""
        self._ensure_initialized()
        return self.class_profiles

model_service = ModelService()
