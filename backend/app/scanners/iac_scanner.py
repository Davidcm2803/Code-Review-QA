import os
from app.core.logger import logger

# tiene los nombres de archivo que checkov sabe interpretar
IAC_FILES = {
    "Dockerfile", "docker-compose.yml", "docker-compose.yaml",
}
IAC_EXTENSIONS = {".tf", ".yaml", ".yml"}


def has_iac_files(repo_path: str) -> bool:
    # revisa si el repo tiene archivos de infraestructura para escanear
    for root, _, files in os.walk(repo_path):
        root_parts = root.split(os.sep)
        if any(p in root_parts for p in ["node_modules", ".git", "venv", "__pycache__", ".venv"]):
            continue
        for f in files:
            if f in IAC_FILES:
                logger.info(f"Archivo IaC encontrado: {os.path.join(root, f)}")
                return True
            ext = os.path.splitext(f)[1].lower()
            if ext in IAC_EXTENSIONS and _looks_like_k8s_or_compose(f):
                logger.info(f"Archivo IaC encontrado: {os.path.join(root, f)}")
                return True
    return False


def _looks_like_k8s_or_compose(filename: str) -> bool:
    # filtra yaml genericos y solo deja pasar los que parecen manifests reales
    lower = filename.lower()
    keywords = ["deployment", "service", "k8s", "kube", "compose", "terraform", "pod", "ingress", "configmap"]
    return any(k in lower for k in keywords) or filename.endswith(".tf")