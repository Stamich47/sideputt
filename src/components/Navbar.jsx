import React, { useState, useRef, useEffect } from "react";
import { HiMenu, HiX } from "react-icons/hi";
import { Link } from "react-router-dom";
import birdie from "../assets/birdie.png";
import { supabase } from "../lib/supabaseClient";

export default function Navbar({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  // Always use displayName from Supabase user_metadata
  const displayNameFromUser = user?.user_metadata?.displayName || "";
  const [displayName, setDisplayName] = useState(displayNameFromUser);
  const [saving, setSaving] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    setDisplayName(user?.user_metadata?.displayName || "");
  }, [user]);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setMenuOpen(false);
  }

  async function handleProfileSave() {
    if (!displayName.trim()) return;
    setSaving(true);
    await supabase.auth.updateUser({
      data: { displayName: displayName.trim() },
    });
    setSaving(false);
    setShowProfileModal(false);
    setMenuOpen(false);
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-30 bg-white/95 shadow-md border-b border-green-200 px-4 py-4">
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between px-3 sm:px-6 md:px-0">
        <div className="flex items-center gap-2">
          <img
            src={birdie}
            alt="Golf ball logo"
            className="w-8 h-8 object-contain drop-shadow-sm"
          />
          <Link
            to="/"
            className="text-2xl font-extrabold tracking-tight text-gray-900 select-none font-sans"
          >
            Side<span className="text-green-600">Putt</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {/* Hamburger menu for mobile */}
          <button
            className="md:hidden p-2 rounded hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <HiX className="w-6 h-6 text-green-700 transition-all duration-300" />
            ) : (
              <HiMenu className="w-6 h-6 text-green-700 transition-all duration-300" />
            )}
          </button>
          {/* User avatar/profile (desktop) */}
          {user && (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                {user.user_metadata?.displayName ||
                  user.user_metadata?.full_name ||
                  user.email}
              </span>
              <img
                src={user.avatarUrl || birdie}
                alt="User avatar"
                className="w-8 h-8 rounded-full border border-green-300 shadow-sm"
              />
              <button
                className="ml-2 px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-white font-bold text-xs shadow transition"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          )}
          {/* Mobile menu dropdown */}
          <div
            ref={menuRef}
            className={`absolute top-14 right-4 w-56 bg-white border border-green-200 rounded-xl shadow-lg z-50 flex flex-col p-4 gap-3 transition-all duration-300 ease-in-out ${
              menuOpen
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
            style={{ transformOrigin: "top right" }}
          >
            {user && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <img
                    src={user.avatarUrl || birdie}
                    alt="User avatar"
                    className="w-10 h-10 rounded-full border border-green-300 shadow-sm"
                  />
                  <span className="flex-1 text-left text-sm font-semibold text-green-700">
                    {displayNameFromUser}
                  </span>
                </div>
                {/* Home button, only show if not already on home screen */}
                {window.location.pathname !== "/" && (
                  <Link
                    to="/"
                    className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 rounded py-2 font-bold border border-blue-200 text-center "
                    style={{ textDecoration: "none" }}
                    onClick={() => setMenuOpen(false)}
                  >
                    Home
                  </Link>
                )}
                <button
                  className="w-full bg-green-100 hover:bg-green-200 text-green-800 rounded py-2 font-bold border border-green-200"
                  onClick={() => {
                    setShowProfileModal(true);
                    setMenuOpen(false);
                  }}
                >
                  Edit profile
                </button>
                <button
                  className="w-full bg-red-500 hover:bg-red-600 text-white rounded py-2 font-bold"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>

          {/* Profile Edit Modal */}
          {showProfileModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs mx-4 flex flex-col gap-4 relative animate-fade-in-down">
                <button
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
                  onClick={() => setShowProfileModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <h3 className="text-xl font-bold text-green-700 mb-2 text-center">
                  Edit Profile
                </h3>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-gray-700">
                    Display Name
                  </span>
                  <input
                    className="border rounded px-3 py-2 text-base focus:ring-2 focus:ring-green-400"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={saving}
                    autoFocus
                  />
                </label>
                <div className="flex gap-2 mt-2">
                  <button
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded py-2 font-bold disabled:opacity-60"
                    onClick={handleProfileSave}
                    disabled={saving || !displayName.trim()}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded py-2 font-bold"
                    onClick={() => setShowProfileModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
