import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/useAuth";

export default function NewGame() {
  const [mode, setMode] = useState("end");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("sessions")
      .insert({ creator_id: user.id, mode })
      .select()
      .single();
    if (error) setError(error.message);
    else navigate(`/game/${data.id}`);
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Create New Game</h2>
      <form onSubmit={handleCreate} className="flex flex-col gap-4">
        <label>
          Card Dealing Mode:
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="ml-2 p-1 border rounded"
          >
            <option value="end">Deal at End</option>
            <option value="perHolePublic">Deal After Hole (Public)</option>
            <option value="perHolePrivate">Deal After Hole (Private)</option>
          </select>
        </label>
        <button
          type="submit"
          className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Game"}
        </button>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </form>
    </div>
  );
}
