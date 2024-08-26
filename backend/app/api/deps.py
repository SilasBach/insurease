# app/api/deps.py
import jwt
from app.core.config import settings
from app.db.db import UserModel
from app.services.chatbot_service import ChatbotService
from app.services.insurance_service import InsuranceService
from app.services.policy_service import PolicyService
from app.services.user_service import UserService
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserModel:
    try:
        # Remove "Bearer " prefix if it exists
        if token.startswith("Bearer "):
            access_token = token[len("Bearer ") :]

        payload = jwt.decode(
            access_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        email: str = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=401, detail="Invalid authentication credentials"
        )

    user_service = UserService()
    user = await user_service.get_user_by_email(email)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_user_service():
    return UserService()


def get_policy_service():
    return PolicyService()


def get_insurance_service():
    return InsuranceService()


def get_chatbot_service():
    return ChatbotService()
