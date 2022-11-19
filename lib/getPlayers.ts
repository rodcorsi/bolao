import players from "../static_data/players.json";

export interface Player {
  id: number;
  name: string;
}

export default function getPlayers() {
  return players as Player[];
}

export function getPlayerByID(id: number) {
  return getPlayers().find((player) => player.id === id);
}
