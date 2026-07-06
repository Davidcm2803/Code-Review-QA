from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel, field_validator
from app.services.scanner_service import (
    start_scan,
    start_scan_from_upload,
    start_scan_from_paste,
    get_scan_status,
    get_scan_results,
    get_latest_scan,
    get_vulnerability,
)
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/scan", tags=["scan"])

# Whitelist de hosts permitidos para clonar. Sin esto, clone_url llega directo
# a `git clone <url>` en fetch_repo: alguien podria mandar file:///etc/passwd,
# http://localhost:<puerto-interno>, o una IP de metadata cloud (169.254.169.254)
# y usar el scanner como proxy para leer archivos locales o pegarle a servicios
# internos (SSRF). Ajustar esta lista si necesitan soportar mas proveedores
# (Bitbucket, un GitLab self-hosted, etc).
ALLOWED_GIT_HOSTS = {"github.com", "gitlab.com"}


class ScanRequest(BaseModel):
    clone_url: str
    branch:    str = "main"
    repo_name: str = ""

    @field_validator("clone_url")
    @classmethod
    def validate_clone_url(cls, v: str) -> str:
        parsed = urlparse(v)
        if parsed.scheme != "https":
            raise ValueError("clone_url debe usar https://")
        host = (parsed.hostname or "").lower()
        if host not in ALLOWED_GIT_HOSTS:
            raise ValueError(f"Host no permitido: {host}. Permitidos: {', '.join(ALLOWED_GIT_HOSTS)}")
        return v


class PasteRequest(BaseModel):
    code:     str
    filename: str = "pasted_code.py"


@router.post("/start")
async def start_scan_endpoint(body: ScanRequest, current_user: dict = Depends(get_current_user)):
    # Inicia un scan clonando un repo de GitHub/GitLab
    # Esquema corre en el modelo Pydantic
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
    result = await get_latest_scan(user_id=str(current_user["_id"]))
    if not result:
        raise HTTPException(status_code=404, detail="No hay scans completados")
    return result


@router.get("/history")
async def scan_history_endpoint(current_user: dict = Depends(get_current_user)):
    # Devuelve el historial de scans del usuario con metricas resumidas
    from app.database.connection import get_db
    from bson import ObjectId

    db = get_db()
    cursor = db["scans"].find(
        {"user_id": str(current_user["_id"])},
        sort=[("completed_at", -1)],
    )
    scans = []
    async for scan in cursor:
        repo = await db["repositories"].find_one({"_id": ObjectId(scan["repository_id"])})
        vuln_counts = await db["vulnerabilities"].count_documents({"scan_id": str(scan["_id"])})

        pipeline = [
            {"$match": {"scan_id": str(scan["_id"])}},
            {"$group": {"_id": "$severity"}},
        ]
        severity_docs = await db["vulnerabilities"].aggregate(pipeline).to_list(length=10)
        severities = [d["_id"] for d in severity_docs if d["_id"]]

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
    # Estado actual del scan para hacer polling
    # que el scan pertenezca a current_user
    result = await get_scan_status(scan_id, user_id=str(current_user["_id"]))
    if not result:
        raise HTTPException(status_code=404, detail="Scan no encontrado")
    return result


@router.get("/{scan_id}/results")
async def scan_results_endpoint(scan_id: str, current_user: dict = Depends(get_current_user)):
    # Resultado final del scan con vulnerabilidades 
    result = await get_scan_results(scan_id, user_id=str(current_user["_id"]))
    if not result:
        raise HTTPException(status_code=404, detail="Scan no encontrado")
    if result["status"] == "running":
        raise HTTPException(status_code=202, detail="Scan todavía en progreso")
    return result


@router.get("/{scan_id}/vulnerabilities/{vuln_id}")
async def vulnerability_detail_endpoint(
    scan_id: str,
    vuln_id: str,
    current_user: dict = Depends(get_current_user),
):
    # Detalle de UNA vulnerabilidad puntual, validar si traer todas para mayor contexto
    # traer todo get_scan_results solo para abrir el detalle de un finding).
    vuln = await get_vulnerability(scan_id, vuln_id, user_id=str(current_user["_id"]))
    if not vuln:
        raise HTTPException(status_code=404, detail="Vulnerabilidad no encontrada")
    return vuln