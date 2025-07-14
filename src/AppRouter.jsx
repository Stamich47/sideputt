import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";

import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard";
import HoleTracker from "./pages/HoleTracker";
import NotFound from "./pages/NotFound";
import NewGame from "./pages/NewGame";
import Navbar from "./components/Navbar";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

function Layout() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-56px)] bg-gray-100 p-4">
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
                <HoleTracker />
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
        <Route path="/*" element={<Layout />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
