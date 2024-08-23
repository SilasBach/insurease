import os
import shutil
from datetime import datetime, timedelta

import bcrypt
import jwt
from compare_query import compare_policies_query
from fastapi import Body, Cookie, Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from information_query import process_query
from pydantic import BaseModel
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
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

BASE_PATH = Path("./insurance_policies")


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


class QuestionRequest(BaseModel):
    question: str


# Endpoint for processing questions using the chatbot
@app.post("/question")
async def ask(request: QuestionRequest):
    try:
        answer = process_query(request.question)

        return {"answer": answer}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing the question: {str(e)}",
        )


class ComparisonRequest(BaseModel):
    policy1: str
    policy2: str
    query: str


@app.post("/compare-policies")
async def compare_policies(request: ComparisonRequest):
    try:
        # Add .pdf extension to policy names
        policy1_with_extension = f"{request.policy1}.pdf"
        policy2_with_extension = f"{request.policy2}.pdf"

        answer = compare_policies_query(
            policy1_with_extension,
            policy2_with_extension,
            request.query,
        )
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while comparing policies: {str(e)}",
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

@app.post("/upload-policy")
async def upload_pdf(
    file: UploadFile = File(...),
    insurance_name: str = Form(...),
    policy_name: str = Form(...),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403, detail="Not authorized to upload insurance policies"
        )

    if not file.filename.endswith(".pdf"):
        return JSONResponse(content={"message": "File must be a PDF"}, status_code=400)

    insurance_path = os.path.join(BASE_PATH, insurance_name)
    if not os.path.exists(insurance_path):
        return JSONResponse(
            content={"message": "Insurance company not found"}, status_code=404
        )

    # Construct the full file path
    file_location = os.path.join(insurance_path, f"{policy_name}.pdf")

    try:
        os.makedirs(
            os.path.dirname(file_location), exist_ok=True
        )  # Ensure the directory exists
        with open(file_location, "wb") as file_object:
            shutil.copyfileobj(file.file, file_object)
    except IOError:
        return JSONResponse(
            content={"message": "Failed to write file"}, status_code=500
        )

    return {"message": f"Successfully uploaded {insurance_name}/{policy_name}.pdf"}


@app.delete("/delete-policy/{insurance_name}/{policy_name}")
async def delete_policy(
    insurance_name: str,
    policy_name: str,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403, detail="Not authorized to delete insurance policies"
        )
    # Construct the full file path
    file_path = os.path.join(BASE_PATH, insurance_name, f"{policy_name}.pdf")

    # Check if the file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Policy file not found")

    try:
        # Delete the file
        os.remove(file_path)

        return {"message": f"Successfully deleted {insurance_name}/{policy_name}.pdf"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while deleting the file: {str(e)}",
        )


# Define the InsuranceCompanyCreate model
class InsuranceCompanyCreate(BaseModel):
    name: str


@app.post("/insurance-companies")
async def add_insurance_company(
    company: InsuranceCompanyCreate, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403, detail="Not authorized to add insurance companies"
        )

    company_path = os.path.join(BASE_PATH, company.name)
    if os.path.exists(company_path):
        raise HTTPException(status_code=400, detail="Insurance company already exists")

    try:
        os.makedirs(company_path, exist_ok=True)
        return {"message": f"Insurance company {company.name} added successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error adding insurance company: {str(e)}"
        )


@app.delete("/insurance-companies/{company_name}")
async def delete_insurance_company(
    company_name: str, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403, detail="Not authorized to delete insurance companies"
        )

    company_path = os.path.join(BASE_PATH, company_name)
    if not os.path.exists(company_path):
        return JSONResponse(
            content={"message": "Insurance company not found"}, status_code=404
        )

    try:
        shutil.rmtree(company_path)
        return {
            "message": f"Insurance company {company_name} and all its policies deleted successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error deleting insurance company: {str(e)}"
        )


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


@app.get("/policies")
async def get_folder_structure():
    base_path = Path("./insurance_policies")

    if not base_path.exists() or not base_path.is_dir():
        raise HTTPException(status_code=500, detail="Insurance folder not found")

    structure = {}

    try:
        for company in base_path.iterdir():
            if company.is_dir():
                structure[company.name] = []
                for pdf in company.glob("*.pdf"):
                    # Remove the .pdf extension from the filename
                    policy_name = pdf.stem
                    structure[company.name].append(policy_name)
    except PermissionError:
        raise HTTPException(
            status_code=500, detail="Permission denied when accessing insurance folders"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error reading folder structure: {str(e)}"
        )

    return {"policies": structure}


@app.post("/logout")
async def logout():
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=True,  # Use this in production with HTTPS
        samesite="None",
    )
    return response


@app.get("/check-auth")
async def check_auth(request: Request):
    try:
        current_user = await get_current_user(
            access_token=request.cookies.get("access_token")
        )
        return {"user_id": str(current_user["_id"]), "role": current_user["role"]}
    except HTTPException:
        raise HTTPException(status_code=401, detail="Not authenticated")


# Endpoint to create a new user
@app.post(
    "/users/",
    response_model=UserModel,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
async def create_user(user: UserModel = Body(...)):
    try:
        user_dict = user.model_dump(by_alias=True, exclude=["id"])
        user_dict["password"] = hash_password(user_dict["password"])
        new_user = await user_collection.insert_one(user_dict)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=400, detail="User with this email already exists"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while creating the user: {str(e)}",
        )

    created_user = await user_collection.find_one({"_id": new_user.inserted_id})
    if not created_user:
        raise HTTPException(
            status_code=404, detail="User was created but could not be retrieved"
        )
    return created_user


# Endpoint to retrieve a single user by ID
@app.get("/users/{id}", response_model=UserModel, response_model_by_alias=False)
async def show_user(id: str, current_user: dict = Depends(get_current_user)):
    if str(current_user["_id"]) != id and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this user")
    try:
        user = await user_collection.find_one({"_id": ObjectId(id)})
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while fetching the user: {str(e)}",
        )
    if user is None:
        raise HTTPException(status_code=404, detail=f"User {id} not found")
    return user


# Endpoint to update a user
@app.put("/users/{id}", response_model=UserModel, response_model_by_alias=False)
async def update_user(
    id: str,
    user: UpdateUserModel = Body(...),
    current_user: dict = Depends(get_current_user),
):
    if str(current_user["_id"]) != id and current_user["role"] != "admin":
        raise HTTPException(
            status_code=403, detail="Not authorized to update this user"
        )

    if current_user["role"] != "admin" and "role" in user.model_dump(
        exclude_unset=True
    ):
        raise HTTPException(status_code=403, detail="Not authorized to change role")

    user_data = {
        k: v for k, v in user.model_dump(by_alias=True).items() if v is not None
    }
    if "password" in user_data:
        user_data["password"] = hash_password(user_data["password"])

    user_data["updatedAt"] = datetime.utcnow()

    if len(user_data) >= 1:
        try:
            update_result = await user_collection.find_one_and_update(
                {"_id": ObjectId(id)},
                {"$set": user_data},
                return_document=ReturnDocument.AFTER,
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"An error occurred while updating the user: {str(e)}",
            )

        if update_result is None:
            raise HTTPException(status_code=404, detail=f"User {id} not found")

        return update_result

    existing_user = await user_collection.find_one({"_id": ObjectId(id)})
    if existing_user is None:
        raise HTTPException(status_code=404, detail=f"User {id} not found")

    return existing_user
