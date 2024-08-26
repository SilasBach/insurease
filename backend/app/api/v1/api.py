from app.api.v1.endpoints import auth, chatbot, insurance, policy, user
from fastapi import APIRouter

api_router = APIRouter()
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(user.router, prefix="/users", tags=["users"])
api_router.include_router(policy.router, prefix="/policies", tags=["policies"])
api_router.include_router(insurance.router, prefix="/insurance", tags=["insurance"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])
