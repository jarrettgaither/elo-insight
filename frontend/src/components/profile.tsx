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
  } | null>(null);
  const [eaUsername, setEAUsername] = useState("");
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
