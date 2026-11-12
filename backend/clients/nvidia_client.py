import os
import asyncio
from typing import AsyncGenerator, List, Dict
from openai import AsyncOpenAI
import openai
import logging

logger = logging.getLogger(__name__)

class NVIDIAClient:
    def __init__(self):
        from core.config import settings
        self.api_key = settings.NVIDIA_API_KEY
        if not self.api_key:
            raise ValueError("NVIDIA_API_KEY is missing from environment configuration")
            
        self.base_url = "https://integrate.api.nvidia.com/v1"
        self.client = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url)
        # Using a balanced performance model available universally
        self.model = getattr(settings, "NVIDIA_MODEL_ID", "meta/llama-3.1-8b-instruct")
        
    async def stream_chat(self, messages: List[Dict[str, str]], max_retries: int = 3) -> AsyncGenerator[str, None]:
        """Provides an asynchronous token stream from NVIDIA NIM with resilient error handling."""
        for attempt in range(max_retries):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.2,
                    max_tokens=1024,
                    stream=True,
                    timeout=15.0
                )
                async for chunk in response:
                    content = chunk.choices[0].delta.content if chunk.choices else None
                    if content:
                        yield content
                return
            except openai.APIConnectionError as e:
                logger.warning(f"NVIDIA API connection error (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    yield f"\n[System: Unable to connect to AI provider.]"
                await asyncio.sleep(2 ** attempt)
            except openai.APITimeoutError:
                logger.warning(f"NVIDIA API timeout (attempt {attempt + 1}/{max_retries})")
                if attempt == max_retries - 1:
                    yield "\n[System: AI provider timed out.]"
                await asyncio.sleep(2 ** attempt)
            except openai.APIStatusError as e:
                logger.error(f"NVIDIA API status error (status {e.status_code}): {e.response}")
                yield f"\n[System: Error from AI Provider: HTTP {e.status_code}]"
                return
            except Exception as e:
                logger.error(f"NVIDIA API unhandled error: {e}")
                yield "\n[System: An unexpected AI error occurred.]"
                return
