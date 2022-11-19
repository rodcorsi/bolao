import bets from "../static_data/bets.json";

export interface Bet {
  playerID: number;
  matchID: number;
  homeGoals: number;
  awayGoals: number;
}

export default function getBets() {
  return bets as Bet[];
}

export function getBetsByPlayerID(playerID: number) {
  return getBets().filter((bet) => bet.playerID === playerID);
}
