import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [profile, setProfile] = useState<{ 
    username: string; 
    email: string; 
    steam_id?: string;
    ea_username?: string;
    riot_id?: string;
    riot_game_name?: string;
    riot_tagline?: string;
    riot_puuid?: string;
    xbox_id?: string;
    playstation_id?: string;
  } | null>(null);
  const [eaUsername, setEAUsername] = useState("");
  const [xboxID, setXboxID] = useState("");
  const [playstationID, setPlaystationID] = useState("");
  const [riotGameName, setRiotGameName] = useState("");
const [riotTagline, setRiotTagline] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/profile`, {
          withCredentials: true,
        });
        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        navigate("/login"); // Redirect to login if not authenticated
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSteamLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/steam/login`; // Redirect to Steam OAuth
  };

  const handleEALinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!eaUsername.trim()) {
      setError("EA username is required");
      return;
    }
    
    setIsLinking(true);
    
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/ea/link`,
        { ea_username: eaUsername },
        { withCredentials: true }
      );
      
      // Update profile with new EA username
      setProfile(prev => prev ? { ...prev, ea_username: eaUsername } : null);
      setEAUsername("");
      setError(null);
    } catch (error: any) {
      console.error("Error linking EA account:", error);
      setError(error.response?.data?.error || "Failed to link EA account");
    } finally {
      setIsLinking(false);
    }
  };

  const handleXboxLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!xboxID.trim()) {
      setError("Xbox Gamertag is required");
      return;
    }
    
    setIsLinking(true);
    
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/xbox/link`,
        { xbox_id: xboxID },
        { withCredentials: true }
      );
      
      // Update profile with new Xbox ID
      setProfile(prev => prev ? { ...prev, xbox_id: xboxID } : null);
      setXboxID("");
      setError(null);
    } catch (error: any) {
      console.error("Error linking Xbox account:", error);
      setError(error.response?.data?.error || "Failed to link Xbox account");
    } finally {
      setIsLinking(false);
    }
  };

  const handlePlayStationLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!playstationID.trim()) {
      setError("PlayStation ID is required");
      return;
    }
    
    setIsLinking(true);
    
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/playstation/link`,
        { playstation_id: playstationID },
        { withCredentials: true }
      );
      
      // Update profile with new PlayStation ID
      setProfile(prev => prev ? { ...prev, playstation_id: playstationID } : null);
      setPlaystationID("");
      setError(null);
    } catch (error: any) {
      console.error("Error linking PlayStation account:", error);
      setError(error.response?.data?.error || "Failed to link PlayStation account");
    } finally {
      setIsLinking(false);
    }
  };

  const handleRiotLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!riotGameName.trim() || !riotTagline.trim()) {
      setError("Both Riot Game Name and Tagline are required");
      return;
    }
    
    setIsLinking(true);
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/link/riot`,
        { riot_game_name: riotGameName, riot_tagline: riotTagline },
        { withCredentials: true }
      );
      // Optionally fetch updated profile, but for now update locally
      setProfile(prev => prev ? { ...prev, riot_game_name: riotGameName, riot_tagline: riotTagline } : null);
      setRiotGameName("");
      setRiotTagline("");
      setError(null);
    } catch (error: any) {
      console.error("Error linking Riot account:", error);
      setError(error.response?.data?.error || "Failed to link Riot account");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <Card className="w-full max-w-md bg-gray-800 text-white p-6 shadow-lg">
        <CardContent>
          <h2 className="text-2xl font-bold text-center mb-4">Profile</h2>
          {profile ? (
            <div className="space-y-6">
              <div>
                <p><strong>Username:</strong> {profile.username}</p>
                <p><strong>Email:</strong> {profile.email}</p>
              </div>
              
              {/* Steam Account Section */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-xl font-semibold mb-2">Steam Account</h3>
                {profile.steam_id ? (
                  <p><strong>Steam ID:</strong> {profile.steam_id}</p>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm mb-2">No Steam account linked. Link your Steam account to track CS2 stats.</p>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSteamLogin}>
                      Link Steam Account
                    </Button>
                  </>
                )}
              </div>
              
              {/* EA Account Section */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-xl font-semibold mb-2">EA Account</h3>
                {profile.ea_username ? (
                  <p><strong>EA Username:</strong> {profile.ea_username}</p>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm mb-2">No EA account linked. Link your EA account to track Apex Legends stats.</p>
                    <form onSubmit={handleEALinkSubmit} className="space-y-3">
                      {error && <p className="text-red-400 text-sm">{error}</p>}
                      <div>
                        <label htmlFor="ea-username" className="block text-sm font-medium mb-1">
                          EA Username
                        </label>
                        <input
                          id="ea-username"
                          type="text"
                          value={eaUsername}
                          onChange={(e) => setEAUsername(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your EA username"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={isLinking}
                      >
                        {isLinking ? "Linking..." : "Link EA Account"}
                      </Button>
                    </form>
                  </>
                )}
              </div>
              
              {/* Xbox Account Section */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-xl font-semibold mb-2">Xbox Account</h3>
                {profile.xbox_id ? (
                  <p><strong>Xbox Gamertag:</strong> {profile.xbox_id}</p>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm mb-2">No Xbox account linked. Link your Xbox account to track Call of Duty stats.</p>
                    <form onSubmit={handleXboxLinkSubmit} className="space-y-3">
                      {error && <p className="text-red-400 text-sm">{error}</p>}
                      <div>
                        <label htmlFor="xbox-id" className="block text-sm font-medium mb-1">
                          Xbox Gamertag
                        </label>
                        <input
                          id="xbox-id"
                          type="text"
                          value={xboxID}
                          onChange={(e) => setXboxID(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your Xbox Gamertag"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={isLinking}
                      >
                        {isLinking ? "Linking..." : "Link Xbox Account"}
                      </Button>
                    </form>
                  </>
                )}
              </div>
              
              {/* PlayStation Account Section */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-xl font-semibold mb-2">PlayStation Account</h3>
                {profile.playstation_id ? (
                  <p><strong>PlayStation ID:</strong> {profile.playstation_id}</p>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm mb-2">No PlayStation account linked. Link your PlayStation account to track Call of Duty stats.</p>
                    <form onSubmit={handlePlayStationLinkSubmit} className="space-y-3">
                      {error && <p className="text-red-400 text-sm">{error}</p>}
                      <div>
                        <label htmlFor="playstation-id" className="block text-sm font-medium mb-1">
                          PlayStation ID
                        </label>
                        <input
                          id="playstation-id"
                          type="text"
                          value={playstationID}
                          onChange={(e) => setPlaystationID(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your PlayStation ID"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={isLinking}
                      >
                        {isLinking ? "Linking..." : "Link PlayStation Account"}
                      </Button>
                    </form>
                  </>
                )}
              </div>
              
              {/* Riot Account Section */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-xl font-semibold mb-2">Riot Account</h3>
                {profile.riot_game_name && profile.riot_tagline ? (
                  <p><strong>Riot Account:</strong> {profile.riot_game_name}#{profile.riot_tagline}</p>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm mb-2">No Riot account linked. Link your Riot account to track League of Legends and Valorant stats.</p>
                    <form onSubmit={handleRiotLinkSubmit} className="space-y-3">
                      {error && <p className="text-red-400 text-sm">{error}</p>}
                      <div>
                        <label htmlFor="riot-game-name" className="block text-sm font-medium mb-1">
                          Riot Game Name
                        </label>
                        <input
                          id="riot-game-name"
                          type="text"
                          value={riotGameName}
                          onChange={(e) => setRiotGameName(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. SummonerName"
                        />
                      </div>
                      <div>
                        <label htmlFor="riot-tagline" className="block text-sm font-medium mb-1">
                          Riot Tagline
                        </label>
                        <input
                          id="riot-tagline"
                          type="text"
                          value={riotTagline}
                          onChange={(e) => setRiotTagline(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. NA1, 1234, etc."
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={isLinking}
                      >
                        {isLinking ? "Linking..." : "Link Riot Account"}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
