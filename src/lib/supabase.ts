import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface NHLPlayer {
  id: string;
  name: string;
  points_games: number;
  points_total_games: number;
  shots_threshold: number;
  shots_games: number;
  shots_total_games: number;
  created_at: string;
  updated_at: string;
}
