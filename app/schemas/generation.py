from pydantic import BaseModel, Field

from app.schemas.mcq import MCQ


class PublicMCQ(BaseModel):
    question: str
    options: dict[str, str]


class MCQGenerationAPIResponse(BaseModel):
    session_id: str
    question_count: int
    difficulty: str
    questions: list[PublicMCQ]
    message: str
