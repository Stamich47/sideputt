import React from "react";
import { SUITS } from "../utils/cardUtils";

export function PokerCard({ card, faceDown = false, onClick, className = "" }) {
  // Customization options:
  // - Use the 'className' prop to override or extend styles (e.g., add shadow, change border, etc.)
  // - Use the 'onClick' prop for interactive cards
  // - Use the 'faceDown' prop to show the card back
  // - You can further style with Tailwind or custom CSSg
  // Map rank and suit to asset filename
  if (faceDown) {
    return (
      <img
        src={"/assets/cards/back_bicycle.svg"}
        alt="Card back"
        className={`w-16 h-24 rounded-lg border border-gray-500 select-none ${className}`}
        onClick={onClick}
        style={{ cursor: onClick ? "pointer" : "default" }}
      />
    );
  }
  if (!card || !card.rank || !card.suit) {
    return null;
  }
  // Convert suit to code (H, D, C, S)
  const suitMap = { hearts: "H", diamonds: "D", clubs: "C", spades: "S" };
  const suitCode = suitMap[card.suit];
  const rank = card.rank;
  const assetPath = `/assets/cards/${rank}${suitCode}.svg`;
  return (
    <img
      src={assetPath}
      alt={`${rank} of ${card.suit}`}
      className={`w-16 h-24 rounded-lg border border-gray-500 select-none ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    />
  );
}
