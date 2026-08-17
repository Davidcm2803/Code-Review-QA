import pytest

pytestmark = pytest.mark.asyncio


class TestHealthEndpoint:

    async def test_health_responde_ok(self, client):
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}


class TestAuthFlujoCompleto:

    async def test_registro_login_y_perfil(self, client, db):
        res = await client.post("/api/auth/register", json={
            "email": "flujo@example.com", "password": "password123", "name": "Flujo",
        })
        assert res.status_code == 201
        token = res.json()["token"]

        res = await client.post("/api/auth/login", json={
            "email": "flujo@example.com", "password": "password123",
        })
        assert res.status_code == 200

        res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert res.json()["email"] == "flujo@example.com"

    async def test_registro_duplicado_devuelve_409(self, client, db):
        payload = {"email": "dup@example.com", "password": "password123", "name": "Dup"}
        await client.post("/api/auth/register", json=payload)
        res = await client.post("/api/auth/register", json=payload)
        assert res.status_code == 409

    async def test_password_corta_es_rechazada(self, client):
        res = await client.post("/api/auth/register", json={
            "email": "corta@example.com", "password": "123", "name": "Corta",
        })
        assert res.status_code == 422


class TestScanEndpoints:

    async def test_paste_scan_inicia_correctamente(self, client, auth_headers):
        res = await client.post("/api/scan/paste", json={
            "code": "print('hola')", "filename": "test.py",
        }, headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "running"

    async def test_paste_scan_extension_invalida_devuelve_400(self, client, auth_headers):
        res = await client.post("/api/scan/paste", json={
            "code": "print(1)", "filename": "archivo.txt",
        }, headers=auth_headers)
        assert res.status_code == 400

    async def test_scan_start_url_sin_https_es_rechazada(self, client, auth_headers):
        res = await client.post("/api/scan/start", json={
            "clone_url": "http://github.com/user/repo",
        }, headers=auth_headers)
        assert res.status_code == 422

    async def test_scan_start_host_no_permitido_es_rechazado(self, client, auth_headers):
        res = await client.post("/api/scan/start", json={
            "clone_url": "https://bitbucket.org/user/repo",
        }, headers=auth_headers)
        assert res.status_code == 422

    async def test_historial_devuelve_lista(self, client, auth_headers):
        res = await client.get("/api/scan/history", headers=auth_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    async def test_estado_de_scan_inexistente_devuelve_404(self, client, auth_headers):
        res = await client.get("/api/scan/64b000000000000000000000/status", headers=auth_headers)
        assert res.status_code == 404