import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from app.core.logger import logger
from app.scanners.engines.bandit_engine import run_bandit
from app.scanners.engines.semgrep_engine import run_semgrep, build_configs
from app.scanners.engines.dependency_engine import run_osv_scanner
from app.scanners.engines.gitleaks_engine import run_gitleaks
from app.scanners.engines.iac_rules_engine import run_iac_rules
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


def _run_bandit_job(repo_path, repository_id, scan_id):
    logger.info("Ejecutando Bandit (Python)")
    raw = run_bandit(repo_path)
    vulns = normalize_bandit(raw, repository_id, scan_id)
    logger.info(f"Bandit: {len(vulns)} vulnerabilidades encontradas")
    return vulns


def _run_semgrep_job(repo_path, repository_id, scan_id, semgrep_langs):
    logger.info(f"Ejecutando Semgrep ({', '.join(semgrep_langs)})")
    configs = build_configs(semgrep_langs)
    raw = run_semgrep(repo_path, configs)
    vulns = normalize_semgrep(raw, repository_id, scan_id, repo_path)
    logger.info(f"Semgrep: {len(vulns)} vulnerabilidades encontradas")
    return vulns


def _run_osv_job(repo_path, repository_id, scan_id):
    logger.info("Ejecutando osv-scanner (dependencias)")
    raw = run_osv_scanner(repo_path)
    vulns = normalize_osv(raw, repository_id, scan_id)
    logger.info(f"osv-scanner: {len(vulns)} vulnerabilidades encontradas")
    return vulns


def _run_gitleaks_job(repo_path, repository_id, scan_id):
    logger.info("Ejecutando gitleaks (secretos)")
    raw = run_gitleaks(repo_path)
    vulns = normalize_gitleaks(raw, repository_id, scan_id, repo_path)
    logger.info(f"gitleaks: {len(vulns)} secretos encontrados")
    return vulns


def _run_checkov_job(repo_path, repository_id, scan_id):
    logger.info("Ejecutando checkov (IaC)")
    raw = run_iac_rules(repo_path)
    vulns = normalize_checkov(raw, repository_id, scan_id, repo_path)
    logger.info(f"checkov: {len(vulns)} configuraciones inseguras encontradas")
    return vulns


MAX_PARALLEL_SCANNERS = 1  


def run_scan(repo_path: str, repository_id: str, scan_id: str) -> list[dict]:
    # corre los engines en paralelo, pero limitado a MAX_PARALLEL_SCANNERS

    languages = detect_languages(repo_path)
    semgrep_langs = [lang for lang in languages if lang in SEMGREP_LANGUAGES]

    jobs = {}

    if "python" in languages:
        jobs["bandit"] = (_run_bandit_job, (repo_path, repository_id, scan_id))
    else:
        logger.info("No se detecto Python en el repo, saltando Bandit")

    if semgrep_langs:
        jobs["semgrep"] = (_run_semgrep_job, (repo_path, repository_id, scan_id, semgrep_langs))
    else:
        logger.info("No se detecto JS/TS/JSX/TSX/C# en el repo, saltando Semgrep")

    if has_dependency_manifests(repo_path):
        jobs["osv-scanner"] = (_run_osv_job, (repo_path, repository_id, scan_id))
    else:
        logger.info("No se detectaron manifests de dependencias, saltando osv-scanner")

    jobs["gitleaks"] = (_run_gitleaks_job, (repo_path, repository_id, scan_id))

    if has_iac_files(repo_path):
        jobs["checkov"] = (_run_checkov_job, (repo_path, repository_id, scan_id))
    else:
        logger.info("No se detectaron archivos IaC, saltando checkov")

    all_vulns = []

    max_workers = min(MAX_PARALLEL_SCANNERS, len(jobs)) or 1

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_name = {
            executor.submit(fn, *args): name
            for name, (fn, args) in jobs.items()
        }
        for future in as_completed(future_to_name):
            name = future_to_name[future]
            try:
                vulns = future.result()
                all_vulns.extend(vulns)
            except Exception as e:
                logger.error(f"{name} fallo durante el scan: {e}", exc_info=True)

    return all_vulns