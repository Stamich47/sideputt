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
    <nav className="backdrop-blur-md bg-gradient-to-r from-blue-900/80 via-indigo-800/80 to-indigo-900/80 text-white px-4 py-2 shadow-lg sticky top-0 z-50 border-b border-white/20">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <Link to="/" className="flex items-end gap-2 select-none">
          <img
            src={birdie}
            alt="Golf ball"
            className="w-7 h-7 object-contain drop-shadow"
            style={{ marginBottom: "4px" }}
          />
          <span
            className="text-2xl font-extrabold tracking-tight text-white font-sans drop-shadow-sm"
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
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 py-3 flex flex-col gap-4 animate-fade-in-down">
          {user && (
            <Link
              to="/"
              className="hover:text-green-400 transition"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
          )}
          {user && (
            <Link
              to="/new-game"
              className="hover:text-green-400 transition"
              onClick={() => setMenuOpen(false)}
            >
              New Game
            </Link>
          )}
          {user ? (
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 mt-2"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 mt-2"
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
