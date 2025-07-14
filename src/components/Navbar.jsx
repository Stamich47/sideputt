import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { supabase } from "../lib/supabaseClient";

export default function Navbar() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="font-bold text-lg">
          3-Putt Poker
        </Link>
        {user && (
          <Link to="/" className="hover:underline">
            Dashboard
          </Link>
        )}
        {user && (
          <Link to="/game/new" className="hover:underline">
            New Game
          </Link>
        )}
      </div>
      <div>
        {user ? (
          <button
            onClick={handleLogout}
            className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
