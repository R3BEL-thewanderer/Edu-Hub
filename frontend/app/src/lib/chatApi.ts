import { supabase } from '@/lib/supabase';

// Force localhost for dev fallback to bypass stale .env cache without restarting Vite
const API_URL = import.meta.env.DEV ? 'http://localhost:8000' : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

interface ChatResponse {
  reply: string;
  sources: string[];
}

/**
 * Send a chat message to the backend AI endpoint.
 * The backend proxies to NVIDIA NIM — API key never touches the browser.
 */
export async function sendChatMessage(
  message: string,
  subjectId: string,
  history: ChatMessage[] = [],
  attachedFileName?: string,
): Promise<ChatResponse> {
  // Get the current session token
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    return { reply: 'Please log in to use the AI tutor.', sources: [] };
  }

  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      message,
      subjectId,
      sessionId: '',
      history,
      attachedFileName: attachedFileName || null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const detail = errorData.detail || `Server error (${response.status})`;
    return { reply: detail, sources: [] };
  }

  return response.json();
}
