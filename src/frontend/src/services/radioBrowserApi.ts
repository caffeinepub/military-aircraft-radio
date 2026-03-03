const USER_AGENT = "AntennaRadio/1.0";
const FETCH_TIMEOUT_MS = 8_000; // 8 seconds per host attempt

const CACHE_KEY = "antenna_stations_v1";

export type StationSource = "live" | "cache" | "hardcoded";

export interface StationsResult {
  stations: RadioStation[];
  source: StationSource;
}

export interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  language: string;
  codec: string;
  bitrate: number;
  votes: number;
  clickcount: number;
}

interface CachedStations {
  stations: RadioStation[];
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Hardcoded fallback list — at least 15 popular global radio stations
// ---------------------------------------------------------------------------
const HARDCODED_STATIONS: RadioStation[] = [
  {
    stationuuid: "hardcoded-bbc-world",
    name: "BBC World Service",
    url: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service",
    url_resolved: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service",
    homepage: "https://www.bbc.co.uk/worldservice",
    favicon: "https://www.bbc.co.uk/favicon.ico",
    tags: "news,world,english",
    country: "United Kingdom",
    countrycode: "GB",
    language: "english",
    codec: "MP3",
    bitrate: 128,
    votes: 0,
    clickcount: 0,
  },
  {
    stationuuid: "hardcoded-npr-news",
    name: "NPR News",
    url: "https://npr-ice.streamguys1.com/live.mp3",
    url_resolved: "https://npr-ice.streamguys1.com/live.mp3",
    homepage: "https://www.npr.org",
    favicon: "https://www.npr.org/favicon.ico",
    tags: "news,public radio,usa",
    country: "United States",
    countrycode: "US",
    language: "english",
    codec: "MP3",
    bitrate: 128,
    votes: 0,
    clickcount: 0,
  },
  {
    stationuuid: "hardcoded-france-inter",
    name: "France Inter",
    url: "https://icecast.radiofrance.fr/franceinter-midfi.mp3",
    url_resolved: "https://icecast.radiofrance.fr/franceinter-midfi.mp3",
    homepage: "https://www.radiofrance.fr/franceinter",
    favicon: "https://www.radiofrance.fr/favicon.ico",
    tags: "news,culture,french",
    country: "France",
    countrycode: "FR",
    language: "french",
    codec: "MP3",
    bitrate: 128,
    votes: 0,
    clickcount: 0,
  },
  {
    stationuuid: "hardcoded-deutschlandfunk",
    name: "Deutschlandfunk",
    url: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3",
    url_resolved: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3",
    homepage: "https://www.deutschlandfunk.de",
    favicon: "https://www.deutschlandfunk.de/favicon.ico",
    tags: "news,culture,german",
    country: "Germany",
    countrycode: "DE",
    language: "german",
    codec: "MP3",
    bitrate: 128,
    votes: 0,
    clickcount: 0,
  },
  {
    stationuuid: "hardcoded-radio-swiss-jazz",
    name: "Radio Swiss Jazz",
    url: "https://stream.srg-ssr.ch/m/rsj/mp3_128",
    url_resolved: "https://stream.srg-ssr.ch/m/rsj/mp3_128",
    homepage: "https://www.radioswissjazz.ch",
    favicon: "https://www.radioswissjazz.ch/favicon.ico",
    tags: "jazz,music",
    country: "Switzerland",
    countrycode: "CH",
    language: "english",
    codec: "MP3",
    bitrate: 128,
    votes: 0,
    clickcount: 0,
  },
  {
    stationuuid: "hardcoded-radio-swiss-classic",
    name: "Radio Swiss Classic",
    url: "https://stream.srg-ssr.ch/m/rsc_de/mp3_128",
    url_resolved: "https://stream.srg-ssr.ch/m/rsc_de/mp3_128",
    homepage: "https://www.radioswissclassic.ch",
    favicon: "https://www.radioswissclassic.ch/favicon.ico",
    tags: "classical,music",
    country: "Switzerland",
    countrycode: "CH",
    language: "german",
    codec: "MP3",
    bitrate: 128,
    votes: 0,
    clickcount: 0,
  },
  {
    stationuuid: "hardcoded-abc-jazz",
    name: "ABC Jazz",
    url: "https://live-radio01.mediahubaustralia.com/2JZZ/mp3/",
    url_resolved: "https://live-radio01.mediahubaustralia.com/2JZZ/mp3/",
    homepage: "https://www.abc.net.au/jazz",
    favicon: "https://www.abc.net.au/favicon.ico",
    tags: "jazz,australia",
    country: "Australia",
    countrycode: "AU",
    language: "english",
    codec: "MP3",
    bitrate: 128,
    votes: 0,
    clickcount: 0,
  },
  {
    stationuuid: "hardcoded-rai-radio1",
    name: "RAI Radio 1",
    url: "https://icestreaming.rai.it/1.mp3",
    url_resolved: "https://icestreaming.rai.it/1.mp3",
    homepage: "https://www.rairadio1.rai.it",
    favicon: "https://www.rai.it/favicon.ico",
    tags: "news,culture,italian",
    country: "Italy",
    countrycode: "IT",
    language: "italian",
    codec: "MP3",
    bitrate: 128,
    votes: 0,
    clickcount: 0,
  },
  {
    stationuuid: "hardcoded-rne-radio1",
    name: "RNE Radio Nacional",
    url: "https://rne.rtveradio.cires21.com/rne_r1.mp3",
    url_resolved: "https://rne.rtveradio.cires21.com/rne_r1.mp3",
    homepage: "https://www.rtve.es/radio/radio-nacional",
    favicon: "https://www.rtve.es/favicon.ico",
    tags: "news,culture,spanish",
    country: "Spain",
    countrycode: "ES",
    language: "spanish",
    codec: "MP3",
    bitrate: 128,
    votes: 0,
    clickcount: 0,
  },
  {
    stationuuid: "hardcoded-nrk-p1",
    name: "NRK P1",
    url: "https://lyd.nrk.no/nrk_radio_p1_ostlandssendingen_mp3_h",
    url_resolved: "https://lyd.nrk.no/nrk_radio_p1_ostlandssendingen_mp3_h",
    homepage: "https://www.nrk.no/p1",
    favicon: "https://www.nrk.no/favicon.ico",
    tags: "news,culture,norwegian",
    country: "Norway",
    countrycode: "NO",
    language: "norwegian",
    codec: "MP3",
    bitrate: 128,
    votes: 0,
    clickcount: 0,
  },
  {
    stationuuid: "hardcoded-yle-radio1",
    name: "Yle Radio 1",
    url: "https://icecast.yle.fi/radio/ylepuhe/mp3/128/yleradio1.mp3",
    url_resolved: "https://icecast.yle.fi/radio/ylepuhe/mp3/128/yleradio1.mp3",
    homepage: "https://yle.fi/radio1",
    favicon: "https://yle.fi/favicon.ico",
    tags: "news,culture,finnish",
    country: "Finland",
    countrycode: "FI",
    language: "finnish",
    codec: "MP3",
    bitrate: 128,
    votes: 0,
    clickcount: 0,
  },
  {
    stationuuid: "hardcoded-cbc-radio1",
    name: "CBC Radio One Toronto",
    url: "https://cbcmp3.ic.llnwd.net/stream/cbcmp3_cbc_r1_tor",
    url_resolved: "https://cbcmp3.ic.llnwd.net/stream/cbcmp3_cbc_r1_tor",
    homepage: "https://www.cbc.ca/radio",
    favicon: "https://www.cbc.ca/favicon.ico",
    tags: "news,public radio,canada",
    country: "Canada",
    countrycode: "CA",
    language: "english",
    codec: "MP3",
    bitrate: 128,
    votes: 0,
    clickcount: 0,
  },
  {
    stationuuid: "hardcoded-rfi",
    name: "RFI Monde",
    url: "https://live02.rfi.fr/rfimonde-96k.mp3",
    url_resolved: "https://live02.rfi.fr/rfimonde-96k.mp3",
    homepage: "https://www.rfi.fr",
    favicon: "https://www.rfi.fr/favicon.ico",
    tags: "news,world,french",
    country: "France",
    countrycode: "FR",
    language: "french",
    codec: "MP3",
    bitrate: 96,
    votes: 0,
    clickcount: 0,
  },
  {
    stationuuid: "hardcoded-dw-english",
    name: "DW Radio English",
    url: "https://icecast.dw.com/dw/english/mp3_128",
    url_resolved: "https://icecast.dw.com/dw/english/mp3_128",
    homepage: "https://www.dw.com",
    favicon: "https://www.dw.com/favicon.ico",
    tags: "news,world,english",
    country: "Germany",
    countrycode: "DE",
    language: "english",
    codec: "MP3",
    bitrate: 128,
    votes: 0,
    clickcount: 0,
  },
  {
    stationuuid: "hardcoded-radio-paradise",
    name: "Radio Paradise",
    url: "https://stream.radioparadise.com/mp3-128",
    url_resolved: "https://stream.radioparadise.com/mp3-128",
    homepage: "https://www.radioparadise.com",
    favicon: "https://www.radioparadise.com/favicon.ico",
    tags: "eclectic,rock,indie",
    country: "United States",
    countrycode: "US",
    language: "english",
    codec: "MP3",
    bitrate: 128,
    votes: 0,
    clickcount: 0,
  },
  {
    stationuuid: "hardcoded-soma-groove-salad",
    name: "SomaFM Groove Salad",
    url: "https://ice1.somafm.com/groovesalad-128-mp3",
    url_resolved: "https://ice1.somafm.com/groovesalad-128-mp3",
    homepage: "https://somafm.com/groovesalad",
    favicon: "https://somafm.com/favicon.ico",
    tags: "ambient,chillout,electronic",
    country: "United States",
    countrycode: "US",
    language: "english",
    codec: "MP3",
    bitrate: 128,
    votes: 0,
    clickcount: 0,
  },
  {
    stationuuid: "hardcoded-soma-drone-zone",
    name: "SomaFM Drone Zone",
    url: "https://ice1.somafm.com/dronezone-128-mp3",
    url_resolved: "https://ice1.somafm.com/dronezone-128-mp3",
    homepage: "https://somafm.com/dronezone",
    favicon: "https://somafm.com/favicon.ico",
    tags: "ambient,drone,electronic",
    country: "United States",
    countrycode: "US",
    language: "english",
    codec: "MP3",
    bitrate: 128,
    votes: 0,
    clickcount: 0,
  },
];

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function saveStationsToCache(stations: RadioStation[]): void {
  try {
    const payload: CachedStations = { stations, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota or serialisation errors — caching is best-effort
  }
}

function loadStationsFromCache(): RadioStation[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedStations = JSON.parse(raw);
    if (Array.isArray(parsed.stations) && parsed.stations.length > 0) {
      return parsed.stations;
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Known Radio Browser API mirrors — tried in order until one succeeds
// ---------------------------------------------------------------------------
const FALLBACK_HOSTS = [
  "https://de1.api.radio-browser.info",
  "https://de2.api.radio-browser.info",
  "https://fi1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
];

// Cache the last working host to avoid redundant probing on subsequent requests
let cachedBaseUrl: string | null = null;

const defaultHeaders = {
  "User-Agent": USER_AGENT,
  "Content-Type": "application/json",
};

/** Wraps fetch with an AbortController timeout. Throws a descriptive error on timeout. */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(`Request timed out after ${FETCH_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Probes each known host in sequence and returns the first one that responds
 * with a valid JSON array. Caches the result for subsequent calls.
 * Returns null (instead of throwing) when all hosts fail.
 */
async function getWorkingBaseUrl(): Promise<string | null> {
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }

  for (const host of FALLBACK_HOSTS) {
    try {
      const probeUrl = `${host}/json/stations/search?limit=1&hidebroken=true`;
      const res = await fetchWithTimeout(probeUrl, { headers: defaultHeaders });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          cachedBaseUrl = host;
          return host;
        }
      }
    } catch {
      // Try next host
    }
  }

  cachedBaseUrl = null;
  return null;
}

/** Invalidates the cached base URL so the next request re-probes all hosts. */
export function resetApiHostCache(): void {
  cachedBaseUrl = null;
}

/** Fetches from the best available host. Returns null if no host is reachable. */
async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response | null> {
  const baseUrl = await getWorkingBaseUrl();
  if (!baseUrl) return null;

  try {
    const res = await fetchWithTimeout(`${baseUrl}${path}`, {
      ...options,
      headers: { ...defaultHeaders, ...(options.headers ?? {}) },
    });
    return res;
  } catch {
    // If the cached host fails mid-session, clear cache and retry once with a fresh probe
    cachedBaseUrl = null;
    const freshBase = await getWorkingBaseUrl();
    if (!freshBase) return null;
    try {
      return await fetchWithTimeout(`${freshBase}${path}`, {
        ...options,
        headers: { ...defaultHeaders, ...(options.headers ?? {}) },
      });
    } catch {
      return null;
    }
  }
}

export async function fetchTopStations(limit = 60): Promise<StationsResult> {
  const params = new URLSearchParams({
    order: "clickcount",
    reverse: "true",
    limit: String(limit),
    hidebroken: "true",
  });

  const res = await apiFetch(`/json/stations/search?${params}`);
  if (res?.ok) {
    try {
      const data: RadioStation[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveStationsToCache(data);
        return { stations: data, source: "live" };
      }
    } catch {
      // Fall through to cache/hardcoded
    }
  }

  // API failed — try localStorage cache
  const cached = loadStationsFromCache();
  if (cached) {
    return { stations: cached, source: "cache" };
  }

  // Last resort — hardcoded list
  return { stations: HARDCODED_STATIONS, source: "hardcoded" };
}

/**
 * Fetches a broad set of stations for the globe view, pulling from multiple
 * regions to ensure good geographic coverage including the United States.
 * Returns up to ~500 stations with valid country data.
 */
export async function fetchGlobeStations(): Promise<RadioStation[]> {
  const baseUrl = await getWorkingBaseUrl();

  if (!baseUrl) {
    // Fall back to cache or hardcoded for globe too
    const cached = loadStationsFromCache();
    if (cached) return cached;
    return HARDCODED_STATIONS;
  }

  const makeUrl = (order: string) =>
    `${baseUrl}/json/stations/search?${new URLSearchParams({
      order,
      reverse: "true",
      limit: "500",
      hidebroken: "true",
    })}`;

  const fetchOne = async (url: string): Promise<RadioStation[]> => {
    try {
      const res = await fetchWithTimeout(url, { headers: defaultHeaders });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const [byVotes, byClicks] = await Promise.all([
    fetchOne(makeUrl("votes")),
    fetchOne(makeUrl("clickcount")),
  ]);

  // Deduplicate by stationuuid, keeping first occurrence
  const seen = new Set<string>();
  const combined: RadioStation[] = [];
  for (const station of [...byVotes, ...byClicks]) {
    if (
      !seen.has(station.stationuuid) &&
      station.country &&
      station.country.trim().length > 0
    ) {
      seen.add(station.stationuuid);
      combined.push(station);
    }
  }

  if (combined.length === 0) {
    const cached = loadStationsFromCache();
    if (cached) return cached;
    return HARDCODED_STATIONS;
  }

  return combined;
}

export async function searchStations(params: {
  tag?: string;
  country?: string;
  name?: string;
  limit?: number;
}): Promise<StationsResult> {
  const searchParams = new URLSearchParams({
    order: "clickcount",
    reverse: "true",
    limit: String(params.limit ?? 60),
    hidebroken: "true",
  });

  if (params.tag) searchParams.set("tag", params.tag);
  if (params.country) searchParams.set("country", params.country);
  if (params.name) searchParams.set("name", params.name);

  const res = await apiFetch(`/json/stations/search?${searchParams}`);
  if (res?.ok) {
    try {
      const data: RadioStation[] = await res.json();
      if (Array.isArray(data)) {
        return { stations: data, source: "live" };
      }
    } catch {
      // Fall through
    }
  }

  // API failed — try cache
  const cached = loadStationsFromCache();
  if (cached) {
    return { stations: cached, source: "cache" };
  }

  return { stations: HARDCODED_STATIONS, source: "hardcoded" };
}

export async function fetchCountries(): Promise<
  { name: string; stationcount: number }[]
> {
  const res = await apiFetch(
    "/json/countries?order=stationcount&reverse=true&limit=100",
  );
  if (!res || !res.ok) return [];
  try {
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchTags(): Promise<
  { name: string; stationcount: number }[]
> {
  const res = await apiFetch(
    "/json/tags?order=stationcount&reverse=true&limit=50&hidebroken=true",
  );
  if (!res || !res.ok) return [];
  try {
    return res.json();
  } catch {
    return [];
  }
}

export async function clickStation(stationuuid: string): Promise<void> {
  try {
    const baseUrl = cachedBaseUrl ?? FALLBACK_HOSTS[0];
    await fetchWithTimeout(`${baseUrl}/json/url/${stationuuid}`, {
      headers: defaultHeaders,
    });
  } catch {
    // Non-critical, ignore errors
  }
}
