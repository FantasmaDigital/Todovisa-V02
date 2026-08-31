"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { FAQ_CATEGORIES, FAQOption, INITIAL_BOT_MESSAGE } from "@/app/constants/faqChatbotData";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  actionText?: string;
  actionUrl?: string;
  timestamp: string;
}

// Monochrome Inline SVG Icons
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  vipro: (
    <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" strokeWidth="2" />
      <circle cx="12" cy="12" r="2" strokeWidth="2" />
    </svg>
  ),
  ds160: (
    <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  visas: (
    <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  citas: (
    <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  pagos: (
    <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
      <line x1="2" y1="10" x2="22" y2="10" strokeWidth="2" />
    </svg>
  ),
  referidos: (
    <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasUnread, setHasUnread] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "bot",
      text: INITIAL_BOT_MESSAGE,
      timestamp: getFormattedTime(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  function getFormattedTime() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSelectQuestion = (q: FAQOption) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: q.question,
      timestamp: getFormattedTime(),
    };

    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      sender: "bot",
      text: q.answer,
      actionText: q.actionText,
      actionUrl: q.actionUrl,
      timestamp: getFormattedTime(),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: "bot",
        text: INITIAL_BOT_MESSAGE,
        timestamp: getFormattedTime(),
      },
    ]);
    setSelectedCategory(null);
    setSearchQuery("");
  };

  // Filter questions across the site based on search query or selected category
  const allQuestions = FAQ_CATEGORIES.flatMap((cat) => cat.questions);

  const filteredQuestions = searchQuery.trim()
    ? allQuestions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : selectedCategory
    ? FAQ_CATEGORIES.find((cat) => cat.id === selectedCategory)?.questions || []
    : [];

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#113E5F] text-white shadow-xl hover:bg-[#0d314c] transition-all duration-300 border border-slate-100"
        aria-label="Abrir asistente consular de TodoVisa"
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}

        {/* Unread badge dot */}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
          </span>
        )}
      </motion.button>

      {/* Main Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-18 right-0 w-[92vw] sm:w-[420px] max-h-[650px] h-[82vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Header - Styled with TodoVisa Navy Accent */}
            <div className="bg-[#113E5F] text-white p-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold border border-white/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                    </svg>
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#113E5F] rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-wide font-sans">
                    Todovisa
                  </h3>
                  <p className="text-xs text-slate-200/90 flex items-center gap-1.5 font-medium">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Centro de Ayuda 24/7
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={handleResetChat}
                  title="Reiniciar chat"
                  className="p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Cerrar chat"
                  className="p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Live Search Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200">
              <div className="relative">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar dudas sobre visas, VIPRO, precios, citas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#113E5F] text-slate-800 placeholder:text-slate-400 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Chat Messages Body (Clean Light White Background) */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-[#113E5F] text-white rounded-br-none shadow-sm"
                        : "bg-slate-100 text-slate-800 border border-slate-200/80 rounded-bl-none shadow-2xs"
                    }`}
                  >
                    <p className="whitespace-pre-line font-normal">{msg.text}</p>

                    {/* Action Button inside response */}
                    {msg.actionText && msg.actionUrl && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/80">
                        {msg.actionUrl.startsWith("http") ? (
                          <a
                            href={msg.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#113E5F] hover:bg-[#0d314c] rounded-lg transition-colors shadow-xs"
                          >
                            <span>{msg.actionText}</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <Link
                            href={msg.actionUrl}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#113E5F] hover:bg-[#0d314c] rounded-lg transition-colors shadow-xs"
                          >
                            <span>{msg.actionText}</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Presets & Categories Options */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 max-h-[250px] overflow-y-auto">
              {!searchQuery && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {selectedCategory
                        ? `Categoría: ${
                            FAQ_CATEGORIES.find((c) => c.id === selectedCategory)?.title
                          }`
                        : "Categorías del sitio:"}
                    </span>
                    {selectedCategory && (
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-[11px] text-[#113E5F] font-semibold hover:underline"
                      >
                        Ver todas
                      </button>
                    )}
                  </div>

                  {/* Category Filter Chips */}
                  {!selectedCategory && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {FAQ_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className="flex items-center gap-2 p-2.5 text-left text-xs bg-white hover:bg-slate-100 hover:border-slate-300 text-slate-700 border border-slate-200 rounded-xl transition-all font-medium shadow-2xs group"
                        >
                          <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors">
                            {CATEGORY_ICONS[cat.id] || (
                              <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </div>
                          <span className="truncate font-semibold text-slate-800">{cat.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Questions List */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {searchQuery
                    ? `Resultados de búsqueda (${filteredQuestions.length}):`
                    : selectedCategory
                    ? "Elige una pregunta para responderte:"
                    : "Preguntas destacadas:"}
                </span>

                {(searchQuery || selectedCategory
                  ? filteredQuestions
                  : allQuestions.slice(0, 4)
                ).map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuestion(q)}
                    className="w-full text-left p-2.5 text-xs text-[#113E5F] bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center justify-between group shadow-2xs font-medium"
                  >
                    <span className="pr-2 line-clamp-2">{q.question}</span>
                    <svg className="w-4 h-4 text-slate-400 shrink-0 transform group-hover:translate-x-1 group-hover:text-[#113E5F] transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}

                {filteredQuestions.length === 0 && (searchQuery || selectedCategory) && (
                  <div className="text-center py-4 text-xs text-slate-500">
                    <p>No se encontraron respuestas para esa búsqueda.</p>
                    <a
                      href="https://wa.me/50370000000?text=Hola%20TodoVisa,%20tengo%20una%20consulta%20personalizada"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 font-semibold text-[#113E5F] hover:underline"
                    >
                      <span>Hablar con un asesor por WhatsApp</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


