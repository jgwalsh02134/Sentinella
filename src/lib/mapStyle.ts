import type { StyleSpecification } from "maplibre-gl";

/**
 * Hand-written MapLibre style for the Protomaps v4 basemap schema
 * (layers: earth, landcover, landuse, water, roads, buildings, boundaries,
 * pois, places). We style the tiles ourselves instead of pulling in a theme
 * package so the map ships with zero extra dependencies and matches the
 * app's signage palette. Glyphs are self-hosted under /map-fonts so labels
 * render fully offline; no sprite is used (text-only labels).
 */

const GREEN_FILL = "#DCEBE2";
const WATER_FILL = "#B7D2E3";
const LABEL_HALO = "rgba(255, 255, 255, 0.9)";

export function buildMapStyle(opts: {
  /** pmtiles protocol key for the active city, e.g. "rome" */
  key: string;
  /** [minLon, minLat, maxLon, maxLat] of the pack */
  bounds: [number, number, number, number];
  maxzoom: number;
}): StyleSpecification {
  return {
    version: 8,
    glyphs: "/map-fonts/{fontstack}/{range}.pbf",
    sources: {
      basemap: {
        type: "vector",
        // Tile scheme + metadata declared inline (from the generated pack
        // manifest) so the style needs no TileJSON round trip.
        tiles: [`pmtiles://${opts.key}/{z}/{x}/{y}`],
        bounds: opts.bounds,
        minzoom: 0,
        maxzoom: opts.maxzoom,
        // Plain text on purpose: the offline guarantee bans remote URLs in
        // the style, and attribution links are useless with no connection.
        attribution: "© OpenStreetMap · Protomaps",
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#F4F6F3" } },
      {
        id: "earth",
        type: "fill",
        source: "basemap",
        "source-layer": "earth",
        paint: { "fill-color": "#F1F3EF" },
      },
      {
        id: "landcover",
        type: "fill",
        source: "basemap",
        "source-layer": "landcover",
        paint: {
          "fill-color": [
            "match",
            ["get", "kind"],
            ["forest", "grassland", "scrub"],
            GREEN_FILL,
            ["farmland"],
            "#EAEFE4",
            ["urban_area"],
            "#ECEEEA",
            "#F1F3EF",
          ],
        },
      },
      {
        id: "landuse-green",
        type: "fill",
        source: "basemap",
        "source-layer": "landuse",
        filter: [
          "in",
          ["get", "kind"],
          ["literal", ["park", "forest", "wood", "grass", "cemetery", "golf_course", "garden", "pitch", "playground", "nature_reserve", "village_green", "allotments", "farmland", "meadow"]],
        ],
        paint: { "fill-color": GREEN_FILL },
      },
      {
        id: "landuse-built",
        type: "fill",
        source: "basemap",
        "source-layer": "landuse",
        filter: [
          "in",
          ["get", "kind"],
          ["literal", ["aerodrome", "industrial", "military", "pedestrian", "hospital", "school", "university", "college", "beach"]],
        ],
        paint: {
          "fill-color": [
            "match",
            ["get", "kind"],
            ["beach"],
            "#F3EBD7",
            ["pedestrian"],
            "#EDEFEB",
            "#E9ECEA",
          ],
        },
      },
      {
        id: "water",
        type: "fill",
        source: "basemap",
        "source-layer": "water",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": WATER_FILL },
      },
      {
        id: "water-lines",
        type: "line",
        source: "basemap",
        "source-layer": "water",
        filter: ["==", ["geometry-type"], "LineString"],
        paint: {
          "line-color": WATER_FILL,
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.6, 14, 1.6, 17, 4],
        },
      },
      {
        id: "buildings",
        type: "fill",
        source: "basemap",
        "source-layer": "buildings",
        minzoom: 13,
        paint: {
          "fill-color": "#E4E8E4",
          "fill-outline-color": "#D3DAD5",
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0, 14, 1],
        },
      },
      {
        id: "roads-path",
        type: "line",
        source: "basemap",
        "source-layer": "roads",
        filter: ["==", ["get", "kind"], "path"],
        minzoom: 13,
        paint: {
          "line-color": "#C7CFCA",
          "line-width": ["interpolate", ["linear"], ["zoom"], 13, 0.5, 17, 2],
          "line-dasharray": [2, 1.5],
        },
      },
      {
        id: "roads-minor-casing",
        type: "line",
        source: "basemap",
        "source-layer": "roads",
        filter: ["in", ["get", "kind"], ["literal", ["minor_road", "medium_road"]]],
        minzoom: 11,
        paint: {
          "line-color": "#D8DFDA",
          "line-gap-width": ["interpolate", ["linear"], ["zoom"], 11, 0.5, 14, 2.5, 17, 10],
          "line-width": 1,
        },
      },
      {
        id: "roads-minor",
        type: "line",
        source: "basemap",
        "source-layer": "roads",
        filter: ["in", ["get", "kind"], ["literal", ["minor_road", "medium_road"]]],
        minzoom: 11,
        paint: {
          "line-color": "#FFFFFF",
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.5, 14, 2.5, 17, 10],
        },
      },
      {
        id: "roads-major-casing",
        type: "line",
        source: "basemap",
        "source-layer": "roads",
        filter: ["==", ["get", "kind"], "major_road"],
        paint: {
          "line-color": "#CBD4CE",
          "line-gap-width": ["interpolate", ["linear"], ["zoom"], 7, 0.6, 12, 2.5, 14, 4, 17, 14],
          "line-width": 1,
        },
      },
      {
        id: "roads-major",
        type: "line",
        source: "basemap",
        "source-layer": "roads",
        filter: ["==", ["get", "kind"], "major_road"],
        paint: {
          "line-color": "#FDFDFB",
          "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.6, 12, 2.5, 14, 4, 17, 14],
        },
      },
      {
        id: "roads-highway-casing",
        type: "line",
        source: "basemap",
        "source-layer": "roads",
        filter: ["==", ["get", "kind"], "highway"],
        paint: {
          "line-color": "#D6C690",
          "line-gap-width": ["interpolate", ["linear"], ["zoom"], 6, 0.8, 12, 3.5, 14, 6, 17, 18],
          "line-width": 1,
        },
      },
      {
        id: "roads-highway",
        type: "line",
        source: "basemap",
        "source-layer": "roads",
        filter: ["==", ["get", "kind"], "highway"],
        paint: {
          "line-color": "#F6ECD1",
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.8, 12, 3.5, 14, 6, 17, 18],
        },
      },
      {
        id: "roads-rail",
        type: "line",
        source: "basemap",
        "source-layer": "roads",
        filter: ["==", ["get", "kind"], "rail"],
        minzoom: 10,
        paint: {
          "line-color": "#B9C2BC",
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.6, 14, 1.4, 17, 2.5],
          "line-dasharray": [4, 2],
        },
      },
      {
        id: "boundaries",
        type: "line",
        source: "basemap",
        "source-layer": "boundaries",
        paint: {
          "line-color": "#98A49E",
          "line-width": 1,
          "line-dasharray": [3, 2],
        },
      },
      {
        id: "road-labels",
        type: "symbol",
        source: "basemap",
        "source-layer": "roads",
        minzoom: 12,
        filter: ["in", ["get", "kind"], ["literal", ["highway", "major_road", "medium_road", "minor_road"]]],
        layout: {
          "symbol-placement": "line",
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 12, 10, 17, 14],
        },
        paint: {
          "text-color": "#4A554F",
          "text-halo-color": LABEL_HALO,
          "text-halo-width": 1.5,
        },
      },
      {
        id: "poi-labels",
        type: "symbol",
        source: "basemap",
        "source-layer": "pois",
        minzoom: 13,
        filter: [
          "in",
          ["get", "kind"],
          ["literal", ["hospital", "clinic", "pharmacy", "police", "fire_station", "station", "aerodrome", "university", "townhall", "park"]],
        ],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-max-width": 8,
        },
        paint: {
          "text-color": "#5E6B67",
          "text-halo-color": LABEL_HALO,
          "text-halo-width": 1.2,
        },
      },
      {
        id: "place-neighbourhood",
        type: "symbol",
        source: "basemap",
        "source-layer": "places",
        minzoom: 11,
        filter: ["==", ["get", "kind"], "neighbourhood"],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 11, 10.5, 15, 14],
          "text-transform": "uppercase",
          "text-letter-spacing": 0.05,
        },
        paint: {
          "text-color": "#78837E",
          "text-halo-color": LABEL_HALO,
          "text-halo-width": 1.4,
        },
      },
      {
        id: "place-locality",
        type: "symbol",
        source: "basemap",
        "source-layer": "places",
        filter: ["==", ["get", "kind"], "locality"],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Medium"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 4, 10, 8, 13, 12, 18],
        },
        paint: {
          "text-color": "#17201D",
          "text-halo-color": LABEL_HALO,
          "text-halo-width": 1.6,
        },
      },
    ],
  };
}
