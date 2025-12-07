"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouteStream } from "@/hooks/useRouteStream";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

type RouteChatProps = {
  routeId: string;
  currentUserId?: string;
};

export default function RouteChat({ routeId, currentUserId }: RouteChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialLoadDone = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Callback para nuevos mensajes del SSE
  const handleNewMessages = useCallback((newMsgs: Message[]) => {
    if (!initialLoadDone.current) {
      // Primera carga - reemplazar todo
      setMessages(newMsgs);
      initialLoadDone.current = true;
    } else {
      // Mensajes nuevos - añadir
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const uniqueNew = newMsgs.filter(m => !existingIds.has(m.id));
        if (uniqueNew.length > 0 && !isOpen) {
          setUnreadCount(c => c + uniqueNew.length);
        }
        return [...prev, ...uniqueNew];
      });
    }
  }, [isOpen]);

  // Usar SSE para actualizaciones en tiempo real
  const { status } = useRouteStream({
    routeId,
    enabled: true,
    onMessages: handleNewMessages,
  });

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/routes/${routeId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setMessages(prev => [...prev, data.message]);
          setNewMessage("");
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-[110px] left-4 z-50 pointer-events-auto bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-200 active:scale-95"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-lg animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-auto flex flex-col bg-white md:inset-auto md:bottom-20 md:right-4 md:w-96 md:h-[500px] md:rounded-2xl md:shadow-2xl md:border md:border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-amber-500 to-amber-600 text-white md:rounded-t-2xl shadow-sm">
            <h3 className="font-bold flex items-center gap-2 text-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              Chat del Grupo
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-full transition-all active:scale-90">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="font-semibold text-slate-600">No hay mensajes todavía</p>
                <p className="text-sm mt-1">¡Sé el primero en escribir!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.user?.id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    {!isOwn && (
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-white shadow-sm flex-shrink-0 mb-1">
                        {msg.user?.image ? (
                          <img src={msg.user.image} alt={msg.user.name || "User"} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-600">
                            {msg.user?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] ${isOwn
                        ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl rounded-br-md shadow-md"
                        : "bg-white text-slate-800 rounded-2xl rounded-bl-md border border-slate-200 shadow-sm"
                        } p-3 transition-all hover:shadow-lg`}
                    >
                      {!isOwn && (
                        <p className="text-xs font-bold text-amber-600 mb-1">
                          {msg.user?.name || "Anónimo"}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                      <p className={`text-[10px] mt-1.5 ${isOwn ? "text-amber-100" : "text-slate-400"}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 bg-white md:rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50 transition-all"
                maxLength={500}
              />
              <button
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
                className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-2.5 rounded-full hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
