"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SLUGS = ["basics", "scams", "phrases", "cities", "health"];

/** Old tab deep-links (/guide#scams) land on the new routes. */
export default function GuideHashRedirect() {
  const router = useRouter();
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "").toLowerCase();
    if (SLUGS.includes(hash)) router.replace(`/guide/${hash}`);
  }, [router]);
  return null;
}
