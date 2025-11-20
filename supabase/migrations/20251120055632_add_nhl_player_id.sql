-- Add nhl_player_id column to nhl_players table
ALTER TABLE nhl_players
ADD COLUMN nhl_player_id integer;

-- Update existing rows with a placeholder ID (e.g., 0)
-- In a real-world scenario, a script would be run to backfill this data
UPDATE nhl_players
SET nhl_player_id = 0
WHERE nhl_player_id IS NULL;

-- Make the column NOT NULL after backfilling
ALTER TABLE nhl_players
ALTER COLUMN nhl_player_id SET NOT NULL;

-- Optionally, add a unique constraint if you only want to track a player once
-- ALTER TABLE nhl_players
-- ADD CONSTRAINT unique_nhl_player_id UNIQUE (nhl_player_id);
