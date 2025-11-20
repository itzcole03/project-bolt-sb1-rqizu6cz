import { useEffect, useState } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';
import { supabase, NHLPlayer } from './lib/supabase';
import { getNHLPlayerStats } from './lib/nhlApi';
import { PlayerRow } from './components/PlayerRow';
import { AddPlayerForm } from './components/AddPlayerForm';

function App() {
  const [players, setPlayers] = useState<NHLPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'shots'>('name');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('nhl_players')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading players:', error);
    } else {
      setPlayers(data || []);
    }
    setLoading(false);
  };

  const handleAddPlayer = async (newPlayer: Omit<NHLPlayer, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase
      .from('nhl_players')
      .insert([newPlayer]);

    if (error) {
      console.error('Error adding player:', error);
      alert('Failed to add player');
    } else {
      await loadPlayers();
    }
  };

  const handleUpdatePlayer = async (id: string, updates: Partial<NHLPlayer>) => {
    const { error } = await supabase
      .from('nhl_players')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating player:', error);
      alert('Failed to update player');
    } else {
      await loadPlayers();
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this player?')) return;

    const { error } = await supabase
      .from('nhl_players')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting player:', error);
      alert('Failed to delete player');
    } else {
      await loadPlayers();
    }
  };

  const handleRefreshStats = async () => {
    setIsRefreshing(true);
    let updatedCount = 0;
    let failedPlayers: { name: string; reason: string }[] = [];

    for (const player of players) {
      try {
        console.log(`Refreshing stats for: ${player.name}`);
        const nhlStats = await getNHLPlayerStats(player.name);

        if (!nhlStats) {
          failedPlayers.push({ name: player.name, reason: 'Player not found in NHL database' });
          continue;
        }

        if (nhlStats.totalGames === 0) {
          failedPlayers.push({ name: player.name, reason: 'No games played this season' });
          continue;
        }

        console.log(`Updating ${player.name} with stats:`, nhlStats);

        const { error } = await supabase
          .from('nhl_players')
          .update({
            points_games: nhlStats.pointsGames,
            points_total_games: nhlStats.totalGames,
            shots_games: nhlStats.shots,
            shots_total_games: nhlStats.totalGames,
            updated_at: new Date().toISOString(),
          })
          .eq('id', player.id);

        if (error) {
          console.error(`Database error for ${player.name}:`, error);
          failedPlayers.push({ name: player.name, reason: 'Database update failed' });
        } else {
          console.log(`Successfully updated ${player.name}`);
          updatedCount++;
        }
      } catch (err) {
        console.error(`Error refreshing stats for ${player.name}:`, err);
        failedPlayers.push({
          name: player.name,
          reason: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    await loadPlayers();
    setIsRefreshing(false);

    if (updatedCount > 0) {
      let message = `✓ Updated ${updatedCount} player(s) with latest NHL stats!`;
      if (failedPlayers.length > 0) {
        message += `\n\n⚠ Failed updates:\n`;
        failedPlayers.forEach(p => {
          message += `• ${p.name}: ${p.reason}\n`;
        });
      }
      alert(message);
    } else {
      let message = 'No stats were updated.\n\nReasons:\n';
      failedPlayers.forEach(p => {
        message += `• ${p.name}: ${p.reason}\n`;
      });
      alert(message);
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'points') {
      const aPercent = a.points_total_games > 0 ? a.points_games / a.points_total_games : 0;
      const bPercent = b.points_total_games > 0 ? b.points_games / b.points_total_games : 0;
      return bPercent - aPercent;
    } else {
      const aPercent = a.shots_total_games > 0 ? a.shots_games / a.shots_total_games : 0;
      const bPercent = b.shots_total_games > 0 ? b.shots_games / b.shots_total_games : 0;
      return bPercent - aPercent;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy size={36} className="text-slate-700" />
            <h1 className="text-4xl font-bold text-slate-800">NHL Player Stats Tracker</h1>
          </div>
          <p className="text-slate-600">Track points and shots on goal statistics</p>
        </div>

        <AddPlayerForm onAdd={handleAddPlayer} />

        <div className="mb-4 flex justify-end">
          <button
            onClick={handleRefreshStats}
            disabled={players.length === 0 || isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing Stats...' : 'Refresh All Stats'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-slate-700 text-white flex items-center justify-between">
            <h2 className="text-xl font-semibold">Players</h2>
            <div className="flex gap-2 text-sm">
              <span className="text-slate-300">Sort by:</span>
              <button
                onClick={() => setSortBy('name')}
                className={`px-2 py-1 rounded ${sortBy === 'name' ? 'bg-slate-600' : 'hover:bg-slate-600'}`}
              >
                Name
              </button>
              <button
                onClick={() => setSortBy('points')}
                className={`px-2 py-1 rounded ${sortBy === 'points' ? 'bg-slate-600' : 'hover:bg-slate-600'}`}
              >
                Points %
              </button>
              <button
                onClick={() => setSortBy('shots')}
                className={`px-2 py-1 rounded ${sortBy === 'shots' ? 'bg-slate-600' : 'hover:bg-slate-600'}`}
              >
                Shots %
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading players...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Player</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Points (1+ PPG)</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Points %</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">SOG Threshold</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">SOG Games</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">SOG %</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player) => (
                    <PlayerRow
                      key={player.id}
                      player={player}
                      onUpdate={handleUpdatePlayer}
                      onDelete={handleDeletePlayer}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && players.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No players yet. Add your first player above!
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-slate-600 bg-white rounded-lg p-4">
          <h3 className="font-semibold mb-2">Legend:</h3>
          <ul className="space-y-1">
            <li><strong>Points (1+ PPG):</strong> Games with at least 1 point / Total games</li>
            <li><strong>SOG Threshold:</strong> Shots on goal threshold (1.5 or 2.5)</li>
            <li><strong>SOG Games:</strong> Games meeting the shots threshold / Total games</li>
            <li><strong>Percentages:</strong> Automatically calculated and updated</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
