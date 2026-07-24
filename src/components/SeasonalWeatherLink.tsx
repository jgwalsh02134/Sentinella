"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CloudRain, Sun } from "lucide-react";
import Icon from "@/components/Icon";
import { isHeatSeason } from "@/lib/season";

/**
 * Compact companion to SeasonalWeatherCard for the Alerts screen: one row
 * pointing at the full card in the guide. Season resolves after mount for
 * the same reason as the full card — cached pages must never bake in a
 * stale season.
 */
export default function SeasonalWeatherLink() {
  const [heat, setHeat] = useState<boolean | null>(null);

  useEffect(() => {
    setHeat(isHeatSeason());
  }, []);

  if (heat === null) return null;

  return (
    <Link
      href="/guide"
      className="plate flex min-h-[3.5rem] items-center gap-3 border border-line bg-white p-4"
    >
      <span className="text-ambra">
        <Icon icon={heat ? Sun : CloudRain} size="lg" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-snug">
          {heat ? "Heat bulletins — today's bollino and advice" : "Allerta meteo — color codes and today's outlook"}
        </span>
        <span className="block text-xs text-mist">Seasonal weather safety · in the field guide</span>
      </span>
      <span className="text-sm font-bold text-verde" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
