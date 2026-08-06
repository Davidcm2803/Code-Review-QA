import subprocess
import json
import sys
from app.core.logger import logger


def run_bandit(repo_path: str) -> dict:
    #Ejecuta Bandit sobre el repo y retorna el JSON resultados para luego guardarlo en embbedings

    logger.info(f"Ejecutando Bandit en {repo_path}")
    try:
        result = subprocess.run(
            [sys.executable, "-m", "bandit", "-r", repo_path, "-f", "json", "-q", "--exit-zero"],
            capture_output=True,
            text=True,
            timeout=180,
        )
        if not result.stdout.strip():
            logger.warning(f"Bandit no produjo output. stderr: {result.stderr.strip()}")
            return {"results": [], "errors": []}

        data = json.loads(result.stdout)
        logger.info(f"Bandit encontró {len(data.get('results', []))} issues")
        return data

    except subprocess.TimeoutExpired:
        logger.error("Bandit timeout (180s)")
        return {"results": [], "errors": ["Bandit timeout"]}
    except json.JSONDecodeError as e:
        logger.error(f"Bandit JSON parse error: {e}")
        return {"results": [], "errors": [str(e)]}
    except FileNotFoundError:
        logger.error("Python no encontrado")
        return {"results": [], "errors": ["Python not found"]}