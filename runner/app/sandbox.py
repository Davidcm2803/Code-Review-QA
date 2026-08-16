from __future__ import annotations

import json
import logging
import os
import re
import shutil
import subprocess
import tempfile
import time
import uuid
from dataclasses import dataclass, field
from urllib.parse import urlparse, urlunparse

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("sandbox")

CLONE_TIMEOUT = 60
BUILD_TIMEOUT = 90
CONTAINER_START_TIMEOUT = 15
HEALTHCHECK_TIMEOUT = 30
NUCLEI_TIMEOUT = 120
DEFAULT_PORTS = [8000, 8080, 3000, 5000, 80]

NUCLEI_ARGS = [
    "-severity", "critical,high",
    "-timeout", "5",
    "-rate-limit", "100",
    "-jsonl",
    "-silent",
]


@dataclass
class DastResult:
    status: str  # completed | skipped | error
    reason: str | None = None
    findings: list[dict] = field(default_factory=list)


def run_dast(clone_url: str, branch: str, scan_id: str, github_token: str | None = None) -> DastResult:
    run_id = f"{scan_id}-{uuid.uuid4().hex[:6]}"
    image_tag = f"scan-{run_id}"
    net_name = f"scan-net-{run_id}"
    container_name = f"scan-target-{run_id}"
    repo_path = None

    try:
        repo_path = _clone_repo(clone_url, branch, github_token)

        dockerfile_path = _find_dockerfile(repo_path)
        if not dockerfile_path:
            return DastResult(status="skipped", reason="No se encontró Dockerfile en la raíz del repo")

        port = _detect_port(dockerfile_path)

        log.info(f"[{run_id}] Build de la imagen...")
        _build_image(repo_path, dockerfile_path, image_tag)

        log.info(f"[{run_id}] Creando red aislada (sin salida a internet)...")
        _create_isolated_network(net_name)

        log.info(f"[{run_id}] Levantando el contenedor objetivo...")
        _run_target_container(image_tag, container_name, net_name)

        log.info(f"[{run_id}] Esperando healthcheck en puerto {port}...")
        if not _wait_healthy(container_name, port, net_name):
            return DastResult(status="error", reason=f"La app no respondió en el puerto {port} a tiempo")

        log.info(f"[{run_id}] Ejecutando Nuclei...")
        findings = _run_nuclei(container_name, port, net_name)

        return DastResult(status="completed", findings=findings)

    except subprocess.TimeoutExpired as e:
        log.error(f"[{run_id}] Timeout: {e}")
        return DastResult(status="error", reason=f"Timeout durante: {e.cmd}")
    except Exception as e:  # noqa: BLE001
        log.error(f"[{run_id}] Error: {e}", exc_info=True)
        return DastResult(status="error", reason=str(e))
    finally:
        _cleanup(container_name, net_name, image_tag)
        if repo_path:
            shutil.rmtree(repo_path, ignore_errors=True)

def _inject_token(clone_url: str, github_token: str | None) -> str:
    if not github_token:
        return clone_url
    parsed = urlparse(clone_url)
    netloc = f"x-access-token:{github_token}@{parsed.hostname}"
    if parsed.port:
        netloc += f":{parsed.port}"
    return urlunparse(parsed._replace(netloc=netloc))


def _clone_repo(clone_url: str, branch: str, github_token: str | None) -> str:
    tmp_dir = tempfile.mkdtemp(prefix="dast_")
    authenticated_url = _inject_token(clone_url, github_token)
    result = subprocess.run(
        ["git", "clone", "--depth", "1", "--branch", branch, authenticated_url, tmp_dir],
        capture_output=True, text=True, timeout=CLONE_TIMEOUT,
    )
    if result.returncode != 0:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        safe_err = result.stderr.replace(github_token or "", "***")
        raise RuntimeError(f"git clone falló: {safe_err.strip()}")
    return tmp_dir


COMMON_DOCKERFILE_LOCATIONS = [
    "Dockerfile",
    "backend/Dockerfile",
    "backend/docker/Dockerfile",
    "docker/Dockerfile",
    "app/Dockerfile",
    "server/Dockerfile",
]


def _find_dockerfile(repo_path: str) -> str | None:
    for rel_path in COMMON_DOCKERFILE_LOCATIONS:
        candidate = os.path.join(repo_path, rel_path)
        if os.path.isfile(candidate):
            return candidate

    for root, dirs, files in os.walk(repo_path):
        depth = root[len(repo_path):].count(os.sep)
        if depth >= 2:
            dirs[:] = []  # no seguir bajando
            continue
        if "node_modules" in dirs:
            dirs.remove("node_modules")
        if ".git" in dirs:
            dirs.remove(".git")
        if "Dockerfile" in files:
            return os.path.join(root, "Dockerfile")

    return None


def _detect_port(dockerfile_path: str) -> int:
    with open(dockerfile_path, "r", errors="replace") as f:
        content = f.read()
    match = re.search(r"^\s*EXPOSE\s+(\d+)", content, re.MULTILINE)
    if match:
        return int(match.group(1))
    return DEFAULT_PORTS[0]


def _prepare_build_context(repo_path: str, dockerfile_path: str) -> tuple[str, str]:
    """
    Docker prohíbe que un COPY/ADD salga del árbol del contexto, sin importar
    qué carpeta elijas como contexto — si el Dockerfile hace "COPY ../algo" o
    incluso "COPY ..", NINGÚN contexto sirve tal cual porque ese archivo no
    existe dentro del tar que se le manda al daemon.
    Devuelve (build_context_dir, path_al_dockerfile_dentro_del_contexto).
    """
    dockerfile_dir = os.path.dirname(dockerfile_path)
    build_dir = tempfile.mkdtemp(prefix="dctx_")

    shutil.copytree(
        dockerfile_dir, build_dir, dirs_exist_ok=True,
        ignore=shutil.ignore_patterns(".git"),
    )

    with open(dockerfile_path, "r", errors="replace") as f:
        lines = f.readlines()

    repo_path_norm = os.path.normpath(repo_path)
    patched_lines = []
    ext_counter = 0

    for line in lines:
        stripped = line.strip()
        upper = stripped.upper()
        is_copy_or_add = upper.startswith("COPY ") or upper.startswith("ADD ")

        if is_copy_or_add and "--from=" not in stripped.lower():
            parts = stripped.split()
            instruction, args = parts[0], parts[1:]

            if len(args) >= 2:
                sources, dest = args[:-1], args[-1]
                new_sources = []

                for src in sources:
                    escapes_context = src == ".." or src.startswith("../")

                    if escapes_context:
                        abs_src = os.path.normpath(os.path.join(dockerfile_dir, src))
                        inside_repo = (
                            os.path.exists(abs_src)
                            and os.path.commonpath([abs_src, repo_path_norm]) == repo_path_norm
                        )
                        if inside_repo:
                            ext_counter += 1
                            staged_name = f"_ext_{ext_counter}"
                            dest_in_ctx = os.path.join(build_dir, staged_name)
                            if os.path.isdir(abs_src):
                                shutil.copytree(
                                    abs_src, dest_in_ctx, dirs_exist_ok=True,
                                    ignore=shutil.ignore_patterns(".git", "node_modules"),
                                )
                            else:
                                shutil.copy2(abs_src, dest_in_ctx)
                            new_sources.append(staged_name)
                        else:
                            # no se pudo resolver dentro del repo, se deja igual
                            # (fallará con un error claro en vez de silencioso)
                            new_sources.append(src)
                    else:
                        new_sources.append(src)

                line = f"{instruction} {' '.join(new_sources)} {dest}\n"

        patched_lines.append(line)

    patched_dockerfile = os.path.join(build_dir, "Dockerfile.qacode")
    with open(patched_dockerfile, "w") as f:
        f.writelines(patched_lines)

    return build_dir, patched_dockerfile


def _build_image(repo_path: str, dockerfile_path: str, image_tag: str) -> None:
    build_context, effective_dockerfile = _prepare_build_context(repo_path, dockerfile_path)
    try:
        result = subprocess.run(
            ["docker", "build", "--network=default", "-t", image_tag, "-f", effective_dockerfile, build_context],
            capture_output=True, text=True, timeout=BUILD_TIMEOUT,
        )
        if result.returncode != 0:
            raise RuntimeError(f"docker build falló: {result.stderr[-1000:]}")
    finally:
        shutil.rmtree(build_context, ignore_errors=True)


def _create_isolated_network(net_name: str) -> None:
    # --internal = sin ruta a internet ni a otras redes del host
    subprocess.run(
        ["docker", "network", "create", "--internal", net_name],
        capture_output=True, text=True, timeout=15, check=True,
    )


def _run_target_container(image_tag: str, container_name: str, net_name: str) -> None:
    result = subprocess.run(
        [
            "docker", "run", "-d",
            "--name", container_name,
            "--network", net_name,
            "--memory", "512m",
            "--cpus", "1",
            "--security-opt", "no-new-privileges",
            "--pids-limit", "256",
            image_tag,
        ],
        capture_output=True, text=True, timeout=CONTAINER_START_TIMEOUT,
    )
    if result.returncode != 0:
        raise RuntimeError(f"docker run falló: {result.stderr.strip()}")


def _wait_healthy(container_name: str, port: int, net_name: str) -> bool:
    deadline = time.time() + HEALTHCHECK_TIMEOUT
    url = f"http://{container_name}:{port}"
    while time.time() < deadline:
        probe = subprocess.run(
            [
                "docker", "run", "--rm", "--network", net_name,
                "curlimages/curl:latest", "-sf", "-o", "/dev/null",
                "--max-time", "3", url,
            ],
            capture_output=True, timeout=10,
        )
        if probe.returncode == 0:
            return True
        time.sleep(2)
    return False


def _run_nuclei(container_name: str, port: int, net_name: str) -> list[dict]:
    url = f"http://{container_name}:{port}"
    result = subprocess.run(
        ["docker", "run", "--rm", "--network", net_name,
         "projectdiscovery/nuclei:latest", "-u", url, *NUCLEI_ARGS],
        capture_output=True, text=True, timeout=NUCLEI_TIMEOUT,
    )
    findings = []
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            findings.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return findings


def _cleanup(container_name: str, net_name: str, image_tag: str) -> None:
    for cmd in (
        ["docker", "rm", "-f", container_name],
        ["docker", "network", "rm", net_name],
        ["docker", "rmi", "-f", image_tag],
    ):
        subprocess.run(cmd, capture_output=True, timeout=20)