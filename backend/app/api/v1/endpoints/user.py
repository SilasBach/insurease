# app/api/v1/endpoints/user.py
from typing import List

from app.api.deps import get_current_user, get_user_service
from app.db.db import UpdateUserModel, UserModel
from app.services.user_service import UserService
from fastapi import APIRouter, Depends, HTTPException, Request, status

router = APIRouter()


@router.post("/", response_model=UserModel, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserModel, user_service: UserService = Depends(get_user_service)
):
    db_user = await user_service.get_user_by_email(user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return await user_service.create_user(user)


@router.get("/", response_model=List[UserModel])
async def read_users(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    user_service: UserService = Depends(get_user_service),
):
    current_user = await get_current_user(request.cookies.get("access_token"))
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to list users")
    users = await user_service.get_users(skip=skip, limit=limit)
    return users


@router.get("/{user_id}", response_model=UserModel)
async def read_user(
    user_id: str,
    request: Request,
    user_service: UserService = Depends(get_user_service),
):
    current_user = await get_current_user(request.cookies.get("access_token"))
    if str(current_user.id) != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this user")
    user = await user_service.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserModel)
async def update_user(
    user_id: str,
    request: Request,
    user: UpdateUserModel,
    user_service: UserService = Depends(get_user_service),
):
    current_user = await get_current_user(request.cookies.get("access_token"))
    if str(current_user.id) != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Not authorized to update this user"
        )
    updated_user = await user_service.update_user(user_id, user)
    if updated_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    request: Request,
    user_id: str,
    user_service: UserService = Depends(get_user_service),
):
    current_user = await get_current_user(request.cookies.get("access_token"))
    if str(current_user.id) != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this user"
        )
    deleted = await user_service.delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
