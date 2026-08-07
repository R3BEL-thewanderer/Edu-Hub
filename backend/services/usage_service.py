from datetime import date
from fastapi import HTTPException
from repositories.ai_repository import AIRepository
import logging

logger = logging.getLogger(__name__)

class UsageService:
    def __init__(self):
        self.ai_repo = AIRepository()
        self.DAILY_MESSAGE_LIMIT = 50
        self.DAILY_TOKEN_LIMIT = 50000

    def check_daily_limits(self, user_id: str) -> dict:
        """Verifies daily message and token constraints have not been breached."""
        usage = self.ai_repo.get_daily_usage(user_id, date.today())
        messages_used = usage.get("messages_used", 0)
        tokens_used = usage.get("tokens_used", 0)

        if messages_used >= self.DAILY_MESSAGE_LIMIT:
            logger.info(f"User {user_id} breached daily AI message limit ({messages_used})")
            raise HTTPException(
                status_code=429, 
                detail="Daily AI message limit reached. Upgrade your subscription or wait until tomorrow."
            )
            
        if tokens_used >= self.DAILY_TOKEN_LIMIT:
            logger.info(f"User {user_id} breached daily AI token limit ({tokens_used})")
            raise HTTPException(
                status_code=429, 
                detail="Daily AI token limit reached. Upgrade your subscription or wait until tomorrow."
            )
            
        return usage
        
    def estimate_tokens(self, text: str) -> int:
        """Heuristic token estimation: ~4 chars per token for standard English."""
        if not text:
            return 0
        return max(1, len(text) // 4)
