import os
from app.core.logger import logger
from app.scanners.engines.bandit_engine import run_bandit
from app.scanners.engines.semgrep_engine import run_semgrep, build_configs
from app.scanners.normalizer import normalize_bandit, normalize_semgrep

# Lenguajes que Semgrep sabe cubrir en este sprint (sin Java)
SEMGREP_LANGUAGES = {"javascript", "typescript", "csharp"}


def detect_languages(repo_path: str) -> list[str]:
    #Detecta los lenguajes dentro del repo

    lang_map = {
        ".py":   "python",
        ".js":   "javascript",
        ".ts":   "typescript",
        ".jsx":  "javascript",
        ".tsx":  "typescript",
        ".java": "java",
        ".cs":   "csharp",
        ".go":   "go",
        ".rb":   "ruby",
        ".php":  "php",
    }
    found = set()
    for root, _, files in os.walk(repo_path):
        # Ignorar node_modules, .git, venv, etc.
        root_parts = root.split(os.sep)
        if any(p in root_parts for p in ["node_modules", ".git", "venv", "__pycache__", ".venv"]):
            continue
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in lang_map:
                found.add(lang_map[ext])
    langs = list(found)
    logger.info(f"Lenguajes detectados: {langs}")
    return langs


def run_scan(repo_path: str, repository_id: str, scan_id: str) -> list[dict]:
    #Corre la carpeta de los engines disponibles segun los lenguajes
    languages = detect_languages(repo_path)
    all_vulns = []

    if "python" in languages:
        try:
            logger.info("Ejecutando Bandit (Python)")
            raw = run_bandit(repo_path)
            vulns = normalize_bandit(raw, repository_id, scan_id)
            all_vulns.extend(vulns)
            logger.info(f"Bandit: {len(vulns)} vulnerabilidades encontradas")
        except Exception as e:
            # Aislado: si Bandit falla no debe tumbar el resto del scan
            logger.error(f"Bandit fallo durante el scan: {e}", exc_info=True)
    else:
        logger.info("No se detectó Python en el repo, saltando Bandit")

    semgrep_langs = [lang for lang in languages if lang in SEMGREP_LANGUAGES]
    if semgrep_langs:
        try:
            logger.info(f"Ejecutando Semgrep ({', '.join(semgrep_langs)})")
            configs = build_configs(semgrep_langs)
            raw = run_semgrep(repo_path, configs)
            vulns = normalize_semgrep(raw, repository_id, scan_id, repo_path)
            all_vulns.extend(vulns)
            logger.info(f"Semgrep: {len(vulns)} vulnerabilidades encontradas")
        except Exception as e:
            # Aislado: si Semgrep falla no debe tumbar el resto del scan
            logger.error(f"Semgrep fallo durante el scan: {e}", exc_info=True)
    else:
        logger.info("No se detectó JS/TS/JSX/TSX/C# en el repo, saltando Semgrep")

    return all_vulns