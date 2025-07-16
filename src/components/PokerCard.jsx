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
  if (faceDown) {
    return (
      <div
        className={`w-10 h-14 bg-gray-300 rounded-lg border border-gray-500 flex items-center justify-center text-2xl font-bold select-none ${className}`}
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
      className={`w-10 h-14 bg-white rounded-lg border border-gray-500 flex flex-col justify-between p-1 text-xs font-bold select-none ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <span className={color}>{rank}</span>
      <span className={`self-end ${color}`}>{symbol}</span>
    </div>
  );
}
