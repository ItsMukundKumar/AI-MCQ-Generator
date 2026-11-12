from fastapi import APIRouter, HTTPException, status

from app.config import settings
from app.schemas.session import (
    SessionConfigurationRequest,
    SessionConfigurationResponse,
)
from app.utils.session_manager import session_manager

router = APIRouter(
    prefix="/sessions",
    tags=["Session Management"],
)


@router.get("/{session_id}")
async def get_session(session_id: str):
    """
    Retrieve session information without exposing PDF bytes.
    """

    session = session_manager.get_session(session_id)

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired.",
        )

    return {
        "session_id": session.session_id,
        "filename": session.filename,
        "question_count": session.question_count,
        "difficulty": session.difficulty,
        "has_generated_mcqs": (session.generated_mcqs is not None),
        "is_submitted": session.is_submitted,
        "created_at": session.created_at,
        "expires_at": session.expires_at,
    }


@router.post(
    "/{session_id}/configure",
    response_model=SessionConfigurationResponse,
)
async def configure_session(
    session_id: str,
    configuration: SessionConfigurationRequest,
):
    """
    Configure the number and difficulty of quiz questions.
    """

    if configuration.question_count > settings.max_questions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(f"Maximum allowed questions: " f"{settings.max_questions}."),
        )

    session = session_manager.get_session(session_id)

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired.",
        )

    try:
        session_manager.configure_session(
            session_id=session_id,
            question_count=configuration.question_count,
            difficulty=configuration.difficulty,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    return SessionConfigurationResponse(
        session_id=session.session_id,
        filename=session.filename,
        question_count=configuration.question_count,
        difficulty=configuration.difficulty,
        message="Quiz configuration saved successfully.",
    )


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """
    Delete an existing session.
    """

    deleted = session_manager.delete_session(session_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    return {
        "message": "Session deleted successfully.",
        "session_id": session_id,
    }
