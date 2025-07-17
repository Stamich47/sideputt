import React, { useState, useEffect } from "react";
import {
  CurrencyDollarIcon,
  ThreePuttIcon,
  CardsIcon,
} from "../components/Icons";

import {
  StarIcon,
  SmileIcon,
  FrownIcon,
  DollarBillIcon,
  CasinoZeroIcon,
  CasinoChipIcon,
} from "../components/Icons";
import { PuttsDisplay, CardPlaceholder } from "../components/GameWidgets";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  createHolesForSession,
  createPuttsForPlayer,
} from "../lib/supabaseGameUtils";
import { PokerCard } from "../components/PokerCard";

export default function Game() {
  // Tab state for poker hand section
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  // --- All useState hooks at the very top ---

  useEffect(() => {
    if (
      players.length > 0 &&
      (!selectedPlayerId || !players.find((p) => p.id === selectedPlayerId))
    ) {
      setSelectedPlayerId(players[0].id);
    }
  }, [players, selectedPlayerId]);
  const [playerCards, setPlayerCards] = useState({});
  const [loadingCards, setLoadingCards] = useState(false);
  const [putts, setPutts] = useState({}); // { playerId: [puttsPerHole] }
  // Persist currentHole in localStorage by session id
  const [currentHole, setCurrentHole] = useState(() => {
    const saved = window.localStorage.getItem(`currentHole_${id}`);
    return saved ? Number(saved) : 1;
  });
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [chipHolder, setChipHolder] = useState(null); // session_player_id
  const [showChipModal, setShowChipModal] = useState(false);
  const [chipModalCandidates, setChipModalCandidates] = useState([]);
  const [chipModalHole, setChipModalHole] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [showGameDetails, setShowGameDetails] = useState(false);
  const [editingGameDetails, setEditingGameDetails] = useState(false);
  const [editDetails, setEditDetails] = useState({
    buyIn: "",
    threePutt: "",
    chipValue: "",
    dealMethod: "",
    chipEnabled: false,
  });
  const [savingDetails, setSavingDetails] = useState(false);
  // Handler to start editing game details
  const handleEditGameDetails = () => {
    setEditDetails({
      buyIn: session?.buy_in_amount || "",
      threePutt: session?.three_putt_value || "",
      chipValue: session?.three_putt_chip_value || "",
      dealMethod: session?.deal_method || "",
      chipEnabled: !!session?.three_putt_chip_enabled,
    });
    setEditingGameDetails(true);
  };

  // Handler to save edited game details
  const handleSaveGameDetails = async () => {
    setSavingDetails(true);
    const updates = {
      buy_in_amount: editDetails.buyIn,
      three_putt_value: editDetails.threePutt,
      three_putt_chip_value: editDetails.chipValue,
      deal_method: editDetails.dealMethod,
      three_putt_chip_enabled: editDetails.chipEnabled,
    };
    const { error } = await supabase
      .from("sessions")
      .update(updates)
      .eq("id", session.id);
    if (!error) {
      setEditingGameDetails(false);
      setShowGameDetails(false);
      window.location.reload();
    }
    setSavingDetails(false);
  };
  const [puttsModalPlayer] = useState(null); // restored for modal usage
  const [puttsModalData] = useState([]); // restored for modal usage
  const [showPuttsModal, setShowPuttsModal] = useState(false);
  const [userId, setUserId] = useState(null);
  // Add missing state hooks
  const [animatePrev, setAnimatePrev] = useState({});
  const [showScorecard, setShowScorecard] = useState(false);
  const [showPotModal, setShowPotModal] = useState(false);
  // Modal for game deletion
  const [showGameDeletedModal, setShowGameDeletedModal] = useState(false);

  const fetchCardsForHole = React.useCallback(async () => {
    if (!session?.id || players.length === 0) return;
    setLoadingCards(true);
    // Fetch all cards for this session
    const { data: cards, error } = await supabase
      .from("cards")
      .select("id, session_player_id, suit, rank, is_hidden, hole_id")
      .eq("session_id", session.id);
    if (error) {
      setLoadingCards(false);
      return;
    }
    // Group by player
    const grouped = {};
    for (const row of cards) {
      if (!grouped[row.session_player_id]) grouped[row.session_player_id] = [];
      grouped[row.session_player_id].push(row);
    }
    setPlayerCards(grouped);
    setLoadingCards(false);
  }, [session?.id, players]);

  // Fetch all putts for all players for this session and update state (used by realtime)
  const fetchAllPuttsAndChip = React.useCallback(async () => {
    if (!session?.id || players.length === 0) return;
    // Fetch all putts
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
    setPutts(puttsMap);

    // CHIP LOGIC: Only run if chip is enabled
    if (!session.three_putt_chip_enabled) {
      setChipHolder(null);
      setShowChipModal(false);
      return;
    }
    // 1. Find the latest hole with a 3+ putt
    let latestHole = 0;
    players.forEach((p) => {
      const playerPutts = puttsMap[p.id] || {};
      Object.entries(playerPutts).forEach(([holeNumStr, numPutts]) => {
        const holeNum = Number(holeNumStr);
        if (holeNum > latestHole && Number(numPutts) >= 3) {
          latestHole = holeNum;
        }
      });
    });
    // 2. Find all players with a 3+ on the latestHole
    const chipCandidates = players.filter((p) => {
      const playerPutts = puttsMap[p.id] || {};
      return Number(playerPutts[latestHole]) >= 3;
    });
    // 3. Fetch latest chip_event for this session
    const { data: chipEvents, error: chipEventsError } = await supabase
      .from("chip_events")
      .select("id, session_player_id, hole_number")
      .eq("session_id", session.id)
      .order("hole_number", { ascending: false })
      .limit(1);
    if (chipEventsError) {
      console.error(
        "[CHIP_EVENTS FETCH DEBUG] Error fetching chip_events",
        chipEventsError
      );
      setChipHolder(null);
      return;
    }
    const latestChipEvent =
      chipEvents && chipEvents.length > 0 ? chipEvents[0] : null;
    // 4. Decide chip holder and modal
    if (latestChipEvent && latestChipEvent.hole_number >= latestHole) {
      // There is already a chip event for this hole or a later one
      setChipHolder(latestChipEvent.session_player_id);
      setShowChipModal(false);
    } else if (latestHole > 0 && chipCandidates.length === 1) {
      // Only one candidate, assign chip
      setChipHolder(chipCandidates[0].id);
      // Insert chip_event
      await supabase.from("chip_events").insert([
        {
          session_id: session.id,
          session_player_id: chipCandidates[0].id,
          hole_number: latestHole,
        },
      ]);
      setShowChipModal(false);
    } else if (latestHole > 0 && chipCandidates.length > 1) {
      // Multiple candidates, show modal if not already resolved
      setChipModalCandidates(chipCandidates);
      setChipModalHole(latestHole);
      setShowChipModal(true);
    } else {
      setChipHolder(null);
      setShowChipModal(false);
    }
  }, [session?.id, players, session?.three_putt_chip_enabled]);

  // --- Supabase Realtime subscriptions ---
  React.useEffect(() => {
    if (!session?.id) return;
    // Listen for changes to putts table for this session
    const puttsChannel = supabase
      .channel("putts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "putts",
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          // Re-fetch all putts and chip logic
          fetchAllPuttsAndChip();
        }
      )
      .subscribe();

    // Listen for changes to cards table for this session
    const cardsChannel = supabase
      .channel("cards-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cards",
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          // Re-fetch all cards for session
          fetchCardsForHole();
        }
      )
      .subscribe();

    // Listen for new players joining (INSERT on session_players)
    const playersChannel = supabase
      .channel("session_players-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_players",
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          // Re-fetch players list
          supabase
            .from("session_players")
            .select("*")
            .eq("session_id", session.id)
            .then(({ data }) => {
              if (data) {
                const normalizedPlayers = (data || []).map((p) => ({
                  ...p,
                  id: p.id || p.session_player_id || p.player_id,
                }));
                setPlayers(normalizedPlayers);
              }
            });
        }
      )
      .subscribe();

    // Listen for game deletion (DELETE on sessions)
    const sessionDeleteChannel = supabase
      .channel("session-delete-changes")
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${session.id}`,
        },
        () => {
          setShowGameDeletedModal(true);
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(puttsChannel);
      supabase.removeChannel(cardsChannel);
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(sessionDeleteChannel);
    };
  }, [session?.id, fetchAllPuttsAndChip, fetchCardsForHole]);

  // Fetch all putts for all players for this session and update state (used by realtime)

  // --- Card DB logic: always fetch from DB, assign after putt submit ---
  // Fetch cards for the current hole and update playerCards

  // Assign cards for the current hole based on putts
  const assignCardsForHole = async (holeNumber) => {
    console.log(
      "[assignCardsForHole] called for holeNumber:",
      holeNumber,
      "session:",
      session?.id,
      "players:",
      players.map((p) => p.id)
    );
    if (!session?.id || players.length === 0 || !holeNumber) {
      console.warn(
        "[assignCardsForHole] Missing session, players, or holeNumber",
        { sessionId: session?.id, players, holeNumber }
      );
      return;
    }
    const { data: holes, error: holesError } = await supabase
      .from("holes")
      .select("id, number")
      .eq("session_id", session.id);
    if (holesError) {
      console.error("[assignCardsForHole] Error fetching holes:", holesError);
      return;
    }
    const hole = holes.find((h) => h.number === holeNumber);
    if (!hole) {
      console.warn("[assignCardsForHole] No hole found for number", holeNumber);
      return;
    }
    for (const p of players) {
      const numPutts = putts[p.id]?.[holeNumber];
      let numCards = 0;
      if (Number(numPutts) === 1) numCards = 1;
      else if (Number(numPutts) === 0) numCards = 2;
      console.log(
        `[assignCardsForHole] Player ${p.id} putts:`,
        numPutts,
        "numCards:",
        numCards
      );
      // Fetch existing cards for this player/hole
      const { data: existingCards } = await supabase
        .from("cards")
        .select("id, suit, rank")
        .eq("session_id", session.id)
        .eq("hole_id", hole.id)
        .eq("session_player_id", p.id);
      console.log(
        `[assignCardsForHole] Player ${p.id} existingCards:`,
        existingCards
      );
      // Delete if too many
      if (existingCards && existingCards.length > numCards) {
        const toDelete = existingCards.slice(numCards).map((c) => c.id);
        if (toDelete.length > 0) {
          console.log(
            `[assignCardsForHole] Deleting extra cards for player ${p.id}:`,
            toDelete
          );
          await supabase.from("cards").delete().in("id", toDelete);
        }
      }
      // Insert if too few
      if (existingCards && existingCards.length < numCards) {
        const deck = createDeck();
        // Remove used cards for this hole
        const { data: usedCards } = await supabase
          .from("cards")
          .select("suit, rank")
          .eq("session_id", session.id)
          .eq("hole_id", hole.id);
        const usedSet = new Set(usedCards.map((c) => `${c.suit}-${c.rank}`));
        const available = deck.filter(
          (c) => !usedSet.has(`${c.suit}-${c.rank}`)
        );
        const newCards = dealRandomCards(
          available,
          numCards - existingCards.length,
          true
        );
        for (const c of newCards) {
          console.log(
            `[assignCardsForHole] Inserting card for player ${p.id}:`,
            c
          );
          await supabase.from("cards").insert({
            session_id: session.id,
            session_player_id: p.id,
            hole_id: hole.id,
            suit: c.suit,
            rank: c.rank,
            is_hidden: c.is_hidden,
          });
        }
      }
    }
    console.log("[assignCardsForHole] Complete for holeNumber:", holeNumber);
  };

  // ...existing code...

  // Helper: get number of cards to deal for a player (example: based on putts)

  // Helper: deal random cards (returns [{suit, rank, is_hidden}...])
  function dealRandomCards(deck, n, isHidden = true) {
    // Simple shuffle
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n).map((c) => ({ ...c, is_hidden: isHidden }));
  }

  // Card suits and ranks
  const SUITS = React.useMemo(
    () => ["hearts", "diamonds", "clubs", "spades"],
    []
  );
  const RANKS = React.useMemo(
    () => ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"],
    []
  );
  const createDeck = React.useCallback(() => {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank });
      }
    }
    return deck;
  }, [RANKS, SUITS]);

  // Only fetch cards for the current hole and update playerCards (do NOT assign cards here)
  useEffect(() => {
    if (!session?.id || players.length === 0 || !currentHole) return;
    async function fetchCardsOnMount() {
      await fetchCardsForHole(currentHole);
    }
    fetchCardsOnMount();
  }, [session?.id, players, currentHole, fetchCardsForHole]);

  // Calculate payouts for each player
  function getPayouts() {
    const payouts = players.map((p) => {
      let total = Number(session?.buy_in_amount) || 0;
      // Count 3-putts
      let threePuttCount = 0;
      const playerPutts = putts[p.id] || {};
      Object.values(playerPutts).forEach((numPutts) => {
        if (Number(numPutts) >= 3) threePuttCount++;
      });
      total += threePuttCount * (Number(session?.three_putt_value) || 0);
      // Chip value (if currently holding chip)
      if (chipHolder === p.id && session?.three_putt_chip_enabled) {
        total += Number(session?.three_putt_chip_value) || 0;
      }
      return {
        id: p.id,
        name: p.name,
        total: total,
        threePuttCount: threePuttCount,
        hasChip: chipHolder === p.id,
      };
    });
    return payouts;
  }
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
  // (handleViewPutts removed - unused function)

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
        // --- CHIP HOLDER: always compute from latest putts data ---
        if (sessionData.three_putt_chip_enabled) {
          // Fetch all putts for this session
          const { data: allPutts, error: allPuttsError } = await supabase
            .from("putts")
            .select("player_id, num_putts, hole_id, session_id, holes(number)")
            .eq("session_id", sessionData.id);
          if (allPuttsError) {
            console.error(
              "[CHIP HOLDER DEBUG] Error fetching all putts for chip logic",
              allPuttsError
            );
            setChipHolder(null);
          } else {
            // Find the highest hole number with a 3+ putt
            let latestHole = 0;
            let candidates = [];
            for (const row of allPutts) {
              const holeNum = row.holes?.number;
              if (holeNum && Number(row.num_putts) >= 3) {
                if (holeNum > latestHole) {
                  latestHole = holeNum;
                  candidates = [row.player_id];
                } else if (holeNum === latestHole) {
                  candidates.push(row.player_id);
                }
              }
            }
            if (latestHole > 0 && candidates.length === 1) {
              setChipHolder(candidates[0]);
            } else {
              setChipHolder(null);
            }
          }
        } else {
          setChipHolder(null);
        }
      }
      // ---
    };
    fetchData();
  }, [id, currentHole]);
  // Handle join by code

  // Handle putt input (host only)

  // Handle submit putts (host only)

  // Handle chip assignment if multiple 3-putters

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
        // --- CHIP HOLDER: always compute from latest putts data ---
        if (sessionData.three_putt_chip_enabled) {
          // Fetch all putts for this session
          const { data: allPutts, error: allPuttsError } = await supabase
            .from("putts")
            .select("player_id, num_putts, hole_id, session_id, holes(number)")
            .eq("session_id", sessionData.id);
          if (allPuttsError) {
            console.error(
              "[CHIP HOLDER DEBUG] Error fetching all putts for chip logic",
              allPuttsError
            );
            setChipHolder(null);
          } else {
            // Find the highest hole number with a 3+ putt
            let latestHole = 0;
            let candidates = [];
            for (const row of allPutts) {
              const holeNum = row.holes?.number;
              if (holeNum && Number(row.num_putts) >= 3) {
                if (holeNum > latestHole) {
                  latestHole = holeNum;
                  candidates = [row.player_id];
                } else if (holeNum === latestHole) {
                  candidates.push(row.player_id);
                }
              }
            }
            if (latestHole > 0 && candidates.length === 1) {
              setChipHolder(candidates[0]);
            } else {
              setChipHolder(null);
            }
          }
        } else {
          setChipHolder(null);
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
    console.log(
      "[handleSubmitPutts] called for currentHole:",
      currentHole,
      "players:",
      players.map((p) => p.id)
    );
    // Your putt submission logic here (if any)
    // After submitting putts, automatically advance to the next hole
    if (currentHole < 18) {
      setCurrentHole(currentHole + 1);
      window.localStorage.setItem(`currentHole_${id}`, currentHole + 1);
    }
    // Optionally, you can show a message if it's the last hole
    // else { alert('All holes complete!'); }
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
    const { data: holes, error: holesError } = await supabase
      .from("holes")
      .select("id, number")
      .eq("session_id", session.id);
    if (holesError) {
      console.error("[handleSubmitPutts] Error fetching holes:", holesError);
      return;
    }
    const hole = holes.find((h) => h.number === currentHole);
    if (!hole) {
      console.warn("[handleSubmitPutts] No hole found for number", currentHole);
      return;
    }
    for (const p of players) {
      const numPutts = putts[p.id]?.[currentHole];
      if (numPutts !== undefined && numPutts !== "") {
        console.log(
          `[handleSubmitPutts] Saving putts for player ${p.id}:`,
          numPutts
        );
        await supabase.from("putts").upsert(
          {
            session_id: session.id,
            player_id: p.id,
            hole_id: hole.id,
            num_putts: numPutts,
          },
          { onConflict: ["session_id", "player_id", "hole_id"] }
        );
      }
    }
    // Assign cards for this hole based on putts
    await assignCardsForHole(currentHole);
    // Fetch cards for this hole and update UI
    await fetchCardsForHole(currentHole);
    // (Optional) CHIP LOGIC: You can re-add chip logic here if needed
    console.log("[handleSubmitPutts] complete for currentHole:", currentHole);
  };

  // Handle chip assignment if multiple 3-putters
  const assignChip = async (userId) => {
    const player = players.find((p) => p.user_id === userId);
    if (player && chipModalHole) {
      setChipHolder(player.id);
      // Persist chip assignment to backend
      await supabase.from("chip_events").insert([
        {
          session_id: session.id,
          session_player_id: player.id,
          hole_number: chipModalHole,
        },
      ]);
    }
    setShowChipModal(false);
  };

  if (showGameDeletedModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-800/20 backdrop-blur-sm"
        onClick={() => (window.location.href = "/")}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 flex flex-col gap-6 relative border-t-8 border-red-200"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
            onClick={() => (window.location.href = "/")}
          >
            &times;
          </button>
          <h3 className="text-xl font-bold text-red-700 mb-2">Game Deleted</h3>
          <p className="text-gray-700">This game has been deleted.</p>
        </div>
      </div>
    );
  }

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
            {editingGameDetails ? (
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveGameDetails();
                }}
              >
                <label className="flex flex-col gap-1 text-sm font-medium text-green-900">
                  Buy-In
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="rounded px-2 py-1 border border-green-200"
                    value={editDetails.buyIn}
                    onChange={(e) =>
                      setEditDetails((d) => ({ ...d, buyIn: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-green-900">
                  3-Putt Value
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="rounded px-2 py-1 border border-green-200"
                    value={editDetails.threePutt}
                    onChange={(e) =>
                      setEditDetails((d) => ({
                        ...d,
                        threePutt: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="flex flex-row items-center gap-2 text-sm font-medium text-yellow-900">
                  <input
                    type="checkbox"
                    className="accent-yellow-500 w-4 h-4"
                    checked={editDetails.chipEnabled}
                    onChange={(e) =>
                      setEditDetails((d) => ({
                        ...d,
                        chipEnabled: e.target.checked,
                      }))
                    }
                  />
                  Enable Three-Putt Chip
                </label>
                {editDetails.chipEnabled && (
                  <label className="flex flex-col gap-1 text-sm font-medium text-yellow-900">
                    Chip Value
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="rounded px-2 py-1 border border-yellow-200"
                      value={editDetails.chipValue}
                      onChange={(e) =>
                        setEditDetails((d) => ({
                          ...d,
                          chipValue: e.target.value,
                        }))
                      }
                    />
                  </label>
                )}
                <span className="flex items-center gap-2 bg-blue-100 rounded-full px-3 py-1 text-blue-900 font-medium border border-blue-200 text-sm min-w-fit">
                  <CardsIcon className="w-4 h-4 text-blue-400" />
                  Deal: {session.deal_method?.replace(/_/g, " ")}
                </span>
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded shadow"
                    disabled={savingDetails}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="bg-neutral-200 hover:bg-neutral-300 text-green-900 font-semibold px-4 py-2 rounded shadow"
                    onClick={() => setEditingGameDetails(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                <span className="flex items-center gap-2 bg-green-100 rounded-full px-3 py-1 text-green-900 font-medium border border-green-200 text-sm min-w-fit">
                  <CurrencyDollarIcon className="w-4 h-4 text-green-500" />
                  Buy-In: ${session.buy_in_amount}
                </span>
                <span className="flex items-center gap-2 bg-green-100 rounded-full px-3 py-1 text-green-900 font-medium border border-green-200 text-sm min-w-fit">
                  <ThreePuttIcon className="w-4 h-4 text-green-500" />
                  3-Putt: ${session.three_putt_value}
                </span>
                <span className="flex items-center gap-2 bg-yellow-100 rounded-full px-3 py-1 text-yellow-900 font-medium border border-yellow-200 text-sm min-w-fit">
                  <CasinoChipIcon className="w-4 h-4" color="#eab308" />
                  Chip:{" "}
                  {session.three_putt_chip_enabled
                    ? `$${session.three_putt_chip_value}`
                    : "not used"}
                </span>
                <span className="flex items-center gap-2 bg-blue-100 rounded-full px-3 py-1 text-blue-900 font-medium border border-blue-200 text-sm min-w-fit">
                  <CardsIcon className="w-4 h-4 text-blue-400" />
                  Deal: {session.deal_method?.replace(/_/g, " ")}
                </span>
                {isHost && (
                  <button
                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded shadow"
                    onClick={handleEditGameDetails}
                  >
                    Edit Game Details
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="w-full max-w-3xl flex flex-col gap-8 items-center">
        {/* Putts Table Card */}
        <section className="w-full bg-white rounded-2xl shadow border border-green-100 p-5 mb-2">
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex flex-row items-center gap-4">
              <label className="flex items-center gap-2 text-base font-semibold text-neutral-800">
                <span>Hole</span>
                <select
                  className="rounded px-3 py-1 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-400 text-base font-semibold bg-neutral-50"
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

              <button
                className="ml-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold px-4 py-1 rounded shadow border border-blue-200 text-sm transition"
                onClick={() => setShowScorecard(true)}
              >
                Scorecard
              </button>

              <button
                className="ml-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold px-4 py-1 rounded shadow border border-yellow-300 text-sm transition h-[36px] flex items-center"
                style={{ minHeight: "36px" }}
                onClick={() => setShowPotModal(true)}
              >
                Current Pot
              </button>
              {/* Live Payouts Modal */}
              {showPotModal && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-800/20 backdrop-blur-sm px-2 sm:px-6"
                  onClick={() => setShowPotModal(false)}
                >
                  <div
                    className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-auto flex flex-col gap-6 relative border-t-8 border-yellow-200"
                    style={{ marginLeft: "auto", marginRight: "auto" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                      onClick={() => setShowPotModal(false)}
                    >
                      &times;
                    </button>
                    <h3 className="text-xl font-bold text-yellow-700 mb-2">
                      Current Pot
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-center border border-gray-200 rounded-xl">
                        <thead>
                          <tr>
                            <th className="px-2 py-1 text-sm font-bold border-b border-gray-100 bg-yellow-50 text-left whitespace-nowrap">
                              Player
                            </th>
                            <th className="px-2 py-1 text-sm font-bold border-b border-gray-100 bg-yellow-50 whitespace-nowrap">
                              Buy-In
                            </th>
                            <th className="px-2 py-1 text-sm font-bold border-b border-gray-100 bg-yellow-50 whitespace-nowrap">
                              3-Putts
                            </th>
                            <th className="px-2 py-1 text-sm font-bold border-b border-gray-100 bg-yellow-50 whitespace-nowrap">
                              Chip
                            </th>
                            <th className="px-2 py-1 text-sm font-bold border-b border-gray-100 bg-yellow-50 whitespace-nowrap">
                              Total Owed
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {getPayouts().map((p) => (
                            <tr key={p.id}>
                              <td className="px-2 py-1 border-b border-gray-50 text-left font-semibold text-yellow-900 whitespace-nowrap text-sm">
                                {p.name}{" "}
                                {userId === p.id && (
                                  <span className="ml-1 text-xs text-neutral-400 font-bold">
                                    (You)
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-1 border-b border-gray-50 text-sm">
                                $
                                {Number(session?.buy_in_amount || 0).toFixed(2)}
                              </td>
                              <td className="px-2 py-1 border-b border-gray-50 text-sm">
                                {session?.three_putt_value &&
                                p.threePuttCount > 0
                                  ? `$${(
                                      p.threePuttCount *
                                      Number(session.three_putt_value)
                                    ).toFixed(2)} (${p.threePuttCount})`
                                  : "-"}
                              </td>
                              <td className="px-2 py-1 border-b border-gray-50 text-sm">
                                {p.hasChip && session?.three_putt_chip_enabled
                                  ? `$${Number(
                                      session.three_putt_chip_value || 0
                                    ).toFixed(2)}`
                                  : "-"}
                              </td>
                              <td className="px-2 py-1 border-b border-gray-50 font-bold text-yellow-700 text-sm">
                                ${p.total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      <span>
                        Includes buy-in, 3+ putt penalties, and chip value (if
                        held).
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Scorecard Modal */}
              {showScorecard && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-800/20 backdrop-blur-sm"
                  onClick={() => setShowScorecard(false)}
                >
                  <div
                    className="bg-white rounded-2xl shadow-2xl px-4 sm:px-8 py-4 sm:py-6 w-full max-w-2xl mx-2 sm:mx-auto flex flex-col gap-6 relative border-t-8 border-blue-200"
                    style={{ maxHeight: "80vh", overflowY: "auto" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                      onClick={() => setShowScorecard(false)}
                    >
                      &times;
                    </button>
                    <h3 className="text-xl font-bold text-blue-700 mb-2">
                      Putt Scorecard
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-center border border-gray-200 rounded-xl">
                        <thead>
                          <tr>
                            <th
                              className="px-2 py-2 text-base font-bold border-b border-gray-100 bg-blue-50 text-left whitespace-nowrap"
                              style={{ fontSize: "16px" }}
                            >
                              Hole
                            </th>
                            {players.map((p) => {
                              // Shrink columns for 2 players, expand for more
                              let maxWidth = "80px";
                              if (players.length === 3) maxWidth = "110px";
                              else if (players.length === 4) maxWidth = "130px";
                              else if (players.length > 4) maxWidth = "150px";
                              return (
                                <th
                                  key={p.user_id}
                                  className="px-1.5 py-2 text-xs font-semibold border-b border-gray-100 bg-blue-50 whitespace-nowrap overflow-hidden text-ellipsis"
                                  style={{ fontSize: "14px", maxWidth }}
                                >
                                  {p.name}
                                  {userId === p.user_id && (
                                    <span className="ml-1 text-[10px] text-neutral-400 font-bold">
                                      (You)
                                    </span>
                                  )}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 18 }, (_, i) => (
                            <tr key={i}>
                              <td
                                className="px-2 py-2 border-b border-gray-50 text-left font-semibold text-blue-900 whitespace-nowrap"
                                style={{ fontSize: "14px" }}
                              >
                                {i + 1}
                              </td>
                              {players.map((p) => {
                                let maxWidth = "80px";
                                if (players.length === 3) maxWidth = "110px";
                                else if (players.length === 4)
                                  maxWidth = "130px";
                                else if (players.length > 4) maxWidth = "150px";
                                const val = putts[p.id]?.[i + 1];
                                let numberContent = null;
                                let icon = null;
                                if (val == null || val === "") {
                                  numberContent = (
                                    <span className="text-gray-300">-</span>
                                  );
                                } else if (val === 0) {
                                  numberContent = (
                                    <CasinoZeroIcon animate={true} />
                                  );
                                  icon = (
                                    <span className="flex items-center">
                                      <StarIcon />
                                    </span>
                                  );
                                } else if (val === 1) {
                                  numberContent = (
                                    <span className="text-green-600 font-bold">
                                      1
                                    </span>
                                  );
                                  icon = (
                                    <span className="flex items-center">
                                      <SmileIcon />
                                    </span>
                                  );
                                } else if (val === 2) {
                                  numberContent = (
                                    <span className="text-black font-semibold">
                                      2
                                    </span>
                                  );
                                  icon = null;
                                } else if (val >= 3) {
                                  numberContent = (
                                    <span className="text-red-600 font-bold">
                                      {val}
                                    </span>
                                  );
                                  icon = (
                                    <span className="flex items-center">
                                      <FrownIcon />
                                    </span>
                                  );
                                } else {
                                  numberContent = <span>{val}</span>;
                                }
                                return (
                                  <td
                                    key={p.user_id}
                                    className="px-1.5 py-2 border-b border-gray-50 whitespace-nowrap overflow-hidden text-ellipsis"
                                    style={{ fontSize: "14px", maxWidth }}
                                  >
                                    <span className="flex flex-row items-center justify-center gap-0">
                                      {/* Number: always right-aligned in a fixed-width box */}
                                      <span className="inline-block text-right min-w-[22px] max-w-[22px] pr-0.5 align-middle">
                                        {numberContent}
                                      </span>
                                      {/* Icon: always left-aligned in a fixed-width box, so number never shifts */}
                                      <span className="inline-block min-w-[22px] max-w-[22px] ml-2 align-middle">
                                        {icon}
                                      </span>
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
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
                      Hole {Math.min(currentHole - 1, 18)}
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
        {/* Tabbed Poker Hand Section - File Tab Style */}
        <section className="w-full max-w-xl mx-auto flex flex-col gap-0">
          <h2 className="text-lg sm:text-xl font-bold text-blue-700 mb-2 tracking-wide uppercase text-center">
            Poker Hands
          </h2>
          {/* File-style tabs for each player */}
          <div
            className="flex items-end gap-0 mb-0 border-b-0 relative z-10"
            style={{ marginBottom: "-1px", marginTop: "0.5rem" }}
          >
            {players.map((p, idx) => {
              const isActive =
                selectedPlayerId === p.id || (!selectedPlayerId && idx === 0);
              return (
                <button
                  key={p.user_id}
                  className={`relative px-6 py-2 font-semibold text-base focus:outline-none transition-all duration-150
                    ${
                      isActive
                        ? "bg-white border-x border-t border-blue-400 text-blue-900 rounded-t-lg shadow z-20 -mb-px"
                        : "bg-blue-50 border-x border-t border-blue-200 text-blue-600 rounded-t-lg hover:bg-blue-100 z-10 mb-0"
                    }
                  `}
                  style={{ minWidth: 110 }}
                  onClick={() => setSelectedPlayerId(p.id)}
                >
                  {p.name}
                  {userId === p.user_id && (
                    <span className="ml-1 text-xs text-neutral-400 font-bold">
                      (You)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Show only selected player's hand */}
          <div
            className="w-full bg-white border border-blue-200 rounded-b-2xl shadow-xl p-8 flex flex-col items-center min-h-[180px] z-0"
            style={{ marginTop: "0px" }}
          >
            {(() => {
              const p =
                players.find((pl) => pl.id === selectedPlayerId) || players[0];
              if (!p) return null;
              return (
                <>
                  <span className="font-bold text-blue-900 mb-4 text-xl flex items-center gap-2 tracking-wide">
                    {session?.three_putt_chip_enabled &&
                      chipHolder === p.id && (
                        <span className="flex items-center gap-1 text-yellow-700 font-bold animate-bounce">
                          <CasinoChipIcon className="w-5 h-5" color="#eab308" />
                        </span>
                      )}
                    {p.name}
                    {userId === p.user_id && (
                      <span className="ml-1 text-xs text-neutral-500 font-bold">
                        (You)
                      </span>
                    )}
                  </span>
                  <div className="mb-4 flex flex-col gap-3 w-full items-center">
                    {loadingCards ? (
                      <div className="flex justify-center items-center w-full py-8">
                        <span className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-400 border-solid border-r-4 border-b-4 border-l-0"></span>
                      </div>
                    ) : (
                      (() => {
                        const cards = playerCards[p.id] || [];
                        const rows = [];
                        for (let r = 0; r < Math.ceil(cards.length / 7); r++) {
                          rows.push(
                            <div className="flex gap-3 justify-center" key={r}>
                              {cards
                                .slice(r * 7, r * 7 + 7)
                                .map((card, i) =>
                                  card ? (
                                    <PokerCard
                                      key={card.id || i + r * 7}
                                      card={card}
                                      faceDown={
                                        card.is_hidden && userId !== p.user_id
                                      }
                                    />
                                  ) : (
                                    <CardPlaceholder key={i + r * 7} />
                                  )
                                )}
                            </div>
                          );
                        }
                        if (cards.length === 0) {
                          rows.push(
                            <div
                              className="flex flex-col items-center justify-center text-gray-400 text-xs py-6 w-full"
                              key="empty"
                            >
                              <span className="text-3xl mb-2">🃏</span>
                              <span>No cards yet</span>
                            </div>
                          );
                        }
                        return rows;
                      })()
                    )}
                  </div>
                  {/* ...other player info/actions if needed... */}
                </>
              );
            })()}
          </div>
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
              {chipModalCandidates.length > 0 ? (
                chipModalCandidates.map((p) => (
                  <button
                    key={p.id}
                    className="flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 font-semibold px-4 py-2 rounded-lg border border-yellow-300 shadow transition"
                    onClick={() => assignChip(p.user_id)}
                  >
                    <CasinoChipIcon className="w-4 h-4" color="#eab308" />
                    {p.name}
                  </button>
                ))
              ) : (
                <span className="text-yellow-700 text-sm">
                  No chip candidates available.
                </span>
              )}
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
