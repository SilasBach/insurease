from datetime import timedelta

import jwt
from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password


def test_hash_password():
    password = "testpassword"
    hashed = hash_password(password)
    assert hashed != password
    assert len(hashed) > 0


def test_verify_password():
    password = "testpassword"
    hashed = hash_password(password)
    assert verify_password(password, hashed)
    assert not verify_password("wrongpassword", hashed)


def test_create_access_token():
    data = {"sub": "test@example.com"}
    token = create_access_token(data)
    decoded = jwt.decode(
        token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
    )
    assert decoded["sub"] == "test@example.com"
    assert "exp" in decoded
    assert "iat" in decoded

    # Test with custom expiration
    custom_expire = timedelta(hours=1)
    token_custom = create_access_token(data, custom_expire)
    decoded_custom = jwt.decode(
        token_custom, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
    )
    assert (
        abs(
            (decoded_custom["exp"] - decoded_custom["iat"])
            - int(custom_expire.total_seconds())
        )
        <= 1
    )
