import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Register from "./components/register";
import Login from "./components/login";
import Profile from "./components/profile";
import { Button } from "./components/ui/button";
import Statistics from "./components/Statistics";

const PrivateRoute = ({ element }: { element: React.JSX.Element }) => {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/login" />;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token")); // Check if token exists
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token
    setIsLoggedIn(false);
    window.location.href = "/login"; // Redirect to login
  };

  return (
    <Router>
      {/* 🔹 Navigation Bar with Tailwind */}
      <nav className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="text-white text-xl font-bold">Elo Insight</div>
        <div>
          {!isLoggedIn ? (
            <>
              <Link to="/register" className="text-gray-300 hover:text-white mx-2">Register</Link>
              <Link to="/login">
  <Button className="ml-2">Login</Button>
</Link>
            </>
          ) : (
            <>
              <Link to="/profile" className="text-gray-300 hover:text-white mx-2">Profile</Link>
              <Link to="/statistics" className="text-gray-300 hover:text-white mx-2">Statistics</Link>
              <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 ml-4">
                Logout
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* 🔹 Routes */}
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/statistics" element={<Statistics />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
