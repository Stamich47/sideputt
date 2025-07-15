import { supabase } from "../lib/supabaseClient";

// Utility: Create 18 holes for a session
export async function createHolesForSession(sessionId) {
  console.log(`[createHolesForSession] called for sessionId:`, sessionId);
  // Check if holes already exist for this session
  let { data: existingHoles, error: checkError } = await supabase
    .from("holes")
    .select("id, number")
    .eq("session_id", sessionId);
  if (checkError) throw checkError;
  if (existingHoles && existingHoles.length > 0) {
    console.log(
      `[createHolesForSession] Holes already exist for sessionId:`,
      sessionId,
      `Count:`,
      existingHoles.length
    );
    return existingHoles;
  }
  // Insert 18 holes if none exist
  console.log(
    `[createHolesForSession] Inserting 18 holes for sessionId:`,
    sessionId
  );
  const { error } = await supabase.from("holes").insert(
    Array.from({ length: 18 }, (_, i) => ({
      session_id: sessionId,
      number: i + 1,
    }))
  );
  if (error) {
    if (
      error.code === "23505" ||
      (error.details && error.details.includes("duplicate"))
    ) {
      // Unique violation, likely due to race condition, safe to ignore
      console.warn(
        `[createHolesForSession] Duplicate holes insert detected for sessionId:`,
        sessionId
      );
    } else {
      throw error;
    }
  }
  // Always fetch and return unique holes after insert
  const { data: allHoles, error: fetchError } = await supabase
    .from("holes")
    .select("id, number")
    .eq("session_id", sessionId);
  if (fetchError) throw fetchError;
  // Remove duplicates by number (shouldn't happen with unique constraint)
  const uniqueHoles = Object.values(
    (allHoles || []).reduce((acc, h) => {
      acc[h.number] = h;
      return acc;
    }, {})
  );
  console.log(
    `[createHolesForSession] Returning holes for sessionId:`,
    sessionId,
    `Count:`,
    uniqueHoles.length
  );
  return uniqueHoles;
}

// Utility: Create 18 putts for a player in a session
export async function createPuttsForPlayer(sessionId, sessionPlayerId) {
  console.log(
    `[createPuttsForPlayer] called for sessionId:`,
    sessionId,
    `playerId:`,
    sessionPlayerId
  );
  // Get all holes for this session
  const { data: holes, error: holesError } = await supabase
    .from("holes")
    .select("id")
    .eq("session_id", sessionId);
  if (holesError) throw holesError;
  // Get all existing putts for this player/session
  const { data: existingPutts, error: checkError } = await supabase
    .from("putts")
    .select("hole_id")
    .eq("session_id", sessionId)
    .eq("player_id", sessionPlayerId);
  if (checkError) throw checkError;
  const existingHoleIds = new Set((existingPutts || []).map((p) => p.hole_id));
  // Only insert putts for holes that don't already have a putt for this player
  const puttsRows = holes
    .filter((hole) => !existingHoleIds.has(hole.id))
    .map((hole) => ({
      hole_id: hole.id,
      session_id: sessionId,
      player_id: sessionPlayerId,
      num_putts: null,
      chip_holder: false,
    }));
  if (puttsRows.length > 0) {
    console.log(
      `[createPuttsForPlayer] Inserting putts for sessionId:`,
      sessionId,
      `playerId:`,
      sessionPlayerId,
      `Count:`,
      puttsRows.length
    );
    const { error: puttsError } = await supabase
      .from("putts")
      .insert(puttsRows);
    if (puttsError) {
      // Ignore duplicate errors (race condition)
      if (!puttsError.message.includes("duplicate")) {
        throw puttsError;
      }
    }
    console.log(
      `[createPuttsForPlayer] Inserted putts for sessionId:`,
      sessionId,
      `playerId:`,
      sessionPlayerId
    );
  } else {
    console.log(
      `[createPuttsForPlayer] All putts already exist for sessionId:`,
      sessionId,
      `playerId:`,
      sessionPlayerId
    );
  }
}
