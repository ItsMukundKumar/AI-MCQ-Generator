from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralized application configuration.

    Values are loaded from environment variables
    or the .env file.
    """

    app_name: str = "AI MCQ Generator"
    app_version: str = "1.0.0"

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.1-flash-lite"

    max_upload_size_mb: int = 10
    session_cleanup_interval_seconds: int = 60
    session_ttl_seconds: int = 3600

    # Quiz Configuration
    max_questions: int = 50

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Create one reusable settings instance.
settings = Settings()
