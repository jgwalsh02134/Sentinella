import type { Metadata } from "next";
import Crest from "@/components/Crest";
import { invitesRequired } from "@/lib/invites";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = { title: "Create account" };

// Read INVITE_CODES per request so flipping it doesn't require a rebuild.
export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const required = invitesRequired();

  return (
    <main>
      <header>
        <div className="flex justify-center pb-3 pt-1">
          <Crest size={72} priority />
        </div>
        <p className="eyebrow">Create account</p>
        <h1 className="text-2xl font-extrabold tracking-tight">Join your traveler group</h1>
        <p className="mt-1 text-sm leading-relaxed text-mist">
          {required
            ? "Access is by invite code — the app is limited to a specific group even though it's reachable on the open web."
            : "Create an account to check in and see your trip history. Emergency numbers and the guide never need one."}
        </p>
      </header>

      <RegisterForm invitesRequired={required} />
    </main>
  );
}
