from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from bson import ObjectId
from app.services.scanner_service import (
    start_scan,
    start_scan_from_upload,
    start_scan_from_paste,
    get_scan_status,
    get_scan_results,
)
from app.core.deps import get_current_user
from app.database.connection import get_db

router = APIRouter(prefix="/api/scan", tags=["scan"])


class ScanRequest(BaseModel):
    clone_url: str
    branch:    str = "main"
    repo_name: str = ""


class PasteRequest(BaseModel):
    code:     str
    filename: str = "pasted_code.py"


@router.post("/start")
async def start_scan_endpoint(body: ScanRequest, current_user: dict = Depends(get_current_user)):
    # Inicia un scan clonando un repo de GitHub
    if not body.clone_url:
        raise HTTPException(status_code=400, detail="clone_url es requerido")

    repo_name = body.repo_name or body.clone_url.rstrip("/").split("/")[-1].replace(".git", "")

    scan_id = await start_scan(
        clone_url=body.clone_url,
        branch=body.branch,
        repo_name=repo_name,
        user_id=str(current_user["_id"]),
    )
    return {"scan_id": scan_id, "status": "running"}


@router.post("/upload")
async def upload_scan_endpoint(
    files: list[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
):
    # Inicia un scan a partir de archivos subidos
    try:
        scan_id = await start_scan_from_upload(files, user_id=str(current_user["_id"]))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"scan_id": scan_id, "status": "running"}


@router.post("/paste")
async def paste_scan_endpoint(body: PasteRequest, current_user: dict = Depends(get_current_user)):
    # Inicia un scan a partir de codigo pegado
    try:
        scan_id = await start_scan_from_paste(body.code, body.filename, user_id=str(current_user["_id"]))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"scan_id": scan_id, "status": "running"}


@router.get("/latest")
async def latest_scan_endpoint(current_user: dict = Depends(get_current_user)):
    # Devuelve el ultimo scan completado del usuario
    db = get_db()
    scan = await db["scans"].find_one(
        {"user_id": str(current_user["_id"]), "status": "completed"},
        sort=[("completed_at", -1)],
    )
    if not scan:
        raise HTTPException(status_code=404, detail="No hay scans completados")

    scan_id = str(scan["_id"])
    return await get_scan_results(scan_id)


@router.get("/history")
async def scan_history_endpoint(current_user: dict = Depends(get_current_user)):
    # Devuelve el historial de scans del usuario con métricas resumidas
    db = get_db()
    cursor = db["scans"].find(
        {"user_id": str(current_user["_id"])},
        sort=[("completed_at", -1)],
    )
    scans = []
    async for scan in cursor:
        repo = await db["repositories"].find_one({"_id": ObjectId(scan["repository_id"])})
        vuln_counts = await db["vulnerabilities"].count_documents({"scan_id": str(scan["_id"])})

        # Severidades únicas presentes en este scan
        pipeline = [
            {"$match": {"scan_id": str(scan["_id"])}},
            {"$group": {"_id": "$severity"}},
        ]
        severity_docs = await db["vulnerabilities"].aggregate(pipeline).to_list(length=10)
        severities = [d["_id"] for d in severity_docs if d["_id"]]

        # branch solo aplica a repos de github, no a upload/paste
        branch = repo["github_metadata"]["branch"] if repo and repo.get("github_metadata") else None

        scans.append({
            "scan_id":        str(scan["_id"]),
            "repo_name":      repo["name"] if repo else "Unknown",
            "branch":         branch,
            "source_type":    repo["source_type"] if repo else "unknown",
            "status":         scan["status"],
            "security_score": scan.get("security_score"),
            "metrics":        scan.get("metrics"),
            "total_issues":   vuln_counts,
            "severities":     severities,
            "completed_at":   scan["completed_at"].isoformat() if scan.get("completed_at") else None,
            "started_at":     scan["started_at"].isoformat() if scan.get("started_at") else None,
        })
    return scans


@router.get("/{scan_id}/status")
async def scan_status_endpoint(scan_id: str, current_user: dict = Depends(get_current_user)):
    # Estado actual del scan (para polling)
    result = await get_scan_status(scan_id)
    if not result:
        raise HTTPException(status_code=404, detail="Scan no encontrado")
    return result


@router.get("/{scan_id}/results")
async def scan_results_endpoint(scan_id: str, current_user: dict = Depends(get_current_user)):
    # Resultado final del scan con vulnerabilidades
    result = await get_scan_results(scan_id)
    if not result:
        raise HTTPException(status_code=404, detail="Scan no encontrado")
    if result["status"] == "running":
        raise HTTPException(status_code=202, detail="Scan todavía en progreso")
    return result