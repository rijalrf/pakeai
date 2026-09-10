// Halaman chat: Brainstorming dengan AI (form terstruktur, streaming disabled)
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { ChatMessageList } from '@/components/chat/chat-message-list';
import { ChatBubble } from '@/components/chat/chat-bubble';
import { StructuredForm } from '@/components/chat/structured-form';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  kind: 'text' | 'form' | 'done';
  content: string;
  payload?: any;
  createdAt: Date;
};

function parsePayload(val: any) {
  if (!val) return undefined;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return undefined;
  }
}

export function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showFinishButton, setShowFinishButton] = useState(false);
  const [formAnswered, setFormAnswered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load messages on mount
  useEffect(() => {
    if (!sessionId) return;

    const loadMessages = async () => {
      try {
        const res = await fetch(`http://localhost:6655/api/chat/sessions/${sessionId}/messages`, {
          credentials: 'include',
        });
        const json = await res.json();
        const rawMsgs = json.messages || [];
        const msgs = rawMsgs.map((m: any) => ({
          ...m,
          payload: parsePayload(m.payload),
        }));
        setMessages(msgs);
        if (msgs.some((m: any) => m.kind === 'done')) {
          setShowFinishButton(true);
        }
      } catch (err) {
        console.error('Gagal load pesan:', err);
      }
    };

    loadMessages();
  }, [sessionId]);

  // Auto-scroll ke bawah
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      kind: 'text',
      content: inputText,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);
    setFormAnswered(false);

    try {
      const res = await fetch(`http://localhost:6655/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: inputText }),
      });

      const aiResponse = await res.json();

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        kind: aiResponse.kind || 'text',
        content: aiResponse.content,
        payload: parsePayload(aiResponse.payload),
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);

      // Jika kind="done", tampilkan tombol Lanjut
      if (aiResponse.kind === 'done') {
        setShowFinishButton(true);
      }
    } catch (err) {
      console.error('Error mengirim pesan:', err);
      setIsTyping(false);
      alert('Terjadi kesalahan saat mengirim pesan.');
    } finally {
      setIsLoading(false);
    }
  };

  const retryLastMessage = async () => {
    setIsLoading(true);
    setIsTyping(true);
    try {
      const res = await fetch(`http://localhost:6655/api/chat/sessions/${sessionId}/retry`, {
        method: 'POST',
        credentials: 'include',
      });
      const aiResponse = await res.json();
      setMessages((prev) => {
        const next = [...prev];
        if (next.length > 0 && next[next.length - 1].role === 'assistant') {
          next.pop();
        }
        return [
          ...next,
          {
            id: aiResponse.id || `ai-${Date.now()}`,
            role: 'assistant',
            kind: aiResponse.kind || 'text',
            content: aiResponse.content,
            payload: parsePayload(aiResponse.payload),
            createdAt: new Date(),
          },
        ];
      });
      if (aiResponse.kind === 'done') {
        setShowFinishButton(true);
      }
    } catch (err) {
      console.error('Error saat retry:', err);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleFormSubmit = async (answers: Record<string, string>) => {
    // Serialisasi jawaban form jadi text untuk dikirim ke AI
    const serialized = Object.entries(answers)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    const userMessage: ChatMessage = {
      id: `form-${Date.now()}`,
      role: 'user',
      kind: 'text',
      content: serialized,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setFormAnswered(true);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const res = await fetch(`http://localhost:6655/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: serialized, formAnswers: answers }),
      });

      const aiResponse = await res.json();

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        kind: aiResponse.kind || 'text',
        content: aiResponse.content,
        payload: parsePayload(aiResponse.payload),
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);

      if (aiResponse.kind === 'done') {
        setShowFinishButton(true);
      }
    } catch (err) {
      console.error('Error mengirim jawaban form:', err);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeProject = async () => {
    setShowFinishButton(false);
    setIsLoading(true);

    try {
      const res = await fetch(`http://localhost:6655/api/chat/sessions/${sessionId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const json = await res.json();
      if (json.projectId) {
        navigate(`/projects/${json.projectId}/interview`);
      } else {
        console.error('Gagal finalisasi project:', json);
        alert('Terjadi kesalahan saat membuat project.');
      }
    } catch (err) {
      console.error('Error finalisasi:', err);
      alert('Terjadi kesalahan saat membuat project.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header kecil untuk chat */}
      <div className="border-b px-6 py-3 bg-muted/50">
        <h2 className="font-medium text-foreground">Brainstorming Ide</h2>
        <p className="text-sm text-muted-foreground">Ceritakan ide aplikasi Anda ke pake.ai</p>
      </div>

      {/* Konten chat */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              <ChatBubble message={msg} />
              {msg.role === 'assistant' && msg.content.includes('Maaf, saya mengalami kesalahan') && (
                <div className="flex justify-start">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={retryLastMessage}
                    disabled={isLoading}
                    className="gap-2 text-xs"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Coba Lagi
                  </Button>
                </div>
              )}
              {msg.kind === 'form' && msg.payload && (
                <StructuredForm
                  questions={msg.payload.questions}
                  onSubmit={handleFormSubmit}
                  disabled={isLoading || formAnswered}
                />
              )}
            </div>
          ))}

          {isTyping && <TypingIndicator />}

          {showFinishButton && (
            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={finalizeProject}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Lanjut ke Interview
              </Button>
            </div>
          )}

          {/* Hidden div untuk auto-scroll */}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t px-6 py-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-start">
            <Textarea
              placeholder="Tulis pesan Anda... (Shift+Enter untuk baris baru)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || showFinishButton}
              rows={3}
              className="flex-1 resize-none"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || showFinishButton || !inputText.trim()}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Tekan Enter untuk kirim, Shift+Enter untuk baris baru
          </p>
        </div>
      </div>
    </div>
  );
}
