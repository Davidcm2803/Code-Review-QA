import os
from app.core.logger import logger

MANIFEST_FILES = {
    "requirements.txt", "Pipfile.lock", "poetry.lock",
    "package.json", "package-lock.json", "yarn.lock",
}


def has_dependency_manifests(repo_path: str) -> bool:
    for root, _, files in os.walk(repo_path):
        root_parts = root.split(os.sep)
        if any(p in root_parts for p in ["node_modules", ".git", "venv", "__pycache__", ".venv"]):
            continue
        if any(f in MANIFEST_FILES for f in files):
            logger.info(f"Manifest de dependencias encontrado en {root}")
            return True
    return False