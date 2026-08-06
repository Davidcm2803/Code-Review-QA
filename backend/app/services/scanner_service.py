import os
import asyncio
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import UploadFile
from app.database.connection import get_db
from app.services.repo_fetcher_service import (
    fetch_repo,
    cleanup_repo,
    create_temp_workspace_from_files,
)
from app.scanners.scan_orchestrator import run_scan
from app.scanners.normalizer import compute_metrics, compute_security_score
from app.core.logger import logger


ALLOWED_EXTENSIONS = {".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cs"}
MAX_FILE_SIZE = 1 * 1024 * 1024   # 1mb por archivo
MAX_FILES = 50                    # max archivos por scan
MAX_PASTE_LINES = 500             # max lineas para paste


def _to_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise ValueError(f"Id invalido: {id_str}")


async def _emit_event(db, scan_id: str, event_type: str, message: str):
    await db["scan_events"].insert_one({
        "scan_id":    scan_id,
        "type":       event_type,
        "message":    message,
        "created_at": datetime.now(timezone.utc),
    })

# crea el documento de repositorio temporal
async def _create_repo_and_scan(db, user_id: str, repo_name: str, source_type: str, extra_repo_fields: dict = None):
    
    now = datetime.now(timezone.utc)
    repo_doc = {
        "_id":         ObjectId(),
        "user_id":     user_id,
        "name":        repo_name,
        "source_type": source_type,
        "created_at":  now,
        **(extra_repo_fields or {}),
    }
    await db["repositories"].insert_one(repo_doc)
    repository_id = str(repo_doc["_id"])

    scan_id_obj = ObjectId()
    scan_id = str(scan_id_obj)
    await db["scans"].insert_one({
        "_id":                 scan_id_obj,
        "repository_id":       repository_id,
        "user_id":             user_id,
        "status":              "running",
        "started_at":          now,
        "created_at":          now,
        "security_score":      None,
        "metrics":             None,
        "ai_analysis":         None,
        "executive_summary":   None,
        "report_generated_at": None,
        "completed_at":        None,
    })
    await db["repositories"].update_one({"_id": repo_doc["_id"]}, {"$set": {"last_scan_id": scan_id_obj}})
    return repository_id, scan_id

# inicia un scan clonando en un repo de git
async def start_scan(clone_url: str, branch: str, repo_name: str, user_id: str, github_token: str | None = None) -> str:
    
    db = get_db()
    now = datetime.now(timezone.utc)

    repo_doc = await db["repositories"].find_one_and_update(
        {"user_id": user_id, "github_url": clone_url},
        {"$setOnInsert": {
            "_id":             ObjectId(),
            "user_id":         user_id,
            "name":            repo_name,
            "source_type":     "github",
            "github_url":      clone_url,
            "github_metadata": {"branch": branch, "clone_url": clone_url},
            "created_at":      now,
        }, "$set": {"updated_at": now}},
        upsert=True,
        return_document=True,
    )
    repository_id = str(repo_doc["_id"])

    scan_id_obj = ObjectId()
    scan_id = str(scan_id_obj)
    await db["scans"].insert_one({
        "_id":                 scan_id_obj,
        "repository_id":       repository_id,
        "user_id":             user_id,
        "status":              "running",
        "started_at":          now,
        "created_at":          now,
        "security_score":      None,
        "metrics":             None,
        "ai_analysis":         None,
        "executive_summary":   None,
        "report_generated_at": None,
        "completed_at":        None,
    })
    await db["repositories"].update_one({"_id": repo_doc["_id"]}, {"$set": {"last_scan_id": scan_id_obj}})

    asyncio.create_task(_run_scan_task(db, scan_id, repository_id, clone_url, branch, repo_name, github_token))
    return scan_id

# valida archivos subidos y lanza un scan 
async def start_scan_from_upload(files: list[UploadFile], user_id: str) -> str:
    
    if not files:
        raise ValueError("No se recibieron archivos")
    if len(files) > MAX_FILES:
        raise ValueError(f"Maximo {MAX_FILES} archivos por scan")

    contents = []
    for f in files:
        ext = os.path.splitext(f.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Extension no soportada: {f.filename}")
        data = await f.read()
        if len(data) > MAX_FILE_SIZE:
            raise ValueError(f"{f.filename} excede 1mb")
        contents.append((f.filename, data))

    db = get_db()
    now = datetime.now(timezone.utc)
    repository_id, scan_id = await _create_repo_and_scan(
        db, user_id, f"upload-{now.strftime('%Y%m%d%H%M%S')}", "upload"
    )

    asyncio.create_task(_run_scan_task_from_files(db, scan_id, repository_id, contents))
    return scan_id

# valida codigo pegado y lanza un scan sobre ese archivo
async def start_scan_from_paste(code: str, filename: str, user_id: str) -> str:
    
    lines = code.splitlines()
    if not lines:
        raise ValueError("El codigo esta vacio")
    if len(lines) > MAX_PASTE_LINES:
        raise ValueError(f"Maximo {MAX_PASTE_LINES} lineas, recibidas {len(lines)}")

    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Extension no soportada: {filename}")

    db = get_db()
    repository_id, scan_id = await _create_repo_and_scan(db, user_id, filename, "paste")

    asyncio.create_task(
        _run_scan_task_from_files(db, scan_id, repository_id, [(filename, code.encode("utf-8"))])
    )
    return scan_id

# guarda las vulnerabilidades encontradas y marca el scan como completado
async def _finalize_scan(db, scan_id: str, vulns: list[dict]):
    
    if vulns:
        now = datetime.now(timezone.utc)
        for v in vulns:
            v["created_at"] = now
        await db["vulnerabilities"].insert_many(vulns)

    metrics = compute_metrics(vulns)
    score = compute_security_score(metrics)
    total = sum(metrics.values())
    summary = (
        f"Detected {total} vulnerabilities: "
        f"{metrics['critical']} critical, {metrics['high']} high, "
        f"{metrics['medium']} medium, {metrics['low']} low. "
        f"Security score: {score}/100."
    )

    completed_at = datetime.now(timezone.utc)
    await db["scans"].update_one(
        {"_id": ObjectId(scan_id)},
        {"$set": {
            "status":              "completed",
            "security_score":      score,
            "metrics":             metrics,
            "executive_summary":   summary,
            "report_generated_at": completed_at,
            "completed_at":        completed_at,
        }},
    )
    await _emit_event(db, scan_id, "completed", f"Scan completado — {total} vulnerabilidades encontradas")
    logger.info(f"Scan {scan_id} completado: {total} vulns, score {score}")


async def _mark_scan_failed(db, scan_id: str, error: Exception):
    logger.error(f"Scan {scan_id} fallo: {error}", exc_info=True)
    await db["scans"].update_one(
        {"_id": ObjectId(scan_id)},
        {"$set": {"status": "failed", "completed_at": datetime.now(timezone.utc)}},
    )
    await _emit_event(db, scan_id, "failed", f"Error durante el scan: {str(error)}")


# clona el repo y ejecuta los scanners
async def _run_scan_task(db, scan_id: str, repository_id: str, clone_url: str, branch: str, repo_name: str, github_token: str | None = None):
    
    repo_path = None
    try:
        await _emit_event(db, scan_id, "progress", f"Clonando {repo_name} rama {branch}...")

        loop = asyncio.get_event_loop()
        repo_path = await loop.run_in_executor(None, fetch_repo, clone_url, branch, github_token)

        await _emit_event(db, scan_id, "progress", "Detectando lenguajes y ejecutando scanners...")
        vulns = await loop.run_in_executor(None, run_scan, repo_path, repository_id, scan_id)

        await _emit_event(db, scan_id, "progress", "Calculando metricas y generando reporte...")
        await _finalize_scan(db, scan_id, vulns)

    except Exception as e:
        await _mark_scan_failed(db, scan_id, e)
    finally:
        if repo_path:
            cleanup_repo(repo_path)

# prepara el workspace temp con los archivos ejecuta los scanners
async def _run_scan_task_from_files(db, scan_id: str, repository_id: str, files: list[tuple[str, bytes]]):
    
    repo_path = None
    try:
        await _emit_event(db, scan_id, "progress", f"Preparando {len(files)} archivo(s)...")

        loop = asyncio.get_event_loop()
        repo_path = await loop.run_in_executor(None, create_temp_workspace_from_files, files)

        await _emit_event(db, scan_id, "progress", "Detectando lenguajes y ejecutando scanners...")
        vulns = await loop.run_in_executor(None, run_scan, repo_path, repository_id, scan_id)

        await _emit_event(db, scan_id, "progress", "Calculando metricas y generando reporte...")
        await _finalize_scan(db, scan_id, vulns)

    except Exception as e:
        await _mark_scan_failed(db, scan_id, e)
    finally:
        if repo_path:
            cleanup_repo(repo_path)

# devuelve el estado actual del scan y su ultimo evento de progreso
async def get_scan_status(scan_id: str, user_id: str) -> dict | None:
    
    db = get_db()
    try:
        oid = _to_object_id(scan_id)
    except ValueError:
        return None

    scan = await db["scans"].find_one({"_id": oid, "user_id": user_id})
    if not scan:
        return None

    last_event = await db["scan_events"].find_one(
        {"scan_id": scan_id},
        sort=[("created_at", -1)],
    )

    return {
        "scan_id":        scan_id,
        "status":         scan["status"],
        "message":        last_event["message"] if last_event else "",
        "security_score": scan.get("security_score"),
        "metrics":        scan.get("metrics"),
        "summary":        scan.get("executive_summary"),
        "repository_id":  str(scan.get("repository_id", "")),
    }
    
# devuelve el scan completo con sus vulnerabilidades 
async def get_scan_results(scan_id: str, user_id: str) -> dict | None:

    db = get_db()
    try:
        oid = _to_object_id(scan_id)
    except ValueError:
        return None

    scan = await db["scans"].find_one({"_id": oid, "user_id": user_id})
    if not scan:
        return None

    vulns_cursor = db["vulnerabilities"].find({"scan_id": scan_id})
    vulns = []
    async for v in vulns_cursor:
        v["_id"] = str(v["_id"])
        vulns.append(v)

    repo = await db["repositories"].find_one({"_id": ObjectId(scan["repository_id"])})

    return {
        "scan_id":         scan_id,
        "status":          scan["status"],
        "repo_name":       repo["name"] if repo else "",
        "security_score":  scan.get("security_score"),
        "metrics":         scan.get("metrics"),
        "summary":         scan.get("executive_summary"),
        "vulnerabilities": vulns,
        "completed_at":    scan.get("completed_at").strftime("%Y-%m-%dT%H:%M:%SZ") if scan.get("completed_at") else None,
    }

# devuelve el resultado del ultimo scan para dashboard
async def get_latest_scan(user_id: str) -> dict | None:

    db = get_db()
    scan = await db["scans"].find_one(
        {"user_id": user_id, "status": "completed"},
        sort=[("completed_at", -1)],
    )
    if not scan:
        return None
    return await get_scan_results(str(scan["_id"]), user_id)

# devuelve una vulnerabilidad dentro de un scan 
async def get_vulnerability(scan_id: str, vuln_id: str, user_id: str) -> dict | None:
    db = get_db()
    try:
        scan_oid = _to_object_id(scan_id)
        vuln_oid = _to_object_id(vuln_id)
    except ValueError:
        return None

    scan = await db["scans"].find_one({"_id": scan_oid, "user_id": user_id})
    if not scan:
        return None

    vuln = await db["vulnerabilities"].find_one({"_id": vuln_oid, "scan_id": scan_id})
    if not vuln:
        return None

    vuln["_id"] = str(vuln["_id"])
    return vuln