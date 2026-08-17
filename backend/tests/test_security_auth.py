from datetime import datetime, timedelta, timezone
import pytest
from jose import jwt
from app.core.security import SECRET_KEY, ALGORITHM

pytestmark = pytest.mark.asyncio


class TestAccesoSinToken:

    async def test_endpoint_protegido_sin_token_es_rechazado(self, client):
        res = await client.get("/api/auth/me")
        assert res.status_code in (401, 403)

    async def test_scan_history_sin_token_es_rechazado(self, client):
        res = await client.get("/api/scan/history")
        assert res.status_code in (401, 403)


class TestTokenInvalido:

    async def test_token_con_firma_incorrecta_es_rechazado(self, client):
        token_falso = jwt.encode({"sub": "000000000000000000000000"}, "clave-incorrecta", algorithm=ALGORITHM)
        res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token_falso}"})
        assert res.status_code == 401

    async def test_token_expirado_es_rechazado(self, client):
        expirado = jwt.encode(
            {"sub": "000000000000000000000000", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
            SECRET_KEY, algorithm=ALGORITHM,
        )
        res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {expirado}"})
        assert res.status_code == 401

    async def test_token_mal_formado_es_rechazado(self, client):
        res = await client.get("/api/auth/me", headers={"Authorization": "Bearer esto-no-es-un-jwt"})
        assert res.status_code == 401

    async def test_usuario_del_token_no_existe_es_rechazado(self, client):
        token = jwt.encode({"sub": "000000000000000000000000"}, SECRET_KEY, algorithm=ALGORITHM)
        res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 401


class TestValidacionDeEntradas:

    async def test_login_con_email_invalido_devuelve_422(self, client):
        res = await client.post("/api/auth/login", json={"email": "no-es-email", "password": "password123"})
        assert res.status_code == 422

    async def test_password_incorrecta_no_verifica(self, client, db):
        await client.post("/api/auth/register", json={
            "email": "seguro@example.com", "password": "password123", "name": "Seguro",
        })
        res = await client.post("/api/auth/login", json={
            "email": "seguro@example.com", "password": "password-incorrecta",
        })
        assert res.status_code == 401

    async def test_no_expone_si_el_email_existe_o_no(self, client):
        res = await client.post("/api/auth/login", json={
            "email": "no-registrado@example.com", "password": "cualquier1",
        })
        assert res.status_code == 401
        assert res.json()["detail"] == "Credenciales incorrectas"


class TestAutorizacionEntreUsuarios:

    async def test_usuario_no_puede_ver_scan_de_otro_usuario(self, client, db):
        res1 = await client.post("/api/auth/register", json={
            "email": "user1@example.com", "password": "password123", "name": "User1",
        })
        token1 = res1.json()["token"]

        res2 = await client.post("/api/auth/register", json={
            "email": "user2@example.com", "password": "password123", "name": "User2",
        })
        token2 = res2.json()["token"]

        scan_res = await client.post("/api/scan/paste", json={
            "code": "print(1)", "filename": "a.py",
        }, headers={"Authorization": f"Bearer {token1}"})
        scan_id = scan_res.json()["scan_id"]

        res = await client.get(f"/api/scan/{scan_id}/status", headers={"Authorization": f"Bearer {token2}"})
        assert res.status_code == 404