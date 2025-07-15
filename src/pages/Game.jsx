// Utility functions for holes/putts creation
import React, { useEffect, useState } from "react";
import { CurrencyDollarIcon, SparklesIcon } from "@heroicons/react/24/outline";

// Custom SVG Casino Chip Icon
function CasinoChipIcon({ className = "w-4 h-4", color = "#eab308" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        fill="#fffbe6"
      />
      <circle
        cx="12"
        cy="12"
        r="5"
        stroke={color}
        strokeWidth="2"
        fill="#fde68a"
      />
      <g stroke={color} strokeWidth="1.5">
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
        <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
        <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
        <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
        <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
      </g>
    </svg>
  );
}
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
  const [isHost, setIsHost] = useState(false);
  const [userId, setUserId] = useState(null);
  // Modal for viewing putts history
  const [showPuttsModal, setShowPuttsModal] = useState(false);
  const [puttsModalPlayer, setPuttsModalPlayer] = useState(null);
  const [puttsModalData, setPuttsModalData] = useState([]); // Array of 18 putts
  // Modal for game details
  const [showGameDetails, setShowGameDetails] = useState(false);
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

    // --- CHIP LOGIC: Always assign chip to the player with the highest hole number 3-putt or higher ---
    // Find the latest (highest hole number) 3-putt or higher for any player
    let latestHole = 0;
    let chipPlayerId = null;
    players.forEach((p) => {
      const playerPutts = putts[p.id] || {};
      Object.entries(playerPutts).forEach(([holeNumStr, numPutts]) => {
        const holeNum = Number(holeNumStr);
        if (holeNum > latestHole && Number(numPutts) >= 3) {
          latestHole = holeNum;
          chipPlayerId = p.id;
        }
      });
    });
    if (chipPlayerId) {
      setChipHolder(chipPlayerId);
    } else {
      setChipHolder(null);
    }

    setTimeout(() => setAnimatePrev({}), 600); // clear after animation
    setCurrentHole((h) => {
      const next = h + 1;
      window.localStorage.setItem(`currentHole_${id}`, next);
      return next;
    });
  };

  // Handle chip assignment if multiple 3-putters
  const assignChip = (userId) => {
    const player = players.find((p) => p.user_id === userId);
    if (player) setChipHolder(player.id);
    setShowChipModal(false);
  };

  // --- Clean, neutral UI ---
  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-green-50 via-blue-50 to-green-100 px-2 sm:px-0">
      {/* HEADER */}
      <header className="w-full max-w-3xl mt-10 mb-8 px-4 flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-green-800 tracking-tight w-full text-center">
          {session?.name || "Three Putt Poker"}
        </h1>
        <div className="flex flex-row items-center justify-between mt-2">
          <div className="flex-1 flex items-center gap-2">
            {session?.game_type && (
              <span className="text-xs font-semibold text-green-700 bg-green-100 rounded px-2 py-0.5 align-middle border border-green-200">
                {session.game_type === "three-putt"
                  ? "Three Putt Poker"
                  : session.game_type
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            )}
          </div>
          <button
            className="ml-2 flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-green-900 font-semibold px-4 py-1 rounded-full border border-green-200 shadow-sm text-sm transition"
            onClick={() => setShowGameDetails(true)}
          >
            <span>Game Details</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
          {isHost && (
            <button
              className="ml-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-1 rounded-lg shadow border border-green-400 transition-transform hover:scale-105 text-sm"
              onClick={() => setShowInviteCode(true)}
            >
              Invite Players
            </button>
          )}
        </div>
      </header>
      {/* Game Details Modal */}
      {showGameDetails && session && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-800/20 backdrop-blur-sm"
          onClick={() => setShowGameDetails(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 flex flex-col gap-6 relative border-t-8 border-green-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowGameDetails(false)}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-green-700 mb-2">
              Game Details
            </h3>
            <div className="flex flex-col gap-3">
              <span className="flex items-center gap-2 bg-green-100 rounded-full px-3 py-1 text-green-900 font-medium border border-green-200 text-sm min-w-fit">
                <CurrencyDollarIcon className="w-4 h-4 text-green-500" />
                Buy-In: ${session.buy_in_amount}
              </span>
              <span className="flex items-center gap-2 bg-green-100 rounded-full px-3 py-1 text-green-900 font-medium border border-green-200 text-sm min-w-fit">
                <SparklesIcon className="w-4 h-4 text-green-500" />
                3-Putt: ${session.three_putt_value}
              </span>
              {session.three_putt_chip_enabled && (
                <span className="flex items-center gap-2 bg-yellow-100 rounded-full px-3 py-1 text-yellow-900 font-medium border border-yellow-200 text-sm min-w-fit">
                  <CasinoChipIcon className="w-4 h-4" color="#eab308" />
                  Chip: ${session.three_putt_chip_value}
                </span>
              )}
              <span className="flex items-center gap-2 bg-blue-100 rounded-full px-3 py-1 text-blue-900 font-medium border border-blue-200 text-sm min-w-fit">
                <svg
                  className="w-4 h-4 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7V3m0 0L8 7m8-4v18m0 0l-8-4m8 4H8"
                  />
                </svg>
                Deal: {session.deal_method?.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="w-full max-w-3xl flex flex-col gap-8 items-center">
        {/* Putts Table Card */}
        <section className="w-full bg-white rounded-2xl shadow border border-green-100 p-5 mb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <label className="text-base font-semibold text-neutral-800 flex items-center gap-2">
                Hole
                <select
                  className="ml-1 rounded px-3 py-1 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-400 text-base font-semibold bg-neutral-50"
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
          </div>
          <div className="overflow-x-auto rounded-xl">
            <table className="min-w-full text-center border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="py-3 px-2 rounded-l-xl text-neutral-800 font-semibold">
                    Player
                  </th>
                  {currentHole > 1 && (
                    <th className="py-3 px-2 text-neutral-400 font-medium">
                      Hole {currentHole - 1}
                    </th>
                  )}
                  <th className="py-3 px-2 rounded-r-xl text-neutral-800 font-semibold">
                    Putts
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr
                    key={p.user_id}
                    className={
                      (userId === p.user_id ? "bg-neutral-100 " : "") +
                      "hover:bg-neutral-50 transition-colors"
                    }
                  >
                    <td className="py-2 px-2 font-medium flex items-center justify-center gap-2 text-neutral-800">
                      {chipHolder === p.id && (
                        <span className="flex items-center gap-1 text-yellow-700 font-bold animate-bounce">
                          <CasinoChipIcon className="w-5 h-5" color="#eab308" />
                        </span>
                      )}
                      <span>{p.name}</span>
                      {userId === p.user_id && (
                        <span className="ml-1 text-xs text-neutral-500 font-bold">
                          (You)
                        </span>
                      )}
                    </td>
                    {currentHole > 1 && (
                      <td className="py-2 px-2">
                        <span
                          className={`text-neutral-400 transition-all duration-500 ${
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
                    <td className="py-2 px-2">
                      {isHost ? (
                        <input
                          type="number"
                          min="0"
                          max="6"
                          className="w-16 rounded px-2 py-1 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-400 text-center mt-1 bg-neutral-50"
                          value={
                            putts[p.id]?.[currentHole] === 0
                              ? 0
                              : putts[p.id]?.[currentHole] ?? ""
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            handlePuttChange(
                              p.id,
                              val === "" ? "" : Number(val)
                            );
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
          </div>
          {isHost && (
            <div className="flex flex-col sm:flex-row justify-end mt-6">
              <button
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2 rounded shadow border border-green-400 transition-transform hover:scale-105"
                onClick={handleSubmitPutts}
              >
                Submit Putts
              </button>
            </div>
          )}
        </section>

        {/* Poker Hands Section */}
        <section className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {players.map((p) => (
            <div
              key={p.user_id}
              className="bg-white rounded-2xl border border-blue-100 shadow p-6 flex flex-col items-center hover:shadow-lg transition-shadow"
            >
              <span className="font-semibold text-blue-900 mb-2 text-lg flex items-center gap-2">
                {chipHolder === p.id && (
                  <span className="flex items-center gap-1 text-yellow-700 font-bold animate-bounce">
                    <CasinoChipIcon className="w-4 h-4" color="#eab308" />
                  </span>
                )}
                {p.name}
                {userId === p.user_id && (
                  <span className="ml-1 text-xs text-neutral-500 font-bold">
                    (You)
                  </span>
                )}
              </span>
              <div className="flex gap-2 mb-2">
                <CardPlaceholder />
                <CardPlaceholder />
                <CardPlaceholder />
                <CardPlaceholder />
                <CardPlaceholder />
              </div>
              <span className="text-xs text-blue-500 mb-2">Poker Hand</span>
              <button
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold px-4 py-1 rounded shadow border border-blue-200 text-xs"
                onClick={() => handleViewPutts(p)}
              >
                View Putts
              </button>
            </div>
          ))}
        </section>
      </main>

      {/* MODALS */}
      {/* End Game Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-800/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 flex flex-col gap-6 relative border-t-8 border-neutral-200">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowEndModal(false)}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-green-700 mb-2">End Game?</h3>
            <p className="text-gray-700">
              This will end the game for all players, but results will be saved
              to history. Are you sure?
            </p>
            <div className="flex gap-2">
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow font-semibold flex-1"
                onClick={handleEndGame}
              >
                Yes, End Game
              </button>
              <button
                className="text-gray-500 hover:text-gray-700 text-sm mt-1 flex-1"
                onClick={() => setShowEndModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Game Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-800/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 flex flex-col gap-6 relative border-t-8 border-neutral-200">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowDeleteModal(false)}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-red-700 mb-2">
              Delete Game?
            </h3>
            <p className="text-gray-700">
              This will permanently delete the game and all its data. This
              action cannot be undone.
            </p>
            <div className="flex gap-2">
              {deleteConfirmStep < 2 ? (
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow font-semibold flex-1"
                  onClick={() => setDeleteConfirmStep((s) => s + 1)}
                >
                  {deleteConfirmStep === 0
                    ? "Yes, I'm sure"
                    : "Really, really sure?"}
                </button>
              ) : (
                <button
                  className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded shadow font-semibold flex-1"
                  onClick={handleDeleteGame}
                >
                  Delete Forever
                </button>
              )}
              <button
                className="text-gray-500 hover:text-gray-700 text-sm mt-1 flex-1"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Invite Code Modal */}
      {showInviteCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-800/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs mx-4 flex flex-col gap-6 relative border-t-8 border-neutral-200">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowInviteCode(false)}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-green-700 mb-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-800/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs mx-4 flex flex-col gap-6 relative border-t-8 border-neutral-200">
            <h3 className="text-xl font-bold text-yellow-700 mb-2">
              Who gets the chip?
            </h3>
            <div className="flex flex-col gap-2">
              <span className="text-yellow-700 text-sm">
                No chip candidates available.
              </span>
            </div>
            <button
              className="text-gray-500 hover:text-gray-700 text-sm mt-1"
              onClick={() => setShowChipModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Join by Code Modal (if user not in session_players) */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-800/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs mx-4 flex flex-col gap-6 relative border-t-8 border-neutral-200">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowJoinModal(false)}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-green-700 mb-2">Join Game</h3>
            <input
              type="text"
              placeholder="Enter Game Code"
              className="rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 uppercase tracking-widest font-mono text-center text-lg"
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
      {/* Putts History Modal */}
      {showPuttsModal && puttsModalPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-800/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl mx-4 flex flex-col gap-6 relative border-t-8 border-neutral-200">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowPuttsModal(false)}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-blue-700 mb-2">
              {puttsModalPlayer.name}'s Putts (18 Holes)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-center border border-gray-200 rounded-xl">
                <thead>
                  <tr>
                    {Array.from({ length: 18 }, (_, i) => (
                      <th
                        key={i}
                        className="px-2 py-1 text-xs font-semibold border-b border-gray-100 bg-blue-50"
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
        <footer className="w-full max-w-4xl flex gap-2 justify-end mt-10 px-4 mb-8">
          <button
            className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-6 py-2 rounded-xl shadow border border-yellow-500"
            onClick={() => setShowEndModal(true)}
          >
            End Game
          </button>
          <button
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-xl shadow border border-red-600"
            onClick={() => {
              setShowDeleteModal(true);
              setDeleteConfirmStep(0);
            }}
          >
            Delete Game
          </button>
        </footer>
      )}
    </div>
  );
}
