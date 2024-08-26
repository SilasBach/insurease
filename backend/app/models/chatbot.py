from pydantic import BaseModel


class ComparisonRequest(BaseModel):
    policy1: str
    policy2: str
    query: str


class QuestionRequest(BaseModel):
    question: str
