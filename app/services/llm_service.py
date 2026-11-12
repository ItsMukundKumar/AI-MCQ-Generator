import base64

from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings


def get_gemini_model():
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY is missing. Add it to your .env file.")

    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.gemini_api_key,
        temperature=0.3,
        max_retries=2,
    )


def invoke_gemini(prompt: str) -> str:
    model = get_gemini_model()
    response = model.invoke(prompt)
    return response.content


def analyze_pdf(pdf_bytes: bytes, prompt: str) -> str:
    if not pdf_bytes:
        raise ValueError("PDF data cannot be empty.")

    pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")

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
    response = model.invoke([message])

    return response.content
