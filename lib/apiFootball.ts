const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";

export default async function apiFootball<T>(endpoint: string): Promise<T> {
  const headers = new Headers();
  headers.append("X-Auth-Token", process.env.FOOTBAL_DATA_ORG_API_KEY);
  headers.append("X-Unfold-Goals", "true");

  const response = await fetch(`${FOOTBALL_DATA_BASE_URL}${endpoint}`, {
    method: "GET",
    headers,
    redirect: "follow",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `football-data.org request failed (${response.status} ${response.statusText}): ${body}`,
    );
  }

  return (await response.json()) as T;
}
