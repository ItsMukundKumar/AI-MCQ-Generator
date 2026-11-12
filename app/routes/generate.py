from fastapi import APIRouter, HTTPException, status

from app.config import settings
from app.schemas.generation import (
    MCQGenerationAPIResponse,
    PublicMCQ,
)
from app.services.mcq_generator import generate_mcqs
from app.utils.session_manager import session_manager

router = APIRouter(prefix="/generate", tags=["MCQ Generation"])


@router.post(
    "/{session_id}",
    response_model=MCQGenerationAPIResponse,
)
async def generate_quiz(session_id: str):

    # 1. Retrieve the session
    session = session_manager.get_session(session_id)

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired.",
        )

    # 2. Ensure quiz configuration exists
    if session.question_count is None or session.difficulty is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configure the quiz before generating MCQs.",
        )

    # 3. Prevent duplicate generation
    if session.generated_mcqs is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="MCQs have already been generated for this session.",
        )

    # 4. Validate question count against application settings
    if not 1 <= session.question_count <= settings.max_questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question count in session configuration.",
        )

    # 5. Generate MCQs
    try:
        result = generate_mcqs(
            pdf_bytes=session.pdf_bytes,
            question_count=session.question_count,
            difficulty=session.difficulty,
        )

    except Exception as exc:
        # Log the actual exception on the server.
        import logging

        logging.exception("MCQ generation failed.")

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="MCQ generation failed. Please try again later.",
        ) from exc

    # 6. Store complete MCQs internally
    session.generated_mcqs = [mcq.model_dump() for mcq in result.questions]

    # 7. Build a response that hides answers and explanations
    public_questions = [
        PublicMCQ(
            question=mcq.question,
            options=mcq.options,
        )
        for mcq in result.questions
    ]

    return MCQGenerationAPIResponse(
        session_id=session.session_id,
        question_count=len(public_questions),
        difficulty=session.difficulty,
        questions=public_questions,
        message="MCQs generated successfully.",
    )
