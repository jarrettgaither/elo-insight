import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Hero section with gradient background */}
        <div className="bg-gradient-to-r from-black to-primary-900 p-10 rounded-sm border border-primary-700 shadow-xl">
          {/* Main title */}
          <h1 className="text-6xl md:text-7xl font-bold mb-4 text-white">
            Elo <span className="text-accent-600">Insight</span>
          </h1>
          
          {/* Caption */}
          <p className="text-xl text-gray-300 mb-8">
            Track, analyze, and compare your gaming stats across multiple platforms
          </p>
          
          {/* Call to action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full bg-accent-600 hover:bg-accent-700 border-0 !rounded-none text-white font-semibold"
              >
                Log In
              </Button>
            </Link>
            <Link to="/register" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full bg-surface-dark hover:bg-gray-800 border border-accent-600 !rounded-none text-white font-semibold"
              >
                Register
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-surface-dark p-6 border border-primary-700 rounded-sm">
            <h3 className="text-xl font-bold text-accent-400 mb-2">Multi-Platform</h3>
            <p className="text-gray-300">Track your stats across CS2, League of Legends, Valorant, Apex Legends and more</p>
          </div>
          <div className="bg-surface-dark p-6 border border-primary-700 rounded-sm">
            <h3 className="text-xl font-bold text-accent-400 mb-2">Compare Stats</h3>
            <p className="text-gray-300">Compare your gaming performance with friends to see who's really the best</p>
          </div>
          <div className="bg-surface-dark p-6 border border-primary-700 rounded-sm">
            <h3 className="text-xl font-bold text-accent-400 mb-2">Visualize Progress</h3>
            <p className="text-gray-300">See your improvement over time with detailed stats and beautiful charts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
