"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import type { Message } from "@/types/conversation";

interface ChatViewProps {
  conversationId: string;
  phone: string;
  contactName: string | null;
  initialMessages: Message[];
}

export function ChatView({
  conversationId,
  phone,
  contactName,
  initialMessages,
}: ChatViewProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);

    try {
      const res = await fetch("/api/whatsapp/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          name: contactName,
          message: input.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.reload();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-zinc-800 bg-zinc-900">
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
        <div ref={bottomRef} />
      </div>

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
            placeholder="Type a reply..."
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            style={{ cursor: sending || !input.trim() ? "not-allowed" : "pointer" }}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
