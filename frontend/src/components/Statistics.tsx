import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

const Statistics = () => {
  const [stats, setStats] = useState<{ game: string; platform: string; data: any }[]>([]);
  const [profile, setProfile] = useState<{ steam_id?: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedGame, setSelectedGame] = useState("");

  useEffect(() => {
    const savedStats = localStorage.getItem("savedStats");
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }

    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchUpdatedStats = async () => {
      const updatedStats = await Promise.all(
        stats.map(async (stat) => {
          try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stats/cs2`, {
              params: { steam_id: profile?.steam_id },
            });
            return { ...stat, data: response.data };
          } catch (error) {
            console.error("Error fetching updated stats:", error);
            return stat;
          }
        })
      );
      setStats(updatedStats);
    };

    if (stats.length > 0 && profile?.steam_id) {
      fetchUpdatedStats();
    }
  }, [profile]);

  const handleAddStat = async () => {
    if (!selectedPlatform || !selectedGame) {
      alert("Please select a platform and game.");
      return;
    }

    console.log("➡️ Sending request to API with Steam ID:", profile?.steam_id);

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stats/cs2`, {
        params: { steam_id: profile?.steam_id },
      });

      console.log("✅ API Response:", response.data);

      const newStat = {
        game: selectedGame,
        platform: selectedPlatform,
        data: response.data,
      };

      const updatedStats = [...stats, newStat];
      setStats(updatedStats);
      localStorage.setItem("savedStats", JSON.stringify(updatedStats));
      setShowModal(false);
      setSelectedPlatform("");
      setSelectedGame("");
    } catch (error: any) {
      console.error("❌ Error fetching stats:");
      console.error("Status:", error.response?.status);
      console.error("Message:", error.response?.data);
      console.error("Full Error:", error);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-3xl font-bold mb-6">Player Statistics</h2>

      {stats.length === 0 ? (
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl"
          onClick={() => setShowModal(true)}
        >
          +
        </Button>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gray-800 text-white p-6 rounded-lg shadow-lg transform transition duration-200 hover:scale-105">
              <CardContent>
                <h3 className="text-2xl font-bold mb-2">{stat.game}</h3>
                <p className="text-gray-400 text-sm">Platform: {stat.platform}</p>

                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-red-500 text-3xl">💀</span>
                    <p className="text-lg font-semibold">{stat.data.total_kills}</p>
                    <span className="text-gray-400 text-sm">Kills</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-yellow-500 text-3xl">🏆</span>
                    <p className="text-lg font-semibold">{stat.data.total_matches_won}</p>
                    <span className="text-gray-400 text-sm">Wins</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-blue-400 text-3xl">🎖️</span>
                    <p className="text-lg font-semibold">{stat.data.total_mvps}</p>
                    <span className="text-gray-400 text-sm">MVPs</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-gray-800 text-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Add CS2 Stats</h3>

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
              <option value="CS2">Counter-Strike 2</option>
            </select>

            <div className="flex justify-end">
              <Button onClick={() => setShowModal(false)} className="mr-2 bg-gray-600 hover:bg-gray-700">
                Cancel
              </Button>
              <Button onClick={handleAddStat} className="bg-blue-600 hover:bg-blue-700">
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;
