from pydantic import BaseModel


# Define the InsuranceCompanyCreate model
class InsuranceCompanyCreate(BaseModel):
    name: str
