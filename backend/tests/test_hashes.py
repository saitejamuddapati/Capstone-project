import hashlib
from app.config import settings

def test_file_hashes():
    """Verify exact SHA-256 hashes of the four core model artifacts."""
    artifacts_dir = settings.ARTIFACTS_DIR
    for rel_path, expected_hash in settings.VERIFIED_HASHES.items():
        file_path = artifacts_dir / rel_path
        assert file_path.exists(), f"File missing: {file_path}"
        with open(file_path, "rb") as f:
            computed_hash = hashlib.sha256(f.read()).hexdigest()
        assert computed_hash == expected_hash, f"Hash mismatch for {rel_path}: expected {expected_hash}, got {computed_hash}"
