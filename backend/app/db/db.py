# db.py
# This script contains the MongoDB database configuration and user model definitions for the InsurEase application.

# Importing necessary libraries and modules
import os
from datetime import datetime
from typing import List, Optional

from app.core.config import settings
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient  # Asynchronous client for MongoDB
from pydantic import (  # For data validation and schema definition
    BaseModel,
    EmailStr,
    Field,
)
from pydantic.functional_validators import BeforeValidator
from typing_extensions import Annotated

# MongoDB connection URL
MONGO_URL = os.getenv("MONGO_URL")

# Use settings.MONGODB_URL instead of os.getenv("MONGO_URL")
client = AsyncIOMotorClient(settings.MONGODB_URL)

# Use settings.DATABASE and settings.USER_COLLECTION
database = client[settings.DATABASE]
user_collection = database[settings.USER_COLLECTION]

# Custom type definition for handling MongoDB ObjectId fields
PyObjectId = Annotated[str, BeforeValidator(str)]


# Defining the user model for database operations
class UserModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    email: EmailStr = Field(...)  # Email field with validation
    password: str = Field(...)  # Password field
    fullName: str = Field(...)  # Full name of the user
    role: Optional[str] = Field(default="user")  # Role field, defaulting to 'user'
    createdAt: Optional[datetime] = Field(
        default_factory=datetime.now
    )  # Timestamp of creation
    updatedAt: Optional[datetime] = Field(
        default_factory=datetime.now
    )  # Timestamp of last update
    lastLogin: Optional[datetime] = Field(
        default_factory=datetime.now
    )  # Timestamp of last login
    bureauAffiliation: str = None  # Affiliation to a specific bureau
    accountStatus: Optional[str] = Field(
        default="active"
    )  # Account status, defaulting to 'active'

    class Config:
        # Configuration for Pydantic model
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            # Example schema for the user model
            "example": {
                "email": "johndoe@example.com",
                "password": "strongpassword",
                "fullName": "John Doe",
                "bureauAffiliation": "Bureau of Insurance",
            }
        }


# Model for updating user information
class UpdateUserModel(BaseModel):
    # Optional fields for updating user details
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    fullName: Optional[str] = None
    role: Optional[str] = None
    bureauAffiliation: Optional[str] = None
    updatedAt: Optional[datetime] = Field(default_factory=datetime.now)
    accountStatus: Optional[str] = None

    class Config:
        # Similar configuration as the UserModel
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "email": "johndoe@example.com",
                "password": "strongpassword",
                "fullName": "John Doe",
                "bureauAffiliation": "Bureau of Insurance",
                "accountStatus": "active",
            }
        }


# Model representing a collection of user models
class UserCollection(BaseModel):
    users: List[UserModel]
