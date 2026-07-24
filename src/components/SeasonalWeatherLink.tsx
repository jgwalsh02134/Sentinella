"use client";

import { useEffect, useState } from "react";
import { CloudRain, Sun } from "lucide-react";
import Icon from "@/components/Icon";
import ListRow from "@/components/ui/ListRow";
import { isHeatSeason } from "@/lib/season";

/**
 * Compact companion to SeasonalWeatherCard for the Alerts screen: one row
 * pointing at the full card in the guide. Season resolves after mount for
 * the same reason as the full card — cached pages must never bake in a
 * stale season.
 */
export default function SeasonalWeatherLink({
  subtitle = "Seasonal weather safety · in the field guide",
}: {
  /** Override on the guide index itself, where "in the field guide" is redundant. */
  subtitle?: string;
}) {
  const [heat, setHeat] = useState<boolean | null>(null);

  useEffect(() => {
    setHeat(isHeatSeason());
  }, []);

  if (heat === null) return null;

  return (
    <ListRow
      href="/guide/basics"
      icon={
        <span className={heat ? "text-icon-warning" : "text-icon-info"}>
          <Icon icon={heat ? Sun : CloudRain} size="lg" />
        </span>
      }
      title={
        heat
          ? "Heat bulletins — today's bollino and advice"
          : "Allerta meteo — color codes and today's outlook"
      }
      subtitle={subtitle}
    />
  );
}
