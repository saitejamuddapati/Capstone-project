import pytest
from fastapi.testclient import TestClient

def test_insufficient_data_empty_patient(client: TestClient):
    """Empty patient returns insufficient_data on analyze, explain, recommend, and predict."""
    # 1. Analyze
    res = client.post("/api/analyze", json={"patient": {}, "mode": "default"})
    assert res.status_code == 200
    data = res.json()
    assert data["prediction"]["status"] == "insufficient_data"
    assert data["explanation"] is None
    assert data["recommendations"] == []

    # 2. Predict
    res = client.post("/api/predict", json={})
    assert res.status_code == 200
    assert res.json()["status"] == "insufficient_data"

    # 3. Explain
    res = client.post("/api/explain", json={})
    assert res.status_code == 200
    assert res.json()["status"] == "insufficient_data"

    # 4. Recommend
    res = client.post("/api/recommend", json={})
    assert res.status_code == 200
    assert res.json()["status"] == "insufficient_data"

def test_insufficient_data_two_tests(client: TestClient):
    """Patient with only 2 measured tests returns insufficient_data."""
    two_test_patient = {"Age": 45, "Gender": "Female", "ESR": 25.0, "CRP": 10.0}
    
    res = client.post("/api/analyze", json={"patient": two_test_patient})
    assert res.status_code == 200
    assert res.json()["prediction"]["status"] == "insufficient_data"

    res = client.post("/api/explain", json=two_test_patient)
    assert res.status_code == 200
    assert res.json()["status"] == "insufficient_data"

    res = client.post("/api/recommend", json=two_test_patient)
    assert res.status_code == 200
    assert res.json()["status"] == "insufficient_data"

def test_invalid_mode_returns_422(client: TestClient):
    """Invalid mode parameter returns HTTP 422."""
    patient = {"ESR": 25.0, "CRP": 10.0, "RF": 15.0}
    
    # In /api/analyze body
    res = client.post("/api/analyze", json={"patient": patient, "mode": "xyz"})
    assert res.status_code == 422

    # In /api/predict query
    res = client.post("/api/predict?mode=xyz", json=patient)
    assert res.status_code == 422

def test_invalid_compare_with_returns_422(client: TestClient):
    """Unknown compare_with disease returns HTTP 422."""
    patient = {
        "ESR": 25.0, "CRP": 10.0, "RF": 15.0, "Anti-CCP": 20.0,
        "HLA-B27": "Negative", "ANA": "Positive"
    }
    
    # In /api/analyze body
    res = client.post("/api/analyze", json={"patient": patient, "compare_with": "Flu"})
    assert res.status_code == 422

    # In /api/explain query
    res = client.post("/api/explain?compare_with=Flu", json=patient)
    assert res.status_code == 422

def test_compare_with_same_as_explained_returns_422(client: TestClient):
    """compare_with equal to the predicted/explained class returns HTTP 422."""
    # Sample 1 predicts Ankylosing Spondylitis
    patient = {
        "Age": 29, "Gender": "Male", "ESR": 28.0, "CRP": 21.8, "RF": 32.5,
        "Anti-CCP": 18.2, "HLA-B27": "Positive", "ANA": "Negative", "Anti-Ro": "Negative",
        "Anti-La": "Positive", "Anti-dsDNA": "Negative", "Anti-Sm": "Negative",
        "C3": 137.0, "C4": 51.0
    }
    res = client.post("/api/analyze", json={"patient": patient, "compare_with": "Ankylosing Spondylitis"})
    assert res.status_code == 422

def test_unknown_field_returns_422(client: TestClient):
    """Unknown fields in request body return HTTP 422 (extra='forbid')."""
    res = client.post("/api/analyze", json={
        "patient": {"ESR": 25.0, "CRP": 10.0, "RF": 15.0, "BloodPressure": 120},
        "mode": "default"
    })
    assert res.status_code == 422

def test_unreadable_values_produce_warnings_not_500(client: TestClient):
    """Unreadable text for labs (e.g. ESR='high') produces warnings and does not fail."""
    patient = {
        "ESR": "high", "CRP": 12.5, "RF": 30.0, "Anti-CCP": 25.0
    }
    res = client.post("/api/analyze", json={"patient": patient})
    assert res.status_code == 200
    data = res.json()
    warnings = data["prediction"]["warnings"]
    assert any("could not read" in w for w in warnings)
