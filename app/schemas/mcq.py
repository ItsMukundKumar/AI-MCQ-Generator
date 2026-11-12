from typing import Literal

from pydantic import BaseModel, Field, field_validator


class MCQ(BaseModel):
    question: str = Field(
        min_length=5,
        description="The MCQ question.",
    )

    options: dict[Literal["A", "B", "C", "D"], str] = Field(
        description="Exactly four answer options labelled A, B, C, and D."
    )

    correct_answer: Literal["A", "B", "C", "D"] = Field(
        description="The label of the correct option."
    )

    explanation: str = Field(
        min_length=5,
        description="An explanation of why the correct option is correct.",
    )

    @field_validator("options")
    @classmethod
    def validate_options(cls, value):
        required_keys = {"A", "B", "C", "D"}

        if set(value.keys()) != required_keys:
            raise ValueError("Each MCQ must contain exactly options A, B, C, and D.")

        if any(not option.strip() for option in value.values()):
            raise ValueError("Answer options cannot be empty.")

        return value


class MCQGenerationResponse(BaseModel):
    questions: list[MCQ] = Field(
        min_length=1,
        description="The list of generated MCQs.",
    )
