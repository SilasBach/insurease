from pathlib import Path

from app.compare_query import compare_policies_query
from app.core.config import settings
from app.information_query import process_query
from app.models.chatbot import ComparisonRequest, QuestionRequest
from fastapi import HTTPException


class ChatbotService:
    BASE_PATH = Path(settings.BASE_PATH)

    async def ask(self, request: QuestionRequest):
        try:
            answer = process_query(request.question)
            return {"answer": answer}
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"An error occurred while processing the question: {str(e)}",
            )

    async def compare_policies(self, request: ComparisonRequest):
        try:
            policy1_with_extension = f"{request.policy1}.pdf"
            policy2_with_extension = f"{request.policy2}.pdf"

            answer = compare_policies_query(
                policy1_with_extension,
                policy2_with_extension,
                request.query,
            )
            return {"answer": answer}
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"An error occurred while comparing policies: {str(e)}",
            )
