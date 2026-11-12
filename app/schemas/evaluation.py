
from typing import Literal

from pydantic import BaseModel, Field


class AnswerSubmissionRequest(BaseModel):
    answers: dict[int, Literal["A", "B", "C", "D"]] = Field(
        description="Question index mapped to the selected answer."
    )


class EvaluationResponse(BaseModel):
    session_id: str
    total_questions: int
    attempted_questions: int
    correct_answers: int
    incorrect_answers: int
    score_percentage: float
    message: str


class QuestionResult(BaseModel):
    question_index: int
    question: str
    options: dict[str, str]
    submitted_answer: str | None
    correct_answer: str
    is_correct: bool
    explanation: str


class DetailedResultsResponse(BaseModel):
    session_id: str
    total_questions: int
    attempted_questions: int
    correct_answers: int
    incorrect_answers: int
    unattempted_questions: int
    score_percentage: float
    question_results: list[QuestionResult]
    message: str
