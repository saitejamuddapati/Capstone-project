import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app
from app.model_service import model_service

@pytest.fixture(scope="session", autouse=True)
def init_model():
    model_service.initialize()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
