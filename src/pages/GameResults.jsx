import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { PokerCard } from "../components/PokerCard";

export default function GameResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [playerCards, setPlayerCards] = useState({});
  const [revealIndex, setRevealIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch players in join order (host first)
      const { data: playerData } = await supabase
        .from("session_players")
        .select("*")
        .eq("session_id", id)
        .order("is_creator", { ascending: false })
        .order("id", { ascending: true });
      setPlayers(playerData || []);
      // Fetch all cards for this session
      const { data: cards } = await supabase
        .from("cards")
        .select("id, session_player_id, suit, rank, is_hidden, hole_id")
        .eq("session_id", id);
      // Group by player
      const grouped = {};
      for (const row of cards || []) {
        if (!grouped[row.session_player_id])
          grouped[row.session_player_id] = [];
        grouped[row.session_player_id].push(row);
      }
      setPlayerCards(grouped);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  // Animate reveal: every 2s, show next player
  useEffect(() => {
    if (loading || revealIndex >= players.length) return;
    const timer = setTimeout(() => {
      setRevealIndex((i) => i + 1);
    }, 2000);
    return () => clearTimeout(timer);
  }, [revealIndex, players.length, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-xl text-gray-500">Loading results...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-green-50 via-blue-50 to-green-100 px-2">
      <header className="w-full max-w-3xl mt-10 mb-8 px-4 flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-green-800 tracking-tight w-full text-center">
          Game Results
        </h1>
      </header>
      <main className="w-full max-w-3xl flex flex-col gap-8 items-center">
        {players.map((p, idx) => (
          <div
            key={p.id}
            className={`w-full bg-white rounded-2xl shadow border border-green-100 p-5 mb-2 transition-all duration-700 ${
              idx <= revealIndex ? "opacity-100" : "opacity-30 blur-sm"
            }`}
            style={{ pointerEvents: idx <= revealIndex ? "auto" : "none" }}
          >
            <h2 className="text-xl font-bold text-blue-700 mb-2 text-center">
              {p.name}{" "}
              {p.is_creator ? (
                <span className="text-xs text-green-600">(Host)</span>
              ) : null}
            </h2>
            {/* Cards: wrap after 5 per row */}
            <div className="flex flex-col gap-3 items-center justify-center">
              {(() => {
                const cards = playerCards[p.id] || [];
                const rows = [];
                for (let r = 0; r < Math.ceil(cards.length / 5); r++) {
                  rows.push(
                    <div className="flex gap-3 justify-center" key={r}>
                      {cards.slice(r * 5, r * 5 + 5).map((card, i) => (
                        <PokerCard
                          key={card.id || i + r * 5}
                          card={{ ...card, is_hidden: false }}
                          faceDown={false}
                        />
                      ))}
                    </div>
                  );
                }
                return rows;
              })()}
            </div>
          </div>
        ))}
      </main>
      <footer className="w-full max-w-3xl flex justify-center mt-10 mb-8">
        <button
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-xl shadow border border-green-500"
          onClick={() => navigate("/")}
        >
          Back to Home
        </button>
      </footer>
    </div>
  );
}
