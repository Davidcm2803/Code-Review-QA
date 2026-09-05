import os
import re
import yaml
from app.core.logger import logger

RULES_PATH = os.path.join(os.path.dirname(__file__), "semgrep_rules", "iac_security.yml")


def _load_rules() -> dict:
    if not os.path.exists(RULES_PATH):
        logger.error(f"Ruleset de IaC no encontrado en {RULES_PATH}")
        return {"docker_compose_rules": [], "dockerfile_rules": []}
    with open(RULES_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _find_files(repo_path: str) -> tuple[list[str], list[str]]:
    compose_files = []
    dockerfiles = []
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".git", "venv", ".venv", "__pycache__")]
        for f in files:
            fl = f.lower()
            full = os.path.join(root, f)
            if fl in ("docker-compose.yml", "docker-compose.yaml") or fl.startswith("docker-compose."):
                compose_files.append(full)
            elif fl == "dockerfile" or fl.startswith("dockerfile."):
                dockerfiles.append(full)
    return compose_files, dockerfiles


def _get_nested(data: dict, key_path: str):
    parts = key_path.split(".")
    current = data
    for p in parts:
        if not isinstance(current, dict) or p not in current:
            return None
        current = current[p]
    return current


def _check_service_rule(service_name: str, service_def: dict, rule: dict, file_path: str) -> dict | None:
    match = rule.get("match", {})
    key_path = match.get("key_path")
    value = _get_nested(service_def, key_path) if key_path else None

    triggered = False

    if "equals" in match:
        triggered = value == match["equals"]

    elif "contains_substring" in match:
        if isinstance(value, list):
            triggered = any(match["contains_substring"] in str(v) for v in value)
        elif value is not None:
            triggered = match["contains_substring"] in str(value)

    elif "is_missing" in match:
        triggered = value is None

    elif "tag_is_latest_or_missing" in match:
        if isinstance(value, str):
            triggered = (":" not in value) or value.endswith(":latest")

    elif "port_binds_all_interfaces" in match:
        if isinstance(value, list):
            for port_entry in value:
                port_str = str(port_entry)
                # si NO especifica una IP (ej "8000:8000"), se asume 0.0.0.0
                if re.match(r"^\d+:\d+$", port_str.strip()):
                    triggered = True
                    break

    elif "key_name_regex" in match:
        if isinstance(value, dict):
            for k, v in value.items():
                if re.search(match["key_name_regex"], k) and v and not str(v).startswith("${"):
                    triggered = True
                    break
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, str) and "=" in item:
                    k, v = item.split("=", 1)
                    if re.search(match["key_name_regex"], k) and v and not v.startswith("${"):
                        triggered = True
                        break

    if not triggered:
        return None

    return {
        "check_id": rule["id"],
        "check_name": rule["check_name"],
        "check_result": {"result": "FAILED"},
        "file_path": file_path,
        "file_line_range": [1, 1],
        "resource": f"docker_compose.{service_name}",
        "guideline": rule.get("guideline", ""),
        "severity": rule.get("severity", "MEDIUM"),
    }


def _scan_compose_file(file_path: str, rules: list[dict]) -> list[dict]:
    findings = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
    except Exception as e:
        logger.warning(f"No se pudo parsear {file_path}: {e}")
        return findings

    if not isinstance(data, dict):
        return findings

    services = data.get("services", {})
    for service_name, service_def in services.items():
        if not isinstance(service_def, dict):
            continue
        for rule in rules:
            result = _check_service_rule(service_name, service_def, rule, file_path)
            if result:
                findings.append(result)

    return findings


def _scan_dockerfile(file_path: str, rules: list[dict]) -> list[dict]:
    findings = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception as e:
        logger.warning(f"No se pudo leer {file_path}: {e}")
        return findings

    instructions_present = set()
    env_arg_lines = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        parts = stripped.split(None, 1)
        if not parts:
            continue
        instruction = parts[0].upper()
        instructions_present.add(instruction)
        if instruction in ("ENV", "ARG") and len(parts) > 1:
            env_arg_lines.append((i + 1, instruction, parts[1]))

    for rule in rules:
        match = rule.get("match", {})

        if "instruction_missing" in match:
            if match["instruction_missing"] not in instructions_present:
                findings.append({
                    "check_id": rule["id"],
                    "check_name": rule["check_name"],
                    "check_result": {"result": "FAILED"},
                    "file_path": file_path,
                    "file_line_range": [1, 1],
                    "resource": os.path.basename(file_path),
                    "guideline": rule.get("guideline", ""),
                    "severity": rule.get("severity", "MEDIUM"),
                })

        elif "instruction_present" in match:
            if match["instruction_present"] in instructions_present:
                findings.append({
                    "check_id": rule["id"],
                    "check_name": rule["check_name"],
                    "check_result": {"result": "FAILED"},
                    "file_path": file_path,
                    "file_line_range": [1, 1],
                    "resource": os.path.basename(file_path),
                    "guideline": rule.get("guideline", ""),
                    "severity": rule.get("severity", "MEDIUM"),
                })

        elif "instruction_in" in match:
            regex = match.get("key_name_regex", "")
            for lineno, instruction, content in env_arg_lines:
                if instruction in match["instruction_in"] and re.search(regex, content):
                    findings.append({
                        "check_id": rule["id"],
                        "check_name": rule["check_name"],
                        "check_result": {"result": "FAILED"},
                        "file_path": file_path,
                        "file_line_range": [lineno, lineno],
                        "resource": os.path.basename(file_path),
                        "guideline": rule.get("guideline", ""),
                        "severity": rule.get("severity", "MEDIUM"),
                    })

    return findings


def run_iac_rules(repo_path: str) -> dict:

    rules = _load_rules()
    compose_rules = rules.get("docker_compose_rules", [])
    dockerfile_rules = rules.get("dockerfile_rules", [])

    compose_files, dockerfiles = _find_files(repo_path)

    all_findings = []
    for cf in compose_files:
        all_findings.extend(_scan_compose_file(cf, compose_rules))
    for df in dockerfiles:
        all_findings.extend(_scan_dockerfile(df, dockerfile_rules))

    logger.info(f"iac_rules encontro {len(all_findings)} configuraciones inseguras")
    return {"results": {"failed_checks": all_findings}}