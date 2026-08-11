import httpx
from app.core.logger import logger
from app.config import settings


async def run_dast(clone_url: str, branch: str, scan_id: str, github_token: str | None = None) -> dict:
    """
    Devuelve: {"status": "completed|skipped|error", "reason": str|None, "findings": [...]}
    Si el runner falla, se devuelve status=error
    """
    payload = {
        "clone_url": clone_url,
        "branch": branch,
        "scan_id": scan_id,
        "github_token": github_token,
    }
    try:
        async with httpx.AsyncClient(timeout=settings.RUNNER_TIMEOUT) as client:
            resp = await client.post(f"{settings.RUNNER_URL}/execute", json=payload)
            resp.raise_for_status()
            return resp.json()
    except httpx.TimeoutException:
        logger.error(f"Runner timeout en scan {scan_id}")
        return {"status": "error", "reason": "Timeout en el ataque dinámico", "findings": []}
    except Exception as e:
        logger.error(f"Runner falló en scan {scan_id}: {e}", exc_info=True)
        return {"status": "error", "reason": str(e), "findings": []}