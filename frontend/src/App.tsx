import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Register from "./components/register";
import Login from "./components/login";
import Profile from "./components/profile";
import Navbar from "./components/navbar";
import Statistics from "./components/Statistics";

const PrivateRoute = ({ element }: { element: React.JSX.Element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(`${process.env.REACT_APP_API_URL}/user/profile`, {
          withCredentials: true,
        });
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) return <p>Loading...</p>;
  return isAuthenticated ? element : <Navigate to="/login" />;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const checkAuth = async () => {
    try {
      await axios.get(`${process.env.REACT_APP_API_URL}/user/profile`, {
        withCredentials: true,
      });
      setIsLoggedIn(true);
    } catch {
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/logout`, {}, { withCredentials: true });
      setIsLoggedIn(false); // Update state immediately
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Router>
      {/* Pass `isLoggedIn` and `setIsLoggedIn` to Navbar */}
      <Navbar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} /> {/* Pass `setIsLoggedIn` */}
          <Route path="/profile" element={<PrivateRoute element={<Profile />} />} />
          <Route path="/statistics" element={<PrivateRoute element={<Statistics />} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
