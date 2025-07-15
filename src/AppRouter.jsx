import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";

import AuthPage from "./pages/AuthPage.jsx";
import AuthConfirm from "./pages/AuthConfirm.jsx";
import Dashboard from "./pages/Dashboard";
import Game from "./pages/Game";
import NotFound from "./pages/NotFound";
import NewGame from "./pages/NewGame";
import Navbar from "./components/Navbar";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  // If the URL contains type=recovery, do NOT redirect, always show children (AuthPage)
  const params = new URLSearchParams(window.location.search);
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (params.get("type") === "recovery") {
    return children;
  }
  return user ? children : <Navigate to="/login" />;
}

function Layout() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-56px)]">
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/game/new"
            element={
              <PrivateRoute>
                <NewGame />
              </PrivateRoute>
            }
          />
          <Route
            path="/game/:id"
            element={
              <PrivateRoute>
                <Game />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/auth/confirm" element={<AuthConfirm />} />
        <Route path="/*" element={<Layout />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
