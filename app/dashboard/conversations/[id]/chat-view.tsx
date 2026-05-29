"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Bot, User } from "lucide-react";
import type { Message } from "@/types/conversation";

interface ChatViewProps {
  conversationId: string;
  phone: string;
  contactName: string | null;
  aiActive: boolean;
  initialMessages: Message[];
}

export function ChatView({
  conversationId,
  phone,
  contactName,
  aiActive,
  initialMessages,
}: ChatViewProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiOn, setAiOn] = useState(aiActive);
  const router = useRouter();

  async function handleToggleAI() {
    const newState = !aiOn;
    setAiOn(newState);

    await fetch("/api/conversations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: conversationId, ai_active: newState }),
    });
  }

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);

    try {
      await fetch("/api/whatsapp/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          name: contactName,
          message: input.trim(),
        }),
      });
      window.location.reload();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-zinc-800 bg-zinc-900">
      {/* Header with toggle */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <span className="text-sm text-zinc-400">
          {aiOn ? "AI is handling this chat" : "Owner is handling this chat"}
        </span>
        <button
          type="button"
          onClick={handleToggleAI}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            aiOn
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          }`}
        >
          {aiOn ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
          {aiOn ? "AI Active" : "Take Over"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-zinc-700 text-zinc-100"
                  : msg.role === "assistant"
                    ? "bg-zinc-800 text-zinc-200"
                    : "bg-zinc-850 text-zinc-400"
              }`}
            >
              {msg.content.split("\n").map((line, i) => (
                <p key={i}>{line || "\u00A0"}</p>
              ))}
              <p className="mt-1 text-right text-[10px] text-zinc-500">
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={(el) => el?.scrollIntoView({ behavior: "smooth" })} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={aiOn ? "AI is handling replies..." : "Type a reply..."}
            disabled={aiOn}
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !input.trim() || aiOn}
            style={{ cursor: sending || !input.trim() || aiOn ? "not-allowed" : "pointer" }}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
