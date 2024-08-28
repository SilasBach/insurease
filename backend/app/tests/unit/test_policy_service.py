from pathlib import Path
from unittest.mock import MagicMock, mock_open, patch

import pytest
from app.services.policy_service import PolicyService
from fastapi import HTTPException, UploadFile


@pytest.fixture
def policy_service():
    return PolicyService()


@pytest.mark.asyncio
async def test_upload_policy_success(policy_service):
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "test.pdf"
    mock_file.file = MagicMock()

    with patch("pathlib.Path.exists", return_value=True), patch("os.makedirs"), patch(
        "builtins.open", mock_open()
    ) as mock_file_open, patch("shutil.copyfileobj") as mock_copyfileobj:
        result = await policy_service.upload_policy(
            mock_file, "TestInsurance", "TestPolicy"
        )

        assert result == "Successfully uploaded TestInsurance/TestPolicy.pdf"
        mock_file_open.assert_called_once()
        mock_copyfileobj.assert_called_once()


@pytest.mark.asyncio
async def test_upload_policy_not_pdf(policy_service):
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "test.txt"

    with pytest.raises(HTTPException) as exc_info:
        await policy_service.upload_policy(mock_file, "TestInsurance", "TestPolicy")

    assert exc_info.value.status_code == 400
    assert "File must be a PDF" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_upload_policy_insurance_not_found(policy_service):
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "test.pdf"

    with patch("pathlib.Path.exists", return_value=False):
        with pytest.raises(HTTPException) as exc_info:
            await policy_service.upload_policy(
                mock_file, "NonexistentInsurance", "TestPolicy"
            )

    assert exc_info.value.status_code == 404
    assert "Insurance company not found" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_delete_policy_success(policy_service):
    with patch("pathlib.Path.exists", return_value=True), patch(
        "os.remove"
    ) as mock_remove:
        result = await policy_service.delete_policy("TestInsurance", "TestPolicy")

        assert result == "Successfully deleted TestInsurance/TestPolicy.pdf"
        mock_remove.assert_called_once()


@pytest.mark.asyncio
async def test_delete_policy_not_found(policy_service):
    with patch("pathlib.Path.exists", return_value=False):
        with pytest.raises(HTTPException) as exc_info:
            await policy_service.delete_policy("TestInsurance", "NonexistentPolicy")

    assert exc_info.value.status_code == 404
    assert "Policy file not found" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_get_policies_success(policy_service):
    mock_structure = {"Insurance1": ["Policy1", "Policy2"], "Insurance2": ["Policy3"]}

    with patch("pathlib.Path.exists", return_value=True), patch(
        "pathlib.Path.is_dir", return_value=True
    ), patch("pathlib.Path.iterdir") as mock_iterdir, patch(
        "pathlib.Path.glob"
    ) as mock_glob:
        # Create mock directories for each insurance company
        mock_dirs = []
        for company, policies in mock_structure.items():
            mock_dir = MagicMock(spec=Path)
            mock_dir.name = company
            mock_dir.is_dir.return_value = True
            mock_dir.glob.return_value = [
                MagicMock(spec=Path, stem=policy) for policy in policies
            ]
            mock_dirs.append(mock_dir)

        mock_iterdir.return_value = mock_dirs

        result = await policy_service.get_policies()

        assert result == {"policies": mock_structure}


@pytest.mark.asyncio
async def test_get_policies_folder_not_found(policy_service):
    with patch("pathlib.Path.exists", return_value=False):
        with pytest.raises(HTTPException) as exc_info:
            await policy_service.get_policies()

    assert exc_info.value.status_code == 500
    assert "Insurance folder not found" in str(exc_info.value.detail)
