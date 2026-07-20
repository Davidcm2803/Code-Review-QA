import os
from app.core.logger import logger
from app.scanners.engines.bandit_engine import run_bandit
from app.scanners.engines.semgrep_engine import run_semgrep, build_configs
from app.scanners.engines.dependency_engine import run_osv_scanner
from app.scanners.engines.gitleaks_engine import run_gitleaks
from app.scanners.engines.checkov_engine import run_checkov
from app.scanners.dependency_scanner import has_dependency_manifests
from app.scanners.iac_scanner import has_iac_files
from app.scanners.normalizer import (
    normalize_bandit,
    normalize_semgrep,
    normalize_osv,
    normalize_gitleaks,
    normalize_checkov,
)

SEMGREP_LANGUAGES = {"javascript", "typescript", "csharp"}


def detect_languages(repo_path: str) -> list[str]:
    # detecta los lenguajes dentro del repo
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
    # corre todos los engines disponibles segun lo que detecte en el repo
    languages = detect_languages(repo_path)
    all_vulns = []

    # Bandit
    if "python" in languages:
        try:
            logger.info("Ejecutando Bandit (Python)")
            raw = run_bandit(repo_path)
            vulns = normalize_bandit(raw, repository_id, scan_id)
            all_vulns.extend(vulns)
            logger.info(f"Bandit: {len(vulns)} vulnerabilidades encontradas")
        except Exception as e:
            logger.error(f"Bandit fallo durante el scan: {e}", exc_info=True)
    else:
        logger.info("No se detecto Python en el repo, saltando Bandit")

    # Semgrep
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
            logger.error(f"Semgrep fallo durante el scan: {e}", exc_info=True)
    else:
        logger.info("No se detecto JS/TS/JSX/TSX/C# en el repo, saltando Semgrep")

    # osv-scanner
    if has_dependency_manifests(repo_path):
        try:
            logger.info("Ejecutando osv-scanner (dependencias)")
            raw = run_osv_scanner(repo_path)
            vulns = normalize_osv(raw, repository_id, scan_id)
            all_vulns.extend(vulns)
            logger.info(f"osv-scanner: {len(vulns)} vulnerabilidades encontradas")
        except Exception as e:
            logger.error(f"osv-scanner fallo durante el scan: {e}", exc_info=True)
    else:
        logger.info("No se detectaron manifests de dependencias, saltando osv-scanner")

    # gitleaks
    try:
        logger.info("Ejecutando gitleaks (secretos)")
        raw = run_gitleaks(repo_path)
        vulns = normalize_gitleaks(raw, repository_id, scan_id, repo_path)
        all_vulns.extend(vulns)
        logger.info(f"gitleaks: {len(vulns)} secretos encontrados")
    except Exception as e:
        logger.error(f"gitleaks fallo durante el scan: {e}", exc_info=True)

    # checkov
    if has_iac_files(repo_path):
        try:
            logger.info("Ejecutando checkov (IaC)")
            raw = run_checkov(repo_path)
            vulns = normalize_checkov(raw, repository_id, scan_id, repo_path)
            all_vulns.extend(vulns)
            logger.info(f"checkov: {len(vulns)} configuraciones inseguras encontradas")
        except Exception as e:
            logger.error(f"checkov fallo durante el scan: {e}", exc_info=True)
    else:
        logger.info("No se detectaron archivos IaC, saltando checkov")

    return all_vulns