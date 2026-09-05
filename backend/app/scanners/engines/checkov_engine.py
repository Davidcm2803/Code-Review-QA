import subprocess
import json
import shutil
from app.core.logger import logger


RELEVANT_FRAMEWORKS = [
    "dockerfile",
    "docker_compose",
    "kubernetes",
    "github_actions",
    "gitlab_ci",
]


def run_checkov(repo_path: str) -> dict:
    # esta funcion corre checkov sobre el repo y devuelve el JSON de resultados
    if shutil.which("checkov") is None:
        logger.error("checkov no esta instalado")
        return {"results": {"failed_checks": []}}

    logger.info(f"Ejecutando checkov en {repo_path}")
    try:
        cmd = [
            "checkov", "-d", repo_path,
            "-o", "json",
            "--compact",
            "--quiet",
            "--framework", *RELEVANT_FRAMEWORKS,
        ]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=180,
        )
        if not result.stdout.strip():
            logger.warning(f"checkov no produjo output. stderr: {result.stderr.strip()}")
            return {"results": {"failed_checks": []}}

        data = json.loads(result.stdout)

        # checkov devuelve una lista si escaneo mas de un framework, o un dict si fue uno solo
        if isinstance(data, list):
            failed = []
            for entry in data:
                failed.extend(entry.get("results", {}).get("failed_checks", []))
            data = {"results": {"failed_checks": failed}}

        n_failed = len(data.get("results", {}).get("failed_checks", []))
        logger.info(f"checkov encontro {n_failed} configuraciones inseguras")
        return data

    except subprocess.TimeoutExpired:
        logger.error("checkov timeout (180s)")
        return {"results": {"failed_checks": []}}
    except json.JSONDecodeError as e:
        logger.error(f"checkov JSON parse error: {e}")
        return {"results": {"failed_checks": []}}