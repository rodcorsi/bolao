import { supabase } from "./supabaseClient";

export interface Player {
  id: number;
  name: string;
}

export default async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase.from('players').select('*').order('id');
  if (error) {
    console.error('Error fetching players:', error.message);
    return [];
  }
  return data as Player[];
}

export async function getPlayerByID(id: number) {
  const players = await getPlayers();
  return players.find((player) => player.id === id);
}
