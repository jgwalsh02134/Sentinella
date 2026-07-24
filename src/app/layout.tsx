import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Crest from "@/components/Crest";
import RegisterSW from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: {
    default: "Sentinella — Italy travel safety",
    template: "%s · Sentinella",
  },
  description:
    "Emergency numbers, safety briefings, advisories, and check-ins for travelers in Italy. Built to work one-handed, under stress, and offline.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/icons/icon-180.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sentinella",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A6B44",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="page-shell mx-auto min-h-dvh w-full max-w-md px-4 pt-4">
          {children}
          <footer className="mt-10 flex items-start gap-3 border-t border-default pt-4 text-footnote text-secondary">
            <Crest size={28} decorative className="mt-1 shrink-0" />
            <span>
            Sentinella is an informational tool. In an emergency, always call{" "}
            <a href="tel:112" className="font-bold text-danger">
              112
            </a>
            . Verify contact numbers against official sources before relying on them.
            </span>
          </footer>
        </div>
        <BottomNav />
        <RegisterSW />
      </body>
    </html>
  );
}
