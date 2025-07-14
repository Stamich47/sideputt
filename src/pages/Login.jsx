import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import TailwindTest from "../components/TailwindTest";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setMessage(error.message);
    else setMessage("Check your email for the login link!");
    setLoading(false);
  };

  const handleOAuth = async (provider) => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) setMessage(error.message);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <TailwindTest />
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-80 flex flex-col gap-4"
      >
        <h1 className="text-2xl font-bold mb-2 text-center">
          3-Putt Poker Login
        </h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Loading..." : "Login with Email"}
        </button>
        <div className="flex flex-col gap-2 mt-2">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            className="bg-red-500 text-white py-2 rounded hover:bg-red-600"
          >
            Login with Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("github")}
            className="bg-gray-800 text-white py-2 rounded hover:bg-gray-900"
          >
            Login with GitHub
          </button>
        </div>
        {message && (
          <div className="text-center text-sm text-gray-700 mt-2">
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
