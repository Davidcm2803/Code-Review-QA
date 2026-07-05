import os
import shutil
import tempfile
import subprocess
from app.core.logger import logger


def fetch_repo(clone_url: str, branch: str = "main") -> str:
    # Clona un repo de GitHub en un dir temporal
    tmp_dir = tempfile.mkdtemp(prefix="aisecure_")
    try:
        logger.info(f"Clonando {clone_url} rama {branch} en {tmp_dir}")
        result = subprocess.run(
            ["git", "clone", "--depth", "1", "--branch", branch, clone_url, tmp_dir],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            shutil.rmtree(tmp_dir, ignore_errors=True)
            raise RuntimeError(f"Git clone failed: {result.stderr.strip()}")
        logger.info(f"Clone exitoso en {tmp_dir}")
        return tmp_dir
    except subprocess.TimeoutExpired:
        # Clone tardó más de 120s, se aborta
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise RuntimeError("Git clone timeout (120s)")
    except Exception:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise


def create_temp_workspace_from_files(files: list[tuple[str, bytes]]) -> str:
    # Escribe archivos subidos/pegados a un dir temporal, sin git
    tmp_dir = tempfile.mkdtemp(prefix="aisecure_upload_")
    for filename, content in files:
        safe_name = os.path.basename(filename)
        dest = os.path.join(tmp_dir, safe_name)
        with open(dest, "wb") as f:
            f.write(content)
    logger.info(f"Workspace temporal creado con {len(files)} archivo(s) en {tmp_dir}")
    return tmp_dir


def cleanup_repo(path: str):
    # Elimina el directorio temporal del repo/workspace
    if path and os.path.exists(path):
        shutil.rmtree(path, ignore_errors=True)
        logger.info(f"Directorio temporal eliminado: {path}")