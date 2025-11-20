/*
  # Create NHL Player Stats Table

  1. New Tables
    - `nhl_players`
      - `id` (uuid, primary key)
      - `name` (text, player name)
      - `points_games` (integer, games with 1+ point)
      - `points_total_games` (integer, total games played for points stat)
      - `shots_threshold` (numeric, either 1.5 or 2.5)
      - `shots_games` (integer, games meeting shots threshold)
      - `shots_total_games` (integer, total games played for shots stat)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `nhl_players` table
    - Add policy for public read access (for viewing stats)
    - Add policy for public write access (for editing stats)
    
  Note: This is a personal tracking app with public access for simplicity
*/

CREATE TABLE IF NOT EXISTS nhl_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  points_games integer DEFAULT 0,
  points_total_games integer DEFAULT 0,
  shots_threshold numeric DEFAULT 1.5,
  shots_games integer DEFAULT 0,
  shots_total_games integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE nhl_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON nhl_players
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access"
  ON nhl_players
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON nhl_players
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access"
  ON nhl_players
  FOR DELETE
  TO public
  USING (true);