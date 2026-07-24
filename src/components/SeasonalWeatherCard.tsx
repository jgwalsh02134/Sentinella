"use client";

import { useEffect, useState } from "react";
import { CloudRain, Sun } from "lucide-react";
import Icon from "@/components/Icon";
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
    return <div className="plate min-h-[8rem] border border-line bg-white p-5" aria-hidden="true" />;
  }

  return (
    <article
      className="plate border border-line bg-white p-5"
      data-accent={card.id === "allerta" ? "azzurro" : undefined}
    >
      <div className="flex items-start gap-2.5">
        <span className={card.id === "heat" ? "mt-0.5 text-icon-warning" : "mt-0.5 text-icon-info"}>
          <Icon icon={card.id === "heat" ? Sun : CloudRain} size="lg" />
        </span>
        <div>
          <p className="eyebrow">Seasonal weather safety</p>
          <h3 className="text-base font-bold leading-snug">{card.title}</h3>
        </div>
      </div>

      <p className="body-copy mt-2 text-mist">{card.intro}</p>

      {card.levels ? (
        <ul className="mt-3 space-y-1.5">
          {card.levels.map((level) => (
            <li key={level.code} className="body-copy text-mist">
              <strong className="font-bold text-ink">{level.code}</strong> — {level.meaning}
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="mt-3 space-y-2">
        {card.points.map((point) => (
          <li key={point} className="body-copy text-mist">
            {point}
          </li>
        ))}
      </ul>

      <p className="callout mt-3">{card.warning}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {card.links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={card.id === "heat"
              ? "flex min-h-[2.75rem] items-center justify-center rounded-xl border-2 border-ambra px-4 text-sm font-bold text-warning active:bg-warning-subtle"
              : "flex min-h-[2.75rem] items-center justify-center rounded-xl border-2 border-accent px-4 text-sm font-bold text-accent active:bg-accent-subtle"}
          >
            {link.label}
          </a>
        ))}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-mist">
        Links and schedules last verified {weatherLastVerified} —{" "}
        <strong className="font-bold">verify against official sources before travel.</strong>
      </p>
    </article>
  );
}
