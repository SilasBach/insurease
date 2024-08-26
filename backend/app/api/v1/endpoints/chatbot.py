from app.api.deps import get_chatbot_service, get_current_user
from app.models.chatbot import ComparisonRequest, QuestionRequest
from app.services.chatbot_service import ChatbotService
from fastapi import APIRouter, Depends, Request

router = APIRouter()


@router.post("/compare-policies")
async def compare_policies(
    request: Request,
    comparerequest: ComparisonRequest,
    chatbot_service: ChatbotService = Depends(get_chatbot_service),
):
    if await get_current_user(request.cookies.get("access_token")):
        return await chatbot_service.compare_policies(comparerequest)


@router.post("/question")
async def ask_question(
    request: Request,
    questionrequest: QuestionRequest,
    chatbot_service: ChatbotService = Depends(get_chatbot_service),
):
    if await get_current_user(request.cookies.get("access_token")):
        return await chatbot_service.ask(questionrequest)
