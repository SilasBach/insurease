from app.api.deps import get_current_user, get_user_service
from app.core.security import create_access_token, verify_password
from app.services.user_service import UserService
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()


@router.post("/token")
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_service: UserService = Depends(get_user_service),
):
    user = await user_service.get_user_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=True,
        samesite="None",
        max_age=86400,
    )

    return {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "access_token": access_token,
    }


@router.get("/check-auth")
async def check_auth(request: Request):
    try:
        current_user = await get_current_user(request.cookies.get("access_token"))
        return {"user_id": current_user.id, "role": current_user.role}
    except HTTPException:
        raise HTTPException(status_code=401, detail="Not authenticated")


@router.post("/logout")
async def logout():
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=True,  # Use this in production with HTTPS
        samesite="None",
    )
    return response
