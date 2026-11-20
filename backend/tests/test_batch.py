import io
import csv
from fastapi.testclient import TestClient

def test_batch_prediction_with_bad_row(client: TestClient):
    """A batch containing normal rows and an insufficient/unusual row reports errors per row without failing the file."""
    csv_content = """Age,Gender,ESR,CRP,RF,Anti-CCP,HLA-B27,ANA,Anti-Ro,Anti-La,Anti-dsDNA,Anti-Sm,C3,C4
29,Male,28.0,21.8,32.5,18.2,Positive,Negative,Negative,Positive,Negative,Negative,137.0,51.0
,,,,,,,,,,,,,
58,Female,12.0,0.8,10.4,14.5,Positive,Positive,Positive,,,,116.0,63.0
"""
    files = {"file": ("patients.csv", csv_content.encode("utf-8"), "text/csv")}
    res = client.post("/api/batch", files=files)
    assert res.status_code == 200
    data = res.json()

    assert data["summary"]["total_rows"] == 3
    assert len(data["results"]) == 3
    
    # Row 1 is Sample 1 -> confident
    assert data["results"][0]["predicted_disease"] == "Ankylosing Spondylitis"
    assert data["results"][0]["status"] == "confident"

    # Row 2 is empty -> insufficient_data
    assert data["results"][1]["status"] == "insufficient_data"

    # Row 3 is Sample 3 -> needs_review
    assert data["results"][2]["predicted_disease"] == "Normal"
    assert data["results"][2]["status"] == "needs_review"

def test_batch_csv_export(client: TestClient):
    """Batch export with format=csv returns downloadable CSV with predictions and status."""
    csv_content = """Age,Gender,ESR,CRP,RF,Anti-CCP,HLA-B27,ANA,Anti-Ro,Anti-La,Anti-dsDNA,Anti-Sm,C3,C4
29,Male,28.0,21.8,32.5,18.2,Positive,Negative,Negative,Positive,Negative,Negative,137.0,51.0
"""
    files = {"file": ("test.csv", csv_content.encode("utf-8"), "text/csv")}
    res = client.post("/api/batch?format=csv", files=files)
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    
    reader = csv.DictReader(io.StringIO(res.text))
    rows = list(reader)
    assert len(rows) == 1
    assert rows[0]["predicted_disease"] == "Ankylosing Spondylitis"
    assert rows[0]["status"] == "confident"
