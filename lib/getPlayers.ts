import { supabase } from "./supabaseClient";

export interface Player {
  id: number;
  userId?: number;
  userName?: string;
  name: string;
}

export default async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("id, user_id, name, users(name)")
    .order("id");
  if (error) {
    console.error("Error fetching players:", error.message);
    return [];
  }
  return data.map((player: any) => ({
    id: player.id,
    userId: player.user_id ?? undefined,
    userName: player.users?.name ?? undefined,
    name: player.name,
  })) as Player[];
}

export async function getPlayerByID(id: number) {
  const players = await getPlayers();
  return players.find((player) => player.id === id);
}

export async function getPlayersByUserID(userID: number) {
  const { data, error } = await supabase
    .from("players")
    .select("id, user_id, name, users(name)")
    .eq("user_id", userID)
    .order("id");
  if (error) {
    console.error(`Error fetching players for user ${userID}:`, error.message);
    return [];
  }
  return data.map((player: any) => ({
    id: player.id,
    userId: player.user_id ?? undefined,
    userName: player.users?.name ?? undefined,
    name: player.name,
  })) as Player[];
}
