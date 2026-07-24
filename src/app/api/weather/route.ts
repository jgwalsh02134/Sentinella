import { NextResponse } from "next/server";
import { z } from "zod";
import { getForecast } from "@/lib/weather";

export const dynamic = "force-dynamic";

const Query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

/**
 * Public, like every safety-adjacent read. All Open-Meteo traffic is
 * server-to-server; the browser only ever talks to this route. When the
 * source is down the response is the last-good cached forecast with its
 * age (`fetchedAt`) and a `stale` flag — 404 only if nothing was ever
 * cached for the location.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Query.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Pass numeric lat and lng." }, { status: 400 });
  }

  try {
    const result = await getForecast(parsed.data.lat, parsed.data.lng);
    if (!result) {
      return NextResponse.json(
        { error: "Weather is unreachable and nothing is cached for this location yet." },
        { status: 404 },
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("api/weather failed:", err);
    return NextResponse.json({ error: "Couldn't load weather. Try again shortly." }, { status: 500 });
  }
}
