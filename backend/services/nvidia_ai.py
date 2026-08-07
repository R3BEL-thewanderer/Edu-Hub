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
        f"You are EduHub AI, a comprehensive Engineering Academic Assistant and mentor for students.\n"
        f"The user is currently studying or asking about: {subject_name}.\n\n"
        "RESPONSE PRIORITY & BEHAVIOR RULES:\n"
        "1. PRIORITY 1 - USE CONTEXT FIRST: If context or uploaded notes are provided and relevant, use them first to answer. Clearly indicate when pulling info from notes.\n"
        "2. PRIORITY 2 - SUPPLEMENT WITH KNOWLEDGE: If notes don't fully answer the question, or if no notes are provided, supplement with your general engineering knowledge. Never refuse a question because it isn't in the notes.\n"
        "3. PRIORITY 3 - OPEN DOMAIN: You must confidently answer questions on ANY engineering domain: Programming, Data Structures, Algorithms, DBMS, OS, Networks, Software Eng, AI/ML, Cloud, Cyber Security, IoT, Electronics, Math, Physics, Chemistry, Aptitude, Interview/Resume Prep, Debugging, SQL, Linux, Git, and System Design.\n"
        "4. PROJECT HELP: You can explain, debug, or review code, summarize architecture, and generate small/medium code examples. Do NOT generate massive full-scale commercial projects in a single response.\n"
        "5. TONE & FORMATTING: Explain like a supportive engineering mentor. Use simple, conversational language, analogies, and examples.\n"
        "6. DO NOT use any markdown formatting. No asterisks, no hashtags, no bold syntax, no bullet markers like * or -. Just write plain sentences and paragraphs. When listing things, use numbered lists (1, 2, 3).\n"
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
