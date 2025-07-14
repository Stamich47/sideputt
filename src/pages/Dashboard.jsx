import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Heroicons Plus SVG
const PlusIcon = ({ className = "w-8 h-8" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.75v14.5m7.25-7.25H4.75"
    />
  </svg>
);

export default function Dashboard() {
  const navigate = useNavigate();
  // Simulated state for multiple active games
  const [activeGames, setActiveGames] = useState([
    { id: 1, name: "Sunday Skins", status: "active" },
    { id: 2, name: "Friday Night Lights", status: "active" },
  ]);
  const [showGameSetup, setShowGameSetup] = useState(false);
  const newGameRef = useRef(null);
  // Game setup state
  const [gameType, setGameType] = useState("");
  const [startingAmount, setStartingAmount] = useState(20);
  const [threePuttValue, setThreePuttValue] = useState(1);
  const [chip, setChip] = useState(true);
  const [dealMethod, setDealMethod] = useState("private");
  const [chipValue, setChipValue] = useState(1);
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center"
      style={{
        background:
          "linear-gradient(to bottom, #eaf3fb 0%, #eaf3fb 60%, #d1f7e7 100%)",
      }}
    >
      <div className="w-full max-w-4xl flex flex-col gap-6 mt-12 px-2 sm:px-4 md:px-0 relative">
        {/* Start New Game full width */}
        <div className="w-full" ref={newGameRef}>
          {/* Shared width for all three: Start New Game, Setup, Active Game */}
          <div className="w-full">
            <div
              className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-lg shadow-2xl flex flex-col items-center justify-center cursor-pointer hover:shadow-2xl transition w-full py-8 px-3 text-center group relative"
              onClick={() => setShowGameSetup((v) => !v)}
            >
              {/* Plus icon in upper right */}
              <span className="absolute top-4 right-4 bg-green-500 group-hover:bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-all">
                <PlusIcon className="w-5 h-5" />
              </span>
              <span className="text-green-600 text-5xl mb-3 flex items-center justify-center">
                ⛳
              </span>
              <h3 className="text-2xl font-extrabold mb-0">Start New Game</h3>
            </div>
            {/* Game Setup Modal */}
            {showGameSetup && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={() => setShowGameSetup(false)}
                tabIndex={-1}
                aria-modal="true"
                role="dialog"
              >
                <div
                  className="bg-white/95 border border-green-400/60 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 flex flex-col gap-4 animate-fade-in-down relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
                    onClick={() => setShowGameSetup(false)}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                  <h3 className="text-xl font-bold text-green-700 mb-2">
                    Set Up New Game
                  </h3>
                  <input
                    type="text"
                    placeholder="Game Name"
                    className="rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <div className="relative mt-1">
                    <select
                      className="appearance-none rounded px-3 py-2 border border-gray-300 bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-green-400 w-full text-base"
                      value={gameType}
                      onChange={(e) => setGameType(e.target.value)}
                    >
                      <option value="" disabled>
                        Select Game Type
                      </option>
                      <option value="three-putt">Three Putt Poker</option>
                    </select>
                    {/* Chevron Down Icon */}
                    <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </span>
                  </div>

                  {/* Extra options for Three Putt Poker */}
                  {gameType === "three-putt" && (
                    <div className="flex flex-col gap-3 mt-2">
                      <label className="flex flex-col text-left text-sm font-medium text-gray-700">
                        Buy-In Amount (per player)
                        <span className="relative mt-1 flex items-center">
                          <span className="absolute left-3 text-gray-400 text-lg pointer-events-none">
                            $
                          </span>
                          <input
                            type="number"
                            min="0"
                            className="pl-7 rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 w-full"
                            value={startingAmount === 0 ? "" : startingAmount}
                            onChange={(e) =>
                              setStartingAmount(
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                            inputMode="decimal"
                            step="any"
                            placeholder="Enter amount"
                          />
                        </span>
                      </label>
                      <label className="flex flex-col text-left text-sm font-medium text-gray-700">
                        Three-Putt Value
                        <span className="relative mt-1 flex items-center">
                          <span className="absolute left-3 text-gray-400 text-lg pointer-events-none">
                            $
                          </span>
                          <input
                            type="number"
                            min="0"
                            className="pl-7 rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 w-full"
                            value={threePuttValue === 0 ? "" : threePuttValue}
                            onChange={(e) =>
                              setThreePuttValue(
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                            inputMode="decimal"
                            step="any"
                            placeholder="Enter value"
                          />
                        </span>
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={chip}
                          onChange={(e) => setChip(e.target.checked)}
                          className="form-checkbox h-4 w-4 text-green-600"
                        />
                        Three-Putt Chip
                      </label>
                      {chip && (
                        <label className="flex flex-col text-left text-sm font-medium text-gray-700">
                          Three-Putt Chip Value
                          <span className="relative mt-1 flex items-center">
                            <span className="absolute left-3 text-gray-400 text-lg pointer-events-none">
                              $
                            </span>
                            <input
                              type="number"
                              min="0"
                              className="pl-7 rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 w-full"
                              value={chipValue === 0 ? "" : chipValue}
                              onChange={(e) =>
                                setChipValue(
                                  e.target.value === ""
                                    ? 0
                                    : Number(e.target.value)
                                )
                              }
                              inputMode="decimal"
                              step="any"
                              placeholder="Enter chip value"
                            />
                          </span>
                        </label>
                      )}
                      <label className="flex flex-col text-left text-sm font-medium text-gray-700">
                        Card Dealing Method
                        <div className="relative mt-1">
                          <select
                            className="appearance-none rounded px-3 py-2 border border-gray-300 bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-green-400 w-full text-base"
                            value={dealMethod}
                            onChange={(e) => setDealMethod(e.target.value)}
                          >
                            <option value="private">Dealt Privately</option>
                            <option value="public">Dealt Publicly</option>
                            <option value="end">Dealt at the End</option>
                          </select>
                          <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </span>
                        </div>
                      </label>
                    </div>
                  )}
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow font-semibold mt-2"
                    onClick={() => {
                      setShowGameSetup(false);
                      // Simulate creating a new game and navigating
                      setActiveGames((prev) => [
                        ...prev,
                        {
                          id: prev.length + 1,
                          name: "New Game",
                          status: "active",
                        },
                      ]);
                      navigate(`/game/${activeGames.length + 1}`);
                    }}
                  >
                    Start Game
                  </button>
                  <button
                    className="text-gray-500 hover:text-gray-700 text-sm mt-1"
                    onClick={() => setShowGameSetup(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {/* Active Game Bars (all active games, full width) */}
            {activeGames &&
              activeGames.length > 0 &&
              activeGames.map((game, idx) => (
                <div
                  key={game.id}
                  className={`flex items-center gap-3 bg-white/80 border border-green-400/60 rounded-xl px-4 py-3 shadow-lg ${
                    idx === 0 ? "mt-4" : "mt-2"
                  } mb-2 w-full backdrop-blur-md relative animate-fade-in`}
                >
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                  </span>
                  <span className="font-semibold text-green-700">
                    Active Game:
                  </span>
                  <span className="font-bold text-gray-800 flex-1 truncate">
                    {game.name}
                  </span>
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded shadow transition"
                    onClick={() => navigate(`/game/${game.id}`)}
                  >
                    Resume
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* (Removed duplicate old single activeGame bar) */}

        {/* Floating + button for mobile (opens Start New Game setup) */}
        {!showGameSetup && (
          <button
            className="md:hidden fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-2xl border-4 border-white/70 transition-all"
            onClick={() => {
              if (newGameRef.current) {
                newGameRef.current.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }
              setShowGameSetup(true);
            }}
            aria-label="Start new game"
          >
            <PlusIcon />
          </button>
        )}

        {/* Game History & Rules side by side on all screens */}
        <div className="flex flex-row gap-6 w-full">
          <div className="flex-1 min-w-0 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-lg shadow-2xl flex flex-col items-center justify-center py-6 px-3">
            <span className="text-blue-500 text-4xl mb-2">📜</span>
            <h3 className="text-xl font-bold mb-1">Game History</h3>
            <p className="text-gray-600 text-center">
              View your past games and results.
            </p>
          </div>
          <div className="flex-1 min-w-0 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-lg shadow-2xl flex flex-col items-center justify-center py-6 px-3">
            <span className="text-indigo-500 text-4xl mb-2">📖</span>
            <h3 className="text-xl font-bold mb-1">Rules</h3>
            <p className="text-gray-600 text-center">
              Review the rules for Three Putt Poker.
            </p>
          </div>
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
