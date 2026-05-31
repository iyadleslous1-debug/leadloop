"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, Building2, MessageCircle, Sparkles } from "lucide-react";

const steps = [
  { icon: MessageCircle, title: "Connect WhatsApp", description: "Link your Twilio account so leads can reach you on WhatsApp" },
  { icon: Building2, title: "Add Your Properties", description: "Import or add your first property listings" },
  { icon: Sparkles, title: "You're All Set!", description: "Your AI assistant is ready to handle leads" },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [seeded, setSeeded] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/seed", { method: "POST" });
        const data = await res.json();
        if (data.seeded || (data.seeded === false && data.message === "Already has properties")) {
          setSeeded(true);
        }
      } catch {
        // ignore
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  function handleContinue() {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push("/dashboard");
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
      </div>
    );
  }

  const step = steps[currentStep];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-md">
        {/* Step indicators */}
        <div className="mb-10 flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  i <= currentStep
                    ? "bg-zinc-100 text-zinc-900"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-px w-8 transition-colors ${
                    i < currentStep ? "bg-zinc-100" : "bg-zinc-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
            <step.icon className="h-6 w-6 text-zinc-100" />
          </div>

          <h1 className="mb-2 text-xl font-semibold text-zinc-100">{step.title}</h1>
          <p className="mb-6 text-sm text-zinc-500">{step.description}</p>

          {currentStep === 0 && (
            <div className="mb-6 space-y-3 text-left">
              <p className="text-xs text-zinc-500">
                You will need a Twilio account to receive WhatsApp messages. The setup takes 3 minutes.
              </p>
              <ol className="list-inside list-decimal space-y-1.5 text-xs text-zinc-400">
                <li>Create a free Twilio account at twilio.com</li>
                <li>Go to Settings in your dashboard</li>
                <li>Paste your Account SID, Auth Token, and WhatsApp number</li>
                <li>Done &mdash; your WhatsApp is live!</li>
              </ol>
            </div>
          )}

          {currentStep === 1 && (
            <div className="mb-6 text-left">
              {seeded ? (
                <div className="rounded-lg bg-emerald-500/10 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-400">
                    Sample properties have been created!
                  </p>
                  <p className="mt-1 text-xs text-emerald-400/60">
                    We added 3 demo properties so your dashboard is not empty. You can edit or remove them anytime.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">
                    You can add properties manually or import sample ones to get started.
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="mb-6">
              <div className="space-y-3">
                {[
                  "WhatsApp number connected",
                  "Sample properties added",
                  "AI assistant ready to handle leads",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg bg-zinc-800/50 px-4 py-2.5">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
          >
            {currentStep < steps.length - 1 ? "Continue" : "Go to Dashboard"}
            <ArrowRight className="h-4 w-4" />
          </button>

          {currentStep < steps.length - 1 && (
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mt-3 w-full text-xs text-zinc-600 hover:text-zinc-400"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
