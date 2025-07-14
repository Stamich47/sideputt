import { useAuth } from "../context/useAuth";
import TailwindTest from "../components/TailwindTest";

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Welcome, {user?.email || "Player"}!
      </h1>
      <p>Your games and history will appear here.</p>
      <TailwindTest />
    </div>
  );
}
