// Collapsible My Stats Card component
function CollapsibleStatsCard() {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="w-full flex items-center justify-center my-6">
      <div className="flex-1 rounded-2xl border border-green-200 bg-white/80 shadow-lg flex flex-col items-center px-3 transition-all duration-300">
        <button
          className="w-full flex items-center justify-between py-4 focus:outline-none group"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="flex items-center gap-2 w-full justify-center">
            <span className="text-green-500 text-2xl">🏌️‍♂️</span>
            <span className="text-xl font-bold text-center w-full">
              My Stats
            </span>
          </span>
          <svg
            className={`w-6 h-6 text-green-600 transform transition-transform duration-300 ${
              open ? "" : "rotate-180"
            }`}
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
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ${
            open ? "max-h-40 py-2" : "max-h-0 py-0"
          }`}
          style={{
            transitionProperty: "max-height, padding",
          }}
        >
          {open && (
            <div className="flex flex-col gap-1 text-gray-700 text-sm items-center">
              <span>
                Games Played: <span className="font-semibold">0</span>
              </span>
              <span>
                Best Score: <span className="font-semibold">—</span>
              </span>
              <span>
                Rounds Won: <span className="font-semibold">—</span>
              </span>
              <span>
                Three Putts: <span className="font-semibold">—</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

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

function GolfTip() {
  const tips = [
    "If you can't fix your slice, just aim further left.",
    "Remember: The more expensive the ball, the more likely it is to find water.",
    "Golf is 90% mental. The other 10% is mental, too.",
    "A bad day on the course beats a good day at work.",
    "If all else fails, blame your clubs.",
    "Practice makes permanent, not perfect.",
    "The shorter the putt, the more your hands shake.",
    "Always keep your head down—unless you're looking for your ball.",
    "Golf: The art of playing fetch with yourself.",
    "Drive for show, putt for dough, whiff for laughs.",
    "If you find a ball on the course, it's probably yours from last week.",
    "Golf carts: Because walking is for quitters.",
    "The best wood in your bag is your pencil.",
    "Swing like you’re mad at your ex.",
    "If it’s not going straight, just call it a ‘power fade.’",
    "Remember: golf balls are cheaper than therapy.",
    "Dress like a pro. Play like a drunk uncle.",
    "The cart path is just an aggressive fairway.",
    "Use the toe of the putter if you’re feeling fancy—or desperate.",
    "You’re not slicing—you’re exploring adjacent fairways.",
    "Tee it high, let it fly... then say a prayer.",
    "A 3-putt means more time to bond with your shame.",
    "Golf: where grown men cry quietly in the bushes.",
    "You’re only one good shot away from pretending you know what you're doing.",
    "Trust your swing. And your luck.",
    "Every great golfer was once a hacker. You’re halfway there.",
    "You can’t lose if you don’t keep score.",
    "Sand saves are mostly luck. Just own it.",
    "If it goes in the water, it wanted to be free.",
    "The golf gods demand a sacrifice. Usually your scorecard.",
    "Read the green like it owes you money.",
    "Swing easy. Curse hard.",
    "The only consistent part of your game should be your excuses.",
    "Aim small, miss wildly.",
    "Keep your head down, unless someone yells ‘beer cart.’",
    "Three-putts build character. And rage.",
    "A bogey is just a par with more drama.",
    "Confidence is key. Skill is optional.",
    "A mulligan a day keeps the triple bogey away.",
    "Putt like you’re mad at the ball.",
    "Wind is nature’s way of keeping your ego in check.",
    "If you can't dazzle them with your swing, distract them with your outfit.",
    "Practice makes pars. Sometimes.",
    "The shorter the putt, the greater the pressure. And the greater the chance of humiliation.",
    "Your driver is for distance. Your putter is for pride.",
    "Grip it and sip it. Golf is better with a beverage.",
    "The more you swing, the more you learn. Allegedly.",
    "Aim for the green. Settle for the fairway. Accept the sand.",
  ];
  const [tip] = React.useState(
    () => tips[Math.floor(Math.random() * tips.length)]
  );
  return <span className="italic text-green-900 text-center">{tip}</span>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  // Active games state loaded from Supabase
  const [activeGames, setActiveGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [gameName, setGameName] = useState("");
  // Load active games from Supabase on mount
  React.useEffect(() => {
    const fetchGames = async () => {
      setLoadingGames(true);
      // Get current user
      const user = await supabase.auth.getUser();
      const currentUserId = user.data?.user?.id;
      if (!currentUserId) {
        setActiveGames([]);
        setLoadingGames(false);
        return;
      }
      // Only fetch sessions where user is a member (in session_players)
      const { data, error } = await supabase
        .from("sessions")
        .select("id, name, status, game_type, session_players!inner(user_id)")
        .eq("status", "active")
        .eq("session_players.user_id", currentUserId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching games:", error);
      }
      if (!error) setActiveGames(data || []);
      setLoadingGames(false);
    };
    fetchGames();
  }, []);
  const [showGameModal, setShowGameModal] = useState(false);
  const [gameModalTab, setGameModalTab] = useState("create"); // "create" or "join"
  const newGameRef = useRef(null);
  // Game setup state
  const [gameType, setGameType] = useState("");
  const [startingAmount, setStartingAmount] = useState(5);
  const [threePuttValue, setThreePuttValue] = useState(1);
  const [chip, setChip] = useState(true);
  const [dealMethod, setDealMethod] = useState("private");
  const [chipValue, setChipValue] = useState(5);
  const [gameCreateError, setGameCreateError] = useState("");
  // Get current user for creator_id
  const [userId, setUserId] = useState(null);
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id);
    });
  }, []);
  // --- Join Game by Code (for modal tab) ---
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const handleJoinGame = async (e) => {
    e.preventDefault();
    setJoinError("");
    setJoinLoading(true);
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      setJoinError("Enter a valid invite code.");
      setJoinLoading(false);
      return;
    }
    // Find session by code
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("id,join_code")
      .eq("join_code", code)
      .single();
    if (sessionError || !sessionData) {
      setJoinError("No game found with that code.");
      setJoinLoading(false);
      return;
    }
    // Get user
    const user = await supabase.auth.getUser();
    const currentUserId = user.data?.user?.id;
    const name =
      user.data?.user?.user_metadata?.full_name ||
      user.data?.user?.email ||
      "Player";
    // Insert into session_players
    const { error: insertError } = await supabase
      .from("session_players")
      .insert([
        {
          session_id: sessionData.id,
          user_id: currentUserId,
          name,
        },
      ]);
    if (insertError && !insertError.message.includes("duplicate")) {
      setJoinError("Could not join game. Try again.");
      setJoinLoading(false);
      return;
    }
    // Success: redirect
    navigate(`/game/${sessionData.id}`);
  };
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center"
      style={{
        background:
          "linear-gradient(to bottom, #eaf3fb 0%, #eaf3fb 60%, #d1f7e7 100%)",
        minHeight: "100vh",
        paddingTop: 0,
      }}
    >
      <div className="w-full max-w-4xl flex flex-col mt-12 px-3 sm:px-6 md:px-0 relative">
        {/* Game History & Rules side by side on all screens */}
        {/* Start/Join Game Button */}
        <div className="w-full mb-6">
          <button
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-lg shadow-2xl py-6 px-3 text-green-700 font-bold text-xl hover:bg-green-50 transition-all focus:outline-none"
            onClick={() => {
              setShowGameModal(true);
              setGameModalTab("create");
            }}
            aria-label="Start or join game"
          >
            {/* Golf Icon */}
            <span className="text-3xl mr-2">⛳</span>
            Start / Join Game
          </button>
        </div>
        {/* Start/Join Game Modal */}
        {showGameModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
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
                onClick={() => setShowGameModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <div className="flex gap-2 mb-4">
                <button
                  className={`flex-1 py-2 rounded-lg font-bold text-lg transition ${
                    gameModalTab === "create"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-green-700"
                  }`}
                  onClick={() => setGameModalTab("create")}
                >
                  Start New Game
                </button>
                <button
                  className={`flex-1 py-2 rounded-lg font-bold text-lg transition ${
                    gameModalTab === "join"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-green-700"
                  }`}
                  onClick={() => setGameModalTab("join")}
                >
                  Join Game
                </button>
              </div>
              {gameModalTab === "create" ? (
                <>
                  <h3 className="text-xl font-bold text-green-700 mb-2">
                    Set Up New Game
                  </h3>
                  <input
                    type="text"
                    placeholder="Game Name"
                    className="rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
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
                    onClick={async () => {
                      setGameCreateError("");
                      let finalGameName = gameName.trim();
                      if (!finalGameName) {
                        const now = new Date();
                        finalGameName = now.toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      }
                      setShowGameModal(false);
                      // Generate a random 6-character invite code
                      const joinCode = Math.random()
                        .toString(36)
                        .substring(2, 8)
                        .toUpperCase();
                      const { data, error } = await supabase
                        .from("sessions")
                        .insert([
                          {
                            name: finalGameName,
                            status: "active",
                            game_type: gameType,
                            buy_in_amount: startingAmount,
                            three_putt_value: threePuttValue,
                            three_putt_chip_enabled: chip,
                            three_putt_chip_value: chip ? chipValue : null,
                            deal_method: dealMethod,
                            creator_id: userId,
                            join_code: joinCode,
                          },
                        ])
                        .select()
                        .single();
                      if (error) {
                        setGameCreateError(
                          "Failed to create game: " + error.message
                        );
                        console.error("Supabase insert error:", error);
                        return;
                      }
                      if (data) {
                        const user = await supabase.auth.getUser();
                        const displayName =
                          user.data?.user?.user_metadata?.full_name ||
                          user.data?.user?.email ||
                          "Host";
                        await supabase.from("session_players").insert([
                          {
                            session_id: data.id,
                            user_id: userId,
                            name: displayName,
                          },
                        ]);
                        setActiveGames((prev) => [data, ...prev]);
                        setGameName("");
                        setGameType("");
                        setStartingAmount(5);
                        setThreePuttValue(1);
                        setChip(true);
                        setChipValue(5);
                        setDealMethod("private");
                        navigate(`/game/${data.id}`);
                      }
                    }}
                  >
                    Start Game
                  </button>
                  <button
                    className="text-gray-500 hover:text-gray-700 text-sm mt-1"
                    onClick={() => setShowGameModal(false)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <form
                  onSubmit={handleJoinGame}
                  className="flex flex-col gap-3 items-center"
                >
                  <h3 className="text-lg font-bold text-green-700 mb-1">
                    Join Game
                  </h3>
                  <input
                    type="text"
                    placeholder="Enter Invite Code"
                    className="rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 uppercase tracking-widest font-mono text-center text-lg"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    maxLength={8}
                    autoComplete="off"
                  />
                  {joinError && (
                    <span className="text-red-500 text-sm">{joinError}</span>
                  )}
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow font-semibold w-full"
                    disabled={joinLoading}
                  >
                    {joinLoading ? "Joining..." : "Join Game"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
        {/* Active Game Bars (all active games, full width) */}
        <div className="w-full mb-6" ref={newGameRef}>
          {gameCreateError && (
            <div className="text-red-500 text-center py-2">
              {gameCreateError}
            </div>
          )}
          {loadingGames ? (
            <div className="text-center text-gray-400 py-4">
              Loading games...
            </div>
          ) : activeGames && activeGames.length > 0 ? (
            activeGames.map((game) => (
              <div
                key={game.id}
                className="flex items-center gap-3 bg-white/80 border border-green-400/60 rounded-xl px-4 py-3 shadow-lg my-2 w-full backdrop-blur-md relative animate-fade-in"
              >
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                </span>
                <span className="font-semibold text-green-700 hidden md:inline">
                  Active Game:
                </span>
                <span className="font-bold text-gray-800 flex-1 truncate">
                  {game.name}
                  {game.game_type && (
                    <span className="ml-2 text-xs font-semibold text-green-600 bg-green-100 rounded px-2 py-0.5 align-middle">
                      {game.game_type === "three-putt"
                        ? "Three Putt Poker"
                        : game.game_type
                            .replace(/-/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  )}
                </span>
                <button
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded shadow transition"
                  onClick={() => navigate(`/game/${game.id}`)}
                >
                  Resume
                </button>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-4">
              No active games yet.
            </div>
          )}
        </div>

        {/* Game History & Rules side by side on all screens */}

        {/* Floating + button for mobile (opens Start/Join Game modal) */}
        {!showGameModal && (
          <button
            className="md:hidden fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-2xl border-4 border-white/70 transition-all"
            onClick={() => {
              setShowGameModal(true);
              setGameModalTab("create");
            }}
            aria-label="Start or join game"
          >
            <PlusIcon />
          </button>
        )}

        {/* Game History & Rules side by side on all screens */}
        <div className="flex flex-row gap-8 w-full mt-0 mb-6">
          <div className="flex-1 min-w-0 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-lg shadow-2xl flex flex-col items-center justify-center py-6 px-3">
            <span className="text-blue-500 text-4xl mb-2">📜</span>
            <h3 className="text-xl font-bold mb-1">Game History</h3>
            {/* Subtext removed */}
          </div>
          <div className="flex-1 min-w-0 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-lg shadow-2xl flex flex-col items-center justify-center py-6 px-3">
            <span className="text-indigo-500 text-4xl mb-2">📖</span>
            <h3 className="text-xl font-bold mb-1">Rules</h3>
            {/* Subtext removed */}
          </div>
        </div>
        {/* My Stats Placeholder Card (now below Game History/Rules, collapsible) */}
        <div className="mb-4">
          <CollapsibleStatsCard />
        </div>
      </div>
      {/* Funny/Cheeky Golf Tip of the Day */}
      <div className="w-full flex items-center justify-center mt-0 mb-4">
        <div className="w-full px-0 sm:px-6 md:px-0 max-w-none md:max-w-4xl">
          <div className="border border-green-100 bg-green-50/80 shadow flex flex-col items-center py-4 px-2 sm:px-4 rounded-none md:rounded-xl">
            <span className="text-green-600 text-2xl mb-1">💡</span>
            <h4 className="font-bold text-green-800 mb-1">
              Golf Tip of the Day
            </h4>
            <GolfTip />
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="mt-8 flex items-center justify-center text-center text-xs text-gray-500 min-h-8">
        <span className="flex items-center gap-1">
          Designed by{" "}
          <a
            href="https://mjswebdesign.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 hover:underline font-semibold"
          >
            MJS Web Design
          </a>
        </span>
      </footer>
    </div>
  );
}
