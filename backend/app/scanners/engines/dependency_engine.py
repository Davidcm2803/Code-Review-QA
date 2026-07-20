import subprocess
import json
import shutil
from app.core.logger import logger


def run_osv_scanner(repo_path: str) -> dict:
    # Escanea manifests de dependencias requirements.txt, package.json
    if shutil.which("osv-scanner") is None:
        logger.error("osv-scanner no esta instalado")
        return {"results": [], "errors": ["osv-scanner not found"]}

    logger.info(f"Ejecutando osv-scanner en {repo_path}")
    try:
        result = subprocess.run(
            ["osv-scanner", "scan", "source", "--format", "json", "--recursive", repo_path],
            capture_output=True,
            text=True,
            timeout=180,
        )
        # osv-scanner devuelve exit code 1 cuando SI encuentra vulns, no es un error
        if not result.stdout.strip():
            logger.warning(f"osv-scanner no produjo output. stderr: {result.stderr.strip()}")
            return {"results": [], "errors": []}

        data = json.loads(result.stdout)
        n_vulns = sum(len(pkg.get("packages", [])) for pkg in data.get("results", []))
        logger.info(f"osv-scanner encontró issues en {n_vulns} paquetes")
        return data

    except subprocess.TimeoutExpired:
        logger.error("osv-scanner timeout (180s)")
        return {"results": [], "errors": ["osv-scanner timeout"]}
    except json.JSONDecodeError as e:
        logger.error(f"osv-scanner JSON parse error: {e}")
        return {"results": [], "errors": [str(e)]}