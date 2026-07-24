"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { Field, FieldError, Input } from "@/components/ui/Field";
import { syncQueue } from "@/lib/checkinQueue";

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
      // Auth succeeded: flush any check-ins queued while signed out.
      void syncQueue();
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration didn't work. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="plate mt-5 space-y-3 border border-default bg-card p-4">
      {invitesRequired ? (
        <Field label="Invite code">
          <Input
            required
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="font-mono uppercase"
          />
        </Field>
      ) : null}
      <Field label="Name">
        <Input
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Email">
        <Input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        <Input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {error ? <FieldError>{error}</FieldError> : null}
      <Button type="submit" variant="filled" size="lg" disabled={busy} className="w-full">
        {busy ? "Creating…" : "Create account"}
      </Button>
      <p className="text-subhead text-secondary">
        Already registered?{" "}
        <Link href="/login" className="text-link">
          Sign in
        </Link>
      </p>
    </form>
  );
}
