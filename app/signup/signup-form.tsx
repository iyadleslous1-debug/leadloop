"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    console.log("SIGNUP CLICKED");
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() || email.trim().split("@")[0] },
        },
      });

      if (authError) {
        console.log("AUTH ERROR", authError.message);
        setError(authError.message);
        setLoading(false);
        return;
      }

      console.log("AUTH SUCCESS", data?.user?.email);

      if (data?.session) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=3600; sameSite=lax`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=3600; sameSite=lax`;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      console.log("AUTH ERROR", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400"
          data-testid="signup-error"
        >
          {error}
        </div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          placeholder="John Doe"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              handleSignUp();
            }
          }}
          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          placeholder="••••••••"
        />
      </div>
      <button
        type="button"
        onClick={handleSignUp}
        disabled={loading}
        style={{ cursor: loading ? "not-allowed" : "pointer" }}
        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <a href="/login" className="text-zinc-300 hover:text-zinc-100">
          Sign in
        </a>
      </p>
    </div>
  );
}
