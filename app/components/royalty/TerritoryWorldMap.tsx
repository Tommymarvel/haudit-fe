"use client";

import { useEffect, useMemo, useState } from "react";
import { getCountryDisplayName } from "@/lib/utils/country";

type TerritoryPointInput = {
  name: string;
  streams?: number;
  revenue?: number;
};

type TerritoryWorldMapProps = {
  territories: TerritoryPointInput[];
  className?: string;
  maxMarkers?: number;
};

type Marker = {
  rawName: string;
  displayName: string;
  x: number;
  y: number;
  radius: number;
  streams: number;
  revenue?: number;
};

type MapDimensions = {
  width: number;
  height: number;
};

type MapViewBox = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

const DOT_COLOR = "#7B00D4";

const COUNTRY_ALIASES: Record<string, string> = {
  "usa": "united states",
  "u s a": "united states",
  "us": "united states",
  "u s": "united states",
  "united states of america": "united states",
  "uk": "united kingdom",
  "u k": "united kingdom",
  "great britain": "united kingdom",
  "england": "united kingdom",
  "uae": "united arab emirates",
  "u a e": "united arab emirates",
  "korea south": "south korea",
  "republic of korea": "south korea",
  "korea republic of": "south korea",
  "russian federation": "russia",
};

const DEFAULT_MAP_DIMS: MapDimensions = {
  width: 1009.6727,
  height: 665.96301,
};

function normalizeCountryName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSvgAttr(tag: string, attr: string): string | null {
  const match = new RegExp(`${attr}\\s*=\\s*(["'])(.*?)\\1`, "i").exec(tag);
  return match?.[2] ?? null;
}

function updateBounds(bounds: { minX: number; minY: number; maxX: number; maxY: number }, x: number, y: number) {
  bounds.minX = Math.min(bounds.minX, x);
  bounds.minY = Math.min(bounds.minY, y);
  bounds.maxX = Math.max(bounds.maxX, x);
  bounds.maxY = Math.max(bounds.maxY, y);
}

function parsePathBounds(pathData: string) {
  const tokens = pathData.match(/[a-zA-Z]|[-+]?\d*\.?\d+(?:e[-+]?\d+)?/g);
  if (!tokens || tokens.length === 0) {
    return null;
  }

  const bounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  let i = 0;
  let cmd = "";
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;

  const isCommand = (token: string) => /^[a-zA-Z]$/.test(token);
  const hasMoreNumbers = () => i < tokens.length && !isCommand(tokens[i]);
  const readNumber = () => {
    const value = Number.parseFloat(tokens[i]);
    i += 1;
    return value;
  };

  while (i < tokens.length) {
    if (isCommand(tokens[i])) {
      cmd = tokens[i];
      i += 1;
    }

    if (!cmd) {
      break;
    }

    const absolute = cmd === cmd.toUpperCase();
    const lower = cmd.toLowerCase();

    if (lower === "z") {
      currentX = startX;
      currentY = startY;
      updateBounds(bounds, currentX, currentY);
      continue;
    }

    if (lower === "m") {
      if (!hasMoreNumbers()) {
        continue;
      }

      const x = readNumber();
      const y = readNumber();
      currentX = absolute ? x : currentX + x;
      currentY = absolute ? y : currentY + y;
      startX = currentX;
      startY = currentY;
      updateBounds(bounds, currentX, currentY);

      while (hasMoreNumbers()) {
        const lx = readNumber();
        const ly = readNumber();
        currentX = absolute ? lx : currentX + lx;
        currentY = absolute ? ly : currentY + ly;
        updateBounds(bounds, currentX, currentY);
      }
      continue;
    }

    const run = (paramCount: number, handler: (params: number[]) => void) => {
      while (hasMoreNumbers()) {
        if (i + paramCount > tokens.length) {
          break;
        }
        const params = new Array(paramCount);
        for (let idx = 0; idx < paramCount; idx += 1) {
          params[idx] = readNumber();
        }
        handler(params);
      }
    };

    if (lower === "l") {
      run(2, ([x, y]) => {
        currentX = absolute ? x : currentX + x;
        currentY = absolute ? y : currentY + y;
        updateBounds(bounds, currentX, currentY);
      });
      continue;
    }

    if (lower === "h") {
      run(1, ([x]) => {
        currentX = absolute ? x : currentX + x;
        updateBounds(bounds, currentX, currentY);
      });
      continue;
    }

    if (lower === "v") {
      run(1, ([y]) => {
        currentY = absolute ? y : currentY + y;
        updateBounds(bounds, currentX, currentY);
      });
      continue;
    }

    if (lower === "c") {
      run(6, ([x1, y1, x2, y2, x, y]) => {
        const cx1 = absolute ? x1 : currentX + x1;
        const cy1 = absolute ? y1 : currentY + y1;
        const cx2 = absolute ? x2 : currentX + x2;
        const cy2 = absolute ? y2 : currentY + y2;
        const nx = absolute ? x : currentX + x;
        const ny = absolute ? y : currentY + y;
        updateBounds(bounds, cx1, cy1);
        updateBounds(bounds, cx2, cy2);
        updateBounds(bounds, nx, ny);
        currentX = nx;
        currentY = ny;
      });
      continue;
    }

    if (lower === "s" || lower === "q") {
      run(4, ([x1, y1, x, y]) => {
        const cx1 = absolute ? x1 : currentX + x1;
        const cy1 = absolute ? y1 : currentY + y1;
        const nx = absolute ? x : currentX + x;
        const ny = absolute ? y : currentY + y;
        updateBounds(bounds, cx1, cy1);
        updateBounds(bounds, nx, ny);
        currentX = nx;
        currentY = ny;
      });
      continue;
    }

    if (lower === "t") {
      run(2, ([x, y]) => {
        currentX = absolute ? x : currentX + x;
        currentY = absolute ? y : currentY + y;
        updateBounds(bounds, currentX, currentY);
      });
      continue;
    }

    if (lower === "a") {
      run(7, (params) => {
        const x = params[5];
        const y = params[6];
        currentX = absolute ? x : currentX + x;
        currentY = absolute ? y : currentY + y;
        updateBounds(bounds, currentX, currentY);
      });
      continue;
    }

    break;
  }

  if (!Number.isFinite(bounds.minX) || !Number.isFinite(bounds.minY)) {
    return null;
  }

  return {
    minX: bounds.minX,
    minY: bounds.minY,
    maxX: bounds.maxX,
    maxY: bounds.maxY,
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
}

function sanitizeSvgMarkup(svgText: string) {
  return svgText
    .replace(/<\?xml[^>]*>/gi, "")
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(/\s(on\w+)=("[^"]*"|'[^']*')/gi, "");
}

function recolorSvgMarkup(svgText: string) {
  if (!svgText) {
    return "";
  }

  const styleTag =
    "<style>path{fill:#FFFFFF !important;stroke:#D9D9D9 !important;stroke-width:0.6px;} g{fill:#FFFFFF;}</style>";

  return svgText.replace(/<svg\b[^>]*>/i, (openTag) => {
    let nextTag = openTag;

    if (/\sstyle\s*=\s*("[^"]*"|'[^']*')/i.test(nextTag)) {
      nextTag = nextTag.replace(
        /\sstyle\s*=\s*("([^"]*)"|'([^']*)')/i,
        (_match, _fullQuoted, doubleValue, singleValue) => {
          const existingStyle = (doubleValue ?? singleValue ?? "").trim();
          const merged = [existingStyle, "background: transparent"].filter(Boolean).join("; ");
          return ` style=\"${merged}\"`;
        }
      );
    } else {
      nextTag = nextTag.replace(/<svg\b/i, "<svg style=\"background: transparent\"");
    }

    return `${nextTag}${styleTag}`;
  });
}

function parseMapDimensions(svgText: string): MapDimensions {
  const svgOpenTag = svgText.match(/<svg\b[^>]*>/i)?.[0] ?? "";
  const width = Number.parseFloat((getSvgAttr(svgOpenTag, "width") ?? "").replace(/[^\d.\-eE]/g, ""));
  const height = Number.parseFloat((getSvgAttr(svgOpenTag, "height") ?? "").replace(/[^\d.\-eE]/g, ""));

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { width, height };
  }

  const viewBox = getSvgAttr(svgOpenTag, "viewBox");
  if (viewBox) {
    const values = viewBox.split(/[\s,]+/).map((val) => Number.parseFloat(val));
    if (values.length === 4 && Number.isFinite(values[2]) && Number.isFinite(values[3])) {
      return { width: values[2], height: values[3] };
    }
  }

  return DEFAULT_MAP_DIMS;
}

function parseCountryCenters(svgText: string) {
  const byNormalizedName = new Map<string, { x: number; y: number }>();
  const byIso = new Map<string, { x: number; y: number }>();
  const overallBounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  const paths = svgText.match(/<path\b[^>]*>/gi) ?? [];
  for (const pathTag of paths) {
    const id = getSvgAttr(pathTag, "id");
    const title = getSvgAttr(pathTag, "title");
    const d = getSvgAttr(pathTag, "d");

    if (!id || !title || !d) {
      continue;
    }

    const center = parsePathBounds(d);
    if (!center) {
      continue;
    }

    updateBounds(overallBounds, center.minX, center.minY);
    updateBounds(overallBounds, center.maxX, center.maxY);
    byIso.set(id.toUpperCase(), center);
    byNormalizedName.set(normalizeCountryName(title), center);
  }

  if (
    Number.isFinite(overallBounds.minX) &&
    Number.isFinite(overallBounds.minY) &&
    Number.isFinite(overallBounds.maxX) &&
    Number.isFinite(overallBounds.maxY)
  ) {
    return {
      byIso,
      byNormalizedName,
      viewBox: {
        minX: overallBounds.minX,
        minY: overallBounds.minY,
        width: Math.max(1, overallBounds.maxX - overallBounds.minX),
        height: Math.max(1, overallBounds.maxY - overallBounds.minY),
      } as MapViewBox,
    };
  }

  return {
    byIso,
    byNormalizedName,
    viewBox: {
      minX: 0,
      minY: 0,
      width: DEFAULT_MAP_DIMS.width,
      height: DEFAULT_MAP_DIMS.height,
    } as MapViewBox,
  };
}

function applyViewBoxToSvgMarkup(svgText: string, viewBox: MapViewBox) {
  if (!svgText) {
    return "";
  }

  const viewBoxValue = `${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`;

  return svgText.replace(/<svg\b[^>]*>/i, (openTag) => {
    let nextTag = openTag;

    if (/\sviewBox\s*=\s*("[^"]*"|'[^']*')/i.test(nextTag)) {
      nextTag = nextTag.replace(/\sviewBox\s*=\s*("[^"]*"|'[^']*')/i, ` viewBox="${viewBoxValue}"`);
    } else {
      nextTag = nextTag.replace(/<svg\b/i, `<svg viewBox="${viewBoxValue}"`);
    }

    if (/\spreserveAspectRatio\s*=\s*("[^"]*"|'[^']*')/i.test(nextTag)) {
      nextTag = nextTag.replace(
        /\spreserveAspectRatio\s*=\s*("[^"]*"|'[^']*')/i,
        ' preserveAspectRatio="xMidYMid meet"'
      );
    } else {
      nextTag = nextTag.replace(/<svg\b/i, '<svg preserveAspectRatio="xMidYMid meet"');
    }

    return nextTag;
  });
}

function resolveCountryCenter(
  countryName: string,
  byNormalizedName: Map<string, { x: number; y: number }>,
  byIso: Map<string, { x: number; y: number }>
) {
  const normalized = normalizeCountryName(countryName);
  const aliasMatch = COUNTRY_ALIASES[normalized] ?? normalized;

  if (byNormalizedName.has(aliasMatch)) {
    return byNormalizedName.get(aliasMatch) ?? null;
  }

  const maybeIso = countryName.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(maybeIso) && byIso.has(maybeIso)) {
    return byIso.get(maybeIso) ?? null;
  }

  if (aliasMatch.endsWith(" islands")) {
    const singular = aliasMatch.replace(/ islands$/, "");
    if (byNormalizedName.has(singular)) {
      return byNormalizedName.get(singular) ?? null;
    }
  }

  return null;
}

export default function TerritoryWorldMap({
  territories,
  className,
  maxMarkers = 12,
}: TerritoryWorldMapProps) {
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const [activeMarker, setActiveMarker] = useState<Marker | null>(null);

  useEffect(() => {
    let mounted = true;

    fetch("/svgs/worldmap.svg")
      .then((res) => res.text())
      .then((text) => {
        if (!mounted) {
          return;
        }

        setSvgMarkup(sanitizeSvgMarkup(text));
      })
      .catch(() => {
        if (mounted) {
          setSvgMarkup("");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const mapDims = useMemo(() => {
    if (!svgMarkup) {
      return DEFAULT_MAP_DIMS;
    }
    return parseMapDimensions(svgMarkup);
  }, [svgMarkup]);

  const countryCenters = useMemo(() => {
    if (!svgMarkup) {
      return {
        byIso: new Map<string, { x: number; y: number }>(),
        byNormalizedName: new Map<string, { x: number; y: number }>(),
        viewBox: {
          minX: 0,
          minY: 0,
          width: DEFAULT_MAP_DIMS.width,
          height: DEFAULT_MAP_DIMS.height,
        } as MapViewBox,
      };
    }
    return parseCountryCenters(svgMarkup);
  }, [svgMarkup]);

  const resolvedViewBox = useMemo<MapViewBox>(() => {
    if (countryCenters.viewBox) {
      return countryCenters.viewBox;
    }
    return {
      minX: 0,
      minY: 0,
      width: mapDims.width,
      height: mapDims.height,
    };
  }, [countryCenters.viewBox, mapDims.width, mapDims.height]);

  const renderedSvgMarkup = useMemo(() => {
    if (!svgMarkup) {
      return "";
    }
    const viewBoxAlignedMarkup = applyViewBoxToSvgMarkup(svgMarkup, resolvedViewBox);
    return recolorSvgMarkup(viewBoxAlignedMarkup);
  }, [svgMarkup, resolvedViewBox]);

  const markers = useMemo<Marker[]>(() => {
    if (!territories.length || !svgMarkup) {
      return [];
    }

    const sorted = [...territories]
      .filter((row) => (row.streams ?? 0) > 0)
      .sort((a, b) => (b.streams ?? 0) - (a.streams ?? 0));

    const maxStreams = Math.max(...sorted.map((row) => row.streams ?? 0), 1);
    const usedKeys = new Set<string>();
    const points: Marker[] = [];

    for (const row of sorted) {
      if (points.length >= maxMarkers) {
        break;
      }

      const center = resolveCountryCenter(
        row.name,
        countryCenters.byNormalizedName,
        countryCenters.byIso
      );
      if (!center) {
        continue;
      }

      const key = normalizeCountryName(row.name);
      if (usedKeys.has(key)) {
        continue;
      }

      usedKeys.add(key);
      const strength = Math.max(0, (row.streams ?? 0) / maxStreams);
      const displayName = getCountryDisplayName(row.name);

      points.push({
        rawName: row.name,
        displayName,
        x: center.x,
        y: center.y,
        radius: 3.5 + strength * 3,
        streams: row.streams ?? 0,
        revenue: row.revenue,
      });
    }

    return points;
  }, [territories, maxMarkers, svgMarkup, countryCenters]);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className ?? ""}`}>
      <div
        className="h-full w-full [&_svg]:h-full [&_svg]:w-full [&_svg]:select-none"
        dangerouslySetInnerHTML={{ __html: renderedSvgMarkup }}
      />
      <svg
        viewBox={`${resolvedViewBox.minX} ${resolvedViewBox.minY} ${resolvedViewBox.width} ${resolvedViewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
      >
        {markers.map((marker) => (
          <g
            key={marker.rawName}
            onMouseEnter={() => setActiveMarker(marker)}
            onMouseLeave={() => setActiveMarker((current) => (current?.rawName === marker.rawName ? null : current))}
          >
            <title>
              {`${marker.displayName}\nStreams: ${marker.streams.toLocaleString()}${typeof marker.revenue === "number" ? `\nRevenue: $${marker.revenue.toLocaleString()}` : ""}`}
            </title>
            <circle cx={marker.x} cy={marker.y} r={marker.radius + 2} fill="rgba(123,0,212,0.18)" className="pointer-events-none" />
            <circle cx={marker.x} cy={marker.y} r={marker.radius} fill={DOT_COLOR} className="cursor-pointer" />
          </g>
        ))}
      </svg>
      {activeMarker ? (
        <div
          className="pointer-events-none absolute z-20 rounded-md border border-neutral-200 bg-white/95 px-3 py-2 text-xs text-neutral-800 shadow-sm"
          style={{
            left: `${((activeMarker.x - resolvedViewBox.minX) / resolvedViewBox.width) * 100}%`,
            top: `${((activeMarker.y - resolvedViewBox.minY) / resolvedViewBox.height) * 100}%`,
            transform: "translate(-50%, calc(-100% - 10px))",
          }}
        >
          <div className="font-semibold text-neutral-900">{activeMarker.displayName}</div>
          <div>Streams: {activeMarker.streams.toLocaleString()}</div>
          {typeof activeMarker.revenue === "number" ? <div>Revenue: ${activeMarker.revenue.toLocaleString()}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
