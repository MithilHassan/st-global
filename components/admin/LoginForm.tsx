"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm border border-line bg-white p-8">
        <span className="flex h-9 w-9 items-center justify-center bg-ink font-display text-sm font-semibold text-paper">
          ST
        </span>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-teal">
          Staff only
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          Operations sign-in
        </h1>

        {!configured ? (
          <p className="mt-6 border border-signal/40 bg-signal/5 px-4 py-3 text-sm text-ink">
            Admin login isn't configured yet. Set{" "}
            <span className="font-mono">ADMIN_PASSWORD</span> and{" "}
            <span className="font-mono">ADMIN_SESSION_SECRET</span> in the
            server environment, then reload.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-ink/50">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                placeholder="you@company.com"
                className="w-full border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-royal"
              />
              <span className="mt-1 block text-[11px] text-ink/40">
                Leave blank to sign in with the shared team password.
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-ink/50">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-royal"
              />
            </label>
            {error && <p className="text-sm text-signal">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full border border-ink bg-ink py-3 font-mono text-[12px] uppercase tracking-wider text-paper transition-colors hover:bg-royal hover:border-royal disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
