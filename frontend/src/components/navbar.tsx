import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const Navbar = ({ isLoggedIn, handleLogout }: { isLoggedIn: boolean | null, handleLogout: () => void }) => {
  return (
    <nav className="bg-gray-800 p-4 flex justify-between items-center">
      <div className="text-white text-xl font-bold">Elo Insight</div>
      <div>
        {isLoggedIn === null ? (
          <span className="text-gray-400">Loading...</span>
        ) : isLoggedIn ? (
          <>
            <Link to="/profile" className="text-gray-300 hover:text-white mx-2">Profile</Link>
            <Link to="/statistics" className="text-gray-300 hover:text-white mx-2">Statistics</Link>
            <Link to="/friends" className="text-gray-300 hover:text-white mx-2">Friends</Link>
            <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 ml-4">
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link to="/register" className="text-gray-300 hover:text-white mx-2">Register</Link>
            <Link to="/login">
              <Button className="ml-2">Login</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
