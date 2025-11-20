import { useState } from 'react';
import { Trash2, Edit, Save, X } from 'lucide-react';
import { NHLPlayer } from '../lib/supabase';

interface PlayerRowProps {
  player: NHLPlayer;
  onUpdate: (id: string, updates: Partial<NHLPlayer>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function PlayerRow({ player, onUpdate, onDelete }: PlayerRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [shotsThreshold, setShotsThreshold] = useState(player.shots_threshold);

  const handleSave = async () => {
    await onUpdate(player.id, { shots_threshold: shotsThreshold });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setShotsThreshold(player.shots_threshold);
    setIsEditing(false);
  };

  // Points Average (Total Points / Total Games)
  const pointsAverage =
    player.points_total_games > 0
      ? player.points_games / player.points_total_games
      : 0;

  // Shots Per Game (Total Shots / Total Games)
  const shotsPerGame =
    player.shots_total_games > 0
      ? player.shots_games / player.shots_total_games
      : 0;

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3 font-medium text-slate-800">{player.name}</td>
      <td className="px-4 py-3">{player.points_games}</td>
      <td className="px-4 py-3">{player.points_total_games}</td>
      <td className="px-4 py-3 font-mono text-sm">
        {pointsAverage.toFixed(2)} PPG
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <select
            value={shotsThreshold}
            onChange={(e) => setShotsThreshold(parseFloat(e.target.value))}
            className="px-2 py-1 border rounded-lg"
          >
            <option value={0}>None</option>
            <option value={1.5}>1.5</option>
            <option value={2.5}>2.5</option>
          </select>
        ) : (
          <span className="font-semibold">{player.shots_threshold === 0 ? 'None' : player.shots_threshold}</span>
        )}
      </td>
      <td className="px-4 py-3">{player.shots_games}</td>
      <td className="px-4 py-3 font-mono text-sm">
        {shotsPerGame.toFixed(2)} SPG
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="text-green-600 hover:text-green-800"
                title="Save"
              >
                <Save size={18} />
              </button>
              <button
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-800"
                title="Cancel"
              >
                <X size={18} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-800"
              title="Edit Threshold"
            >
              <Edit size={18} />
            </button>
          )}
          <button
            onClick={() => onDelete(player.id)}
            className="text-red-600 hover:text-red-800"
            title="Delete Player"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}
