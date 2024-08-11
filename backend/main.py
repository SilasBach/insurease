import os
from datetime import datetime, timedelta

import bcrypt
import jwt
from fastapi import Body, Cookie, Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from starlette.requests import Request

# Initialize FastAPI application
app = FastAPI()

# CORS configuration for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://localhost:3002",
        "https://localhost:3001",
        "https://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT configuration for authentication
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM")


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )

# OAuth2 token URL and scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)


# Function to create JWT tokens
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Set default expiration to 1 week (7 days)
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(access_token: str | None = Cookie(None)):
    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    # Remove "Bearer " prefix if it exists
    if access_token.startswith("Bearer "):
        access_token = access_token[len("Bearer ") :]

    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = await user_collection.find_one({"email": email})
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/token")
async def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
    user = await user_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        access_token = create_access_token(data={"sub": user["email"]})
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error creating access token: {str(e)}"
        )

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=True,
        samesite="None",
        max_age=86400,
    )

    return {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"],
        "access_token": access_token,
    }


@app.get("/check-auth")
async def check_auth(request: Request):
    try:
        current_user = await get_current_user(
            access_token=request.cookies.get("access_token")
        )
        return {"user_id": str(current_user["_id"]), "role": current_user["role"]}
    except HTTPException:
        raise HTTPException(status_code=401, detail="Not authenticated")

