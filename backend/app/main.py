import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.model_service import model_service
from app.routers import diagnosis, model_info, metrics, batch

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize and verify model artifacts at startup
    model_service.initialize()
    yield

app = FastAPI(
    title="Explainable AI for Rheumatic and Autoimmune Diseases CDSS",
    description="Clinical decision-support API utilizing a calibrated Range-aware Bayes model with exact explanations.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(model_info.router, prefix="/api")
app.include_router(diagnosis.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(batch.router, prefix="/api")

# Serve frontend production bundle if built (e.g. for start_demo mode)
frontend_dist = settings.BASE_DIR / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Don't intercept API calls
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path == "openapi.json":
            raise HTTPException(status_code=404, detail="Not Found")
        
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        
        # If a file extension is present (e.g. .txt, .png, .csv), do not serve index.html
        if "." in Path(full_path).name:
            raise HTTPException(status_code=404, detail="File Not Found")

        return FileResponse(frontend_dist / "index.html")
