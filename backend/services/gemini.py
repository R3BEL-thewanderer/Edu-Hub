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
