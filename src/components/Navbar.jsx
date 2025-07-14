import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { supabase } from "../lib/supabaseClient";
import birdie from "../assets/birdie.png";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function Navbar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Fetch current display name from Supabase user_metadata
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!user) return;
      // Get latest user info from Supabase
      const { data } = await supabase.auth.getUser();
      if (data?.user?.user_metadata?.full_name) {
        setDisplayName(data.user.user_metadata.full_name);
      } else {
        setDisplayName("");
      }
    };
    fetchDisplayName();
  }, [user, showProfileModal]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Save display name to Supabase Auth user_metadata
  const handleSaveDisplayName = async () => {
    setSaving(true);
    setSaveMsg("");
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName },
    });
    setSaving(false);
    if (error) {
      setSaveMsg("Error saving display name.");
    } else {
      setSaveMsg("Display name updated!");
      setTimeout(() => setShowProfileModal(false), 1000);
    }
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
            <button
              className="hover:text-green-400 transition"
              onClick={() => setShowProfileModal(true)}
            >
              Profile
            </button>
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
      <div
        className={`md:hidden fixed top-[60px] right-0 z-40 transition-transform duration-300 ease-in-out ${
          menuOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-8 opacity-0 pointer-events-none"
        }`}
        style={{ width: "min(60vw, 160px)" }}
      >
        <div className="w-full px-2">
          <div className="backdrop-blur-xl bg-white/95 border border-green-400/30 rounded-l-2xl rounded-r-lg shadow-2xl flex flex-col gap-1 py-3 px-3 animate-fade-in-down text-base">
            {/* Only show Dashboard link if not already on Dashboard ("/") */}
            {user && window.location.pathname !== "/" && (
              <Link
                to="/"
                className="hover:text-green-600 text-gray-900 transition text-sm py-2 px-2 rounded-lg hover:bg-green-100/60 font-semibold"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
            {user && (
              <button
                className="hover:text-green-600 text-gray-900 transition text-sm py-2 px-2 rounded-lg hover:bg-green-100/60 font-semibold flex items-center gap-2 w-full text-left"
                onClick={() => {
                  setMenuOpen(false);
                  setShowProfileModal(true);
                }}
              >
                <span className="text-xl">👤</span> Profile
              </button>
            )}
            {user ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="bg-red-600 px-2 py-2 rounded-lg hover:bg-red-700 mt-2 transition-all font-semibold text-white text-sm"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 px-2 py-2 rounded-lg hover:bg-blue-700 mt-2 transition-all font-semibold text-white text-sm"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
      {/* Profile Modal */}
      {showProfileModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs mx-4 flex flex-col gap-4 relative">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                onClick={() => setShowProfileModal(false)}
              >
                &times;
              </button>
              <h3 className="text-lg font-bold text-green-700 mb-2">
                Edit Display Name
              </h3>
              <input
                type="text"
                className="rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={32}
              />
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow font-semibold disabled:opacity-60"
                onClick={handleSaveDisplayName}
                disabled={saving || !displayName.trim()}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              {saveMsg && (
                <div className="text-center text-sm text-green-600">
                  {saveMsg}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </nav>
  );
}
