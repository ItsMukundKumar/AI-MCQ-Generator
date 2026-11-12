from io import BytesIO

from pypdf import PdfReader
from pypdf.errors import PdfReadError, PdfStreamError


def validate_pdf(
    file_bytes: bytes,
    filename: str,
    content_type: str | None,
    max_size_bytes: int,
) -> dict:
    """
    Validate an uploaded PDF file.

    Checks:
    1. File extension
    2. MIME type
    3. File size
    4. PDF signature
    5. PDF readability

    Returns file metadata if validation succeeds.

    Raises ValueError if validation fails.
    """

    # 1. Validate filename.
    if not filename:
        raise ValueError("Filename is required.")

    if not filename.lower().endswith(".pdf"):
        raise ValueError("Only PDF files are allowed.")

    # 2. Validate MIME type.
    if content_type != "application/pdf":
        raise ValueError("Invalid MIME type. Expected application/pdf.")

    # 3. Validate empty file.
    if not file_bytes:
        raise ValueError("Uploaded file is empty.")

    # 4. Validate maximum file size.
    file_size = len(file_bytes)

    if file_size > max_size_bytes:
        raise ValueError(
            f"File size exceeds the maximum limit of "
            f"{max_size_bytes // (1024 * 1024)} MB."
        )

    # 5. Validate PDF signature.
    if not file_bytes.startswith(b"%PDF-"):
        raise ValueError("Invalid PDF file signature.")

    # 6. Validate PDF readability.
    try:
        pdf_reader = PdfReader(
            BytesIO(file_bytes),
            strict=True,
        )

        if pdf_reader.is_encrypted:
            raise ValueError("Password-protected PDFs are not supported.")

        page_count = len(pdf_reader.pages)

        if page_count == 0:
            raise ValueError("PDF contains no pages.")

    except ValueError:
        raise

    except (PdfReadError, PdfStreamError, EOFError, OSError):
        raise ValueError("PDF is corrupted or cannot be read.") from None

    return {
        "filename": filename,
        "file_size_bytes": file_size,
        "page_count": page_count,
        "content_type": content_type,
        "is_valid": True,
    }
