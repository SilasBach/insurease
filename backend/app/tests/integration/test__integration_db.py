import asyncio

import pytest
from app.core.config import settings
from app.db.db import user_collection
from app.main import app
from bson import ObjectId
from httpx import AsyncClient
from pymongo import MongoClient


def get_test_db():
    client = MongoClient(settings.MONGODB_URL)
    return client.get_database(settings.DATABASE)


def clear_test_db():
    db = get_test_db()
    for collection in db.list_collection_names():
        db[collection].delete_many({})


@pytest.fixture(scope="module")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True, scope="function")
def setup_teardown():
    clear_test_db()
    yield
    clear_test_db()


async def create_test_user(ac: AsyncClient, email: str = "test@example.com"):
    response = await ac.post(
        "/api/v1/users/",
        json={
            "email": email,
            "password": "testpassword",
            "fullName": "Test User",
            "role": "user",
            "bureauAffiliation": "Test Bureau",
            "createdAt": "2021-01-01T00:00:00",
        },
    )
    return response.json()


async def login_user(ac: AsyncClient, email: str, password: str):
    login_response = await ac.post(
        "/api/v1/token",
        data={"username": email, "password": password},
    )
    return login_response.cookies.get("access_token")


@pytest.mark.asyncio
async def test_create_and_get_user():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Create a user via API
        user = await create_test_user(ac)
        user_id = user["_id"]

        # Verify user was created in the database
        db_user = await user_collection.find_one({"_id": ObjectId(user_id)})
        assert db_user is not None
        assert db_user["email"] == "test@example.com"

        # Login to get an access token
        access_token = await login_user(ac, "test@example.com", "testpassword")
        assert access_token is not None

        # Get user via API
        response = await ac.get(
            f"/api/v1/users/{user_id}", cookies={"access_token": access_token}
        )
        assert response.status_code == 200
        response_json = response.json()
        assert response_json["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_read_users():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Create an admin user
        admin_user = await create_test_user(ac, "admin@example.com")
        await user_collection.update_one(
            {"_id": ObjectId(admin_user["_id"])}, {"$set": {"role": "admin"}}
        )

        # Create a regular user
        await create_test_user(ac, "user@example.com")

        # Login as admin
        admin_token = await login_user(ac, "admin@example.com", "testpassword")

        # Get all users
        response = await ac.get("/api/v1/users/", cookies={"access_token": admin_token})
        assert response.status_code == 200
        users = response.json()
        assert len(users) == 2

        # Try to get all users as a regular user
        user_token = await login_user(ac, "user@example.com", "testpassword")
        response = await ac.get("/api/v1/users/", cookies={"access_token": user_token})
        assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_user():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Create a user
        user = await create_test_user(ac)
        user_id = user["_id"]

        # Login
        access_token = await login_user(ac, "test@example.com", "testpassword")

        # Update user
        update_data = {
            "fullName": "Updated Name",
            "bureauAffiliation": "Updated Bureau",
        }
        response = await ac.put(
            f"/api/v1/users/{user_id}",
            json=update_data,
            cookies={"access_token": access_token},
        )
        assert response.status_code == 200
        updated_user = response.json()
        assert updated_user["fullName"] == "Updated Name"
        assert updated_user["bureauAffiliation"] == "Updated Bureau"


@pytest.mark.asyncio
async def test_delete_user():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Create a user
        user = await create_test_user(ac)
        user_id = user["_id"]

        # Login
        access_token = await login_user(ac, "test@example.com", "testpassword")

        # Delete user
        response = await ac.delete(
            f"/api/v1/users/{user_id}", cookies={"access_token": access_token}
        )
        assert response.status_code == 204

        # Verify user was deleted
        db_user = await user_collection.find_one({"_id": ObjectId(user_id)})
        assert db_user is None


@pytest.mark.asyncio
async def test_unauthorized_actions():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Create two users
        user1 = await create_test_user(ac, "user1@example.com")
        user2 = await create_test_user(ac, "user2@example.com")

        # Login as user1
        user1_token = await login_user(ac, "user1@example.com", "testpassword")

        # Try to get user2's details
        response = await ac.get(
            f"/api/v1/users/{user2['_id']}", cookies={"access_token": user1_token}
        )
        assert response.status_code == 403

        # Try to update user2's details
        response = await ac.put(
            f"/api/v1/users/{user2['_id']}",
            json={"fullName": "Hacked Name"},
            cookies={"access_token": user1_token},
        )
        assert response.status_code == 403

        # Try to delete user2
        response = await ac.delete(
            f"/api/v1/users/{user2['_id']}", cookies={"access_token": user1_token}
        )
        assert response.status_code == 403
