import re
from fastapi.testclient import TestClient

def test_metrics_no_version_tags(client: TestClient):
    """Ensure /api/metrics contains no model label matching v\\d."""
    res = client.get("/api/metrics")
    assert res.status_code == 200
    data = res.json()

    # Extract all model names across comparison, repeated splits, robustness, published
    names_to_check = []
    
    for item in data.get("model_comparison", []):
        names_to_check.append(item["model"])
    
    for item in data.get("repeated_splits", {}).get("summary", []):
        names_to_check.append(item["model"])
    
    for item in data.get("repeated_splits", {}).get("paired_tests", []):
        names_to_check.append(item["compared_with"])

    for item in data.get("robustness", {}).get("data", []):
        names_to_check.append(item["model"])

    for item in data.get("published_protocols", []):
        names_to_check.append(item["model"])

    assert len(names_to_check) > 0, "No model names found in metrics response"

    pattern = re.compile(r"\bv\d+\b", re.IGNORECASE)
    for name in names_to_check:
        match = pattern.search(name)
        assert not match, f"Found prohibited version tag in model label: '{name}'"

def test_figure_access_and_path_traversal_blocked(client: TestClient):
    """Ensure path traversal is blocked and banned figures return 404."""
    # 1. Path traversal attempt
    res = client.get("/api/figures/../../requirements.txt")
    assert res.status_code == 404

    # 2. Banned figure containing v2 in legend
    res = client.get("/api/figures/model_comparison.png")
    assert res.status_code == 404

    res = client.get("/api/figures/repeated_splits_accuracy.png")
    assert res.status_code == 404

    # 3. Allowed research figure
    res = client.get("/api/figures/confusion_matrix.png")
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/png"
