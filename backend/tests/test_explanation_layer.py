import pytest
from app.model_service import model_service

def test_dual_explanation_layer_sample_3():
    """Verify both scientific and general explanation layers are generated for doctors and patients."""
    samples = model_service.get_samples()
    s3 = samples[2]["patient"]

    analysis = model_service.analyze(s3)
    exp = analysis["explanation"]

    assert exp is not None
    assert "scientific_summary" in exp and exp["scientific_summary"] is not None
    assert "general_summary" in exp and exp["general_summary"] is not None
    assert "key_findings" in exp and len(exp["key_findings"]) > 0
    assert "questions_for_doctor" in exp and len(exp["questions_for_doctor"]) > 0

    # Scientific summary checks: mentions Bayes, likelihood ratios, and safe mode threshold
    sci = exp["scientific_summary"]
    assert "Range-aware Bayes" in sci or "calibrated" in sci
    assert "LR=" in sci
    assert "threshold" in sci or "safe" in sci.lower()

    # General summary checks: plain language, no math jargon
    gen = exp["general_summary"]
    assert "decision-support" in gen or "blood tests" in gen
    assert "Important Note" in gen or "doctor" in gen

    # Evidence items check
    for item in exp["pushes_toward"] + exp["pushes_against"]:
        assert "clinical_insight" in item and item["clinical_insight"]
        assert "plain_language" in item and item["plain_language"]

def test_arbitrary_disease_comparison():
    """Verify comparing any two diseases (e.g. PsA vs RA) works without being restricted to predicted disease."""
    samples = model_service.get_samples()
    s3 = samples[2]["patient"]

    # Compare Psoriatic Arthritis vs Rheumatoid Arthritis
    exp = model_service.explain(
        patient_dict=s3,
        target_class="Psoriatic Arthritis",
        compare_with="Rheumatoid Arthritis"
    )

    assert exp["explained_class"] == "Psoriatic Arthritis"
    assert exp["compared_with"] == "Rheumatoid Arthritis"
    assert "scientific_summary" in exp
    assert "general_summary" in exp
    assert "Psoriatic Arthritis" in exp["scientific_summary"]
    assert "Rheumatoid Arthritis" in exp["scientific_summary"]

def test_single_disease_attribution_explanation():
    """Verify single-disease attribution explains why predicted disease was diagnosed with favor items."""
    samples = model_service.get_samples()
    s0 = samples[0]["patient"]

    analysis = model_service.analyze(s0)
    exp = analysis["explanation"]
    pred = analysis["prediction"]

    assert pred["predicted_disease"] == "Ankylosing Spondylitis"
    assert exp is not None
    assert "single_disease_scientific_summary" in exp
    assert "single_disease_general_summary" in exp
    assert "disease_evidence" in exp
    assert len(exp["disease_evidence"]) > 0

    sci = exp["single_disease_scientific_summary"]
    gen = exp["single_disease_general_summary"]

    assert "Ankylosing Spondylitis" in sci
    assert "Safe Mode" in sci or "confidence" in sci
    assert "Spine & Joint Arthritis" in gen or "Ankylosing Spondylitis" in gen

    # Verify favor items
    favor_items = [x for x in exp["disease_evidence"] if x.get("favors_target")]
    assert len(favor_items) > 0
    top_item = favor_items[0]
    assert "impact" in top_item and top_item["impact"] > 0
    assert "clinical_insight" in top_item and top_item["clinical_insight"]
    assert "plain_language" in top_item and top_item["plain_language"]
    assert "evidence_level" in top_item

