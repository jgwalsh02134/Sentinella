import type { Metadata } from "next";
import Crest from "@/components/Crest";
import SectionHeader from "@/components/ui/SectionHeader";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main>
      <div className="flex justify-center pb-3 pt-1">
        <Crest size={72} priority />
      </div>
      <SectionHeader
        level={1}
        title="Welcome back"
        intro="Signing in unlocks check-ins. Emergency numbers and the guide never require an account."
      />
      <LoginForm />
    </main>
  );
}
