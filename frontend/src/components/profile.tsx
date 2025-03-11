import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

const Profile = () => {
  const [profile, setProfile] = useState<{ username: string; email: string; steam_id?: string } | null>(null);

  useEffect(() => {
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

  const handleSteamLogin = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("You must be logged in to link Steam!");
      return;
    }

    window.location.href = `${process.env.REACT_APP_API_URL}/auth/steam/login?token=${token}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <Card className="w-full max-w-md bg-gray-800 text-white p-6 shadow-lg">
        <CardContent>
          <h2 className="text-2xl font-bold text-center mb-4">Profile</h2>
          {profile ? (
            <div className="space-y-4">
              <p><strong>Username:</strong> {profile.username}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              {profile.steam_id ? (
                <p><strong>Steam ID:</strong> {profile.steam_id}</p>
              ) : (
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSteamLogin}>
                  Link Steam Account
                </Button>
              )}
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
