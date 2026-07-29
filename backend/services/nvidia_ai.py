import requests
from core.config import settings

NVIDIA_INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
MODEL = "meta/llama-3.1-8b-instruct"


def get_nvidia_chat_response(
    subject_name: str,
    message: str,
    context: str = "",
    history: list = None,
) -> dict:
    """
    Sends a chat request to the NVIDIA NIM endpoint.
    The API key is stored server-side only — never exposed to the frontend.
    """
    api_key = settings.NVIDIA_API_KEY
    if not api_key:
        return {"reply": "AI service is not configured. Please set NVIDIA_API_KEY in .env", "sources": []}

    # Build the system prompt
    system_prompt = (
        f"You are a friendly, patient study tutor on EduHub — a platform for first-year B.E. (Engineering) students in India. "
        f"The student is studying: {subject_name}.\n\n"
        "RULES YOU MUST FOLLOW:\n"
        "1. Explain concepts the way a real tutor would — conversational, clear, and friendly. Use simple language.\n"
        "2. DO NOT use any markdown formatting. No asterisks, no hashtags, no bold syntax, no bullet markers like * or -. Just write plain sentences and paragraphs.\n"
        "3. When listing things, use numbered lists (1, 2, 3) or write them as flowing sentences.\n"
        "4. ONLY answer questions related to the student's current subject. If they ask about programming (Python, Java, C, etc.), writing code, or anything outside academic study topics, politely say: "
        "\"That's outside what I can help with here! I'm your tutor for {subject_name} — ask me anything about that!\"\n"
        "5. Keep answers concise but thorough. Use examples and analogies a student would understand.\n"
        "6. If a student shares a file or PDF description, explain the key concepts from it in your own words.\n"
        "7. End with a short encouraging note or ask if they want to know more.\n"
    )

    if context:
        system_prompt += f"\n\nContext from {subject_name} notes:\n{context}"

    # Build message history for the API
    messages = [{"role": "system", "content": system_prompt}]

    if history:
        for msg in history:
            role = msg.get("role", "user")
            # Map 'bot' role to 'assistant' for the API
            if role == "bot":
                role = "assistant"
            messages.append({"role": role, "content": msg.get("content", "")})

    # Add the current user message
    messages.append({"role": "user", "content": message})

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    payload = {
        "model": MODEL,
        "messages": messages,
        "max_tokens": 4096,
        "temperature": 0.85,
        "top_p": 0.95,
        "stream": False,
    }

    try:
        response = requests.post(NVIDIA_INVOKE_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()

        # Extract the assistant reply from the NVIDIA response
        choices = data.get("choices", [])
        if choices:
            reply = choices[0].get("message", {}).get("content", "")
        else:
            reply = "I couldn't generate a response. Please try again."

        return {"reply": reply, "sources": []}

    except requests.exceptions.Timeout:
        return {"reply": "The AI is taking too long to respond. Please try again.", "sources": []}
    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code if e.response else 500
        if status_code == 401:
            return {"reply": "AI authentication failed. The NVIDIA API key may be invalid or expired. Update NVIDIA_API_KEY in .env", "sources": []}
        elif status_code == 429:
            return {"reply": "Too many requests. Please wait a moment and try again.", "sources": []}
        else:
            return {"reply": f"AI service error (HTTP {status_code}). Please try again later.", "sources": []}
    except Exception:
        return {"reply": "An unexpected error occurred with the AI service.", "sources": []}
