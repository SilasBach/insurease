from app.api.deps import get_current_user, get_policy_service
from app.services.policy_service import PolicyService
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

router = APIRouter()


@router.post("/upload-policy")
async def upload_policy(
    request: Request,
    file: UploadFile = File(...),
    insurance_name: str = Form(...),
    policy_name: str = Form(...),
    policy_service: PolicyService = Depends(get_policy_service),
):
    current_user = await get_current_user(request.cookies.get("access_token"))
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Not authorized to upload insurance policies"
        )
    return await policy_service.upload_policy(file, insurance_name, policy_name)


@router.delete("/delete-policy/{insurance_name}/{policy_name}")
async def delete_policy(
    insurance_name: str,
    policy_name: str,
    request: Request,
    policy_service: PolicyService = Depends(get_policy_service),
):
    current_user = await get_current_user(request.cookies.get("access_token"))
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Not authorized to delete insurance policies"
        )
    return await policy_service.delete_policy(insurance_name, policy_name)


@router.get("/policies")
async def get_policies(policy_service: PolicyService = Depends(get_policy_service)):
    return await policy_service.get_policies()
