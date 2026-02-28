const BASE_URL = 'https://de1.api.radio-browser.info';
const USER_AGENT = 'SquadronRadio/1.0';

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

const defaultHeaders = {
  'User-Agent': USER_AGENT,
  'Content-Type': 'application/json',
};

export async function fetchTopStations(limit = 60): Promise<RadioStation[]> {
  const params = new URLSearchParams({
    order: 'clickcount',
    reverse: 'true',
    limit: String(limit),
    hidebroken: 'true',
  });
  const res = await fetch(`${BASE_URL}/json/stations/search?${params}`, {
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error('Failed to fetch stations');
  return res.json();
}

export async function searchStations(params: {
  tag?: string;
  country?: string;
  name?: string;
  limit?: number;
}): Promise<RadioStation[]> {
  const searchParams = new URLSearchParams({
    order: 'clickcount',
    reverse: 'true',
    limit: String(params.limit ?? 60),
    hidebroken: 'true',
  });

  if (params.tag) searchParams.set('tag', params.tag);
  if (params.country) searchParams.set('country', params.country);
  if (params.name) searchParams.set('name', params.name);

  const res = await fetch(`${BASE_URL}/json/stations/search?${searchParams}`, {
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error('Failed to search stations');
  return res.json();
}

export async function fetchCountries(): Promise<{ name: string; stationcount: number }[]> {
  const res = await fetch(`${BASE_URL}/json/countries?order=stationcount&reverse=true&limit=100`, {
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error('Failed to fetch countries');
  return res.json();
}

export async function fetchTags(): Promise<{ name: string; stationcount: number }[]> {
  const res = await fetch(`${BASE_URL}/json/tags?order=stationcount&reverse=true&limit=50&hidebroken=true`, {
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error('Failed to fetch tags');
  return res.json();
}

export async function clickStation(stationuuid: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/json/url/${stationuuid}`, {
      headers: defaultHeaders,
    });
  } catch {
    // Non-critical, ignore errors
  }
}
