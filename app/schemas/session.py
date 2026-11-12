from typing import Literal

from pydantic import BaseModel, Field


class SessionConfigurationRequest(BaseModel):
    """
    Request schema for configuring a quiz session.
    """

    question_count: int = Field(
        ge=1,
        le=50,
        description="Number of MCQ questions to generate.",
    )

    difficulty: Literal["Easy", "Normal", "Hard"] = Field(
        description="Difficulty level of the quiz.",
    )


class SessionConfigurationResponse(BaseModel):
    """
    Response schema after successful configuration.
    """

    session_id: str
    filename: str
    question_count: int
    difficulty: str
    message: str
