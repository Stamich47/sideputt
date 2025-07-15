import { supabase } from "../lib/supabaseClient";

// Utility: Create 18 holes for a session
export async function createHolesForSession(sessionId) {
  const { data: holes, error } = await supabase
    .from("holes")
    .insert(
      Array.from({ length: 18 }, (_, i) => ({
        session_id: sessionId,
        number: i + 1,
      }))
    )
    .select();
  if (error) throw error;
  return holes;
}

// Utility: Create 18 putts for a player in a session
export async function createPuttsForPlayer(sessionId, sessionPlayerId) {
  // Get all holes for this session
  const { data: holes, error: holesError } = await supabase
    .from("holes")
    .select("id")
    .eq("session_id", sessionId);
  if (holesError) throw holesError;
  const puttsRows = holes.map((hole) => ({
    hole_id: hole.id,
    session_id: sessionId,
    player_id: sessionPlayerId,
    num_putts: null,
    chip_holder: false,
  }));
  const { error: puttsError } = await supabase.from("putts").insert(puttsRows);
  if (puttsError) throw puttsError;
}
