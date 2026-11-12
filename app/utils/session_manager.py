import asyncio
import logging

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID, uuid4
from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class Session:
    """
    Represents one user's quiz session.
    """

    session_id: str
    filename: str
    pdf_bytes: bytes

    created_at: datetime
    last_accessed_at: datetime
    expires_at: datetime

    question_count: int | None = None
    difficulty: str | None = None

    generated_mcqs: list[dict[str, Any]] | None = None

    submitted_answers: dict[int, str | None] | None = None

    evaluation_result: dict[str, Any] | None = None

    is_submitted: bool = False


class SessionManager:
    """
    Manages application sessions using in-memory storage.
    """

    def __init__(self, ttl_seconds: int = 3600):
        if ttl_seconds <= 0:
            raise ValueError("Session TTL must be greater than zero.")

        self.ttl_seconds = ttl_seconds

        self._sessions: dict[str, Session] = {}

    def _get_current_time(self) -> datetime:
        """
        Returns the current UTC time.
        """
        return datetime.now(timezone.utc)

    def _refresh_expiration(self, session: Session) -> None:
        """
        Refresh session expiration using sliding TTL.
        """
        now = self._get_current_time()

        session.last_accessed_at = now

        session.expires_at = now + timedelta(seconds=self.ttl_seconds)

    def create_session(
        self,
        filename: str,
        pdf_bytes: bytes,
    ) -> Session:
        """
        Create a new session and store uploaded PDF bytes.
        """

        if not filename:
            raise ValueError("Filename is required.")

        if not pdf_bytes:
            raise ValueError("PDF data cannot be empty.")

        self.cleanup_expired_sessions()

        now = self._get_current_time()

        session_id = str(uuid4())

        session = Session(
            session_id=session_id,
            filename=filename,
            pdf_bytes=pdf_bytes,
            created_at=now,
            last_accessed_at=now,
            expires_at=now + timedelta(seconds=self.ttl_seconds),
        )

        self._sessions[session_id] = session

        logger.info("Session created: %s", session_id)

        return session

    def get_session(self, session_id: str) -> Session | None:
        """
        Retrieve an existing session.

        Returns None if the session does not exist
        or has expired.
        """

        try:
            normalized_id = str(UUID(session_id))
        except (ValueError, TypeError, AttributeError):
            return None

        session = self._sessions.get(normalized_id)

        if session is None:
            return None

        if session.expires_at <= self._get_current_time():
            self.delete_session(normalized_id)
            return None

        self._refresh_expiration(session)

        return session

    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session.

        Returns True if deleted, otherwise False.
        """

        try:
            normalized_id = str(UUID(session_id))
        except (ValueError, TypeError, AttributeError):
            return False

        session = self._sessions.pop(normalized_id, None)

        if session is None:
            return False

        logger.info("Session deleted: %s", normalized_id)

        return True

    def cleanup_expired_sessions(self) -> int:
        """
        Remove all expired sessions.

        Returns the number of deleted sessions.
        """

        now = self._get_current_time()

        expired_session_ids = [
            session_id
            for session_id, session in self._sessions.items()
            if session.expires_at <= now
        ]

        for session_id in expired_session_ids:
            self._sessions.pop(session_id, None)

            logger.info(
                "Expired session removed: %s",
                session_id,
            )

        return len(expired_session_ids)

    async def cleanup_loop(
        self,
        interval_seconds: int = 60,
    ) -> None:
        """
        Periodically remove expired sessions.

        Runs until the application shuts down.
        """

        while True:
            await asyncio.sleep(interval_seconds)

            removed_count = self.cleanup_expired_sessions()

            if removed_count:
                logger.info(
                    "Cleanup removed %s expired sessions.",
                    removed_count,
                )

    def configure_session(
        self,
        session_id: str,
        question_count: int,
        difficulty: str,
    ) -> Session | None:
        """
        Store quiz configuration in an existing session.
        """

        session = self.get_session(session_id)

        if session is None:
            return None

        if session.generated_mcqs is not None:
            raise ValueError("Quiz configuration cannot be changed after generation.")

        session.question_count = question_count
        session.difficulty = difficulty

        self._refresh_expiration(session)

        return session


# Create one shared session manager instance.
session_manager = SessionManager(ttl_seconds=settings.session_ttl_seconds)
