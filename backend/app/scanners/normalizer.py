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


def compute_metrics(vulns: List[Dict]) -> Dict[str, int]:
    #Cuenta vulnerabilidades para metricas
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