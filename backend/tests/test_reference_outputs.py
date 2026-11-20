import pytest
from app.model_service import model_service

TOLERANCE = 1e-4

def test_sample_3_reference_outputs():
    """Verify Sample 3 (index 2, Normal healthy control) exact prediction, recommendation, and explanation."""
    samples = model_service.get_samples()
    s3 = samples[2]["patient"]

    # 1. Predict
    pred = model_service.predict(s3)
    assert pred["predicted_disease"] == "Normal"
    assert pytest.approx(0.50997, abs=TOLERANCE) == pred["confidence"]
    assert pred["status"] == "needs_review"
    assert pred["runner_up"] == "Sjögren's Syndrome"

    # 2. Recommended tests
    recs = pred["recommended_tests"]
    assert len(recs) > 0
    first_rec = recs[0]
    assert first_rec["test"] == "Anti-La"
    assert pytest.approx(0.2577, abs=TOLERANCE) == first_rec["chance_of_confident_answer"]

    # 3. Explain
    exp = model_service.explain(s3, top_k=12)
    assert exp["method"] == "exact likelihood ratios"
    assert exp["explained_class"] == "Normal"
    assert exp["compared_with"] == "Sjögren's Syndrome"

    # Check evidence features
    pushes_toward = {item["feature"]: item for item in exp["pushes_toward"]}
    pushes_against = {item["feature"]: item for item in exp["pushes_against"]}

    assert "Anti-CCP" in pushes_toward
    assert pytest.approx(2.063, abs=1e-2) == pushes_toward["Anti-CCP"]["likelihood_ratio"]

    assert "RF" in pushes_toward
    assert pytest.approx(1.989, abs=1e-2) == pushes_toward["RF"]["likelihood_ratio"]

    assert "ANA" in pushes_against
    assert pytest.approx(0.504, abs=1e-2) == pushes_against["ANA"]["likelihood_ratio"]

    assert "Anti-Ro" in pushes_against
    assert pytest.approx(0.510, abs=1e-2) == pushes_against["Anti-Ro"]["likelihood_ratio"]

def test_14_sample_patients_accuracy():
    """Verify that exactly 11 of the 14 sample patients are predicted correctly."""
    samples = model_service.get_samples()
    assert len(samples) == 14

    correct_count = 0
    for s in samples:
        pred = model_service.predict(s["patient"])
        if pred["predicted_disease"] == s["true_disease"]:
            correct_count += 1

    assert correct_count == 11, f"Expected 11 correct sample patients, got {correct_count}"

def test_sample_7_sensitivity_mode():
    """Sample 7 (Reactive Arthritis): default predicts AS, sensitive mode predicts ReA."""
    samples = model_service.get_samples()
    s7 = samples[6]["patient"]

    pred_default = model_service.predict(s7, mode="default")
    assert pred_default["predicted_disease"] == "Ankylosing Spondylitis"
    assert pred_default["status"] == "needs_review"

    pred_sensitive = model_service.predict(s7, mode="sensitive")
    assert pred_sensitive["predicted_disease"] == "Reactive Arthritis"
    assert pred_sensitive["status"] == "needs_review"
    assert pred_sensitive["runner_up"] == "Ankylosing Spondylitis"
