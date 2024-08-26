# app/services/user_service.py

from app.core.security import hash_password
from app.db.db import UpdateUserModel, UserModel, user_collection
from bson import ObjectId


class UserService:
    async def create_user(self, user: UserModel) -> UserModel:
        user_dict = user.model_dump(exclude_unset=True)
        user_dict["password"] = hash_password(user_dict["password"])
        new_user = await user_collection.insert_one(user_dict)
        created_user = await user_collection.find_one({"_id": new_user.inserted_id})
        return UserModel(**created_user)

    async def get_user(self, user_id: str) -> UserModel:
        user = await user_collection.find_one({"_id": ObjectId(user_id)})
        if user:
            return UserModel(**user)
        return None

    async def update_user(self, user_id: str, user: UpdateUserModel) -> UserModel:
        user_data = user.model_dump(exclude_unset=True)
        if "password" in user_data:
            user_data["password"] = hash_password(user_data["password"])

        updated_user = await user_collection.find_one_and_update(
            {"_id": ObjectId(user_id)}, {"$set": user_data}, return_document=True
        )
        if updated_user:
            return UserModel(**updated_user)
        return None

    async def delete_user(self, user_id: str) -> bool:
        delete_result = await user_collection.delete_one({"_id": ObjectId(user_id)})
        return delete_result.deleted_count > 0

    async def get_user_by_email(self, email: str) -> UserModel:
        user = await user_collection.find_one({"email": email})
        if user:
            return UserModel(**user)
        return None

    async def get_users(self, skip: int = 0, limit: int = 100) -> list[UserModel]:
        try:
            cursor = user_collection.find().skip(skip).limit(limit)
            user_data_list = await cursor.to_list(length=limit)
            users = [UserModel(**user_data) for user_data in user_data_list]
            return users
        except Exception as e:
            print(f"Error: Error in get_users: {e}")
            return []
