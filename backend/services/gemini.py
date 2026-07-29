import google.generativeai as genai
from core.config import settings

_configured = False

def _ensure_configured():
    global _configured
    if not _configured and settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _configured = True

def get_chat_response(subject_name: str, message: str, context: str = "", history: list = None):
    """
    Generate a chat response using the free Gemini API.
    
    Instead of Vertex AI RAG, we pass note content as context in the prompt.
    Free tier: 15 RPM, 1M tokens/day — more than enough for a college project.
    """
    _ensure_configured()
    
    model = genai.GenerativeModel("gemini-2.0-flash")
    
    system_instruction = (
        f"You are a friendly, patient study tutor on EduHub — a platform for first-year B.E. (Engineering) students in India. "
        f"The student is studying: {subject_name}.\n\n"
        "RULES YOU MUST FOLLOW:\n"
        "1. Explain concepts the way a real tutor would — conversational, clear, and friendly. Use simple language.\n"
        "2. DO NOT use any markdown formatting. No asterisks, no hashtags, no bold syntax, no bullet markers like * or -. Just write plain sentences and paragraphs.\n"
        "3. When listing things, use numbered lists (1, 2, 3) or write them as flowing sentences.\n"
        f"4. ONLY answer questions related to {subject_name}. If they ask about programming, writing code, or anything outside academic study topics, politely decline.\n"
        "5. Keep answers concise but thorough. Use examples and analogies a student would understand.\n"
        "6. If a student shares a file or PDF description, explain the key concepts from it in your own words.\n"
        "7. End with a short encouraging note or ask if they want to know more.\n"
    )
    
    # Build the prompt with context
    prompt_parts = [system_instruction + "\n\n"]
    
    if context:
        prompt_parts.append(f"Context from {subject_name} notes:\n{context}\n\n")
    
    prompt_parts.append(f"Student question: {message}")
    
    # Convert history to Gemini format
    gemini_history = []
    if history:
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            gemini_history.append({
                "role": role,
                "parts": [msg.get("content", "")]
            })
    
    chat = model.start_chat(history=gemini_history)
    response = chat.send_message("".join(prompt_parts))
    
    return {
        "reply": response.text,
        "sources": []
    }
