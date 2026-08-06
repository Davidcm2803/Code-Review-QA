from fastapi import APIRouter, Header, HTTPException
import httpx

router = APIRouter(prefix="/api/github", tags=["github"])

# Recibe el token de acceso de Git
@router.get("/repos")
async def get_repos(x_github_token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://api.github.com/user/repos",
            headers={
                "Authorization": f"Bearer {x_github_token}",
                "Accept": "application/vnd.github+json",
            },
            params={"sort": "updated", "per_page": 30, "affiliation": "owner"},
        )
    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail="Error al obtener repos")
    
    repos = res.json()
    return [
        {
            "id":            r["id"],
            "name":          r["name"],
            "full_name":     r["full_name"],
            "private":       r["private"],
            "default_branch": r["default_branch"],
            "updated_at":    r["updated_at"],
            "url":           r["html_url"],
            "clone_url":     r["clone_url"],
        }
        for r in repos
    ]

# Comunicacion con la API de Git
@router.get("/repos/{owner}/{repo}/branches")
async def get_branches(owner: str, repo: str, x_github_token: str = Header(...)):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/branches",
            headers={
                "Authorization": f"Bearer {x_github_token}",
                "Accept": "application/vnd.github+json",
            },
        )
    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail="Error al obtener ramas")
    
    return [b["name"] for b in res.json()]