import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ENVIRONMENT: str = os.getenv("ENVIRONMENT")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM")
    MONGODB_URL: str = os.getenv("MONGO_URL")
    BASE_PATH: str = "./insurance_policies"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    @property
    def DATABASE(self) -> str:
        return "TEST_DB_Insurease" if self.ENVIRONMENT == "test" else "InsurEaseDB"

    @property
    def USER_COLLECTION(self) -> str:
        return "TEST_USERS" if self.ENVIRONMENT == "test" else "users"


settings = Settings()
