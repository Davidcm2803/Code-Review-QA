import subprocess
import json
import shutil
from app.core.logger import logger

# Configs  de Semgrep por lenguaje
LANGUAGE_CONFIGS = {
    "javascript": ["p/javascript", "p/react"],
    "typescript": ["p/typescript", "p/react"],
    "csharp":     ["p/csharp"],
}

BASELINE_CONFIGS = ["p/owasp-top-ten"]

EXCLUDE_DIRS = [
    "node_modules",
    "dist",
    "build",
    ".git",
    "venv",
    ".venv",
    "__pycache__",
    ".next",
    "coverage",
    "vendor",
]


def build_configs(languages: list[str]) -> list[str]:
    # Arma la lista de configs de semgrep segun lenguajes detectados en el config
    configs = set(BASELINE_CONFIGS)
    for lang in languages:
        for cfg in LANGUAGE_CONFIGS.get(lang, []):
            configs.add(cfg)
    return list(configs)


def run_semgrep(repo_path: str, configs: list[str]) -> dict:
    # Ejecuta Semgrep sobre el repo con los configs y retorna el JSON de resultados
    if not configs:
        logger.info("Semgrep: sin configs aplicables, se salta la ejecucion")
        return {"results": [], "errors": []}

    if shutil.which("semgrep") is None:
        logger.error("Semgrep no esta instalado")
        return {"results": [], "errors": ["Semgrep not found"]}

    logger.info(f"Ejecutando Semgrep en {repo_path} con configs: {configs}")
    try:
        cmd = [
            "semgrep", "scan",
            "--json",
            "--quiet",
            "--error",
            "--metrics=off",         # evita telemetria que agrega overhead
            "--jobs", "1",           # limita paralelismo interno de semgrep
                                      # para no sumar memoria extra sobre el
                                      # resto del scan
            "--max-memory", "1000",  # aborta reglas individuales que exceden
                                      # ~1GB en vez de dejar que Semgrep crezca
                                      # sin limite y tumbe el proceso completo
        ]
        for d in EXCLUDE_DIRS:
            cmd += ["--exclude", d]
        for cfg in configs:
            cmd += ["--config", cfg]
        cmd.append(repo_path)

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,
        )
        if not result.stdout.strip():
            logger.warning(f"Semgrep no produjo output. stderr: {result.stderr.strip()}")
            return {"results": [], "errors": [result.stderr.strip()] if result.stderr.strip() else []}

        data = json.loads(result.stdout)
        logger.info(f"Semgrep encontro {len(data.get('results', []))} issues")
        return data

    except subprocess.TimeoutExpired:
        logger.error("Semgrep timeout (300s)")
        return {"results": [], "errors": ["Semgrep timeout"]}
    except json.JSONDecodeError as e:
        logger.error(f"Semgrep JSON parse error: {e}")
        return {"results": [], "errors": [str(e)]}
    except FileNotFoundError:
        logger.error("Semgrep no encontrado")
        return {"results": [], "errors": ["Semgrep not found"]}