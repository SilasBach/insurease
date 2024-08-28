# app/tests/services/test_user_service.py

from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from app.db.db import UpdateUserModel, UserModel
from app.services.user_service import UserService
from bson import ObjectId


@pytest.fixture
def user_service():
    return UserService()


@pytest.fixture
def sample_user_data():
    return {
        "email": "test@example.com",
        "password": "testpassword",
        "fullName": "Test User",
        "bureauAffiliation": "Test Bureau",
    }


@pytest.mark.asyncio
async def test_create_user(user_service, sample_user_data):
    with patch("app.services.user_service.user_collection") as mock_collection, patch(
        "app.services.user_service.hash_password"
    ) as mock_hash:
        mock_hash.return_value = "hashed_password"
        mock_collection.insert_one = AsyncMock(
            return_value=AsyncMock(inserted_id=ObjectId())
        )
        mock_collection.find_one = AsyncMock(
            return_value={
                **sample_user_data,
                "_id": ObjectId(),
                "password": "hashed_password",
            }
        )

        user = UserModel(**sample_user_data)
        created_user = await user_service.create_user(user)

        assert created_user.email == sample_user_data["email"]
        assert created_user.fullName == sample_user_data["fullName"]
        mock_hash.assert_called_once_with(sample_user_data["password"])
        mock_collection.insert_one.assert_called_once()
        mock_collection.find_one.assert_called_once()


@pytest.mark.asyncio
async def test_get_user(user_service):
    user_id = str(ObjectId())
    mock_user_data = {
        "_id": ObjectId(user_id),
        "email": "test@example.com",
        "fullName": "Test User",
        "password": "hashed_password",  # Add this line
        "bureauAffiliation": "Test Bureau",  # Add this line if it's required
    }

    with patch("app.services.user_service.user_collection") as mock_collection:
        mock_collection.find_one = AsyncMock(return_value=mock_user_data)
        user = await user_service.get_user(user_id)

        assert str(user.id) == user_id
        assert user.email == mock_user_data["email"]
        mock_collection.find_one.assert_called_once_with({"_id": ObjectId(user_id)})


@pytest.mark.asyncio
async def test_update_user(user_service):
    user_id = str(ObjectId())
    update_data = UpdateUserModel(fullName="Updated Name")
    mock_updated_user = {
        "_id": ObjectId(user_id),
        "email": "test@example.com",
        "fullName": "Updated Name",
        "password": "hashed_password",  # Add this line
        "bureauAffiliation": "Test Bureau",  # Add this line if it's required
    }

    with patch("app.services.user_service.user_collection") as mock_collection:
        mock_collection.find_one_and_update = AsyncMock(return_value=mock_updated_user)
        updated_user = await user_service.update_user(user_id, update_data)

        assert str(updated_user.id) == user_id
        assert updated_user.fullName == "Updated Name"
        mock_collection.find_one_and_update.assert_called_once()


@pytest.mark.asyncio
async def test_delete_user(user_service):
    user_id = str(ObjectId())

    with patch("app.services.user_service.user_collection") as mock_collection:
        mock_collection.delete_one = AsyncMock(return_value=AsyncMock(deleted_count=1))
        result = await user_service.delete_user(user_id)

        assert result is True
        mock_collection.delete_one.assert_called_once_with({"_id": ObjectId(user_id)})


@pytest.mark.asyncio
async def test_get_user_by_email(user_service):
    email = "test@example.com"
    mock_user_data = {
        "_id": ObjectId(),
        "email": email,
        "fullName": "Test User",
        "password": "hashed_password",  # Add this line
        "bureauAffiliation": "Test Bureau",  # Add this line if it's required
    }

    with patch("app.services.user_service.user_collection") as mock_collection:
        mock_collection.find_one = AsyncMock(return_value=mock_user_data)
        user = await user_service.get_user_by_email(email)

        assert user.email == email
        mock_collection.find_one.assert_called_once_with({"email": email})


@pytest.mark.asyncio
async def test_get_users(user_service):
    current_time = datetime.now()
    mock_users = [
        {
            "_id": ObjectId(),
            "email": "user1@example.com",
            "password": "hashed_password1",
            "fullName": "User One",
            "role": "user",
            "createdAt": current_time,
            "updatedAt": current_time,
            "lastLogin": current_time,
            "bureauAffiliation": "Bureau1",
            "accountStatus": "active",
        },
        {
            "_id": ObjectId(),
            "email": "user2@example.com",
            "password": "hashed_password2",
            "fullName": "User Two",
            "role": "user",
            "createdAt": current_time,
            "updatedAt": current_time,
            "lastLogin": current_time,
            "bureauAffiliation": "Bureau2",
            "accountStatus": "active",
        },
    ]

    with patch("app.services.user_service.user_collection") as mock_collection:
        mock_cursor = AsyncMock()
        mock_cursor.to_list.return_value = mock_users
        mock_find = mock_collection.find.return_value
        mock_find.skip.return_value.limit.return_value = mock_cursor

        users = await user_service.get_users(skip=0, limit=10)

        assert len(users) == 2
        assert isinstance(users[0], UserModel)
        assert users[0].email == "user1@example.com"
        assert users[1].email == "user2@example.com"
        mock_collection.find.assert_called_once()
        mock_find.skip.assert_called_once_with(0)
        mock_find.skip.return_value.limit.assert_called_once_with(10)
