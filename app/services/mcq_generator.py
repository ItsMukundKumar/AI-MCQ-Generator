import base64

from langchain_core.messages import HumanMessage

from app.schemas.mcq import MCQGenerationResponse
from app.services.llm_service import get_gemini_model


def generate_mcqs(
    pdf_bytes: bytes,
    question_count: int,
    difficulty: str,
) -> MCQGenerationResponse:

    if not pdf_bytes:
        raise ValueError("PDF data cannot be empty.")

    if question_count < 1:
        raise ValueError("Question count must be at least 1.")

    if difficulty not in {"Easy", "Normal", "Hard"}:
        raise ValueError("Invalid difficulty level.")

    pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")

    prompt = f"""
    You are an expert educational assessment creator. Analyze the provided PDF and generate exactly **{question_count} multiple-choice questions**.

        **Difficulty Level:** {difficulty}

        ### Instructions
        1. Use only information explicitly supported by the PDF. Do not introduce external knowledge or assumptions.
        2. Generate clear, meaningful, and relevant questions that test understanding of the material.
        3. Each question must have exactly four options (A, B, C, D), with only one correct answer.
        4. Avoid duplicate, repetitive, ambiguous, or misleading questions.
        5. Match the requested difficulty level:
            - **Easy:** Basic facts and definitions.
            - **Medium:** Conceptual understanding and application.
            - **Hard:** Deeper understanding, analysis, and connections between concepts.
        6. Provide the correct answer and a concise, informative explanation for every question.
        7. If the PDF does not contain enough information to generate the requested number of valid questions, do not invent content.

        **Output:** Return valid, structured JSON only, with no additional text or Markdown.
    """

    message = HumanMessage(
        content=[
            {
                "type": "text",
                "text": prompt,
            },
            {
                "type": "media",
                "mime_type": "application/pdf",
                "data": pdf_base64,
            },
        ]
    )

    model = get_gemini_model()

    structured_model = model.with_structured_output(MCQGenerationResponse)

    result = structured_model.invoke([message])

    if len(result.questions) != question_count:
        raise ValueError(
            f"Expected {question_count} questions, "
            f"but Gemini generated {len(result.questions)}."
        )

    return result
