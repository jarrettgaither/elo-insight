import { useState } from "react";
import { Button } from "./ui/button";

// Full list of available games
const availableGames = ["CS2", "Dota 2", "Apex Legends", "Valorant", "League of Legends", "Call of Duty"]; 

// Game to platform mapping
const gamePlatforms: Record<string, string[]> = {
  "CS2": ["Steam"],
  "Dota 2": ["Steam"],
  "Apex Legends": ["EA", "PlayStation", "Xbox"],
  "Valorant": ["Riot"],
  "League of Legends": ["Riot"],
  "Call of Duty": ["PlayStation", "Xbox", "Battle.net"]
};

const AddStatModal = ({
  profile,
  onClose,
  onAddStat,
}: {
  profile: { 
    steam_id?: string;
    ea_username?: string;
    riot_id?: string;
    riot_game_name?: string;
    riot_tagline?: string;
    xbox_id?: string;
    playstation_id?: string; 
  } | null;
  onClose: () => void;
  onAddStat: (game: string, platform: string) => void;
}) => {
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);

  // Update available platforms when game selection changes
  const handleGameChange = (game: string) => {
    setSelectedGame(game);
    setSelectedPlatform(""); // Reset platform selection
    
    if (!game) {
      setAvailablePlatforms([]);
      return;
    }
    
    // Get platforms for the selected game
    const platforms = gamePlatforms[game] || [];
    
    // Filter platforms based on linked accounts
    const linkedPlatforms = platforms.filter(platform => {
      if (platform === "Steam" && profile?.steam_id) return true;
      if (platform === "EA" && profile?.ea_username) return true;
      if (platform === "Riot" && profile?.riot_game_name && profile?.riot_tagline) return true;
      if (platform === "Xbox" && profile?.xbox_id) return true;
      if (platform === "PlayStation" && profile?.playstation_id) return true;
      if (platform === "Battle.net") return true; // No linking required for now
      return false;
    });
    
    setAvailablePlatforms(linkedPlatforms);
  };

  const handleAdd = () => {
    if (!selectedPlatform || !selectedGame) {
      alert("Please select a platform and game.");
      return;
    }
    onAddStat(selectedGame, selectedPlatform);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
      <div className="bg-surface-dark border border-primary-700 text-white p-6 shadow-lg w-96">
        <div className="border-b border-primary-800 pb-3 mb-5">
          <h3 className="text-xl font-bold text-white">Add Game Stats</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1.5">Select Game:</label>
            <select
              value={selectedGame}
              onChange={(e) => handleGameChange(e.target.value)}
              className="w-full p-2.5 bg-primary-950 border border-primary-800 text-white rounded focus:border-accent-600 focus:outline-none"
            >
              <option value="">-- Select Game --</option>
              {availableGames.map((game) => (
                <option key={game} value={game}>
                  {game}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1.5">Select Platform:</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full p-2.5 bg-primary-950 border border-primary-800 text-white rounded focus:border-accent-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={availablePlatforms.length === 0}
            >
              <option value="">-- Select Platform --</option>
              {availablePlatforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
          
          {selectedGame && availablePlatforms.length === 0 && (
            <div className="bg-accent-900/20 border-l-4 border-accent-600 p-3 text-accent-300 text-sm">
              You need to link your gaming account before adding {selectedGame} stats. 
              Visit your profile to link the required accounts.
            </div>
          )}

          <div className="flex justify-end pt-4 space-x-3 border-t border-primary-900 mt-4">
            <Button onClick={onClose} className="bg-primary-800 hover:bg-primary-700 border-none">
              Cancel
            </Button>
            <Button onClick={handleAdd} className="bg-accent-600 hover:bg-accent-700 border-none">
              Add Stats
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStatModal;
