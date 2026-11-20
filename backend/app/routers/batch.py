import csv
import io
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Query, HTTPException
from fastapi.responses import Response

from app.model_service import model_service
from app.schemas import BatchResponse, BatchSummary, BatchRowResult

router = APIRouter(tags=["Batch"])

MAX_ROWS = 2000
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2 MB

@router.post("/batch")
async def batch_predict(
    file: UploadFile = File(...),
    mode: str = Query(default="default"),
    format: Optional[str] = Query(default="json", description="'json' or 'csv'")
):
    """
    Process up to 2,000 patients from an uploaded CSV in memory.
    Reports errors per row without failing the entire batch.
    Supports JSON response or downloadable CSV.
    """
    if mode not in ("default", "sensitive"):
        raise HTTPException(status_code=422, detail="mode must be 'default' or 'sensitive'")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=422, detail="File size exceeds maximum limit of 2 MB.")

    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            text = content.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=422, detail="File must be valid UTF-8 text.")

    csv_reader = csv.DictReader(io.StringIO(text))
    if not csv_reader.fieldnames:
        raise HTTPException(status_code=422, detail="CSV file has no headers.")

    results = []
    status_counts = {"confident": 0, "needs_review": 0, "insufficient_data": 0, "error": 0}
    disease_counts = {}
    successful_rows = 0

    rows = list(csv_reader)
    if len(rows) > MAX_ROWS:
        raise HTTPException(status_code=422, detail=f"File exceeds maximum allowed rows ({MAX_ROWS}).")

    out_csv_rows = []

    for idx, raw_row in enumerate(rows, start=1):
        # Clean row keys and values
        clean_row = {}
        for k, v in raw_row.items():
            if k is not None:
                clean_k = k.strip()
                clean_v = v.strip() if isinstance(v, str) else v
                clean_row[clean_k] = clean_v if clean_v != "" else None

        try:
            pred = model_service.predict(clean_row, mode=mode)
            status = pred.get("status", "unknown")
            disease = pred.get("predicted_disease")
            confidence = pred.get("confidence")
            runner_up = pred.get("runner_up")
            n_missing = pred.get("n_missing_tests", 0)
            warnings = pred.get("warnings", [])

            status_counts[status] = status_counts.get(status, 0) + 1
            if disease:
                disease_counts[disease] = disease_counts.get(disease, 0) + 1
            successful_rows += 1

            row_res = BatchRowResult(
                row_index=idx,
                predicted_disease=disease,
                confidence=confidence,
                runner_up=runner_up,
                status=status,
                n_missing_tests=n_missing,
                warnings=warnings,
                error=None
            )
            results.append(row_res)

            if format == "csv":
                csv_item = dict(raw_row)
                csv_item["predicted_disease"] = disease or ""
                csv_item["confidence"] = f"{confidence:.4f}" if confidence is not None else ""
                csv_item["runner_up"] = runner_up or ""
                csv_item["status"] = status
                csv_item["n_missing_tests"] = str(n_missing)
                csv_item["warnings"] = "; ".join(warnings)
                csv_item["error"] = ""
                out_csv_rows.append(csv_item)

        except Exception as e:
            status_counts["error"] = status_counts.get("error", 0) + 1
            row_res = BatchRowResult(
                row_index=idx,
                predicted_disease=None,
                confidence=None,
                runner_up=None,
                status="error",
                n_missing_tests=0,
                warnings=[],
                error=str(e)
            )
            results.append(row_res)

            if format == "csv":
                csv_item = dict(raw_row)
                csv_item["predicted_disease"] = ""
                csv_item["confidence"] = ""
                csv_item["runner_up"] = ""
                csv_item["status"] = "error"
                csv_item["n_missing_tests"] = ""
                csv_item["warnings"] = ""
                csv_item["error"] = str(e)
                out_csv_rows.append(csv_item)

    if format == "csv":
        output = io.StringIO()
        fieldnames = list(rows[0].keys()) if rows else []
        for extra_col in ["predicted_disease", "confidence", "runner_up", "status", "n_missing_tests", "warnings", "error"]:
            if extra_col not in fieldnames:
                fieldnames.append(extra_col)
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(out_csv_rows)
        csv_bytes = output.getvalue().encode("utf-8")
        
        return Response(
            content=csv_bytes,
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="batch_predictions.csv"'}
        )

    summary = BatchSummary(
        total_rows=len(rows),
        successful_rows=successful_rows,
        status_counts=status_counts,
        disease_counts=disease_counts
    )
    return BatchResponse(summary=summary, results=results)
