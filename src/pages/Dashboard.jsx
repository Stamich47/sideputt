import React from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-blue-200 via-indigo-300 to-indigo-700">
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-12 px-2 sm:px-4 md:px-0">
        {/* New Game */}
        <div
          className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-lg shadow-2xl flex flex-col items-center justify-center cursor-pointer hover:shadow-2xl transition w-full max-w-xs mx-auto py-6 px-3"
          onClick={() => navigate("/new-game")}
        >
          <span className="text-green-600 text-4xl mb-2">⛳</span>
          <h3 className="text-xl font-bold mb-1">Start New Game</h3>
          <p className="text-gray-600 text-center">
            Create a new Three Putt Poker game and invite your group.
          </p>
        </div>
        {/* Game History */}
        <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-lg shadow-2xl flex flex-col items-center justify-center w-full max-w-xs mx-auto py-6 px-3">
          <span className="text-blue-500 text-4xl mb-2">📜</span>
          <h3 className="text-xl font-bold mb-1">Game History</h3>
          <p className="text-gray-600 text-center">
            View your past games and results.
          </p>
        </div>
        {/* Rules */}
        <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-lg shadow-2xl flex flex-col items-center justify-center w-full max-w-xs mx-auto py-6 px-3">
          <span className="text-indigo-500 text-4xl mb-2">📖</span>
          <h3 className="text-xl font-bold mb-1">Rules</h3>
          <p className="text-gray-600 text-center">
            Review the rules for Three Putt Poker.
          </p>
        </div>
        {/* Profile */}
        <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-lg shadow-2xl flex flex-col items-center justify-center w-full max-w-xs mx-auto py-6 px-3">
          <span className="text-gray-500 text-4xl mb-2">👤</span>
          <h3 className="text-xl font-bold mb-1">Profile</h3>
          <p className="text-gray-600 text-center">
            Manage your account and settings.
          </p>
        </div>
      </div>
      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-500">
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
