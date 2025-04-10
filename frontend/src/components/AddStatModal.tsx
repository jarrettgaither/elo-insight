import { useState } from "react";
import { Button } from "./ui/button";

const availableGames = ["CS2", "Apex Legends", "Valorant"]; // Extendable

const AddStatModal = ({
  profile,
  onClose,
  onAddStat,
}: {
  profile: { steam_id?: string } | null;
  onClose: () => void;
  onAddStat: (game: string, platform: string) => void;
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedGame, setSelectedGame] = useState("");

  const handleAdd = () => {
    if (!selectedPlatform || !selectedGame) {
      alert("Please select a platform and game.");
      return;
    }
    onAddStat(selectedGame, selectedPlatform);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-gray-800 text-white p-6 rounded-lg w-96">
        <h3 className="text-xl font-bold mb-4">Add Game Stats</h3>

        <label className="block mb-2">Select Platform:</label>
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="w-full p-2 bg-gray-700 text-white rounded mb-4"
        >
          <option value="">-- Select Platform --</option>
          {profile?.steam_id && <option value="Steam">Steam</option>}
        </select>

        <label className="block mb-2">Select Game:</label>
        <select
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value)}
          className="w-full p-2 bg-gray-700 text-white rounded mb-4"
        >
          <option value="">-- Select Game --</option>
          {availableGames.map((game) => (
            <option key={game} value={game}>
              {game}
            </option>
          ))}
        </select>

        <div className="flex justify-end">
          <Button onClick={onClose} className="mr-2 bg-gray-600 hover:bg-gray-700">
            Cancel
          </Button>
          <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddStatModal;
