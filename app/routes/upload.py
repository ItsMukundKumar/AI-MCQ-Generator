from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import settings
from app.utils.file_validation import validate_pdf
from app.utils.session_manager import session_manager

router = APIRouter(
    prefix="/upload",
    tags=["PDF Upload"],
)


@router.post("/")
async def upload_pdf(
    file: UploadFile = File(...),
):
    """
    Upload, validate and create a session for a PDF.
    """

    max_size_bytes = settings.max_upload_size_mb * 1024 * 1024

    file_chunks = []
    total_size = 0

    try:
        while True:
            chunk = await file.read(1024 * 1024)

            if not chunk:
                break

            total_size += len(chunk)

            if total_size > max_size_bytes:
                raise HTTPException(
                    status_code=413,
                    detail=(
                        f"File size exceeds the maximum "
                        f"limit of {settings.max_upload_size_mb} MB."
                    ),
                )

            file_chunks.append(chunk)

        file_bytes = b"".join(file_chunks)

        # Validate the uploaded PDF.
        metadata = validate_pdf(
            file_bytes=file_bytes,
            filename=file.filename or "",
            content_type=file.content_type,
            max_size_bytes=max_size_bytes,
        )

        # Create a new session after successful validation.
        session = session_manager.create_session(
            filename=metadata["filename"],
            pdf_bytes=file_bytes,
        )

        return {
            "message": "PDF uploaded and session created successfully.",
            "session": {
                "session_id": session.session_id,
                "filename": session.filename,
                "file_size_bytes": metadata["file_size_bytes"],
                "page_count": metadata["page_count"],
                "question_count": session.question_count,
                "difficulty": session.difficulty,
                "expires_at": session.expires_at,
            },
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    finally:
        await file.close()
