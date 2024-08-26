# app/services/policy_service.py
import os
import shutil
from pathlib import Path

from app.core.config import settings
from fastapi import HTTPException, UploadFile


class PolicyService:
    BASE_PATH = Path(settings.BASE_PATH)

    async def upload_policy(
        self, file: UploadFile, insurance_name: str, policy_name: str
    ) -> str:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="File must be a PDF")

        insurance_path = self.BASE_PATH / insurance_name
        if not insurance_path.exists():
            raise HTTPException(status_code=404, detail="Insurance company not found")

        file_location = insurance_path / f"{policy_name}.pdf"

        try:
            os.makedirs(file_location.parent, exist_ok=True)
            with open(file_location, "wb") as file_object:
                shutil.copyfileobj(file.file, file_object)
        except IOError:
            raise HTTPException(status_code=500, detail="Failed to write file")

        return f"Successfully uploaded {insurance_name}/{policy_name}.pdf"

    async def delete_policy(self, insurance_name: str, policy_name: str) -> str:
        file_path = self.BASE_PATH / insurance_name / f"{policy_name}.pdf"

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Policy file not found")

        try:
            os.remove(file_path)
            return f"Successfully deleted {insurance_name}/{policy_name}.pdf"
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"An error occurred while deleting the file: {str(e)}",
            )

    async def get_policies(self) -> dict:
        if not self.BASE_PATH.exists() or not self.BASE_PATH.is_dir():
            raise HTTPException(status_code=500, detail="Insurance folder not found")

        structure = {}

        try:
            for company in self.BASE_PATH.iterdir():
                if company.is_dir():
                    structure[company.name] = [
                        pdf.stem for pdf in company.glob("*.pdf")
                    ]
        except PermissionError:
            raise HTTPException(
                status_code=500,
                detail="Permission denied when accessing insurance folders",
            )
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error reading folder structure: {str(e)}"
            )

        return {"policies": structure}
