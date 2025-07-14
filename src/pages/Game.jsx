import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

// Placeholder poker card
const CardPlaceholder = () => (
  <div className="w-10 h-14 bg-gray-200 rounded-lg border border-gray-400 flex items-center justify-center text-lg font-bold text-gray-500">
    🂠
  </div>
);

// Poker chip icon
const ChipIcon = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" fill="#fbbf24" stroke="#b45309" />
    <circle cx="12" cy="12" r="5" fill="#fff" stroke="#b45309" />
  </svg>
);

export default function Game() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [putts, setPutts] = useState({}); // { playerId: [puttsPerHole] }
  const [currentHole, setCurrentHole] = useState(1);
  // Invite code modal
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [chipHolder, setChipHolder] = useState(null); // playerId
  const [showChipModal, setShowChipModal] = useState(false);
  const [chipCandidates, setChipCandidates] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [userId, setUserId] = useState(null);

  // --- State for modals ---
  const [showEndModal, setShowEndModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0);
  // Join by code modal (for non-members)
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinError, setJoinError] = useState("");

  // --- End Game handler (future: set inactive, move to history) ---
  const handleEndGame = async () => {
    setShowEndModal(false);
    // TODO: Implement end game logic (e.g., set session.active = false)
    alert("Game ended! (This will move to history in a future update.)");
  };

  // --- Delete Game handler (purge session and related data) ---
  const handleDeleteGame = async () => {
    setShowDeleteModal(false);
    // Delete session and related data (session_players, putts, etc.)
    if (!session) return;
    // Delete child tables first (Supabase: session_players, putts, chip_events, pot_events, cards, holes)
    const tables = [
      "session_players",
      "putts",
      "chip_events",
      "pot_events",
      "cards",
      "holes",
    ];
    for (const table of tables) {
      await supabase.from(table).delete().eq("session_id", session.id);
    }
    await supabase.from("sessions").delete().eq("id", session.id);
    alert("Game deleted.");
    window.location.href = "/";
  };

  // Fetch session, players, and user info
  useEffect(() => {
    const fetchData = async () => {
      const user = await supabase.auth.getUser();
      const currentUserId = user.data?.user?.id;
      setUserId(currentUserId);
      // Session
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", id)
        .single();
      if (sessionError) {
        console.error("Supabase session fetch error:", sessionError);
      }
      setSession(sessionData);
      // Players
      let { data: playerData, error: playerError } = await supabase
        .from("session_players")
        .select("id,user_id,name")
        .eq("session_id", id);
      if (playerError) {
        console.error("Supabase session_players fetch error:", playerError);
      }
      // Only insert user if not present and not immediately after game creation
      if (
        currentUserId &&
        sessionData &&
        playerData &&
        !playerData.some((p) => p.user_id === currentUserId)
      ) {
        // Show join modal for non-members
        setShowJoinModal(true);
      }
      setPlayers(playerData || []);
      // Host check
      if (sessionData && currentUserId === sessionData.creator_id)
        setIsHost(true);
    };
    fetchData();
  }, [id]);
  // Handle join by code
  const handleJoinByCode = async () => {
    setJoinError("");
    const user = await supabase.auth.getUser();
    const currentUserId = user.data?.user?.id;
    const name =
      user.data?.user?.user_metadata?.full_name ||
      user.data?.user?.email ||
      "Player";
    // Find session by code
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("id,join_code")
      .eq("join_code", joinCodeInput.trim().toUpperCase())
      .single();
    if (sessionError || !sessionData) {
      setJoinError("No game found with that code.");
      return;
    }
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
      return;
    }
    // Success: reload page for new session
    window.location.href = `/game/${sessionData.id}`;
  };

  // Placeholder: fetch putts and chip holder from DB (simulate real-time)
  useEffect(() => {
    // TODO: subscribe to putts and chip events for real-time updates
  }, [id]);

  // Handle putt input (host only)
  const handlePuttChange = (playerId, value) => {
    setPutts((prev) => ({
      ...prev,
      [playerId]: { ...(prev[playerId] || {}), [currentHole]: value },
    }));
  };

  // Handle submit putts (host only)
  const handleSubmitPutts = () => {
    // Find 3-putters
    const threePutters = players.filter(
      (p) => Number(putts[p.user_id]?.[currentHole]) === 3
    );
    if (threePutters.length === 1) {
      setChipHolder(threePutters[0].user_id);
    } else if (threePutters.length > 1) {
      setChipCandidates(threePutters);
      setShowChipModal(true);
    }
    // TODO: Save putts to DB
    setCurrentHole((h) => h + 1);
  };

  // Handle chip assignment if multiple 3-putters
  const assignChip = (playerId) => {
    setChipHolder(playerId);
    setShowChipModal(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-green-50 to-green-100 py-6 px-2">
      {/* End/Delete Game Modals */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs mx-4 flex flex-col gap-4 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowEndModal(false)}
            >
              &times;
            </button>
            <h3 className="text-lg font-bold text-green-700 mb-2">End Game?</h3>
            <p className="text-gray-700">
              This will end the game for all players, but results will be saved
              to history. Are you sure?
            </p>
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow font-semibold"
              onClick={handleEndGame}
            >
              Yes, End Game
            </button>
            <button
              className="text-gray-500 hover:text-gray-700 text-sm mt-1"
              onClick={() => setShowEndModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs mx-4 flex flex-col gap-4 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowDeleteModal(false)}
            >
              &times;
            </button>
            <h3 className="text-lg font-bold text-red-700 mb-2">
              Delete Game?
            </h3>
            <p className="text-gray-700">
              This will permanently delete the game and all its data. This
              action cannot be undone.
            </p>
            {deleteConfirmStep < 2 ? (
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow font-semibold"
                onClick={() => setDeleteConfirmStep((s) => s + 1)}
              >
                {deleteConfirmStep === 0
                  ? "Yes, I'm sure"
                  : "Really, really sure?"}
              </button>
            ) : (
              <button
                className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded shadow font-semibold"
                onClick={handleDeleteGame}
              >
                Delete Forever
              </button>
            )}
            <button
              className="text-gray-500 hover:text-gray-700 text-sm mt-1"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Invite Code Modal */}
      {showInviteCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs mx-4 flex flex-col gap-4 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowInviteCode(false)}
            >
              &times;
            </button>
            <h3 className="text-lg font-bold text-green-700 mb-2">
              Game Invite Code
            </h3>
            <p className="text-gray-700 text-sm">
              Share this code with friends so they can join your game.
            </p>
            {session?.join_code ? (
              <div className="flex flex-col items-center gap-2 mt-2">
                <span className="text-2xl font-mono font-bold text-green-700 tracking-widest select-all bg-green-100 rounded px-4 py-2 border border-green-200">
                  {session.join_code}
                </span>
              </div>
            ) : (
              <span className="text-red-500 text-sm">
                No invite code found for this game.
              </span>
            )}
          </div>
        </div>
      )}
      {/* Chip Assignment Modal */}
      {showChipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs mx-4 flex flex-col gap-4 relative">
            <h3 className="text-lg font-bold text-yellow-700 mb-2">
              Who gets the chip?
            </h3>
            {chipCandidates.map((p) => (
              <button
                key={p.user_id}
                className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded shadow font-semibold"
                onClick={() => assignChip(p.user_id)}
              >
                {p.name}
              </button>
            ))}
            <button
              className="text-gray-500 hover:text-gray-700 text-sm mt-1"
              onClick={() => setShowChipModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="w-full max-w-3xl flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-green-800">
            {session?.name || "Three Putt Poker"}
            {session?.game_type && (
              <span className="ml-2 text-xs font-semibold text-green-600 bg-green-100 rounded px-2 py-0.5 align-middle">
                {session.game_type === "three-putt"
                  ? "Three Putt Poker"
                  : session.game_type
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            )}
          </h2>
          {isHost && (
            <div className="flex flex-col items-end gap-1">
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded shadow font-semibold"
                onClick={() => setShowInviteCode(true)}
              >
                Invite Code
              </button>
              {/* Removed code display under Invite Code button */}
            </div>
          )}
        </div>
        {/* ...existing code... */}
        {/* Show buy-in, three-putt value, chip, deal method, etc. */}
        {session && (
          <div className="flex flex-wrap gap-3 text-sm text-gray-700 mt-2">
            <span className="bg-green-100 rounded px-2 py-0.5 font-semibold">
              Buy-In: ${session.buy_in_amount}
            </span>
            <span className="bg-green-100 rounded px-2 py-0.5 font-semibold">
              Three-Putt Value: ${session.three_putt_value}
            </span>
            {session.three_putt_chip_enabled && (
              <span className="bg-yellow-100 rounded px-2 py-0.5 font-semibold">
                Chip: ${session.three_putt_chip_value}
              </span>
            )}
            <span className="bg-blue-100 rounded px-2 py-0.5 font-semibold">
              Deal: {session.deal_method?.replace(/_/g, " ")}
            </span>
          </div>
        )}
      </div>
      {/* Join by Code Modal (if user not in session_players) */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs mx-4 flex flex-col gap-4 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowJoinModal(false)}
            >
              &times;
            </button>
            <h3 className="text-lg font-bold text-green-700 mb-2">Join Game</h3>
            <input
              type="text"
              placeholder="Enter Game Code"
              className="rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 uppercase tracking-widest font-mono"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              maxLength={8}
            />
            {joinError && (
              <span className="text-red-500 text-sm">{joinError}</span>
            )}
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow font-semibold"
              onClick={handleJoinByCode}
            >
              Join Game
            </button>
          </div>
        </div>
      )}
      {/* Putts Per Hole Table */}
      <div className="w-full max-w-3xl bg-white/80 rounded-2xl shadow-lg border border-green-200 p-4 mb-6">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-lg font-semibold">Hole {currentHole}</span>
          {chipHolder && (
            <span className="flex items-center gap-1 text-yellow-700 font-bold">
              <ChipIcon />{" "}
              {players.find((p) => p.user_id === chipHolder)?.name || ""}
            </span>
          )}
        </div>
        <table className="w-full text-center">
          <thead>
            <tr>
              <th className="py-2">Player</th>
              <th className="py-2">Putts</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr
                key={p.user_id}
                className={userId === p.user_id ? "bg-green-50" : ""}
              >
                <td
                  className={
                    "py-2 font-semibold flex items-center justify-center gap-2 " +
                    (userId === p.user_id ? "text-green-900" : "text-green-800")
                  }
                >
                  {chipHolder === p.user_id && <ChipIcon className="w-4 h-4" />}{" "}
                  {p.name}
                  {userId === p.user_id && (
                    <span className="ml-1 text-xs text-green-500 font-bold">
                      (You)
                    </span>
                  )}
                </td>
                <td className="py-2">
                  {isHost ? (
                    <input
                      type="number"
                      min="1"
                      max="6"
                      className="w-16 rounded px-2 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 text-center"
                      value={putts[p.user_id]?.[currentHole] || ""}
                      onChange={(e) =>
                        handlePuttChange(p.user_id, e.target.value)
                      }
                    />
                  ) : (
                    <span>{putts[p.user_id]?.[currentHole] || "-"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isHost && (
          <button
            className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow font-semibold"
            onClick={handleSubmitPutts}
          >
            Submit Putts
          </button>
        )}
      </div>
      {/* Poker Hands Section */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {players.map((p) => (
          <div
            key={p.user_id}
            className="bg-white/80 rounded-2xl shadow-lg border border-green-200 p-4 flex flex-col items-center"
          >
            <span className="font-bold text-green-800 mb-2">{p.name}</span>
            <div className="flex gap-2 mb-2">
              <CardPlaceholder />
              <CardPlaceholder />
              <CardPlaceholder />
              <CardPlaceholder />
              <CardPlaceholder />
            </div>
            <span className="text-xs text-gray-500">Poker Hand</span>
          </div>
        ))}
      </div>
      {/* Host controls: End/Delete Game at bottom */}
      {isHost && (
        <div className="w-full max-w-3xl flex gap-2 justify-end mt-8">
          <button
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold px-4 py-2 rounded shadow border border-yellow-300"
            onClick={() => setShowEndModal(true)}
          >
            End Game
          </button>
          <button
            className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-4 py-2 rounded shadow border border-red-300"
            onClick={() => {
              setShowDeleteModal(true);
              setDeleteConfirmStep(0);
            }}
          >
            Delete Game
          </button>
        </div>
      )}
    </div>
  );
}

// ---
