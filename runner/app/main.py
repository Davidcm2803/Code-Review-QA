from concurrent.futures import ThreadPoolExecutor
import asyncio

from fastapi import FastAPI
from pydantic import BaseModel

from app.sandbox import run_dast

app = FastAPI(title="QA-Code Runner (sandbox DAST)")

# el runner atiende scans de a uno por worker ajusta según CPU/memoria disponibles
executor = ThreadPoolExecutor(max_workers=2)


class ExecuteRequest(BaseModel):
    clone_url: str
    branch: str = "main"
    scan_id: str
    github_token: str | None = None


class ExecuteResponse(BaseModel):
    status: str
    reason: str | None = None
    findings: list[dict] = []


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/execute", response_model=ExecuteResponse)
async def execute(req: ExecuteRequest):
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        executor, run_dast, req.clone_url, req.branch, req.scan_id, req.github_token
    )
    return ExecuteResponse(status=result.status, reason=result.reason, findings=result.findings)