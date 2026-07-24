"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import Crest from "@/components/Crest";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Sign in didn't work. Try again.");
      router.push(nextPath.startsWith("/") ? nextPath : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in didn't work. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="plate mt-5 space-y-3 border border-default bg-card p-4">
      <label className="block">
        <span className="eyebrow">Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 min-h-[3rem] w-full rounded-xl border border-default px-4 text-body outline-none focus:border-verde"
        />
      </label>
      <label className="block">
        <span className="eyebrow">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 min-h-[3rem] w-full rounded-xl border border-default px-4 text-body outline-none focus:border-verde"
        />
      </label>
      {error ? <p className="text-callout font-medium text-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="min-h-[3.25rem] w-full rounded-xl bg-verde text-body font-bold text-white active:bg-brand-strong disabled:bg-sunken disabled:text-tertiary"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-subhead text-secondary">
        New here?{" "}
        <Link href="/register" className="text-link">
          Create an account
        </Link>{" "}
        with your invite code.
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main>
      <header>
        <div className="flex justify-center pb-3 pt-1">
          <Crest size={72} priority />
        </div>
        <p className="eyebrow">Sign in</p>
        <h1 className="title-page">Welcome back</h1>
        <p className="body-copy mt-1 text-secondary">
          Signing in unlocks check-ins. Emergency numbers and the guide never require an account.
        </p>
      </header>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
