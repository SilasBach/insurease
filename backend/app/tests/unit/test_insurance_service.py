from unittest.mock import patch

import pytest
from app.services.insurance_service import InsuranceService
from fastapi import HTTPException


@pytest.fixture
def insurance_service():
    return InsuranceService()


@pytest.mark.asyncio
async def test_add_insurance_company(insurance_service):
    with patch("os.makedirs") as mock_makedirs:
        response = await insurance_service.add_insurance_company("TestCompany")
        assert response == "Insurance company TestCompany added successfully"
        mock_makedirs.assert_called_once()


@pytest.mark.asyncio
async def test_add_existing_insurance_company(insurance_service):
    with patch("pathlib.Path.exists", return_value=True):
        with pytest.raises(HTTPException) as exc_info:
            await insurance_service.add_insurance_company("ExistingCompany")
        assert exc_info.value.status_code == 400
        assert "Insurance company already exists" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_delete_insurance_company(insurance_service):
    with patch("pathlib.Path.exists", return_value=True), patch(
        "shutil.rmtree"
    ) as mock_rmtree:
        response = await insurance_service.delete_insurance_company("TestCompany")
        assert (
            response
            == "Insurance company TestCompany and all its policies deleted successfully"
        )
        mock_rmtree.assert_called_once()


@pytest.mark.asyncio
async def test_delete_nonexistent_insurance_company(insurance_service):
    with patch("pathlib.Path.exists", return_value=False):
        with pytest.raises(HTTPException) as exc_info:
            await insurance_service.delete_insurance_company("NonexistentCompany")
        assert exc_info.value.status_code == 404
        assert "Insurance company not found" in str(exc_info.value.detail)
