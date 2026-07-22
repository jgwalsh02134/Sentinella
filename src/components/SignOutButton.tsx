"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="text-xs font-semibold text-mist underline underline-offset-2"
    >
      Sign out
    </button>
  );
}
