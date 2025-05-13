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
    <div className="p-4 max-w-4xl mx-auto mt-20">
      <Card className="bg-surface-dark border border-primary-800 shadow-lg">
        <CardContent>
          <h1 className="text-2xl font-bold mb-6 text-white border-b border-primary-800 pb-4">Your Gaming Profile</h1>
          
          {profile ? (
            <div className="space-y-8">
              <div className="bg-primary-950/50 p-4 border-l-4 border-accent-600">
                <h2 className="text-xl font-semibold mb-3 text-white">Account Information</h2>
                <p className="text-primary-200"><span className="font-medium text-white">Username:</span> {profile.username}</p>
                <p className="text-primary-200"><span className="font-medium text-white">Email:</span> {profile.email}</p>
              </div>
              
              {/* Steam Account Section */}
              <div className="pt-4 border-t border-primary-800">
                <h3 className="text-xl font-semibold mb-3 text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-accent-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                  </svg>
                  Steam Account
                </h3>
                {profile.steam_id ? (
                  <div className="bg-primary-900/30 p-3 border border-primary-700">
                    <p className="text-primary-200"><span className="font-medium text-white">Steam ID:</span> {profile.steam_id}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-primary-400 text-sm mb-3">No Steam account linked. Link your Steam account to track CS2 and Dota 2 stats.</p>
                    <Button onClick={handleSteamLogin} className="bg-accent-600 hover:bg-accent-700 border-none">
                      Link Steam Account
                    </Button>
                  </>
                )}
              </div>
              
              {/* EA Account Section */}
              <div className="pt-4 border-t border-primary-800">
                <h3 className="text-xl font-semibold mb-3 text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-accent-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 5H5v14h14V5zM5 3h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2z"/>
                    <path d="M12 8c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>
                  </svg>
                  EA Account
                </h3>
                {profile.ea_username ? (
                  <div className="bg-primary-900/30 p-3 border border-primary-700">
                    <p className="text-primary-200"><span className="font-medium text-white">EA Username:</span> {profile.ea_username}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-primary-400 text-sm mb-3">No EA account linked. Link your EA account to track Apex Legends and EA Sports stats.</p>
                    <form onSubmit={handleEALinkSubmit} className="space-y-3">
                      {error && <p className="text-accent-400 text-sm bg-accent-900/20 p-2 border-l-2 border-accent-500">{error}</p>}
                      <div>
                        <label htmlFor="ea-username" className="block text-sm font-medium mb-1.5 text-primary-300">
                          EA Username
                        </label>
                        <input
                          id="ea-username"
                          type="text"
                          value={eaUsername}
                          onChange={(e) => setEAUsername(e.target.value)}
                          className="w-full px-3 py-2 bg-primary-950 border border-primary-800 text-white focus:outline-none focus:border-accent-500 transition-colors"
                          placeholder="Enter your EA username"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-accent-600 hover:bg-accent-700 border-none"
                        disabled={isLinking}
                      >
                        {isLinking ? "Linking..." : "Link EA Account"}
                      </Button>
                    </form>
                  </>
                )}
              </div>
              
              {/* Xbox Account Section */}
              <div className="pt-4 border-t border-primary-800">
                <h3 className="text-xl font-semibold mb-3 text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-accent-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                  Xbox Account
                </h3>
                {profile.xbox_id ? (
                  <div className="bg-primary-900/30 p-3 border border-primary-700">
                    <p className="text-primary-200"><span className="font-medium text-white">Xbox Gamertag:</span> {profile.xbox_id}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-primary-400 text-sm mb-3">No Xbox account linked. Link your Xbox account to track Xbox game stats.</p>
                    <form onSubmit={handleXboxLinkSubmit} className="space-y-3">
                      {error && <p className="text-accent-400 text-sm bg-accent-900/20 p-2 border-l-2 border-accent-500">{error}</p>}
                      <div>
                        <label htmlFor="xbox-id" className="block text-sm font-medium mb-1.5 text-primary-300">
                          Xbox Gamertag
                        </label>
                        <input
                          id="xbox-id"
                          type="text"
                          value={xboxID}
                          onChange={(e) => setXboxID(e.target.value)}
                          className="w-full px-3 py-2 bg-primary-950 border border-primary-800 text-white focus:outline-none focus:border-accent-500 transition-colors"
                          placeholder="Enter your Xbox Gamertag"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-accent-600 hover:bg-accent-700 border-none"
                        disabled={isLinking}
                      >
                        {isLinking ? "Linking..." : "Link Xbox Account"}
                      </Button>
                    </form>
                  </>
                )}
              </div>
              
              {/* PlayStation Account Section */}
              <div className="pt-4 border-t border-primary-800">
                <h3 className="text-xl font-semibold mb-3 text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-accent-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 5H9c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 12H9V7h6v10z"/>
                    <path d="M12 14c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"/>
                  </svg>
                  PlayStation Account
                </h3>
                {profile.playstation_id ? (
                  <div className="bg-primary-900/30 p-3 border border-primary-700">
                    <p className="text-primary-200"><span className="font-medium text-white">PlayStation ID:</span> {profile.playstation_id}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-primary-400 text-sm mb-3">No PlayStation account linked. Link your PlayStation account to track PlayStation game stats.</p>
                    <form onSubmit={handlePlayStationLinkSubmit} className="space-y-3">
                      {error && <p className="text-accent-400 text-sm bg-accent-900/20 p-2 border-l-2 border-accent-500">{error}</p>}
                      <div>
                        <label htmlFor="playstation-id" className="block text-sm font-medium mb-1.5 text-primary-300">
                          PlayStation ID
                        </label>
                        <input
                          id="playstation-id"
                          type="text"
                          value={playstationID}
                          onChange={(e) => setPlaystationID(e.target.value)}
                          className="w-full px-3 py-2 bg-primary-950 border border-primary-800 text-white focus:outline-none focus:border-accent-500 transition-colors"
                          placeholder="Enter your PlayStation ID"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-accent-600 hover:bg-accent-700 border-none"
                        disabled={isLinking}
                      >
                        {isLinking ? "Linking..." : "Link PlayStation Account"}
                      </Button>
                    </form>
                  </>
                )}
              </div>
              
              {/* Riot Account Section */}
              <div className="pt-4 border-t border-primary-800">
                <h3 className="text-xl font-semibold mb-3 text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-accent-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L1 21h22L12 2zm0 5l7.53 13H4.47L12 7z"/>
                    <rect x="11" y="14" width="2" height="4"/>
                    <rect x="11" y="10" width="2" height="2"/>
                  </svg>
                  Riot Account
                </h3>
                {profile.riot_game_name && profile.riot_tagline ? (
                  <div className="bg-primary-900/30 p-3 border border-primary-700">
                    <p className="text-primary-200"><span className="font-medium text-white">Riot Account:</span> {profile.riot_game_name}#{profile.riot_tagline}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-primary-400 text-sm mb-3">No Riot account linked. Link your Riot account to track League of Legends and Valorant stats.</p>
                    <form onSubmit={handleRiotLinkSubmit} className="space-y-3">
                      {error && <p className="text-accent-400 text-sm bg-accent-900/20 p-2 border-l-2 border-accent-500">{error}</p>}
                      <div>
                        <label htmlFor="riot-game-name" className="block text-sm font-medium mb-1.5 text-primary-300">
                          Riot Game Name
                        </label>
                        <input
                          id="riot-game-name"
                          type="text"
                          value={riotGameName}
                          onChange={(e) => setRiotGameName(e.target.value)}
                          className="w-full px-3 py-2 bg-primary-950 border border-primary-800 text-white focus:outline-none focus:border-accent-500 transition-colors"
                          placeholder="e.g. SummonerName"
                        />
                      </div>
                      <div>
                        <label htmlFor="riot-tagline" className="block text-sm font-medium mb-1.5 text-primary-300">
                          Riot Tagline
                        </label>
                        <input
                          id="riot-tagline"
                          type="text"
                          value={riotTagline}
                          onChange={(e) => setRiotTagline(e.target.value)}
                          className="w-full px-3 py-2 bg-primary-950 border border-primary-800 text-white focus:outline-none focus:border-accent-500 transition-colors"
                          placeholder="e.g. NA1, 1234, etc."
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-accent-600 hover:bg-accent-700 border-none"
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
