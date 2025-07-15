// Utility functions for holes/putts creation
import React, { useEffect, useState } from "react";
// ...existing imports...
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  createHolesForSession,
  createPuttsForPlayer,
} from "../lib/supabaseGameUtils";

// Show the putts for a player for the selected hole (non-hosts)
function PuttsDisplay({ playerId, currentHole, sessionId }) {
  const [value, setValue] = useState(null);

  useEffect(() => {
    if (!sessionId || !playerId || !currentHole) {
      setValue(null);
      return;
    }
    let isMounted = true;
    async function fetchPutt() {
      const { data: holes, error: holesError } = await supabase
        .from("holes")
        .select("id, number")
        .eq("session_id", sessionId);
      if (holesError) {
        if (isMounted) setValue(null);
        return;
      }
      const hole = holes.find((h) => h.number === currentHole);
      if (!hole) {
        if (isMounted) setValue(null);
        return;
      }
      const { data: puttRows, error: puttError } = await supabase
        .from("putts")
        .select("num_putts, player_id, session_id, hole_id")
        .eq("session_id", sessionId)
        .eq("player_id", playerId)
        .eq("hole_id", hole.id);
      if (puttError) {
        if (isMounted) setValue(null);
        return;
      }
      if (puttRows && puttRows.length > 0) {
        if (isMounted) setValue(puttRows[0].num_putts);
      } else {
        if (isMounted) setValue(null);
      }
    }
    fetchPutt();
    return () => {
      isMounted = false;
    };
  }, [playerId, currentHole, sessionId]);

  return (
    <span>
      {value === null || value === "" || typeof value === "undefined" ? (
        <span className="text-gray-400">-</span>
      ) : value === 0 ? (
        0
      ) : (
        value
      )}
    </span>
  );
}

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
  // Animation state for prev hole putts
  const [animatePrev, setAnimatePrev] = useState({});
  // Inject animation CSS on mount (client only)
  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !document.getElementById("putts-anim-style")
    ) {
      const style = document.createElement("style");
      style.id = "putts-anim-style";
      style.innerHTML = `
        .slide-fade {
          animation: slideFadeLeft 0.6s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes slideFadeLeft {
          0% {
            opacity: 1;
            transform: translateX(60px) scale(1.2);
            color: #374151;
          }
          60% {
            opacity: 1;
            transform: translateX(0) scale(1);
            color: #374151;
          }
          100% {
            opacity: 1;
            color: #9ca3af;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [putts, setPutts] = useState({}); // { playerId: [puttsPerHole] }
  // Persist currentHole in localStorage by session id
  const [currentHole, setCurrentHole] = useState(() => {
    const saved = window.localStorage.getItem(`currentHole_${id}`);
    return saved ? Number(saved) : 1;
  });
  // Invite code modal
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [chipHolder, setChipHolder] = useState(null); // playerId
  const [showChipModal, setShowChipModal] = useState(false);
  const [chipCandidates, setChipCandidates] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [userId, setUserId] = useState(null);
  // Modal for viewing putts history
  const [showPuttsModal, setShowPuttsModal] = useState(false);
  const [puttsModalPlayer, setPuttsModalPlayer] = useState(null);
  const [puttsModalData, setPuttsModalData] = useState([]); // Array of 18 putts
  // Open modal to view putts for a player
  const handleViewPutts = async (player) => {
    setPuttsModalPlayer(player);
    // Always use player.id (session_players.id)
    const playerId = player.id;
    if (!playerId || !session?.id) {
      setPuttsModalData(Array(18).fill(null));
      setShowPuttsModal(true);
      return;
    }
    // Query only this session and player, join holes for number, order by holes.number
    const { data: puttsRows, error } = await supabase
      .from("putts")
      .select("hole_id, num_putts, player_id, session_id, holes(number)")
      .eq("session_id", session.id)
      .eq("player_id", playerId)
      .order("hole_id");
    if (!error && puttsRows) {
      // Sort by holes.number in JS to ensure correct order
      const sortedRows = [...puttsRows].sort((a, b) => {
        const nA = a.holes?.number ?? 0;
        const nB = b.holes?.number ?? 0;
        return nA - nB;
      });
      const arr = Array(18).fill(null);
      sortedRows.forEach((row) => {
        const holeNumber = row.holes?.number;
        if (holeNumber >= 1 && holeNumber <= 18) {
          arr[holeNumber - 1] = row.num_putts;
        }
      });
      setPuttsModalData(arr);
    } else {
      setPuttsModalData(Array(18).fill(null));
    }
    setShowPuttsModal(true);
  };

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
    // Restore currentHole from localStorage if present (in case id changes)
    const saved = window.localStorage.getItem(`currentHole_${id}`);
    if (saved && Number(saved) !== currentHole) {
      setCurrentHole(Number(saved));
    }
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
        .select("*")
        .eq("session_id", id);
      if (playerError) {
        console.error("Supabase session_players fetch error:", playerError);
      }
      // Only insert user if not present and not immediately after game creation
      let thisPlayer = playerData?.find((p) => p.user_id === currentUserId);
      if (currentUserId && sessionData && playerData && !thisPlayer) {
        // Insert host into session_players if missing (host on first load)
        const name =
          user.data?.user?.user_metadata?.full_name ||
          user.data?.user?.email ||
          "Player";
        const { data: insertData, error: insertError } = await supabase
          .from("session_players")
          .insert([
            {
              session_id: sessionData.id,
              user_id: currentUserId,
              name,
              is_creator: true,
            },
          ])
          .select();
        if (!insertError && insertData && insertData.length > 0) {
          thisPlayer = insertData[0];
          playerData.push(thisPlayer);
        } else if (!insertError) {
          // Fallback: fetch the row if duplicate
          const { data: existingPlayer } = await supabase
            .from("session_players")
            .select("*")
            .eq("session_id", sessionData.id)
            .eq("user_id", currentUserId)
            .single();
          if (existingPlayer) {
            thisPlayer = existingPlayer;
            playerData.push(thisPlayer);
          }
        }
        setShowJoinModal(false);
      } else if (
        currentUserId &&
        sessionData &&
        playerData &&
        !playerData.some((p) => p.user_id === currentUserId)
      ) {
        setShowJoinModal(true);
      }
      // Ensure each player has an id property (session_players.id)
      const normalizedPlayers = (playerData || []).map((p) => ({
        ...p,
        id: p.id || p.session_player_id || p.player_id,
      }));
      setPlayers(normalizedPlayers);
      // Host check
      if (sessionData && currentUserId === sessionData.creator_id)
        setIsHost(true);

      // ---
      // Backend logic: ensure holes and putts exist for this session/player
      if (sessionData) {
        // Only create holes if none exist for this session
        const { data: holes, error: holesError } = await supabase
          .from("holes")
          .select("id")
          .eq("session_id", sessionData.id);
        if (!holesError && (!holes || holes.length === 0)) {
          await createHolesForSession(sessionData.id);
        }
        // Only create putts for the current user if none exist for this user in this session
        if (thisPlayer) {
          const { data: puttsRows, error: puttsError } = await supabase
            .from("putts")
            .select("id")
            .eq("session_id", sessionData.id)
            .eq("player_id", thisPlayer.id);
          if (!puttsError && (!puttsRows || puttsRows.length === 0)) {
            await createPuttsForPlayer(sessionData.id, thisPlayer.id);
          }
        }
      }
      // ---
    };
    fetchData();
  }, [id, currentHole]);
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
    const { data: insertData, error: insertError } = await supabase
      .from("session_players")
      .insert([
        {
          session_id: sessionData.id,
          user_id: currentUserId,
          name,
        },
      ])
      .select();
    if (insertError && !insertError.message.includes("duplicate")) {
      setJoinError("Could not join game. Try again.");
      return;
    }
    // After successful join, create putts for this player
    let newSessionPlayerId;
    if (insertData && insertData.length > 0) {
      newSessionPlayerId = insertData[0].id;
    } else {
      // If duplicate, fetch the session_player row
      const { data: existingPlayer } = await supabase
        .from("session_players")
        .select("id")
        .eq("session_id", sessionData.id)
        .eq("user_id", currentUserId)
        .single();
      newSessionPlayerId = existingPlayer?.id;
    }
    if (newSessionPlayerId) {
      await createPuttsForPlayer(sessionData.id, newSessionPlayerId);
    }
    // Success: reload page for new session
    window.location.href = `/game/${sessionData.id}`;
  };

  // Fetch all putts for all players for this session and populate local state
  useEffect(() => {
    if (!session?.id || players.length === 0) return;
    let isMounted = true;
    async function fetchAllPutts() {
      const { data: puttsRows, error } = await supabase
        .from("putts")
        .select("player_id, num_putts, hole_id, session_id, holes(number)")
        .eq("session_id", session.id);
      if (error) {
        console.error("[PUTTS FETCH DEBUG] Error fetching putts", error);
        return;
      }
      // Build { playerId: { [holeNumber]: num_putts } }
      const puttsMap = {};
      for (const row of puttsRows) {
        const pid = row.player_id;
        const holeNum = row.holes?.number;
        if (!pid || !holeNum) continue;
        if (!puttsMap[pid]) puttsMap[pid] = {};
        puttsMap[pid][holeNum] = row.num_putts;
      }
      if (isMounted) setPutts(puttsMap);
    }
    fetchAllPutts();
    return () => {
      isMounted = false;
    };
  }, [session?.id, players, currentHole]);

  // Handle putt input (host only)
  const handlePuttChange = (playerId, value) => {
    setPutts((prev) => ({
      ...prev,
      [playerId]: { ...(prev[playerId] || {}), [currentHole]: value },
    }));
  };

  // Handle submit putts (host only)
  const handleSubmitPutts = async () => {
    // Mark which players should animate their prev cell
    const animatingPlayers = {};
    players.forEach((p) => {
      if (
        putts[p.id]?.[currentHole] !== undefined &&
        putts[p.id]?.[currentHole] !== ""
      ) {
        animatingPlayers[p.id] = true;
      }
    });
    setAnimatePrev(animatingPlayers);
    // Find 3-putters (any putt 3 or above)
    const threePutters = players.filter(
      (p) => Number(putts[p.id]?.[currentHole]) >= 3
    );
    if (threePutters.length === 1) {
      setChipHolder(threePutters[0].id);
    } else if (threePutters.length > 1) {
      setChipCandidates(threePutters);
      setShowChipModal(true);
    }
    // Save putts to DB for each player for this hole
    // Need to find the correct hole_id for the currentHole
    const { data: holes, error: holesError } = await supabase
      .from("holes")
      .select("id, number")
      .eq("session_id", session.id);
    if (holesError) {
      console.error("[PUTT SUBMIT DEBUG] Error fetching holes", holesError);
      return;
    }
    for (const p of players) {
      const value = putts[p.id]?.[currentHole];
      if (value != null && value !== "") {
        // Find the hole_id for the currentHole
        const hole = holes.find((h) => h.number === currentHole);
        if (!hole) {
          console.error("[PUTT SUBMIT DEBUG] No hole found for currentHole", {
            currentHole,
            holes,
          });
          continue;
        }
        // Update the putts row for this player, session, and hole_id
        const { error } = await supabase
          .from("putts")
          .update({ num_putts: Number(value) })
          .eq("session_id", session.id)
          .eq("player_id", p.id)
          .eq("hole_id", hole.id);
        if (error) {
          console.error("[PUTT SUBMIT DEBUG] Error updating putt", {
            player: p,
            value,
            currentHole,
            error,
          });
        }
      }
    }
    setTimeout(() => setAnimatePrev({}), 600); // clear after animation
    setCurrentHole((h) => {
      const next = h + 1;
      window.localStorage.setItem(`currentHole_${id}`, next);
      return next;
    });
  };

  // Handle chip assignment if multiple 3-putters
  const assignChip = (playerId) => {
    setChipHolder(playerId);
    setShowChipModal(false);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-2 sm:px-4 md:px-6"
      style={{
        background:
          "linear-gradient(to bottom, #eaf3fb 0%, #eaf3fb 60%, #d1f7e7 100%)",
        minHeight: "100vh",
        paddingTop: 0,
      }}
    >
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
      <div className="w-full max-w-3xl flex flex-col gap-4 mb-6 mt-12 px-2 sm:px-4 md:px-6">
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
      <div className="w-full max-w-3xl rounded-2xl border border-white/60 bg-white/70 backdrop-blur-lg shadow-2xl p-4 mb-6 px-2 sm:px-4 md:px-6">
        <div className="flex items-center gap-4 mb-2">
          <label className="text-lg font-semibold flex items-center gap-2">
            Hole
            <select
              className="ml-1 rounded px-2 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 text-lg font-semibold"
              value={currentHole}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCurrentHole(val);
                window.localStorage.setItem(`currentHole_${id}`, val);
              }}
            >
              {Array.from({ length: 18 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
        <table className="w-full text-center">
          <thead>
            <tr>
              <th className="py-2">Player</th>
              {currentHole > 1 && (
                <th className="py-2 text-gray-400">Hole {currentHole - 1}</th>
              )}
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
                  {chipHolder === p.id && (
                    <span className="flex items-center gap-1 text-yellow-700 font-bold">
                      <ChipIcon className="w-4 h-4" />
                    </span>
                  )}
                  {p.name}
                  {userId === p.user_id && (
                    <span className="ml-1 text-xs text-green-500 font-bold">
                      (You)
                    </span>
                  )}
                </td>
                {currentHole > 1 && (
                  <td className="py-2">
                    <span
                      className={`text-gray-400 transition-all duration-500 ${
                        animatePrev[p.id] ? "slide-fade" : ""
                      }`}
                    >
                      <PuttsDisplay
                        playerId={p.id}
                        currentHole={currentHole - 1}
                        sessionId={session?.id}
                      />
                    </span>
                  </td>
                )}
                <td className="py-2">
                  {/* For host: always show input box, prefilled with value; for others: show DB value only */}
                  {isHost ? (
                    <input
                      type="number"
                      min="0"
                      max="6"
                      className="w-16 rounded px-2 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 text-center mt-1"
                      value={
                        putts[p.id]?.[currentHole] === 0
                          ? 0
                          : putts[p.id]?.[currentHole] ?? ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        handlePuttChange(p.id, val === "" ? "" : Number(val));
                      }}
                    />
                  ) : (
                    <PuttsDisplay
                      playerId={p.id}
                      currentHole={currentHole}
                      sessionId={session?.id}
                    />
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
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-2 sm:px-4 md:px-6">
        {players.map((p) => (
          <div
            key={p.user_id}
            className="bg-white/70 rounded-2xl border border-white/60 backdrop-blur-lg shadow-2xl p-4 flex flex-col items-center"
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
            <button
              className="mt-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold px-3 py-1 rounded shadow border border-blue-200 text-xs"
              onClick={() => handleViewPutts(p)}
            >
              View Putts
            </button>
          </div>
        ))}
      </div>
      {/* Putts History Modal */}
      {showPuttsModal && puttsModalPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-4 flex flex-col gap-4 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowPuttsModal(false)}
            >
              &times;
            </button>
            <h3 className="text-lg font-bold text-blue-700 mb-2">
              {puttsModalPlayer.name}'s Putts (18 Holes)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-center border border-gray-200 rounded">
                <thead>
                  <tr>
                    {Array.from({ length: 18 }, (_, i) => (
                      <th
                        key={i}
                        className="px-2 py-1 text-xs font-semibold border-b border-gray-100"
                      >
                        {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {puttsModalData.map((val, i) => (
                      <td key={i} className="px-2 py-1 border-b border-gray-50">
                        {val == null || val === "" ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          val
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Host controls: End/Delete Game at bottom */}
      {isHost && (
        <div className="w-full max-w-3xl flex gap-2 justify-end mt-8 px-2 sm:px-4 md:px-6">
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
