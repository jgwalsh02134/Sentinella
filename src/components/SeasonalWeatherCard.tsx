"use client";

import { useEffect, useState } from "react";
import { CloudRain, Sun } from "lucide-react";
import Icon from "@/components/Icon";
import TelText from "@/components/TelText";
import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { allertaMeteoCard, heatCard, weatherLastVerified, type WeatherCard } from "@/data/weather";
import { isHeatSeason } from "@/lib/season";

/**
 * The guide's weather-safety card, chosen by the date in Europe/Rome:
 * summer-heat bollino during the heat-bulletin season, allerta meteo the
 * rest of the year. Season is decided after mount so the statically
 * prerendered (and service-worker-cached) guide never bakes in a stale
 * choice — the device clock decides at view time, online or offline.
 *
 * Caution styling here is amber only. The official ROSSO/ARANCIONE codes
 * are explained as bold text, not colored chips — in this app, if
 * something is red, tapping it calls for help.
 */
export default function SeasonalWeatherCard() {
  const [card, setCard] = useState<WeatherCard | null>(null);

  useEffect(() => {
    setCard(isHeatSeason() ? heatCard : allertaMeteoCard);
  }, []);

  if (!card) {
    return <SkeletonCard lines={2} />;
  }

  return (
    <Card as="article">
      <div data-accent={card.id === "allerta" ? "azzurro" : undefined}>
        <div className="flex items-start gap-3">
          <span className={card.id === "heat" ? "mt-1 text-icon-warning" : "mt-1 text-icon-info"}>
            <Icon icon={card.id === "heat" ? Sun : CloudRain} size="lg" />
          </span>
          <div className="min-w-0">
            <p className="eyebrow">Seasonal weather safety</p>
            <h3 className="mt-1 text-headline">{card.title}</h3>
          </div>
        </div>

        <p className="body-copy mt-2 text-secondary">{card.intro}</p>

        {card.levels ? (
          <ul className="mt-3 space-y-2">
            {card.levels.map((level) => (
              <li key={level.code} className="body-copy text-secondary">
                <strong className="font-bold text-primary">{level.code}</strong> — {level.meaning}
              </li>
            ))}
          </ul>
        ) : null}

        <ul className="mt-3 space-y-2">
          {card.points.map((point) => (
            <li key={point} className="body-copy text-secondary">
              <TelText text={point} />
            </li>
          ))}
        </ul>

        <Callout className="mt-3">
          <TelText text={card.warning} />
        </Callout>

        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {card.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link inline-block py-1 text-callout"
            >
              {link.label}
            </a>
          ))}
        </p>

        <p className="mt-3 text-footnote text-secondary">
          Links and schedules last verified {weatherLastVerified}.
        </p>
      </div>
    </Card>
  );
}
