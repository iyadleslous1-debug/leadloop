"use client";

import { useState } from "react";
import { Settings, Check } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Settings</h2>
        <p className="text-sm text-zinc-500">Configure your integrations and API keys</p>
      </div>

      <WhatsAppSettings />
      <GeminiSettings />
      <VercelEnvNote />
    </div>
  );
}

function WhatsAppSettings() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="mb-1 text-sm font-semibold text-zinc-100">WhatsApp Business API</h3>
      <p className="mb-4 text-xs text-zinc-500">
        Configure your WhatsApp Business credentials. Get these from Meta Developer Dashboard.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400">Phone Number ID</label>
          <input
            type="text"
            placeholder="1075248509013528"
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400">Access Token</label>
          <input
            type="password"
            placeholder="EAAxx..."
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400">Verify Token</label>
          <input
            type="text"
            defaultValue="leadloop-verify-2024"
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <p className="text-xs text-zinc-600">
          These are currently set as environment variables in Vercel. Settings page storage coming soon.
        </p>
      </div>
    </div>
  );
}

function GeminiSettings() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="mb-1 text-sm font-semibold text-zinc-100">Google Gemini AI</h3>
      <p className="mb-4 text-xs text-zinc-500">
        Free AI brain for intent detection and smart replies. Get a free key at{' '}
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-zinc-300 underline">
          Google AI Studio
        </a>
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400">Gemini API Key</label>
          <input
            type="password"
            placeholder="AIza..."
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <p className="text-xs text-zinc-600">
          Set as GEMINI_API_KEY in Vercel environment variables. Falls back to rule-based AI if not set.
        </p>
      </div>
    </div>
  );
}

function VercelEnvNote() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="mb-1 text-sm font-semibold text-zinc-100">Environment Variables</h3>
      <p className="mb-3 text-xs text-zinc-500">
        Configure these in Vercel Dashboard → Settings → Environment Variables
      </p>
      <div className="space-y-2">
        {[
          { name: "WHATSAPP_PHONE_NUMBER_ID", desc: "Your WhatsApp phone number ID" },
          { name: "WHATSAPP_TOKEN", desc: "WhatsApp Business API access token" },
          { name: "WHATSAPP_VERIFY_TOKEN", desc: "Webhook verification token" },
          { name: "GEMINI_API_KEY", desc: "Google Gemini free API key" },
        ].map((env) => (
          <div key={env.name} className="flex items-center justify-between rounded-lg border border-zinc-800/50 px-3 py-2">
            <div>
              <code className="text-xs text-zinc-300">{env.name}</code>
              <p className="text-[10px] text-zinc-600">{env.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
