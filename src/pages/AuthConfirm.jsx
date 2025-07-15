import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function AuthConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const type = searchParams.get("type");
    const email = searchParams.get("email");
    if (token && type === "recovery" && email) {
      supabase.auth
        .verifyOtp({ type: "recovery", token, email })
        .then(({ error }) => {
          if (error) {
            setError(error.message || JSON.stringify(error));
          } else {
            setShowReset(true);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setError("Invalid link.");
      setLoading(false);
    }
  }, [searchParams]);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setFormError("");
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setFormError(error.message);
    } else {
      navigate("/login?reset=success");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return showReset ? (
    <div className="relative rounded-[2.5rem] w-full max-w-xs sm:max-w-md md:max-w-lg mx-auto overflow-hidden border border-white/60 bg-white/80 backdrop-blur-lg shadow-2xl p-6 sm:p-10 md:p-12 mt-12">
      {/* Decorative golf grass at the bottom using SVG */}
      <div className="absolute left-0 right-0 bottom-0 h-10 flex items-end pointer-events-none select-none">
        <svg
          viewBox="0 0 400 40"
          width="100%"
          height="40"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <rect x="0" y="20" width="400" height="20" fill="#22c55e" />
          <path
            d="M0,30 Q20,10 40,30 T80,30 T120,30 T160,30 T200,30 T240,30 T280,30 T320,30 T360,30 T400,30 V40 H0Z"
            fill="#16a34a"
          />
          <path
            d="M10,35 Q20,25 30,35 Q40,25 50,35 Q60,25 70,35 Q80,25 90,35 Q100,25 110,35 Q120,25 130,35 Q140,25 150,35 Q160,25 170,35 Q180,25 190,35 Q200,25 210,35 Q220,25 230,35 Q240,25 250,35 Q260,25 270,35 Q280,25 290,35 Q300,25 310,35 Q320,25 330,35 Q340,25 350,35 Q360,25 370,35 Q380,25 390,35"
            stroke="#166534"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">
        Set New Password
      </h2>
      <form onSubmit={handleReset} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Enter your new password
        </label>
        <input
          type="password"
          className="w-full px-3 py-2 border-2 border-gray-200 bg-gray-50 rounded-lg shadow-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="New password"
        />
        <input
          type="password"
          className="w-full px-3 py-2 border-2 border-gray-200 bg-gray-50 rounded-lg shadow-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Confirm new password"
        />
        {formError && <div className="text-red-600 text-sm">{formError}</div>}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition"
          disabled={loading}
        >
          {loading ? "Updating..." : "Set New Password"}
        </button>
      </form>
    </div>
  ) : null;
}
