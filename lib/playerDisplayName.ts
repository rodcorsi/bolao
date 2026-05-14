export interface PlayerDisplayNameInput {
  name: string;
  userName?: string;
}

export const defaultPlayerName = "principal";

export function getPlayerDisplayName(player: PlayerDisplayNameInput) {
  const userName = player.userName?.trim();
  const playerName = player.name.trim();

  if (!userName) {
    return playerName;
  }
  if (playerName.toLowerCase() === defaultPlayerName) {
    return userName;
  }
  return `${userName} (${playerName})`;
}
