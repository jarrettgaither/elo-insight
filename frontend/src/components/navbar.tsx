import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const Navbar = ({ isLoggedIn, handleLogout }: { isLoggedIn: boolean | null, handleLogout: () => void }) => {
  return (
    <nav className="bg-black border-b border-primary-800 p-4 flex justify-between items-center shadow-md z-50 fixed top-0 left-0 right-0">
      <Link to="/" className="text-white text-xl font-bold flex items-center">
        <span className="text-accent-500 mr-1">Elo</span>Insight
      </Link>
      <div className="flex items-center">
        {isLoggedIn === null ? (
          <span className="text-primary-400">Loading...</span>
        ) : isLoggedIn ? (
          <>
            <Link to="/profile" className="text-primary-300 hover:text-white mx-3 transition-colors duration-200">Profile</Link>
            <Link to="/statistics" className="text-primary-300 hover:text-white mx-3 transition-colors duration-200">Statistics</Link>
            <Link to="/friends" className="text-primary-300 hover:text-white mx-3 transition-colors duration-200">Friends</Link>
            <Button onClick={handleLogout} className="bg-accent-600 hover:bg-accent-700 border-none ml-4">
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link to="/register" className="text-primary-300 hover:text-white mx-3 transition-colors duration-200">Register</Link>
            <Link to="/login">
              <Button className="bg-accent-600 hover:bg-accent-700 border-none ml-3">Login</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
