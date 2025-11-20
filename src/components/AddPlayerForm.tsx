import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Loader } from 'lucide-react';
import { searchNHLPlayers, getNHLPlayerStats, type NHLApiPlayer } from '../lib/nhlApi';

interface AddPlayerFormProps {
  onAdd: (player: {
    nhl_player_id: number;
    name: string;
    points_games: number;
    points_total_games: number;
    shots_threshold: number;
    shots_games: number;
    shots_total_games: number;
  }) => Promise<void>;
}

// Custom hook for debouncing
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function AddPlayerForm({ onAdd }: AddPlayerFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NHLApiPlayer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<NHLApiPlayer | null>(null);
  const [isFetchingStats, setIsFetchingStats] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    nhl_player_id: 0,
    name: '',
    points_games: 0, // Will now store total points
    points_total_games: 0,
    shots_threshold: 1.5,
    shots_games: 0, // Will now store total shots
    shots_total_games: 0,
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.length >= 2) {
        setIsSearching(true);
        const results = await searchNHLPlayers(debouncedSearchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    };

    performSearch();
  }, [debouncedSearchQuery]);

  const handleSelectPlayer = useCallback(async (player: NHLApiPlayer) => {
    setSelectedPlayer(player);
    setSearchQuery(''); // Clear search query
    setSearchResults([]); // Hide results
    setIsFetchingStats(true);

    const stats = await getNHLPlayerStats(player.id);
    setIsFetchingStats(false);

    if (stats) {
      setNewPlayer((prev) => ({
        ...prev,
        name: player.name,
        nhl_player_id: player.id,
        points_games: stats.pointsGames, // Now total points
        points_total_games: stats.totalGames,
        shots_games: stats.shots, // Now total shots
        shots_total_games: stats.totalGames,
      }));
    } else {
      // Handle case where stats are not found
      setNewPlayer((prev) => ({
        ...prev,
        name: player.name,
        nhl_player_id: player.id,
        points_games: 0,
        points_total_games: 0,
        shots_games: 0,
        shots_total_games: 0,
      }));
      alert(`Could not fetch stats for ${player.name}. Please check if the player has played in the current season.`);
    }
  }, []);

  const resetForm = () => {
    setNewPlayer({
      nhl_player_id: 0,
      name: '',
      points_games: 0,
      points_total_games: 0,
      shots_threshold: 1.5,
      shots_games: 0,
      shots_total_games: 0,
    });
    setSelectedPlayer(null);
    setSearchQuery('');
    setSearchResults([]);
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayer.name.trim()) return;

    await onAdd(newPlayer);
    resetForm();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mb-6"
      >
        <Plus size={20} />
        Add New Player
      </button>
    );
  }

  return (
    <div className="bg-white border-2 border-green-500 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Add New Player</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium mb-1">Search NHL Player *</label>
          <input
            type="text"
            value={selectedPlayer ? selectedPlayer.name : searchQuery}
            onChange={(e) => {
              if (!selectedPlayer) {
                setSearchQuery(e.target.value);
              }
            }}
            placeholder="Search by player name (min 2 characters)"
            className="w-full px-3 py-2 border rounded-lg"
            required
            disabled={!!selectedPlayer}
          />

          {searchResults.length > 0 && !selectedPlayer && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-10">
              {searchResults.slice(0, 10).map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => handleSelectPlayer(player)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                >
                  <div className="font-medium">{player.name}</div>
                </button>
              ))}
            </div>
          )}

          {selectedPlayer && (
            <button
              type="button"
              onClick={() => {
                setSelectedPlayer(null);
                setNewPlayer((prev) => ({ ...prev, name: '', nhl_player_id: 0 }));
                setSearchQuery('');
              }}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}

          {isSearching && (
            <div className="absolute right-3 top-9">
              <Loader size={18} className="animate-spin text-blue-500" />
            </div>
          )}
        </div>

        {isFetchingStats && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm flex items-center gap-2">
            <Loader size={16} className="animate-spin" />
            Fetching player stats from NHL...
          </div>
        )}

        {selectedPlayer && !isFetchingStats && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            ✓ Stats auto-populated from NHL (Current Season)
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Shots Threshold</label>
            <select
              value={newPlayer.shots_threshold}
              onChange={(e) => setNewPlayer({ ...newPlayer, shots_threshold: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value={0}>None</option>
              <option value={1.5}>1.5</option>
              <option value={2.5}>2.5</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Total Points / Games</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={newPlayer.points_games}
                readOnly
                className="w-20 px-3 py-2 border rounded-lg bg-gray-100"
              />
              <span>/</span>
              <input
                type="number"
                value={newPlayer.points_total_games}
                readOnly
                className="w-20 px-3 py-2 border rounded-lg bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Total Shots / Games</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={newPlayer.shots_games}
                readOnly
                className="w-20 px-3 py-2 border rounded-lg bg-gray-100"
              />
              <span>/</span>
              <input
                type="number"
                value={newPlayer.shots_total_games}
                readOnly
                className="w-20 px-3 py-2 border rounded-lg bg-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            disabled={!newPlayer.name.trim() || isFetchingStats}
          >
            Add Player
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
