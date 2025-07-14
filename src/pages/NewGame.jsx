import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/useAuth";
import birdie from "../assets/birdie.png";

export default function NewGame() {
  const [mode, setMode] = useState("end");
  const [gameName, setGameName] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Parse invite emails (comma or newline separated)
    const emails = inviteEmails
      .split(/[\n,]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    const { data, error } = await supabase
      .from("sessions")
      .insert({ creator_id: user.id, mode, name: gameName, invites: emails })
      .select()
      .single();
    if (error) setError(error.message);
    else navigate(`/game/${data.id}`);
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background:
          "linear-gradient(to bottom, #eaf3fb 0%, #eaf3fb 60%, #d1f7e7 100%)",
      }}
    >
      {/* Logo/Header outside the box */}
      <div className="flex flex-col items-center mb-10 mt-8">
        <div className="flex items-end gap-2">
          {/* PNG golf ball icon, left of text and aligned to bottom */}
          <img
            src={birdie}
            alt="Golf ball"
            className="w-8 h-8 object-contain drop-shadow"
            style={{ marginBottom: "3px" }}
          />
          <span className="text-5xl font-extrabold tracking-tight text-gray-900 select-none font-sans drop-shadow-sm">
            Side<span className="text-green-600">Putt</span>
          </span>
        </div>
      </div>
      <div
        className="relative border-4 border-green-600 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(34,197,94,0.15)] p-6 sm:p-10 md:p-12 w-full max-w-xs sm:max-w-md md:max-w-lg mx-auto overflow-hidden"
        style={{
          background: "linear-gradient(to bottom, #e0f2fe 0%, #b9e6fe 100%)",
          minHeight: "420px",
        }}
      >
        {/* Decorative golf grass at the bottom using SVG */}
        <div className="absolute left-0 right-0 bottom-0 h-10 flex items-end pointer-events-none select-none">
          <svg
            viewBox="0 0 400 40"
            width="100%"
            height="40"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <rect x="0" y="20" width="400" height="20" fill="#22c55e" />
            <path
              d="M0,30 Q20,10 40,30 T80,30 T120,30 T160,30 T200,30 T240,30 T280,30 T320,30 T360,30 T400,30 V40 H0Z"
              fill="#16a34a"
            />
            <path
              d="M10,35 Q20,25 30,35 Q40,25 50,35 Q60,25 70,35 Q80,25 90,35 Q100,25 110,35 Q120,25 130,35 Q140,25 150,35 Q160,25 170,35 Q180,25 190,35 Q200,25 210,35 Q220,25 230,35 Q240,25 250,35 Q260,25 270,35 Q280,25 290,35 Q300,25 310,35 Q320,25 330,35 Q340,25 350,35 Q360,25 370,35 Q380,25 390,35"
              stroke="#166534"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">
          Create New Game
        </h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Game Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border-2 border-gray-200 bg-gray-50 rounded-lg shadow-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              required
              placeholder="e.g. Saturday Skins"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invite Players (emails, comma or newline separated)
            </label>
            <textarea
              className="w-full px-3 py-2 border-2 border-gray-200 bg-gray-50 rounded-lg shadow-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              rows={3}
              placeholder="player1@email.com, player2@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Dealing Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 bg-gray-50 rounded-lg shadow-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
            >
              <option value="end">Deal at End</option>
              <option value="perHolePublic">Deal After Hole (Public)</option>
              <option value="perHolePrivate">Deal After Hole (Private)</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition text-lg shadow"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Game"}
          </button>
          {error && <div className="text-red-600 text-sm">{error}</div>}
        </form>
      </div>
      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-500">
        Designed by{" "}
        <a
          href="https://mjswebdesign.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-700 hover:underline font-semibold"
        >
          MJS Web Design
        </a>
      </footer>
    </div>
  );
}
