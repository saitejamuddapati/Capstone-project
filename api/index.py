import sys
import os
from pathlib import Path

# Add project root and backend directory to sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"

if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Ensure ARTIFACTS_DIR is set
os.environ.setdefault("ARTIFACTS_DIR", str(root_dir / "project_artifacts_v4"))

from backend.app.main import app
from backend.app.model_service import model_service

# Ensure model service is initialized for serverless invocations
try:
    model_service.initialize()
except Exception as e:
    print(f"Serverless model_service initialization notice: {e}")
