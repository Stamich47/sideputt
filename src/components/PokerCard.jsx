import React from "react";
import { SUITS } from "../utils/cardUtils";

// Unicode suit symbols and colors
const suitSymbols = {
  hearts: { symbol: "♥", color: "text-red-500" },
  diamonds: { symbol: "♦", color: "text-red-500" },
  clubs: { symbol: "♣", color: "text-black" },
  spades: { symbol: "♠", color: "text-black" },
};

export function PokerCard({ card, faceDown = false, onClick, className = "" }) {
  // Customization options:
  // - Use the 'className' prop to override or extend styles (e.g., add shadow, change border, etc.)
  // - Use the 'onClick' prop for interactive cards
  // - Use the 'faceDown' prop to show the card back
  // - You can further style with Tailwind or custom CSS
  if (faceDown) {
    return (
      <div
        className={`w-16 h-24 bg-gray-300 rounded-lg border border-gray-500 flex items-center justify-center text-2xl font-bold select-none ${className}`}
        onClick={onClick}
        style={{ cursor: onClick ? "pointer" : "default" }}
      >
        🂠
      </div>
    );
  }
  if (!card) {
    return null;
  }
  const { suit, rank } = card;
  const { symbol, color } = suitSymbols[suit] || {};
  return (
    <div
      className={`w-16 h-24 bg-white rounded-lg border border-gray-500 relative select-none font-bold ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* Top-left rank */}
      <span className={`absolute top-2 left-2 text-base ${color}`}>{rank}</span>
      {/* Center suit symbol */}
      <span
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl ${color}`}
      >
        {symbol}
      </span>
      {/* Bottom-right rank */}
      <span className={`absolute bottom-2 right-2 text-base ${color}`}>
        {rank}
      </span>
    </div>
  );
}
