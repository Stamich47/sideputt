import React, { useState, useEffect } from "react";
import birdie from "../assets/birdie.png";
import { supabase } from "../lib/supabaseClient";

export default function AuthPage() {
  const [mode, setMode] = useState("signin");
  const [showRecovery, setShowRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryInfo, setRecoveryInfo] = useState("");
  // Always show recovery form if type=recovery is in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("type") === "recovery") {
      setShowRecovery(true);
      setMode("recovery");
    } else {
      setShowRecovery(false);
    }
  }, []);
  const [resetEmail, setResetEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      let result;
      if (mode === "recovery") {
        // Handle set new password
        setRecoveryError("");
        setRecoveryInfo("");
        if (!newPassword || newPassword.length < 6) {
          setRecoveryError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }
        // Get tokens from URL if present
        const params = new URLSearchParams(window.location.search);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const expires_in = params.get("expires_in");
        const token_type = params.get("token_type");
        if (access_token && refresh_token) {
          // Set session before updating password (pass all possible fields)
          const sessionObj = {
            access_token,
            refresh_token,
          };
          if (expires_in) sessionObj.expires_in = Number(expires_in);
          if (token_type) sessionObj.token_type = token_type;
          const { error: sessionError } = await supabase.auth.setSession(
            sessionObj
          );
          if (sessionError) {
            setRecoveryError("Session error: " + sessionError.message);
            setLoading(false);
            return;
          }
        }
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) {
          setRecoveryError(error.message);
        } else {
          setRecoveryInfo(
            "Password updated! You can now sign in with your new password."
          );
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
        }
        setLoading(false);
        return;
      } else if (mode === "reset") {
        // Password reset flow
        setError("");
        setInfo("");
        if (!resetEmail) {
          setError("Please enter your email address.");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
        if (error) {
          setError(error.message);
        } else {
          setInfo("Password reset email sent! Please check your inbox.");
        }
        setLoading(false);
        return;
      } else if (mode === "signin") {
        // Sign in with email
        result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) {
          setError(result.error.message);
        } else {
          // Redirect to dashboard after successful sign-in (full reload for password manager support)
          window.location.href = "/";
        }
      } else {
        // Sign up with email and display name
        if (!displayName) {
          setError("Please enter a display name.");
          setLoading(false);
          return;
        }
        result = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: displayName } },
        });
        if (result.error) {
          const msg = result.error.message.toLowerCase();
          if (
            msg.includes("user already registered") ||
            msg.includes("already registered")
          ) {
            setError(
              "This email is already registered. Please sign in or use password reset."
            );
          } else if (msg.includes("rate limit")) {
            setError("Too many sign up attempts. Please wait and try again.");
          } else {
            setError(result.error.message);
          }
        } else if (
          result.data?.user &&
          Array.isArray(result.data.user.identities) &&
          result.data.user.identities.length === 0
        ) {
          // Supabase returns a user object with empty identities array if the user already exists and is confirmed
          setError(
            "This email is already registered. Please sign in or use password reset."
          );
        } else {
          setInfo(
            "Sign up successful! Please check your email for a verification link before signing in."
          );
          setEmail("");
          setPassword("");
          setDisplayName("");
        }
      }
    } catch {
      setError("Unexpected error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background:
          "linear-gradient(to bottom, #eaf3fb 0%, #eaf3fb 60%, #d1f7e7 100%)",
      }}
    >
      {/* Logo/Header outside the box */}
      <div className="flex flex-col items-center mb-10 mt-8">
        <div className="flex items-end gap-2">
          {/* PNG golf ball icon, left of text and aligned to bottom */}
          <img
            src={birdie}
            alt="Golf ball"
            className="w-8 h-8 object-contain drop-shadow"
            style={{ marginBottom: "3px" }}
          />
          <span className="text-5xl font-extrabold tracking-tight text-gray-900 select-none font-sans drop-shadow-sm">
            Side<span className="text-green-600">Putt</span>
          </span>
        </div>
      </div>
      <div
        className="relative rounded-[2.5rem] w-full max-w-xs sm:max-w-md md:max-w-lg mx-auto overflow-hidden border border-white/60 bg-white/80 backdrop-blur-lg shadow-2xl p-6 sm:p-10 md:p-12"
        style={{
          background:
            "linear-gradient(135deg, rgba(185,230,254,0.85) 0%, rgba(185,230,254,0.65) 60%, rgba(255,255,255,0.45) 100%)",
          minHeight: "440px",
        }}
      >
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
          {showRecovery
            ? "Set New Password"
            : mode === "signin"
            ? "Sign In"
            : mode === "reset"
            ? "Reset Password"
            : "Sign Up"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {showRecovery ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter your new password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border-2 border-gray-200 bg-gray-50 rounded-lg shadow-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="New password"
              />
              {recoveryError && (
                <div className="text-red-600 text-sm">{recoveryError}</div>
              )}
              {recoveryInfo && (
                <div className="text-green-700 text-sm font-semibold">
                  {recoveryInfo}
                </div>
              )}
              <button
                type="submit"
                className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition"
                disabled={loading}
              >
                {loading ? "Updating..." : "Set New Password"}
              </button>
            </>
          ) : mode === "reset" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter your email to reset password
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border-2 border-gray-200 bg-gray-50 rounded-lg shadow-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          ) : (
            <>
              {mode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border-2 border-gray-200 bg-gray-50 rounded-lg shadow-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    autoComplete="nickname"
                    placeholder="e.g. Tiger Woods"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border-2 border-gray-200 bg-gray-50 rounded-lg shadow-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border-2 border-gray-200 bg-gray-50 rounded-lg shadow-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={
                    mode === "signin"
                      ? "current-password"
                      : mode === "signup"
                      ? "new-password"
                      : undefined
                  }
                />
              </div>
              {mode === "signin" && (
                <div className="text-right">
                  <button
                    type="button"
                    className="text-indigo-600 hover:underline text-xs"
                    onClick={() => {
                      setMode("reset");
                      setError("");
                      setInfo("");
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </>
          )}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {info && (
            <div className="text-green-700 text-sm font-semibold">{info}</div>
          )}
          {mode !== "recovery" && (
            <button
              type="submit"
              className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition"
              disabled={loading}
            >
              {mode === "reset"
                ? loading
                  ? "Sending..."
                  : "Send Reset Email"
                : loading
                ? mode === "signin"
                  ? "Signing In..."
                  : "Signing Up..."
                : mode === "signin"
                ? "Sign In"
                : "Sign Up"}
            </button>
          )}
        </form>
        {!showRecovery && (
          <div className="mt-4 text-center text-sm text-gray-600">
            {mode === "signin" && (
              <>
                Don't have an account?{" "}
                <button
                  className="text-indigo-600 hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Sign Up
                </button>
              </>
            )}
            {mode === "signup" && (
              <>
                Already have an account?{" "}
                <button
                  className="text-indigo-600 hover:underline"
                  onClick={() => setMode("signin")}
                >
                  Sign In
                </button>
              </>
            )}
            {mode === "reset" && (
              <>
                Remembered your password?{" "}
                <button
                  className="text-indigo-600 hover:underline"
                  onClick={() => setMode("signin")}
                >
                  Back to Sign In
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-500">
        Designed by{" "}
        <a
          href="https://mjswebdesign.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-700 hover:underline font-semibold"
        >
          MJS Web Design
        </a>
      </footer>
    </div>
  );
}
