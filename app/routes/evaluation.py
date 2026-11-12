import logging

from fastapi import APIRouter, HTTPException, status

from app.schemas.evaluation import (
    AnswerSubmissionRequest,
    EvaluationResponse,
)
from app.services.evaluator import evaluate_answers
from app.utils.session_manager import session_manager

router = APIRouter(prefix="/evaluation", tags=["Evaluation"])

logger = logging.getLogger(__name__)


@router.post(
    "/{session_id}",
    response_model=EvaluationResponse,
)
async def submit_answers(
    session_id: str,
    submission: AnswerSubmissionRequest,
):

    # 1. Retrieve session
    session = session_manager.get_session(session_id)

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired.",
        )

    # 2. Check whether MCQs have been generated
    if session.generated_mcqs is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Generate MCQs before submitting answers.",
        )

    # 3. Prevent repeated submissions
    if session.is_submitted:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Answers have already been submitted.",
        )

    # 4. Evaluate answers
    try:
        result = evaluate_answers(
            generated_mcqs=session.generated_mcqs,
            submitted_answers=submission.answers,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception("Answer evaluation failed.")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Answer evaluation failed.",
        ) from exc

    # 5. Store submission and evaluation
    session.submitted_answers = submission.answers
    session.evaluation_result = result
    session.is_submitted = True

    # 6. Return evaluation summary
    return EvaluationResponse(
        session_id=session.session_id,
        total_questions=result["total_questions"],
        attempted_questions=result["attempted_questions"],
        correct_answers=result["correct_answers"],
        incorrect_answers=result["incorrect_answers"],
        score_percentage=result["score_percentage"],
        message="Answers submitted and evaluated successfully.",
    )
