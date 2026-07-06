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


def _safe_relative_path(filename: str) -> str:
    # Normaliza separadores y elimina intentos de path mal hechos, sino que los estandariza
    normalized = filename.replace("\\", "/")
    # descarta drive letters tipo "C:" 
    if ":" in normalized:
        normalized = normalized.split(":")[-1]
    parts = [p for p in normalized.split("/") if p not in ("", ".", "..")]
    if not parts:
        parts = ["unnamed_file"]
    return os.path.join(*parts)


def create_temp_workspace_from_files(files: list[tuple[str, bytes]]) -> str:
    # Escribe archivos subidos o pegados a un dir temporal
    tmp_dir = tempfile.mkdtemp(prefix="aisecure_upload_")
    for filename, content in files:
        rel_path = _safe_relative_path(filename)
        dest = os.path.join(tmp_dir, rel_path)
        if not os.path.abspath(dest).startswith(os.path.abspath(tmp_dir) + os.sep):
            logger.warning(f"Nombre de archivo sospechoso ignorado: {filename}")
            continue

        os.makedirs(os.path.dirname(dest), exist_ok=True)

        # Si dos archivos distintos terminan mapeando al mismo dest tira alert
        if os.path.exists(dest):
            logger.warning(f"Archivo duplicado detectado, se sobreescribe: {rel_path}")

        with open(dest, "wb") as f:
            f.write(content)

    logger.info(f"Workspace temporal creado con {len(files)} archivo(s) en {tmp_dir}")
    return tmp_dir


def cleanup_repo(path: str):
    # Elimina el directorio temporal del repo
    if path and os.path.exists(path):
        shutil.rmtree(path, ignore_errors=True)
        logger.info(f"Directorio temporal eliminado: {path}")