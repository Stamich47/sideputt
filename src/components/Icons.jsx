// Use Heroicons React for established icons
import {
  CurrencyDollarIcon,
  FlagIcon,
  RectangleStackIcon as CardsIcon,
} from "@heroicons/react/24/outline";
import { FaStar, FaSmile, FaFrown } from "react-icons/fa";

// Use FlagIcon as a golf flag for 3-putt
export { CurrencyDollarIcon, CardsIcon, FlagIcon as ThreePuttIcon };
export function StarIcon({ className = "w-5 h-5 text-yellow-400" }) {
  return <FaStar className={className} />;
}
export function SmileIcon({ className = "w-5 h-5 text-green-500" }) {
  return <FaSmile className={className} />;
}
export function FrownIcon({ className = "w-5 h-5 text-red-400" }) {
  return <FaFrown className={className} />;
}
export function DollarBillIcon({ className = "w-4 h-4", color = "#dc2626" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1"
        y="1"
        width="18"
        height="12"
        rx="2"
        fill="#fee2e2"
        stroke={color}
        strokeWidth="1.5"
      />
      <circle
        cx="10"
        cy="7"
        r="3"
        fill="#fff1f2"
        stroke={color}
        strokeWidth="1"
      />
      <text
        x="10"
        y="9.5"
        textAnchor="middle"
        fontSize="6"
        fontWeight="bold"
        fill={color}
      >
        $
      </text>
    </svg>
  );
}
export function CasinoZeroIcon({
  className = "w-6 h-6",
  color = "#eab308",
  animate = false,
}) {
  return (
    <span className={animate ? "inline-block animate-bounce" : "inline-block"}>
      <svg
        className={className}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="16"
          y="24"
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fill={color}
          style={{
            filter: animate ? "drop-shadow(0 0 8px #facc15)" : "none",
            fontFamily: "monospace, sans-serif",
            letterSpacing: "2px",
          }}
        >
          0
        </text>
      </svg>
    </span>
  );
}
export function CasinoChipIcon({ className = "w-4 h-4", color = "#eab308" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        fill="#fffbe6"
      />
      <circle
        cx="12"
        cy="12"
        r="5"
        stroke={color}
        strokeWidth="2"
        fill="#fde68a"
      />
      <g stroke={color} strokeWidth="1.5">
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
        <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
        <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
        <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
        <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
      </g>
    </svg>
  );
}
