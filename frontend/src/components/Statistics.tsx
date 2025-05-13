import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import useStats from "./useStats";
import StatCard from "./StatCard";
import AddStatModal from "./AddStatModal";

const Statistics = () => {
  const { stats, profile, saveStatSelection, deleteStatCard, fetchUpdatedStats } = useStats();
  
  // Define a refreshStat function that calls fetchUpdatedStats
  const refreshStat = async (id: number) => {
    console.log(`Refreshing stat with ID: ${id}`);
    await fetchUpdatedStats();
  };
  const [showModal, setShowModal] = useState(false);

  // Add debugging logs
  useEffect(() => {
    console.log("Statistics component stats:", stats);
    console.log("Statistics component profile:", profile);
  }, [stats, profile]);

  const handleAddStat = async (game: string, platform: string) => {
    // DEBUGGING for League of Legends issue
    console.log("=== League of Legends Debugging ===");
    console.log("Adding game:", game, "platform:", platform);
    console.log("Profile.riot_id:", profile?.riot_id);
    console.log("Profile Riot ID type:", typeof profile?.riot_id);
    console.log("Checking if Riot ID exists:", !!profile?.riot_id);
    console.log("Profile keys:", profile ? Object.keys(profile) : "no profile");
    console.log("Full profile:", profile);
    
    // IMPORTANT: For League of Legends, bypass the frontend validation entirely
    if (game === "League of Legends") {
      console.log("Bypassing frontend Riot ID check for League of Legends");
      // Continue without checking profile.riot_id
    }
    // Check for the required account based on platform for other games
    else if (platform === "Steam" && !profile?.steam_id) {
      alert("You must link your Steam account before adding stats.");
      return;
    } else if (platform === "Riot" && !profile?.riot_id && game !== "League of Legends") {
      alert("You must link your Riot account before adding stats.");
      return;
    } else if (platform === "EA" && !profile?.ea_username) {
      alert("You must link your EA account before adding stats.");
      return;
    } else if (platform === "Xbox" && !profile?.xbox_id) {
      alert("You must link your Xbox account before adding stats.");
      return;
    } else if (platform === "PlayStation" && !profile?.playstation_id) {
      alert("You must link your PlayStation account before adding stats.");
      return;
    }

    try {
      console.log(`Statistics: Adding stat for game=${game}, platform=${platform}`);
      await saveStatSelection(game, platform);
      setShowModal(false);
    } catch (error) {
      console.error("Error adding stat:", error);
      alert("Failed to add stat. Please try again.");
    }
  };

  const handleDeleteCard = async (id: number) => {
    try {
      await deleteStatCard(id);
    } catch (error) {
      console.error("Error deleting stat card:", error);
      alert("Failed to delete stat card. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-3xl font-bold mb-6">Player Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {stats.map((stat, index) => (
          <StatCard 
            key={`${stat.game}-${stat.platform}-${index}`} 
            stat={{
              ...stat, 
              onDelete: stat.ID ? handleDeleteCard : undefined,
              onRefresh: stat.ID ? refreshStat : undefined
            }} 
          />
        ))}
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl"
          onClick={() => setShowModal(true)}>
          +
        </Button>
      </div>

      {showModal && (
        <AddStatModal profile={profile} onClose={() => setShowModal(false)} onAddStat={handleAddStat} />
      )}
    </div>
  );
};

export default Statistics;
