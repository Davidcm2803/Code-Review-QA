import time
import asyncio
import pytest

pytestmark = pytest.mark.asyncio


class TestScansConcurrentes:

    async def test_varios_scans_paste_simultaneos(self, client, auth_headers):
        n = 10
        start = time.perf_counter()

        async def enviar_scan(i):
            return await client.post("/api/scan/paste", json={
                "code": f"print({i})", "filename": f"file{i}.py",
            }, headers=auth_headers)

        responses = await asyncio.gather(*[enviar_scan(i) for i in range(n)])
        elapsed = time.perf_counter() - start

        assert all(r.status_code == 200 for r in responses)
        scan_ids = {r.json()["scan_id"] for r in responses}
        assert len(scan_ids) == n
        assert elapsed < 5

    async def test_tiempo_respuesta_promedio_bajo_carga(self, client, auth_headers):
        tiempos = []
        for _ in range(5):
            start = time.perf_counter()
            res = await client.get("/api/scan/history", headers=auth_headers)
            tiempos.append(time.perf_counter() - start)
            assert res.status_code == 200

        promedio = sum(tiempos) / len(tiempos)
        assert promedio < 1.0

    async def test_historial_con_muchos_scans_no_se_degrada(self, client, auth_headers, test_user, db):
        from app.services.scanner_service import _create_repo_and_scan

        user_id = test_user.user.id
        for i in range(30):
            await _create_repo_and_scan(db, user_id, f"repo{i}", "upload")

        start = time.perf_counter()
        res = await client.get("/api/scan/history", headers=auth_headers)
        elapsed = time.perf_counter() - start

        assert res.status_code == 200
        assert elapsed < 2.0