import { useState, useRef, useEffect } from 'react';
import { Send, FileText, X, Menu, Search, Home, BookOpen, Sparkles, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { sendChatMessage } from '@/lib/chatApi';
import { ResourceBrowserModal } from '@/components/tutor/ResourceBrowserModal';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import type { FileItem } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  attachedFile?: string; // Kept for legacy bot messages rendering
}

type Attachment = {
  id: string;
  type: 'manual' | 'eduhub';
  title: string;
  fileItem?: FileItem; // For EduHub resources
  localFile?: File; // For Manual upload
};

export function TutorPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');

  // Attachments State
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map(file => ({
      id: `manual-${Date.now()}-${file.name}`,
      type: 'manual' as const,
      title: file.name,
      localFile: file,
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEduhubSelect = (files: FileItem[]) => {
    const newAttachments = files.map(file => ({
      id: file.id,
      type: 'eduhub' as const,
      title: file.title,
      fileItem: file,
    }));
    // don't add duplicates
    setAttachments(prev => {
      const existingIds = new Set(prev.map(a => a.id));
      const additions = newAttachments.filter(a => !existingIds.has(a.id));
      return [...prev, ...additions];
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputValue.trim() && attachments.length === 0) || isTyping) return;

    // Build Mock Context for EduHub files
    let contextData = '';
    const eduhubFiles = attachments.filter(a => a.type === 'eduhub' && a.fileItem);
    if (eduhubFiles.length > 0) {
      contextData = eduhubFiles.map(a => `[Extracted Content of ${a.title}]:\n(Mocked extracted text for ${a.fileItem?.title} - ${a.fileItem?.contentType})`).join('\n\n');
    }

    const attachmentNames = attachments.map(a => a.title).join(', ');

    // User message format
    let finalInput = inputValue;
    if (contextData) {
      finalInput = `Below is the context from my selected EduHub resources:\n\n${contextData}\n\nMy Question:\n${inputValue}`;
    } else if (attachments.length > 0 && !inputValue) {
      finalInput = `Please analyze the attached files: ${attachmentNames}`;
    }

    const newMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue || `Analyze attached files: ${attachmentNames}`,
      attachedFile: attachmentNames || undefined
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);

    const currentInput = finalInput;
    const fallbackAttachmentName = attachmentNames || undefined;

    setInputValue('');
    setAttachments([]);
    setIsTyping(true);

    const history = updatedMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await sendChatMessage(
        currentInput,
        'General Knowledge', // Mock subject
        history,
        fallbackAttachmentName, // fallback for backend reference
      );

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: response.reply
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: 'Something went wrong. Please try again.'
      }]);
    }

    setIsTyping(false);
  };

  const startNewChat = () => {
    setMessages([]);
    setInputValue('');
    setAttachments([]);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f4f4f4] text-black font-sans overflow-hidden pattern-bg">
      {/* Site-wide Navbar */}
      <Navbar />

      <div className="flex flex-1 relative overflow-hidden">
        {/* Hidden file input (allows multiple) */}
        <input type="file" ref={fileInputRef} onChange={handleManualFileSelect} className="hidden" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" multiple />

        <ResourceBrowserModal
          isOpen={resourceModalOpen}
          onClose={() => setResourceModalOpen(false)}
          onSelect={handleEduhubSelect}
          existingSelections={attachments.filter(a => a.type === 'eduhub').map(a => a.id)}
        />

        {/* Sidebar Overlay (Mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
            style={{ top: '68px' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Neo Brutalism */}
        <div className={`fixed md:relative top-[68px] md:top-0 bottom-0 left-0 z-40 w-72 bg-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out border-r-4 border-black flex flex-col shadow-neo-lg md:shadow-none h-[calc(100vh-68px)] md:h-full shrink-0`}>
          {/* Top items */}
          <div className="p-4 border-b-4 border-black bg-sand">
            <button
              onClick={startNewChat}
              className="flex items-center justify-between w-full p-3 rounded-lg border-2 border-black bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] transition-all text-sm font-black uppercase"
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                New chat
              </div>
              <Sparkles className="w-5 h-5 text-black" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white p-4 space-y-2">
            {[
              { icon: Home, text: "Home", onClick: () => navigate('/') },
              { icon: Search, text: "Search chats", onClick: () => { } },
            ].map((item, idx) => (
              <div key={idx} onClick={item.onClick} className="flex items-center gap-3 px-3 py-3 rounded-lg border-2 border-transparent hover:border-black hover:bg-sage/20 cursor-pointer font-bold transition-all">
                <item.icon className="w-5 h-5 text-black" /> {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          {/* Mobile Sub-Header for Tutor Controls */}
          <div className="md:hidden flex items-center justify-between p-3 border-b-4 border-black bg-white z-10">
            <button onClick={() => setSidebarOpen(true)} className="flex items-center gap-2 px-3 py-1.5 border-2 border-black rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] bg-sand font-black text-xs uppercase">
              <Menu className="w-4 h-4 text-black" />
              Tutor Menu
            </button>
            <button onClick={startNewChat} className="flex items-center gap-2 px-3 py-1.5 border-2 border-black rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] bg-sage font-black text-xs uppercase">
              <Sparkles className="w-4 h-4 text-black" />
              New Chat
            </button>
          </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-48">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto -mt-10">
              <div className="w-24 h-24 mb-6 bg-sand border-4 border-black rounded-2xl flex items-center justify-center shadow-neo">
                <Bot className="w-12 h-12 text-black" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-black font-display text-black mb-4 uppercase tracking-tight">What's on your mind today?</h2>
              <p className="text-lg font-bold text-gray-700 max-w-md">Attach your EduHub notes or upload a file and ask a question to get started.</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full space-y-8">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-4 w-full">
                  {msg.role === 'user' ? (
                    <div className="ml-auto flex flex-col items-end max-w-[85%]">
                      {msg.attachedFile && (
                        <div className="flex flex-wrap items-center justify-end gap-2 mb-2">
                          {msg.attachedFile.split(', ').map((file, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white px-3 py-1.5 border-2 border-black rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                              <FileText className="w-4 h-4 text-black" />
                              <span className="text-xs font-black truncate max-w-[150px]">{file}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="bg-sand border-2 border-black shadow-neo-sm px-5 py-3.5 rounded-2xl rounded-tr-none text-black font-bold whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex gap-4">
                      <div className="w-10 h-10 flex-shrink-0 rounded-xl border-2 border-black flex items-center justify-center bg-sage shadow-neo-sm mt-1">
                        <Bot className="w-6 h-6 text-black" />
                      </div>
                      <div className="bg-white border-2 border-black shadow-neo-sm px-5 py-3.5 rounded-2xl rounded-tl-none text-black font-medium leading-relaxed whitespace-pre-wrap flex-1 prose prose-sm max-w-none">
                        {msg.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="w-full flex gap-4">
                  <div className="w-10 h-10 flex-shrink-0 rounded-xl border-2 border-black flex items-center justify-center bg-sage shadow-neo-sm mt-1">
                    <Bot className="w-6 h-6 text-black animate-pulse" />
                  </div>
                  <div className="bg-white border-2 border-black shadow-neo-sm px-6 py-5 rounded-2xl rounded-tl-none flex items-center gap-2 w-24">
                    <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#f4f4f4] via-[#f4f4f4] to-transparent pt-10 pb-6 px-4 sm:px-8">
          <div className="max-w-3xl mx-auto flex flex-col gap-3">

            {/* Attached Resources Chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 rounded-lg shadow-neo-sm group">
                    {att.type === 'eduhub' ? (
                      <BookOpen className="w-4 h-4 text-black" />
                    ) : (
                      <FileText className="w-4 h-4 text-black" />
                    )}
                    <span className="text-xs font-black truncate max-w-[120px] sm:max-w-[180px]">{att.title}</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-rose text-black border-black h-4 ml-1">
                      {att.type === 'eduhub' ? (att.fileItem?.contentType === 'pdfs' ? 'PDF' : 'NOTE') : 'LOCAL'}
                    </Badge>
                    <button onClick={() => removeAttachment(att.id)} className="ml-1 opacity-60 hover:opacity-100 hover:text-red-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="relative flex items-end w-full border-4 border-black bg-white rounded-2xl focus-within:shadow-neo transition-all shadow-neo-sm overflow-hidden p-1.5">

              <div className="flex items-center gap-1.5 mb-1 ml-1 shrink-0">
                <button
                  type="button"
                  title="Upload Local File"
                  className="p-2 border-2 border-transparent hover:border-black hover:bg-sand rounded-xl transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                </button>
                <button
                  type="button"
                  title="Browse EduHub Resources"
                  className="p-2 border-2 border-transparent hover:border-black hover:bg-sage rounded-xl transition-all"
                  onClick={() => setResourceModalOpen(true)}
                >
                  <BookOpen className="w-6 h-6" strokeWidth={2.5} />
                </button>
              </div>

              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Ask anything or search your notes..."
                className="flex-1 max-h-48 py-3.5 px-3 bg-transparent border-0 focus:ring-0 resize-none outline-none font-bold text-black placeholder-gray-500 text-base"
                rows={1}
                style={{ minHeight: '52px' }}
              />

              <div className="flex items-center p-1.5 mb-0.5 mr-0.5 shrink-0">
                <button
                  type="submit"
                  className={`p-2.5 rounded-xl border-2 border-black transition-all ${((inputValue.trim() || attachments.length > 0) && !isTyping) ? 'bg-black text-white hover:-translate-y-0.5 hover:shadow-neo-sm' : 'bg-gray-200 text-gray-500 opacity-50 cursor-not-allowed'}`}
                  disabled={((!inputValue.trim() && attachments.length === 0) || isTyping)}
                >
                  <Send className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>

            </form>
            <div className="text-center font-bold text-xs text-gray-400">
              Edu-Hub is powered by different AI providers. Validates context against your EduHub PDFs.
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
