import subprocess
import json
import shutil
from app.core.logger import logger

# Packs especificos por lenguaje detectado. A diferencia de un pack
# multi-lenguaje como p/owasp-top-ten (que carga reglas de TODOS los
# lenguajes que Semgrep soporta, incluso los que no estan en el repo),
# estos solo cargan las reglas relevantes al lenguaje real presente,
# reduciendo drasticamente el numero de reglas en memoria.
LANGUAGE_CONFIGS = {
    "javascript": ["p/javascript"],
    "typescript": ["p/typescript"],
    "csharp":     ["p/csharp"],
}

# Carpetas que nunca deben escanearse: dependencias de terceros,
# builds compilados, entornos virtuales, etc.
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

# Patrones de archivo que casi nunca aportan hallazgos reales y son caros
# de analizar (bundles minificados, sourcemaps, assets compilados).
EXCLUDE_PATTERNS = [
    "*.min.js",
    "*.bundle.js",
    "*.map",
    "*.lock",
]

# Semgrep tarda proporcional al tamano de archivo. Saltar archivos muy
# grandes (ej. bundles no excluidos por nombre) evita que un solo archivo
# dispare minutos de analisis.
MAX_TARGET_BYTES = 500_000  # ~500KB por archivo

# IMPORTANTE: este limite debe quedar BIEN por debajo del limite total
# de memoria del contenedor (512MB en Render Free), dejando espacio para
# FastAPI, Uvicorn, el driver de Mongo, etc. Un valor anterior de 700MB
# era mayor al total disponible, por lo que nunca se activaba a tiempo:
# el sistema operativo mataba el contenedor completo antes de que
# Semgrep respetara su propio limite interno.
SEMGREP_MAX_MEMORY_MB = 300


def build_configs(languages: list[str]) -> list[str]:
    configs = set()
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

    cmd = [
        "semgrep", "scan",
        "--json",
        "--quiet",
        "--error",
        "--metrics=off",
        "--jobs", "1",
        "--max-memory", str(SEMGREP_MAX_MEMORY_MB),
        "--max-target-bytes", str(MAX_TARGET_BYTES),
    ]
    for d in EXCLUDE_DIRS:
        cmd += ["--exclude", d]
    for p in EXCLUDE_PATTERNS:
        cmd += ["--exclude", p]
    for cfg in configs:
        cmd += ["--config", cfg]
    cmd.append(repo_path)

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
        )
        if not result.stdout.strip():
            stderr = result.stderr.strip()
            logger.warning(f"Semgrep no produjo output. stderr: {stderr}")
            return {"results": [], "errors": [stderr] if stderr else []}

        data = json.loads(result.stdout)
        logger.info(f"Semgrep encontro {len(data.get('results', []))} issues")
        return data

    except subprocess.TimeoutExpired:
        logger.error("Semgrep timeout (120s)")
        return {"results": [], "errors": ["Semgrep timeout"]}
    except json.JSONDecodeError as e:
        logger.error(f"Semgrep JSON parse error: {e}")
        return {"results": [], "errors": [str(e)]}
    except FileNotFoundError:
        logger.error("Semgrep no encontrado")
        return {"results": [], "errors": ["Semgrep not found"]}