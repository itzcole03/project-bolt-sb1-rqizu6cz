import { useState } from 'react';
import { Pencil, Trash2, Save, X } from 'lucide-react';
import { NHLPlayer } from '../lib/supabase';

interface PlayerRowProps {
  player: NHLPlayer;
  onUpdate: (id: string, updates: Partial<NHLPlayer>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function PlayerRow({ player, onUpdate, onDelete }: PlayerRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlayer, setEditedPlayer] = useState(player);

  const pointsPercentage = player.points_total_games > 0
    ? ((player.points_games / player.points_total_games) * 100).toFixed(1)
    : '0.0';

  const shotsPercentage = player.shots_total_games > 0
    ? ((player.shots_games / player.shots_total_games) * 100).toFixed(1)
    : '0.0';

  const handleSave = async () => {
    await onUpdate(player.id, {
      name: editedPlayer.name,
      points_games: editedPlayer.points_games,
      points_total_games: editedPlayer.points_total_games,
      shots_threshold: editedPlayer.shots_threshold,
      shots_games: editedPlayer.shots_games,
      shots_total_games: editedPlayer.shots_total_games,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedPlayer(player);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-3 border-b">
          <input
            type="text"
            value={editedPlayer.name}
            onChange={(e) => setEditedPlayer({ ...editedPlayer, name: e.target.value })}
            className="w-full px-2 py-1 border rounded"
          />
        </td>
        <td className="px-4 py-3 border-b">
          <div className="flex gap-1 items-center">
            <input
              type="number"
              value={editedPlayer.points_games}
              onChange={(e) => setEditedPlayer({ ...editedPlayer, points_games: parseInt(e.target.value) || 0 })}
              className="w-16 px-2 py-1 border rounded"
            />
            <span>/</span>
            <input
              type="number"
              value={editedPlayer.points_total_games}
              onChange={(e) => setEditedPlayer({ ...editedPlayer, points_total_games: parseInt(e.target.value) || 0 })}
              className="w-16 px-2 py-1 border rounded"
            />
          </div>
        </td>
        <td className="px-4 py-3 border-b text-gray-400">
          {editedPlayer.points_total_games > 0
            ? ((editedPlayer.points_games / editedPlayer.points_total_games) * 100).toFixed(1)
            : '0.0'}%
        </td>
        <td className="px-4 py-3 border-b">
          <select
            value={editedPlayer.shots_threshold}
            onChange={(e) => setEditedPlayer({ ...editedPlayer, shots_threshold: parseFloat(e.target.value) })}
            className="w-20 px-2 py-1 border rounded"
          >
            <option value="0">-</option>
            <option value="1.5">1.5</option>
            <option value="2.5">2.5</option>
          </select>
        </td>
        <td className="px-4 py-3 border-b">
          <div className="flex gap-1 items-center">
            <input
              type="number"
              value={editedPlayer.shots_games}
              onChange={(e) => setEditedPlayer({ ...editedPlayer, shots_games: parseInt(e.target.value) || 0 })}
              className="w-16 px-2 py-1 border rounded"
            />
            <span>/</span>
            <input
              type="number"
              value={editedPlayer.shots_total_games}
              onChange={(e) => setEditedPlayer({ ...editedPlayer, shots_total_games: parseInt(e.target.value) || 0 })}
              className="w-16 px-2 py-1 border rounded"
            />
          </div>
        </td>
        <td className="px-4 py-3 border-b text-gray-400">
          {editedPlayer.shots_total_games > 0
            ? ((editedPlayer.shots_games / editedPlayer.shots_total_games) * 100).toFixed(1)
            : '0.0'}%
        </td>
        <td className="px-4 py-3 border-b">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              title="Save"
            >
              <Save size={18} />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
              title="Cancel"
            >
              <X size={18} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 border-b font-medium">{player.name}</td>
      <td className="px-4 py-3 border-b">
        {player.points_games}/{player.points_total_games}
      </td>
      <td className="px-4 py-3 border-b text-gray-600">{pointsPercentage}%</td>
      <td className="px-4 py-3 border-b">
        {player.shots_threshold > 0 ? player.shots_threshold : '-'}
      </td>
      <td className="px-4 py-3 border-b">
        {player.shots_total_games > 0 ? `${player.shots_games}/${player.shots_total_games}` : '-'}
      </td>
      <td className="px-4 py-3 border-b text-gray-600">
        {player.shots_total_games > 0 ? `${shotsPercentage}%` : '-'}
      </td>
      <td className="px-4 py-3 border-b">
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            title="Edit"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={() => onDelete(player.id)}
            className="p-1 text-red-600 hover:bg-red-100 rounded"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}
