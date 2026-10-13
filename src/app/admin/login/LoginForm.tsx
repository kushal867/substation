"use client";

import { Loader2, Lock, Store } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return setError("Enter your password.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        setError(j.error ?? "Could not sign in.");
        setBusy(false);
        return;
      }
      const next = params.get("next");
      router.replace(next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="admin-root flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-a-line bg-a-surface p-7 shadow-sm" aria-labelledby="login-title">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white"><Store className="h-5 w-5" /></span>
          <div>
            <h1 id="login-title" className="text-lg font-semibold text-a-fg">Admin sign in</h1>
            <p className="text-xs text-a-muted">SABSTATION store administration</p>
          </div>
        </div>
        <label htmlFor="pw" className="mb-1 block text-xs font-medium text-a-fg">Password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-a-muted" />
          <input
            id="pw" type="password" autoComplete="current-password" autoFocus value={password}
            onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error}
            className="h-10 w-full rounded-lg border border-a-line bg-a-surface pl-9 pr-3 text-sm text-a-fg focus:border-a-accent focus:outline-none focus:ring-2 focus:ring-a-accent/20"
          />
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-a-accent text-sm font-medium text-a-accent-fg transition-opacity hover:opacity-90 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}Sign in
        </button>
      </form>
    </div>
  );
}
