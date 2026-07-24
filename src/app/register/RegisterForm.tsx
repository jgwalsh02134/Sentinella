"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm({ invitesRequired }: { invitesRequired: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          invitesRequired ? { name, email, password, inviteCode } : { name, email, password },
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Registration didn't work. Try again.");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration didn't work. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="plate mt-5 space-y-3 border border-line bg-white p-5">
      {invitesRequired ? (
        <label className="block">
          <span className="eyebrow">Invite code</span>
          <input
            required
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="mt-1 min-h-[3rem] w-full rounded-xl border border-line px-4 font-mono text-base uppercase outline-none focus:border-verde"
          />
        </label>
      ) : null}
      <label className="block">
        <span className="eyebrow">Name</span>
        <input
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 min-h-[3rem] w-full rounded-xl border border-line px-4 text-base outline-none focus:border-verde"
        />
      </label>
      <label className="block">
        <span className="eyebrow">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 min-h-[3rem] w-full rounded-xl border border-line px-4 text-base outline-none focus:border-verde"
        />
      </label>
      <label className="block">
        <span className="eyebrow">Password</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 min-h-[3rem] w-full rounded-xl border border-line px-4 text-base outline-none focus:border-verde"
        />
        <span className="mt-1 block text-xs text-mist">At least 8 characters.</span>
      </label>
      {error ? <p className="text-sm font-medium text-signal-deep">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="min-h-[3.25rem] w-full rounded-xl bg-verde text-base font-bold text-white active:bg-brand-strong disabled:bg-sunken disabled:text-tertiary"
      >
        {busy ? "Creating…" : "Create account"}
      </button>
      <p className="text-sm text-mist">
        Already registered?{" "}
        <Link href="/login" className="text-link">
          Sign in
        </Link>
      </p>
    </form>
  );
}
