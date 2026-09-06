from pathlib import Path
import os

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
MAX_UPLOAD_BYTES = 25 * 1024 * 1024


def user_file_path(file_path: str, user_id: int) -> Path:
    """Confine both new and legacy file records to the owner's upload directory."""
    root = UPLOAD_DIR.resolve()
    directory = (root / str(user_id)).resolve()
    path = Path(file_path).resolve()
    if not directory.is_relative_to(root) or not path.is_relative_to(directory):
        raise ValueError("File is outside the user's upload directory")
    if path == directory:
        raise ValueError("Expected a file")
    return path
