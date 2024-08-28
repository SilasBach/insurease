from unittest.mock import patch

import pytest
from app.models.chatbot import ComparisonRequest, QuestionRequest
from app.services.chatbot_service import ChatbotService
from fastapi import HTTPException


@pytest.fixture
def chatbot_service_fixture():
    return ChatbotService()


@pytest.mark.asyncio
async def test_ask(chatbot_service_fixture):
    with patch("app.services.chatbot_service.process_query") as mock_process_query:
        mock_process_query.return_value = "Mocked answer"
        request = QuestionRequest(question="Test question")
        response = await chatbot_service_fixture.ask(request)
        assert response == {"answer": "Mocked answer"}
        mock_process_query.assert_called_once_with("Test question")


@pytest.mark.asyncio
async def test_ask_error(chatbot_service_fixture):
    with patch("app.services.chatbot_service.process_query") as mock_process_query:
        mock_process_query.side_effect = Exception("Test error")
        request = QuestionRequest(question="Test question")
        with pytest.raises(HTTPException) as exc_info:
            await chatbot_service_fixture.ask(request)
        assert exc_info.value.status_code == 500
        assert "An error occurred while processing the question" in str(
            exc_info.value.detail
        )


@pytest.mark.asyncio
async def test_compare_policies(chatbot_service_fixture):
    with patch("app.services.chatbot_service.compare_policies_query") as mock_compare:
        mock_compare.return_value = "Comparison result"
        request = ComparisonRequest(
            policy1="policy1", policy2="policy2", query="comparison query"
        )
        response = await chatbot_service_fixture.compare_policies(request)
        assert response == {"answer": "Comparison result"}
        mock_compare.assert_called_once_with(
            "policy1.pdf", "policy2.pdf", "comparison query"
        )


@pytest.mark.asyncio
async def test_compare_policies_error(chatbot_service_fixture):
    with patch("app.services.chatbot_service.compare_policies_query") as mock_compare:
        mock_compare.side_effect = Exception("Test error")
        request = ComparisonRequest(
            policy1="policy1", policy2="policy2", query="comparison query"
        )
        with pytest.raises(HTTPException) as exc_info:
            await chatbot_service_fixture.compare_policies(request)
        assert exc_info.value.status_code == 500
        assert "An error occurred while comparing policies" in str(
            exc_info.value.detail
        )
