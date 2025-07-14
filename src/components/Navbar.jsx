import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { supabase } from "../lib/supabaseClient";
import birdie from "../assets/birdie.png";

import React, { useState } from "react";
export default function Navbar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="backdrop-blur-md bg-gradient-to-r from-blue-900/80 via-indigo-800/80 to-indigo-900/80 text-white px-2 sm:px-4 md:px-0 py-2 shadow-lg sticky top-0 z-50 border-b border-white/20">
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
        <Link to="/" className="flex items-center gap-2 select-none">
          <img
            src={birdie}
            alt="Golf ball"
            className="w-7 h-7 object-contain drop-shadow"
            style={{ marginBottom: 0 }}
          />
          <span
            className="text-2xl font-extrabold tracking-tight text-white font-sans drop-shadow-sm flex items-center"
            style={{ lineHeight: 1 }}
          >
            Side<span className="text-green-400">Putt</span>
          </span>
        </Link>
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {user && (
            <Link to="/" className="hover:text-green-400 transition">
              Dashboard
            </Link>
          )}
          {user && (
            <Link to="/new-game" className="hover:text-green-400 transition">
              New Game
            </Link>
          )}
          {user && (
            <Link to="/profile" className="hover:text-green-400 transition">
              Profile
            </Link>
          )}
          {user ? (
            <button
              onClick={handleLogout}
              className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 ml-2"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 ml-2"
            >
              Login
            </Link>
          )}
        </div>
        {/* Hamburger for mobile */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 focus:outline-none"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-6 h-0.5 bg-white mb-1 transition-all ${
              menuOpen ? "rotate-45 translate-y-1.5" : ""
            }`}
          ></span>
          <span
            className={`block w-6 h-0.5 bg-white mb-1 transition-all ${
              menuOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            className={`block w-6 h-0.5 bg-white transition-all ${
              menuOpen ? "-rotate-45 -translate-y-1.5" : ""
            }`}
          ></span>
        </button>
      </div>
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-gradient-to-br from-blue-900/95 via-indigo-900/95 to-indigo-800/95 border-t border-white/10 px-4 py-4 flex flex-col gap-3 rounded-b-2xl shadow-2xl animate-fade-in-down transition-all duration-300">
          {user && (
            <Link
              to="/"
              className="hover:text-green-400 transition text-lg py-2 px-2 rounded-md hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
          )}
          {user && (
            <Link
              to="/new-game"
              className="hover:text-green-400 transition text-lg py-2 px-2 rounded-md hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              New Game
            </Link>
          )}
          {user && (
            <Link
              to="/profile"
              className="hover:text-green-400 transition text-lg py-2 px-2 rounded-md hover:bg-white/10 flex items-center gap-2"
              onClick={() => setMenuOpen(false)}
            >
              <span className="text-2xl">👤</span> Profile
            </Link>
          )}
          {user ? (
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="bg-red-600 px-3 py-2 rounded hover:bg-red-700 mt-2 transition-all"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 px-3 py-2 rounded hover:bg-blue-700 mt-2 transition-all"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
