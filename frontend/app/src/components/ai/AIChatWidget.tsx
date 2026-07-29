import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Sparkles, Expand, X, FileText, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { sendChatMessage } from '@/lib/chatApi';
import { ResourceBrowserModal } from '@/components/tutor/ResourceBrowserModal';
import type { FileItem } from '@/types';

interface AIChatWidgetProps {
  subjectName: string;
  subjectId?: string;
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  attachedFile?: string;
}

type Attachment = {
  id: string;
  type: 'manual' | 'eduhub';
  title: string;
  fileItem?: FileItem;
  localFile?: File;
};

export function AIChatWidget({ subjectName, subjectId }: AIChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      content: `Hey! I'm your AI tutor for **${subjectName}**. Got any questions or a file you want me to explain?`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isTyping, setIsTyping] = useState(false);
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

    let contextData = '';
    const eduhubFiles = attachments.filter(a => a.type === 'eduhub' && a.fileItem);
    if (eduhubFiles.length > 0) {
      contextData = eduhubFiles.map(a => `[Extracted Content of ${a.title}]:\n(Content of ${a.fileItem?.title} - ${a.fileItem?.contentType})`).join('\n\n');
    }

    const attachmentNames = attachments.map(a => a.title).join(', ');

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

    setInputValue('');
    setAttachments([]);
    setIsTyping(true);

    const history = updatedMessages.slice(1).map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await sendChatMessage(
        finalInput,
        subjectId || subjectName,
        history,
        attachmentNames || undefined,
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

  return (
    <div className="bg-white rounded-xl border-4 border-black overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col h-[500px]">
      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} onChange={handleManualFileSelect} className="hidden" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" multiple />

      {/* EduHub Resource Browser Modal */}
      <ResourceBrowserModal
        isOpen={resourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
        onSelect={handleEduhubSelect}
        existingSelections={attachments.filter(a => a.type === 'eduhub').map(a => a.id)}
        initialSubjectId={subjectId || subjectName}
      />

      {/* Header */}
      <div className="bg-sage px-4 py-3 border-b-4 border-black flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-black" />
          <span className="font-black text-black uppercase tracking-wider text-sm">AI Tutor</span>
        </div>
        <Link to={`/chat?subject=${encodeURIComponent(subjectName)}&id=${encodeURIComponent(subjectId || subjectName)}&from=${encodeURIComponent(window.location.pathname)}`} className="p-1.5 bg-white border-2 border-black rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
          <Expand className="w-4 h-4 text-black" />
        </Link>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 flex flex-col">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
            >
              {msg.attachedFile && (
                <div className="flex flex-wrap gap-1 justify-end mb-1">
                  {msg.attachedFile.split(', ').map((file, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-white border-2 border-black px-2 py-1 rounded text-xs font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                      <FileText className="w-3 h-3 text-blue-500" />
                      <span>{file}</span>
                    </div>
                  ))}
                </div>
              )}
              <div 
                className={`px-4 py-3 rounded-2xl border-4 border-black text-sm font-bold leading-relaxed shadow-[4px_4px_0px_rgba(0,0,0,1)] ${
                  msg.role === 'user' ? 'bg-sky rounded-br-none' : 'bg-white rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col max-w-[85%] self-start items-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-none border-4 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center gap-1">
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 bg-black rounded-full" />
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-black rounded-full" />
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-black rounded-full" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t-4 border-black bg-white p-3 flex flex-col z-10">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {attachments.map(att => (
              <div key={att.id} className="flex items-center gap-1.5 bg-white border-2 border-black px-2 py-1 rounded text-xs font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                {att.type === 'eduhub' ? (
                  <BookOpen className="w-3.5 h-3.5 text-black" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-black" />
                )}
                <span className="truncate max-w-[100px]">{att.title}</span>
                <Badge variant="secondary" className="px-1 py-0 text-[9px] bg-rose text-black border-black h-3.5">
                  {att.type === 'eduhub' ? (att.fileItem?.contentType === 'pdfs' ? 'PDF' : 'NOTE') : 'LOCAL'}
                </Badge>
                <button onClick={() => removeAttachment(att.id)} className="ml-0.5 hover:text-red-600">
                  <X className="w-3 h-3 text-black" />
                </button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <Button 
            type="button"
            variant="outline" 
            className="px-2 border-2 border-black bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] transition-all"
            onClick={() => fileInputRef.current?.click()}
            title="Upload Local File"
          >
            <Paperclip className="w-4 h-4 text-black" />
          </Button>
          <Button 
            type="button"
            variant="outline" 
            className="px-2 border-2 border-black bg-sand shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] transition-all"
            onClick={() => setResourceModalOpen(true)}
            title={`Browse ${subjectName} EduHub Notes & PDFs`}
          >
            <BookOpen className="w-4 h-4 text-black" />
          </Button>
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 border-2 border-black bg-white rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow font-bold text-sm"
          />
          <Button 
            type="submit" 
            className="px-3 bg-black text-white border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-black hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] transition-all"
            disabled={(!inputValue.trim() && attachments.length === 0) || isTyping}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
