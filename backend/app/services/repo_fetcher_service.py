import os
import shutil
import tempfile
import subprocess
from urllib.parse import urlparse, urlunparse
from app.core.logger import logger


def _inject_token(clone_url: str, github_token: str | None) -> str:
    if not github_token:
        return clone_url
    parsed = urlparse(clone_url)
    netloc = f"x-access-token:{github_token}@{parsed.hostname}"
    if parsed.port:
        netloc += f":{parsed.port}"
    return urlunparse(parsed._replace(netloc=netloc))


def fetch_repo(clone_url: str, branch: str = "main", github_token: str | None = None) -> str:
    tmp_dir = tempfile.mkdtemp(prefix="aisecure_")
    authenticated_url = _inject_token(clone_url, github_token)
    try:
        logger.info(f"Clonando {clone_url} rama {branch} en {tmp_dir}")
        result = subprocess.run(
            ["git", "clone", "--depth", "1", "--branch", branch, authenticated_url, tmp_dir],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            shutil.rmtree(tmp_dir, ignore_errors=True)
            safe_stderr = result.stderr.strip().replace(github_token or "", "***") if github_token else result.stderr.strip()
            raise RuntimeError(f"Git clone failed: {safe_stderr}")
        logger.info(f"Clone exitoso en {tmp_dir}")
        return tmp_dir
    except subprocess.TimeoutExpired:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise RuntimeError("Git clone timeout (120s)")
    except Exception:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise


def _safe_relative_path(filename: str) -> str:
    normalized = filename.replace("\\", "/")
    if ":" in normalized:
        normalized = normalized.split(":")[-1]
    parts = [p for p in normalized.split("/") if p not in ("", ".", "..")]
    if not parts:
        parts = ["unnamed_file"]
    return os.path.join(*parts)


def create_temp_workspace_from_files(files: list[tuple[str, bytes]]) -> str:
    tmp_dir = tempfile.mkdtemp(prefix="aisecure_upload_")
    for filename, content in files:
        rel_path = _safe_relative_path(filename)
        dest = os.path.join(tmp_dir, rel_path)
        if not os.path.abspath(dest).startswith(os.path.abspath(tmp_dir) + os.sep):
            logger.warning(f"Nombre de archivo sospechoso ignorado: {filename}")
            continue

        os.makedirs(os.path.dirname(dest), exist_ok=True)

        if os.path.exists(dest):
            logger.warning(f"Archivo duplicado detectado, se sobreescribe: {rel_path}")

        with open(dest, "wb") as f:
            f.write(content)

    logger.info(f"Workspace temporal creado con {len(files)} archivo(s) en {tmp_dir}")
    return tmp_dir


def cleanup_repo(path: str):
    if path and os.path.exists(path):
        shutil.rmtree(path, ignore_errors=True)
        logger.info(f"Directorio temporal eliminado: {path}")