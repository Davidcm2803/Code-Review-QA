import pytest
from bson import ObjectId
from app.services.scanner_service import (
    _create_repo_and_scan,
    _finalize_scan,
    get_scan_status,
    get_scan_results,
)

pytestmark = pytest.mark.asyncio


class TestConexionMongo:

    async def test_la_base_de_datos_responde(self, db):
        result = await db.command("ping")
        assert result["ok"] == 1.0

    async def test_insertar_y_leer_documento(self, db):
        await db["repositories"].insert_one({"_id": ObjectId(), "name": "repo-test"})
        doc = await db["repositories"].find_one({"name": "repo-test"})
        assert doc is not None


class TestCreacionRepoYScan:

    async def test_crea_repositorio_y_scan_vinculados(self, db):
        repository_id, scan_id = await _create_repo_and_scan(db, "user1", "mi-repo", "upload")
        repo = await db["repositories"].find_one({"_id": ObjectId(repository_id)})
        scan = await db["scans"].find_one({"_id": ObjectId(scan_id)})
        assert repo is not None
        assert scan is not None
        assert scan["status"] == "running"
        assert scan["repository_id"] == repository_id
        assert repo["last_scan_id"] == ObjectId(scan_id)


class TestFinalizeScan:

    async def test_finalize_scan_guarda_vulns_y_actualiza_metricas(self, db):
        repository_id, scan_id = await _create_repo_and_scan(db, "user1", "repo2", "upload")
        vulns = [{
            "scan_id": scan_id, "repository_id": repository_id, "severity": "high",
            "title": "x", "description": "d", "detector_source": "bandit",
            "file_path": "a.py", "line_start": 1, "line_end": 1,
            "vulnerable_code": "", "remediation_recommendation": "r", "status": "open",
        }]
        await _finalize_scan(db, scan_id, vulns)

        scan = await db["scans"].find_one({"_id": ObjectId(scan_id)})
        assert scan["status"] == "completed"
        assert scan["metrics"]["high"] == 1
        assert scan["security_score"] == 90

    async def test_flujo_completo_service_a_mongo(self, db):
        repository_id, scan_id = await _create_repo_and_scan(db, "user1", "repo3", "upload")
        await _finalize_scan(db, scan_id, [])

        status = await get_scan_status(scan_id, "user1")
        assert status["status"] == "completed"
        assert status["security_score"] == 100

        results = await get_scan_results(scan_id, "user1")
        assert results["vulnerabilities"] == []
        assert results["repo_name"] == "repo3"

    async def test_no_devuelve_scan_de_otro_usuario(self, db):
        _, scan_id = await _create_repo_and_scan(db, "user1", "repo4", "upload")
        status = await get_scan_status(scan_id, "otro_usuario")
        assert status is None