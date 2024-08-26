from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ENVIRONMENT: str = "test"
    JWT_SECRET_KEY: str = "a_very_secret_key"
    JWT_ALGORITHM: str = "HS256"
    MONGODB_URL: str = "mongodb+srv://admin:admin@insurease.aclelf4.mongodb.net/"
    BASE_PATH: str = "./insurance_policies"

    class Config:
        env_file = ".env"

    @property
    def DATABASE(self) -> str:
        return "TEST_DB_Insurease" if self.ENVIRONMENT == "test" else "InsurEaseDB"

    @property
    def USER_COLLECTION(self) -> str:
        return "TEST_USERS" if self.ENVIRONMENT == "test" else "users"


settings = Settings()
