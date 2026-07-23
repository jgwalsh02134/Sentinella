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
    <form onSubmit={submit} className="plate mt-5 space-y-3 border border-line bg-white p-5">
      <label className="block">
        <span className="eyebrow">Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 min-h-[3rem] w-full rounded-xl border border-line px-4 text-base outline-none focus:border-verde"
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
          className="mt-1 min-h-[3rem] w-full rounded-xl border border-line px-4 text-base outline-none focus:border-verde"
        />
      </label>
      {error ? <p className="text-sm font-medium text-signal-deep">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="min-h-[3.25rem] w-full rounded-xl bg-verde text-base font-bold text-white active:bg-verde-deep disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm text-mist">
        New here?{" "}
        <Link href="/register" className="font-bold text-verde underline underline-offset-2">
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
        <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm leading-relaxed text-mist">
          Signing in unlocks check-ins. Emergency numbers and the guide never require an account.
        </p>
      </header>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
