from unittest.mock import AsyncMock, patch

import pytest
from app.api.deps import get_current_user
from app.core.security import create_access_token
from app.db.db import UserModel
from fastapi import HTTPException

# Mock user for testing
mock_user = UserModel(
    email="test@example.com",
    password="hashed_password",
    fullName="Test User",
    role="user",
    bureauAffiliation="Test Bureau",
    accountStatus="active",
)


@pytest.fixture
def mock_user_service():
    with patch("app.api.deps.UserService") as mock:
        mock_instance = mock.return_value
        mock_instance.get_user_by_email = AsyncMock()
        yield mock_instance


@pytest.mark.asyncio
async def test_get_current_user_valid(mock_user_service):
    mock_user_service.get_user_by_email.return_value = mock_user

    token_data = {"sub": "test@example.com"}
    token = create_access_token(token_data)

    user = await get_current_user(f"Bearer {token}")
    assert user == mock_user
    mock_user_service.get_user_by_email.assert_called_once_with("test@example.com")


@pytest.mark.asyncio
async def test_get_current_user_invalid_token(mock_user_service):
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user("Bearer invalid_token")
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid authentication credentials"


@pytest.mark.asyncio
async def test_get_current_user_user_not_found(mock_user_service):
    mock_user_service.get_user_by_email.return_value = None

    token_data = {"sub": "nonexistent@example.com"}
    token = create_access_token(token_data)

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(f"Bearer {token}")
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "User not found"
