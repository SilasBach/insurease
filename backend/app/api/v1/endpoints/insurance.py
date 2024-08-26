from app.api.deps import get_current_user, get_insurance_service
from app.models.insurance import InsuranceCompanyCreate
from app.services.insurance_service import InsuranceService
from fastapi import APIRouter, Depends, HTTPException, Request

router = APIRouter()


@router.post("/insurance-companies")
async def add_insurance_company(
    company: InsuranceCompanyCreate,
    request: Request,
    insurance_service: InsuranceService = Depends(get_insurance_service),
):
    current_user = await get_current_user(request.cookies.get("access_token"))
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Not authorized to add insurance companies"
        )
    return await insurance_service.add_insurance_company(company.name)


@router.delete("/insurance-companies/{company_name}")
async def delete_insurance_company(
    company_name: str,
    request: Request,
    insurance_service: InsuranceService = Depends(get_insurance_service),
):
    current_user = await get_current_user(request.cookies.get("access_token"))
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Not authorized to delete insurance companies"
        )
    return await insurance_service.delete_insurance_company(company_name)
