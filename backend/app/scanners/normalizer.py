from typing import List, Dict, Any

# Mapa de severidad de Bandit
SEVERITY_MAP = {
    "HIGH":   "high",
    "MEDIUM": "medium",
    "LOW":    "low",
}

# Si confidence es HIGH y severity es HIGH 
def _resolve_severity(severity: str, confidence: str) -> str:
    if severity == "HIGH" and confidence == "HIGH":
        return "critical"
    return SEVERITY_MAP.get(severity, "low")


def normalize_bandit(raw: dict, repository_id: str, scan_id: str) -> List[Dict[str, Any]]:
    #Convierte el resultado de Bandit al schema de MongoDB
    results = raw.get("results", [])
    normalized = []

    for item in results:
        severity = _resolve_severity(
            item.get("issue_severity", "LOW"),
            item.get("issue_confidence", "LOW"),
        )

        vuln = {
            "scan_id":                    scan_id,
            "repository_id":              repository_id,
            "title":                      item.get("issue_text", "Unknown issue"),
            "description":                (
                f"{item.get('issue_text', '')}. "
                f"Test ID: {item.get('test_id', '')} — {item.get('test_name', '')}. "
                f"Confidence: {item.get('issue_confidence', 'UNKNOWN')}."
            ),
            "severity":                   severity,
            "detector_source":            "bandit",
            "file_path":                  _strip_prefix(item.get("filename", "")),
            "line_start":                 item.get("line_number", 0),
            "line_end":                   item.get("line_range", [item.get("line_number", 0)])[-1],
            "vulnerable_code":            item.get("code", "").strip(),
            "remediation_recommendation": _get_remediation(item.get("test_id", ""), item.get("more_info", "")),
            "status":                     "open",
        }
        normalized.append(vuln)

    return normalized


# Mapa de severidad de Semgrep
SEMGREP_SEVERITY_MAP = {
    "ERROR":   "high",
    "WARNING": "medium",
    "INFO":    "low",
}


def _resolve_semgrep_severity(severity: str, confidence: str) -> str:
    if severity == "ERROR" and confidence == "HIGH":
        return "critical"
    return SEMGREP_SEVERITY_MAP.get(severity, "low")


def normalize_semgrep(raw: dict, repository_id: str, scan_id: str, repo_path: str) -> List[Dict[str, Any]]:
    #Convierte el resultado de Semgrep al schema de MongoDB
    results = raw.get("results", [])
    normalized = []

    for item in results:
        extra = item.get("extra", {})
        metadata = extra.get("metadata", {})

        severity = _resolve_semgrep_severity(
            extra.get("severity", "INFO"),
            metadata.get("confidence", "LOW"),
        )

        start_line = item.get("start", {}).get("line", 0)
        end_line = item.get("end", {}).get("line", start_line)
        check_id = item.get("check_id", "unknown-rule")

        vuln = {
            "scan_id":                    scan_id,
            "repository_id":              repository_id,
            "title":                      extra.get("message", "Unknown issue").split(".")[0][:200],
            "description":                (
                f"{extra.get('message', '')}. "
                f"Regla: {check_id}. "
                f"OWASP: {', '.join(metadata.get('owasp', [])) or 'N/A'}."
            ),
            "severity":                   severity,
            "detector_source":            "semgrep",
            "file_path":                  _strip_repo_path(item.get("path", ""), repo_path),
            "line_start":                 start_line,
            "line_end":                   end_line,
            "vulnerable_code":            _extract_snippet(item.get("path", ""), start_line, end_line),
            "remediation_recommendation": _get_semgrep_remediation(metadata),
            "status":                     "open",
        }
        normalized.append(vuln)

    return normalized


# osv-scanner (dependencias)

def _resolve_osv_severity(severity_list: list) -> str:
    # esta funcion busca el score CVSS y lo convierte a nuestra escala de severidad
    for s in severity_list:
        if s.get("type") in ("CVSS_V3", "CVSS_V4"):
            score_str = s.get("score", "")
            try:
                score = float(score_str)
            except (ValueError, TypeError):
                continue
            if score >= 9.0:
                return "critical"
            elif score >= 7.0:
                return "high"
            elif score >= 4.0:
                return "medium"
            else:
                return "low"
    return "medium"


def _extract_fixed_versions(vuln: dict) -> list:
    # esta funcion junta todas las versiones donde ya se arreglo la vulnerabilidad
    fixed = []
    for affected in vuln.get("affected", []):
        for r in affected.get("ranges", []):
            for event in r.get("events", []):
                if event.get("fixed"):
                    fixed.append(event["fixed"])
    return fixed


def normalize_osv(raw: dict, repository_id: str, scan_id: str) -> List[Dict[str, Any]]:
    # esta funcion convierte el resultado de osv-scanner al schema de MongoDB
    normalized = []

    for result in raw.get("results", []):
        manifest_path = result.get("source", {}).get("path", "unknown")

        for pkg_entry in result.get("packages", []):
            pkg = pkg_entry.get("package", {})
            pkg_name = pkg.get("name", "unknown")
            pkg_version = pkg.get("version", "")
            pkg_ref = f"{pkg_name}@{pkg_version}" if pkg_version else pkg_name

            for vuln in pkg_entry.get("vulnerabilities", []):
                vuln_id = vuln.get("id", "UNKNOWN-CVE")
                severity = _resolve_osv_severity(vuln.get("severity", []))
                fixed_versions = _extract_fixed_versions(vuln)
                summary = (vuln.get("summary") or vuln.get("details", "") or "Sin descripcion disponible.")

                aliases = vuln.get("aliases", [])
                alias_str = f" ({', '.join(aliases)})" if aliases else ""

                remediation = (
                    f"Actualizar {pkg_name} a la version {fixed_versions[0]} o superior."
                    if fixed_versions
                    else f"No hay fix publicado aun para {pkg_name}. Monitorear el advisory."
                )
                remediation += f" Detalle: https://osv.dev/vulnerability/{vuln_id}"

                normalized.append({
                    "scan_id":                    scan_id,
                    "repository_id":              repository_id,
                    "title":                      f"{vuln_id} en {pkg_ref}{alias_str}"[:200],
                    "description":                summary[:500],
                    "severity":                   severity,
                    "detector_source":            "osv-scanner",
                    "file_path":                  manifest_path,
                    "line_start":                 0,
                    "line_end":                   0,
                    "vulnerable_code":            pkg_ref,
                    "remediation_recommendation": remediation,
                    "status":                     "open",
                })

    return normalized


# gitleaks (secretos)

def _redact_secret(match: str, secret: str) -> str:
    # esta funcion enmascara el secreto real para no guardarlo en texto plano en Mongo
    if not secret:
        return match[:80]
    if len(secret) <= 8:
        masked = "*" * len(secret)
    else:
        masked = secret[:4] + "*" * (len(secret) - 8) + secret[-4:]
    return match.replace(secret, masked)[:200]


def normalize_gitleaks(raw: list, repository_id: str, scan_id: str, repo_path: str) -> List[Dict[str, Any]]:
    # esta funcion convierte el resultado de gitleaks al schema de MongoDB
    normalized = []

    for item in raw:
        rule_id = item.get("RuleID", "unknown-rule")
        secret = item.get("Secret", "")
        match = item.get("Match", "")
        file_path = item.get("File", "")

        rel_path = _strip_repo_path(file_path.replace("\\", "/"), repo_path)

        vuln = {
            "scan_id":                    scan_id,
            "repository_id":              repository_id,
            "title":                      f"Secreto expuesto: {rule_id}",
            "description":                (
                f"Se detecto un posible secreto de tipo '{rule_id}' expuesto en el codigo. "
                f"Commit: {item.get('Commit', 'N/A')[:12] if item.get('Commit') else 'N/A'}."
            ),
            "severity":                   "critical",
            "detector_source":            "gitleaks",
            "file_path":                  rel_path,
            "line_start":                 item.get("StartLine", 0),
            "line_end":                   item.get("EndLine", item.get("StartLine", 0)),
            "vulnerable_code":            _redact_secret(match, secret),
            "remediation_recommendation": (
                "Revocar y rotar esta credencial inmediatamente en el proveedor correspondiente. "
                "Eliminar del codigo y mover a variables de entorno o a un gestor de secretos "
                "(Vault, AWS Secrets Manager, etc). Si el repo es publico o el secreto llego a "
                "un commit, considerar la credencial comprometida aunque se elimine del codigo."
            ),
            "status":                     "open",
        }
        normalized.append(vuln)

    return normalized


# checkov (IaC)

def _resolve_checkov_severity(check_id: str, guideline: str) -> str:
    # esta funcion asigna severidad porque checkov no siempre trae un campo severity usable
    high_risk_prefixes = ("CKV_DOCKER", "CKV_K8S", "CKV_AWS")
    if check_id.startswith(high_risk_prefixes):
        return "high"
    return "medium"


def normalize_checkov(raw: dict, repository_id: str, scan_id: str, repo_path: str) -> List[Dict[str, Any]]:
    # esta funcion convierte el resultado de checkov al schema de MongoDB
    failed_checks = raw.get("results", {}).get("failed_checks", [])
    normalized = []

    for item in failed_checks:
        check_id = item.get("check_id", "unknown-check")
        file_path = item.get("file_path", "")
        file_line_range = item.get("file_line_range", [0, 0])
        guideline = item.get("guideline", "")

        vuln = {
            "scan_id":                    scan_id,
            "repository_id":              repository_id,
            "title":                      item.get("check_name", "Configuracion insegura detectada")[:200],
            "description":                (
                f"Regla: {check_id}. Recurso: {item.get('resource', 'N/A')}. "
                f"Archivo: {file_path}."
            ),
            "severity":                   _resolve_checkov_severity(check_id, guideline),
            "detector_source":            "checkov",
            "file_path":                  _strip_repo_path(file_path.replace("\\", "/"), repo_path),
            "line_start":                 file_line_range[0] if file_line_range else 0,
            "line_end":                   file_line_range[-1] if file_line_range else 0,
            "vulnerable_code":            "",
            "remediation_recommendation": (
                f"Revisar la configuracion de '{item.get('resource', 'N/A')}' segun la guia de la regla {check_id}."
                + (f" Mas info: {guideline}" if guideline else "")
            ),
            "status":                     "open",
        }
        normalized.append(vuln)

    return normalized


# --- helpers compartidos entre detectores ---

def _extract_snippet(file_path: str, start_line: int, end_line: int) -> str:
    # Semgrep  requiere login
    if not file_path or not start_line:
        return ""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
        # Lineas de semgrep son 1-indexed 
        snippet = lines[start_line - 1:end_line]
        return "".join(snippet).strip()
    except (OSError, IndexError):
        return ""


def _strip_repo_path(path: str, repo_path: str) -> str:
    # Convierte el path absoluto que devuelve semgrep en un path relativo al repo
    normalized_path = path.replace("\\", "/")
    normalized_repo = repo_path.replace("\\", "/").rstrip("/")
    if normalized_path.startswith(normalized_repo):
        return normalized_path[len(normalized_repo):].lstrip("/")
    return _strip_prefix(normalized_path)


def _get_semgrep_remediation(metadata: dict) -> str:
    references = metadata.get("references", [])
    base = "Revisar el patron detectado y aplicar las practicas seguras recomendadas por la regla de Semgrep."
    if references:
        base += f" Mas info: {references[0]}"
    return base


def compute_metrics(vulns: List[Dict]) -> Dict[str, int]:
    metrics = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for v in vulns:
        sev = v.get("severity", "low")
        if sev in metrics:
            metrics[sev] += 1
    return metrics


def compute_security_score(metrics: Dict[str, int]) -> int:
    #Score de 0-100 puntos dependiento de si es critico o no
    #100 = sin vulnerabilidades.

    penalty = (
        metrics.get("critical", 0) * 25 +
        metrics.get("high",     0) * 10 +
        metrics.get("medium",   0) * 3  +
        metrics.get("low",      0) * 1
    )
    return max(0, 100 - penalty)



def _strip_prefix(path: str) -> str:
    # Elimina el prefijo del directorio temporal del path del archivo
    normalized = path.replace("\\", "/")
    parts = normalized.split("/")

    for i, part in enumerate(parts):
        if part.startswith("aisecure_"):
            return "/".join(parts[i + 1:])
    return normalized

#helpers con el significado de cada tag de bandit
def _get_remediation(test_id: str, more_info_url: str) -> str:
    REMEDIATIONS = {
        "B101": "Evitar el uso de assert en código de producción para validaciones de seguridad. Usar excepciones explícitas.",
        "B102": "No usar exec() con input externo. Rediseñar la lógica sin ejecución dinámica de código.",
        "B103": "Permisos de archivo demasiado permisivos. Usar permisos mínimos necesarios (ej: 0o600).",
        "B104": "Binding a 0.0.0.0 expone el servicio a todas las interfaces. Restringir a la interfaz necesaria.",
        "B105": "Contraseña hardcodeada detectada. Usar variables de entorno o un gestor de secretos.",
        "B106": "Contraseña hardcodeada en argumento. Usar variables de entorno o un gestor de secretos.",
        "B107": "Contraseña hardcodeada en URL. Usar variables de entorno o un gestor de secretos.",
        "B108": "Uso de directorio temporal inseguro. Usar tempfile.mkstemp() o tempfile.mkdtemp().",
        "B110": "Bloque try/except vacío que silencia errores. Manejar la excepción explícitamente o loguearla.",
        "B112": "Uso de continue en except silencia errores. Manejar la excepción explícitamente.",
        "B201": "Flask app con debug=True en producción expone el debugger interactivo. Deshabilitar en producción.",
        "B202": "Flask app con debug=True. Asegurarse de que DEBUG=False en producción.",
        "B301": "Uso de pickle puede ejecutar código arbitrario al deserializar. Usar JSON u otro formato seguro.",
        "B302": "Uso de marshal puede ser inseguro. Considerar alternativas más seguras.",
        "B303": "Uso de MD5 para hashing criptográfico es inseguro. Usar SHA-256 o bcrypt para contraseñas.",
        "B304": "Uso de cifrado débil (DES/RC2/RC4/Blowfish). Usar AES-256.",
        "B305": "Uso de modo ECB en cifrado. Usar modos seguros como GCM o CBC con IV aleatorio.",
        "B306": "Uso de mktemp() es inseguro (race condition). Usar tempfile.mkstemp().",
        "B307": "Uso de eval() con input externo permite ejecución de código arbitrario. Usar ast.literal_eval() para datos simples.",
        "B308": "Uso de mark_safe() con input del usuario puede causar XSS. Escapar el contenido antes.",
        "B310": "URL construida con input del usuario puede causar SSRF. Validar y whitelist las URLs.",
        "B311": "Uso de random para valores de seguridad. Usar secrets o os.urandom() para valores criptográficos.",
        "B312": "Uso de telnetlib transmite datos en texto plano. Usar SSH.",
        "B313": "Parsing XML sin protección contra XXE. Usar defusedxml.",
        "B314": "Parsing XML sin protección contra XXE. Usar defusedxml.",
        "B315": "Parsing XML sin protección contra XXE. Usar defusedxml.",
        "B316": "Parsing XML sin protección contra XXE. Usar defusedxml.",
        "B317": "Parsing XML sin protección contra XXE. Usar defusedxml.",
        "B318": "Parsing XML sin protección contra XXE. Usar defusedxml.",
        "B319": "Parsing XML sin protección contra XXE. Usar defusedxml.",
        "B320": "Parsing XML sin protección contra XXE. Usar defusedxml.",
        "B321": "Uso de FTP transmite datos en texto plano. Usar SFTP.",
        "B322": "Uso de input() en Python 2 es equivalente a eval(). Usar raw_input() o migrar a Python 3.",
        "B323": "Verificación de certificado SSL deshabilitada. Siempre verificar certificados en producción.",
        "B324": "Uso de MD5 o SHA1 para hashing. Usar SHA-256 como mínimo.",
        "B325": "Uso de mktemp() es inseguro. Usar tempfile.mkstemp().",
        "B401": "Import de módulo de red inseguro. Revisar el uso y asegurarse de que sea necesario.",
        "B402": "Import de módulo FTP. Los datos viajan en texto plano.",
        "B403": "Import de pickle puede ser peligroso. Asegurarse de deserializar solo datos confiables.",
        "B404": "Import de subprocess. Asegurarse de no pasar input del usuario directamente.",
        "B405": "Import de xml.etree vulnerable a XXE. Usar defusedxml.",
        "B406": "Import de xml.sax vulnerable a XXE. Usar defusedxml.",
        "B407": "Import de xml.expat vulnerable a XXE. Usar defusedxml.",
        "B408": "Import de xml.dom vulnerable a XXE. Usar defusedxml.",
        "B409": "Import de xml.etree vulnerable a XXE. Usar defusedxml.",
        "B410": "Import de lxml. Asegurarse de usar resolve_entities=False.",
        "B411": "Import de xmlrpc puede ser peligroso. Asegurarse de validar los datos recibidos.",
        "B412": "Import de módulo obsoleto con problemas de seguridad conocidos.",
        "B413": "Import de pycrypto (sin mantenimiento). Migrar a pycryptodome o cryptography.",
        "B501": "Verificación SSL/TLS deshabilitada. Habilitar verificación de certificados.",
        "B502": "Versión de SSL/TLS insegura. Usar TLS 1.2 o superior.",
        "B503": "Versión de SSL/TLS insegura. Usar TLS 1.2 o superior.",
        "B504": "Versión de SSL/TLS insegura. Usar TLS 1.2 o superior.",
        "B505": "Tamaño de clave RSA/DSA insuficiente. Usar mínimo 2048 bits para RSA.",
        "B506": "Uso de yaml.load() sin Loader puede ejecutar código arbitrario. Usar yaml.safe_load().",
        "B507": "Verificación de host SSH deshabilitada. Habilitar verificación de host.",
        "B601": "Uso de shell=True en subprocess con input del usuario permite inyección de comandos.",
        "B602": "Llamada a subprocess con shell=True. Evitar pasar input del usuario directamente.",
        "B603": "Uso de subprocess sin shell=True. Verificar que los argumentos no vengan de input del usuario.",
        "B604": "Llamada a función con shell=True. Evitar input del usuario en comandos de shell.",
        "B605": "Uso de os.system() con input del usuario permite inyección de comandos. Usar subprocess con lista de args.",
        "B606": "Uso de os.popen() sin shell. Verificar argumentos.",
        "B607": "Inicio de proceso con path parcial. Usar path absoluto para evitar ataques de PATH hijacking.",
        "B608": "Posible inyección SQL detectada. Usar prepared statements o un ORM.",
        "B609": "Uso de wildcard en llamada a Linux. Puede ser explotado via inyección de argumentos.",
        "B610": "Uso de extra() de Django con input del usuario puede causar SQL injection.",
        "B611": "Uso de RawSQL de Django con input del usuario puede causar SQL injection.",
        "B701": "Uso de jinja2 con autoescape deshabilitado. Habilitar autoescape para prevenir XSS.",
        "B702": "Uso de Mako templates sin escapado. Escapar el output para prevenir XSS.",
        "B703": "Uso de mark_safe() de Django. Asegurarse de que el contenido esté sanitizado.",
    }
    base = REMEDIATIONS.get(test_id, "Revisar la documentación de seguridad y aplicar las mejores prácticas.")
    if more_info_url:
        base += f" Más info: {more_info_url}"
    return base