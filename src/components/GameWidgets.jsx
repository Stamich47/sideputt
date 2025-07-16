import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

// Show the putts for a player for the selected hole (non-hosts)
export function PuttsDisplay({ playerId, currentHole, sessionId }) {
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
export const CardPlaceholder = () => (
  <div className="w-10 h-14 bg-gray-200 rounded-lg border border-gray-400 flex items-center justify-center text-lg font-bold text-gray-500">
    🂠
  </div>
);
