import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.config import settings

settings.MONGO_URI = "mongodb://admin:admin1234@mongodb:27017/?authSource=admin"
settings.MONGO_DB = "ai_secure_qa_test"

from app.database.connection import connect_db, close_db, get_db
from app.app import app
from app.services.auth_service import register_user
from app.database.schemas.auth import RegisterRequest


@pytest_asyncio.fixture(autouse=True)
async def _db_connection():
    await connect_db()
    yield
    await close_db()


@pytest_asyncio.fixture
async def db():
    database = get_db()
    yield database
    # limpieza de la base de datos de test despues de cada prueba
    for name in await database.list_collection_names():
        await database[name].delete_many({})


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def test_user(db):
    payload = RegisterRequest(email="test@example.com", password="password123", name="Test User")
    return await register_user(payload, db)


@pytest.fixture
def auth_headers(test_user):
    return {"Authorization": f"Bearer {test_user.token}"}