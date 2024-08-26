# app/services/insurance_service.py
import os
import shutil
from pathlib import Path

from app.core.config import settings
from fastapi import HTTPException


class InsuranceService:
    BASE_PATH = Path(settings.BASE_PATH)

    async def add_insurance_company(self, company_name: str) -> str:
        company_path = self.BASE_PATH / company_name
        if company_path.exists():
            raise HTTPException(
                status_code=400, detail="Insurance company already exists"
            )

        try:
            os.makedirs(company_path, exist_ok=True)
            return f"Insurance company {company_name} added successfully"
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error adding insurance company: {str(e)}"
            )

    async def delete_insurance_company(self, company_name: str) -> str:
        company_path = self.BASE_PATH / company_name
        if not company_path.exists():
            raise HTTPException(status_code=404, detail="Insurance company not found")

        try:
            shutil.rmtree(company_path)
            return f"Insurance company {company_name} and all its policies deleted successfully"
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error deleting insurance company: {str(e)}"
            )
