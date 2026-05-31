"use client";

import { useRouter } from "next/navigation";

export function SimulateMessageForm() {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="mb-3 text-sm font-semibold text-zinc-100">Simulate WhatsApp Message</h3>
      <form
        onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const form = e.currentTarget;
          const formData = new FormData(form);
          const btn = form.querySelector("button") as HTMLButtonElement;
          btn.disabled = true;
          btn.textContent = "Processing...";

          try {
            await fetch("/api/whatsapp/simulate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: formData.get("phone") || "+971501234567",
                name: formData.get("name") || "Test User",
                message: formData.get("message"),
              }),
            });
            form.reset();
            router.refresh();
          } catch {
            btn.disabled = false;
            btn.textContent = "Send";
          }
        }}
        className="space-y-3"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            placeholder="Contact name"
            defaultValue="Test User"
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
          <input
            name="phone"
            placeholder="Phone number"
            defaultValue="+971501234567"
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <textarea
          name="message"
          required
          placeholder="Type a message to simulate..."
          rows={2}
          className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
        >
          Send
        </button>
      </form>
    </div>
  );
}
