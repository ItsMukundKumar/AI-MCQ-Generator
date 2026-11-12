from fastapi import APIRouter, HTTPException, status

from app.schemas.evaluation import DetailedResultsResponse
from app.utils.session_manager import session_manager

router = APIRouter(prefix="/results", tags=["Quiz Results"])


@router.get(
    "/{session_id}",
    response_model=DetailedResultsResponse,
)
async def get_quiz_results(session_id: str):

    # 1. Retrieve session
    session = session_manager.get_session(session_id)

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired.",
        )

    # 2. Ensure MCQs have been generated
    if session.generated_mcqs is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MCQs have not been generated for this session.",
        )

    # 3. Ensure answers have been submitted
    if not session.is_submitted or session.evaluation_result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submit your answers before viewing results.",
        )

    # 4. Retrieve stored evaluation
    result = session.evaluation_result

    # 5. Return detailed results
    return DetailedResultsResponse(
        session_id=session.session_id,
        total_questions=result["total_questions"],
        attempted_questions=result["attempted_questions"],
        correct_answers=result["correct_answers"],
        incorrect_answers=result["incorrect_answers"],
        unattempted_questions=result["unattempted_questions"],
        score_percentage=result["score_percentage"],
        question_results=result["question_results"],
        message="Quiz results retrieved successfully.",
    )
