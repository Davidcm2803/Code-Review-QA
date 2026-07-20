import subprocess
import json
import shutil
import tempfile
import os
from app.core.logger import logger


def run_gitleaks(repo_path: str) -> list:
    # esta funcion corre gitleaks sobre el repo y devuelve la lista de secretos encontrados
    if shutil.which("gitleaks") is None:
        logger.error("gitleaks no esta instalado")
        return []

    logger.info(f"Ejecutando gitleaks en {repo_path}")

    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        report_path = tmp.name

    try:
        result = subprocess.run(
            [
                "gitleaks", "detect",
                "--source", repo_path,
                "--report-format", "json",
                "--report-path", report_path,
                "--no-git",
                "--exit-code", "0",
            ],
            capture_output=True,
            text=True,
            timeout=180,
        )

        # gitleaks puede devolver stderr con warnings aunque el exit code sea 0, no es un error fatal
        if result.returncode != 0:
            logger.warning(f"gitleaks devolvio codigo {result.returncode}. stderr: {result.stderr.strip()}")

        if not os.path.exists(report_path) or os.path.getsize(report_path) == 0:
            logger.info("gitleaks no encontro secretos")
            return []

        with open(report_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # el reporte de gitleaks es directamente una lista de findings
        if not isinstance(data, list):
            logger.warning("gitleaks devolvio un formato inesperado, se esperaba una lista")
            return []

        logger.info(f"gitleaks encontro {len(data)} secretos")
        return data

    except subprocess.TimeoutExpired:
        logger.error("gitleaks timeout (180s)")
        return []
    except json.JSONDecodeError as e:
        logger.error(f"gitleaks JSON parse error: {e}")
        return []
    finally:
        if os.path.exists(report_path):
            os.remove(report_path)