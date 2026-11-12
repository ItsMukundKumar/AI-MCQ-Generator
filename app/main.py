import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.upload import router as upload_router
from app.routes.session import router as session_router
from app.utils.session_manager import session_manager
from app.routes.generate import router as generate_router
from app.routes.evaluation import router as evaluation_router
from app.routes.results import router as results_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application startup and shutdown.
    """

    cleanup_task = asyncio.create_task(
        session_manager.cleanup_loop(
            interval_seconds=settings.session_cleanup_interval_seconds
        )
    )

    yield

    cleanup_task.cancel()

    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="An AI-powered MCQ Generator using Google Gemini.",
    lifespan=lifespan,
)

# CORS configuration
origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://ai-mcq-generator-o7jl.onrender.com/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Home"])
async def home():
    return {
        "message": "Welcome to AI MCQ Generator API",
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "application": settings.app_name,
        "version": settings.app_version,
    }


# Register application routers.
app.include_router(upload_router)
app.include_router(session_router)
app.include_router(generate_router)
app.include_router(evaluation_router)
app.include_router(results_router)
