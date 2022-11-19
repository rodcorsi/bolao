const FOOTBALL_HOST = "v3.football.api-sports.io";
export default async function apiFootball(endpoint: string) {
  const myHeaders = new Headers();
  myHeaders.append("x-rapidapi-key", process.env.FOOTBALL_API_KEY);
  myHeaders.append("x-rapidapi-host", FOOTBALL_HOST);

  const response = await fetch(`https://${FOOTBALL_HOST}${endpoint}`, {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  });
  return await response.json();
}
