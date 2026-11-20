import csv
import json
import re
from pathlib import Path
from typing import Dict, Any, List

from app.config import settings

def clean_model_name(name: str) -> str:
    """Apply the required display-name mapping and strip version tags (v2, v3, v4, etc.)."""
    if not name or not isinstance(name, str):
        return ""
    
    trimmed = name.strip()
    
    # Specific mappings
    if trimmed == "v2 stacking ensemble (RF+LGB+XGB+CatBoost)":
        return "Tree stacking ensemble"
    if trimmed == "PROPOSED: Range-aware Bayes model":
        return "Range-aware Bayes model (final)"
    if trimmed == "Range-aware Bayes model":
        return "Range-aware Bayes model (final)"
    if trimmed == "OURS: Range-aware Bayes (no imputation)":
        return "Range-aware Bayes (ours, no imputation)"
    if trimmed == "LightGBM + median imputation (previous approach)":
        return "LightGBM + median imputation"
    if trimmed == "Logistic Regression (baseline)":
        return "Logistic regression"
    if trimmed == "XGBoost (single model, reference)":
        return "XGBoost"

    # Generic cleaning: strip leading "PROPOSED: "
    if trimmed.startswith("PROPOSED: "):
        trimmed = trimmed[10:].strip()
    if trimmed.startswith("OURS: "):
        trimmed = trimmed[6:].strip()

    # Strip any leading "v<digit> "
    trimmed = re.sub(r"^v\d+\s+", "", trimmed)
    # Strip any standalone "v<digit>" word
    trimmed = re.sub(r"\bv\d+\b", "", trimmed).strip()
    # Replace multiple spaces
    trimmed = re.sub(r"\s+", " ", trimmed)
    
    return trimmed

class MetricsService:
    def __init__(self):
        self.artifacts_dir: Path = settings.ARTIFACTS_DIR
        self._cached_metrics: Dict[str, Any] = {}

    def _load_csv_as_dicts(self, rel_path: str) -> List[Dict[str, Any]]:
        full_path = self.artifacts_dir / rel_path
        if not full_path.exists():
            return []
        rows = []
        with open(full_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                cleaned_row = {}
                for k, v in r.items():
                    key = k.strip() if k else "model"
                    if key == "":
                        key = "model"
                    val = v.strip() if v else ""
                    # Convert floats if applicable
                    try:
                        val = float(val)
                    except ValueError:
                        pass
                    cleaned_row[key] = val
                rows.append(cleaned_row)
        return rows

    def get_metrics(self) -> Dict[str, Any]:
        """Aggregate and clean all performance metrics from results.json and paper CSVs."""
        if self._cached_metrics:
            return self._cached_metrics

        paper_dir = self.artifacts_dir / "paper_results"
        results_json_path = paper_dir / "results.json"
        
        with open(results_json_path, "r", encoding="utf-8") as f:
            raw_results = json.load(f)

        # 1. Headline KPIs
        main_stats = raw_results.get("main", {})
        ci_stats = raw_results.get("ci", {})
        
        headline = {
            "accuracy": main_stats.get("accuracy", 0.86100386),
            "macro_f1": main_stats.get("macro_f1", 0.860381),
            "weighted_f1": main_stats.get("weighted_f1", 0.858136),
            "balanced_accuracy": main_stats.get("balanced_accuracy", 0.845946),
            "roc_auc": main_stats.get("auc_ovr", 0.989109),
            "top2_accuracy": main_stats.get("top2_accuracy", 0.988969),
            "ece": main_stats.get("ece", 0.01523),
            "log_loss": main_stats.get("log_loss", 0.251736),
            "brier": main_stats.get("brier", 0.169274),
            "confidence_interval": {
                "accuracy": ci_stats.get("accuracy", [0.8445, 0.8759]),
                "macro_f1": ci_stats.get("macro_f1", [0.8417, 0.8775]),
                "balanced_accuracy": ci_stats.get("balanced_accuracy", [0.8260, 0.8656]),
                "roc_auc": ci_stats.get("auc_ovr", [0.9873, 0.9909]),
                "top2_accuracy": ci_stats.get("top2_accuracy", [0.9840, 0.9934]),
            },
            "safe_mode": {
                "coverage": 0.7557,
                "accuracy": 0.9657,
                "threshold": 0.6666
            },
            "repeated_splits": {
                "mean": 0.8576,
                "std": 0.0066,
                "ceiling": 0.8618,
                "ceiling_pct_reached": 99.5
            }
        }

        # 2. Per-class metrics
        per_class_raw = self._load_csv_as_dicts("paper_results/per_class_metrics.csv")
        per_class_metrics = []
        for r in per_class_raw:
            per_class_metrics.append({
                "disease": r.get("disease"),
                "precision": float(r.get("precision", 0)),
                "recall": float(r.get("recall", 0)),
                "f1": float(r.get("f1", 0)),
                "support": int(r.get("support", 0)),
                "auc": float(r.get("auc", 0)),
                "specificity": float(r.get("specificity", 0)),
            })

        # 3. Model comparison + McNemar significance
        mcnemar_raw = self._load_csv_as_dicts("paper_results/significance_mcnemar.csv")
        mcnemar_map = {}
        for m in mcnemar_raw:
            clean_name = clean_model_name(str(m.get("compared_with", "")))
            mcnemar_map[clean_name] = m

        comparison_raw = self._load_csv_as_dicts("paper_results/model_comparison.csv")
        model_comparison = []
        for r in comparison_raw:
            raw_name = str(r.get("model", ""))
            clean_name = clean_model_name(raw_name)
            mcnemar_info = mcnemar_map.get(clean_name, {})
            model_comparison.append({
                "model": clean_name,
                "accuracy": float(r.get("accuracy", 0)),
                "macro_f1": float(r.get("macro_f1", 0)),
                "balanced_accuracy": float(r.get("balanced_accuracy", 0)),
                "roc_auc": float(r.get("auc_ovr", 0)),
                "log_loss": float(r.get("log_loss", 0)),
                "ece": float(r.get("ece", 0)),
                "top2_accuracy": float(r.get("top2_accuracy", 0)),
                "is_final": "Range-aware Bayes" in clean_name,
                "mcnemar_p": mcnemar_info.get("p_value"),
                "significant": mcnemar_info.get("significant_at_0_05")
            })

        # 4. Repeated splits summary & paired tests
        splits_raw = self._load_csv_as_dicts("paper_results/repeated_splits_summary.csv")
        splits_summary = []
        for r in splits_raw:
            splits_summary.append({
                "model": clean_model_name(str(r.get("model", ""))),
                "accuracy_mean": float(r.get("accuracy_mean", 0)),
                "accuracy_std": float(r.get("accuracy_std", 0)),
                "macro_f1_mean": float(r.get("macro_f1_mean", 0)),
                "macro_f1_std": float(r.get("macro_f1_std", 0)),
                "balanced_accuracy_mean": float(r.get("balanced_accuracy_mean", 0)),
                "balanced_accuracy_std": float(r.get("balanced_accuracy_std", 0)),
                "log_loss_mean": float(r.get("log_loss_mean", 0)),
                "ece_mean": float(r.get("ece_mean", 0)),
            })

        paired_raw = self._load_csv_as_dicts("paper_results/repeated_splits_paired_tests.csv")
        paired_tests = []
        for r in paired_raw:
            paired_tests.append({
                "compared_with": clean_model_name(str(r.get("compared_with", ""))),
                "mean_gain_points": float(r.get("mean_gain_points", 0)),
                "wins": int(r.get("wins", 0)),
                "losses": int(r.get("losses", 0)),
                "paired_t_p": float(r.get("paired_t_p", 0)),
                "wilcoxon_p": float(r.get("wilcoxon_p", 0)),
                "sign_test_p": float(r.get("sign_test_p", 0)),
            })

        # 5. Safe mode confidence gating
        safe_mode_raw = self._load_csv_as_dicts("paper_results/confidence_gated_performance.csv")
        safe_mode_table = []
        for r in safe_mode_raw:
            safe_mode_table.append({
                "target_accuracy": float(r.get("target_accuracy", 0)),
                "confidence_threshold": float(r.get("confidence_threshold", 0)),
                "test_coverage": float(r.get("test_coverage", 0)),
                "test_accuracy": float(r.get("test_accuracy", 0)),
                "flagged_patients_accuracy": float(r.get("flagged_patients_accuracy", 0)),
            })

        # 6. Robustness test accuracy
        robustness_raw = self._load_csv_as_dicts("paper_results/robustness_test_accuracy.csv")
        robustness_table = []
        for r in robustness_raw:
            robustness_table.append({
                "model": clean_model_name(str(r.get("model", ""))),
                "clean": float(r.get("clean", 0)),
                "noise_5pct": float(r.get("noise_5pct", 0)),
                "noise_10pct": float(r.get("noise_10pct", 0)),
                "shift_plus_5pct": float(r.get("shift_plus_5pct", 0)),
                "shift_minus_5pct": float(r.get("shift_minus_5pct", 0)),
                "serology_flip_5pct": float(r.get("serology_flip_5pct", 0)),
                "two_more_missing": float(r.get("two_more_missing", 0)),
            })

        # 7. Head to head published protocols
        head_to_head_raw = self._load_csv_as_dicts("paper_results/head_to_head_published_protocols.csv")
        head_to_head_table = []
        for r in head_to_head_raw:
            head_to_head_table.append({
                "protocol": str(r.get("protocol", "")),
                "model": clean_model_name(str(r.get("model", ""))),
                "test_patients": int(r.get("test_patients", 0)) if r.get("test_patients") else None,
                "accuracy": float(r.get("accuracy", 0)) if r.get("accuracy") != "" else None,
                "macro_f1": float(r.get("macro_f1", 0)) if r.get("macro_f1") != "" else None,
                "balanced_accuracy": float(r.get("balanced_accuracy", 0)) if r.get("balanced_accuracy") != "" else None,
                "recall_AS": float(r.get("recall_AS", 0)) if r.get("recall_AS") != "" else None,
                "recall_ReA": float(r.get("recall_ReA", 0)) if r.get("recall_ReA") != "" else None,
                "note": str(r.get("note", ""))
            })

        self._cached_metrics = {
            "headline": headline,
            "accuracy_ceiling": 0.8618,
            "per_class_metrics": per_class_metrics,
            "model_comparison": model_comparison,
            "repeated_splits": {
                "summary": splits_summary,
                "paired_tests": paired_tests,
            },
            "safe_mode": safe_mode_table,
            "robustness": {
                "conditions": [
                    {"key": "clean", "label": "Clean"},
                    {"key": "noise_5pct", "label": "5% lab error"},
                    {"key": "noise_10pct", "label": "10% lab error"},
                    {"key": "shift_plus_5pct", "label": "All labs +5%"},
                    {"key": "shift_minus_5pct", "label": "All labs −5%"},
                    {"key": "serology_flip_5pct", "label": "5% antibody errors"},
                    {"key": "two_more_missing", "label": "2 more tests missing"},
                ],
                "data": robustness_table,
                "caption": "With 5% lab error every model falls to about 81%."
            },
            "published_protocols": head_to_head_table
        }
        return self._cached_metrics

metrics_service = MetricsService()
