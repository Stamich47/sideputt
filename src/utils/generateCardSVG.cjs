// Card SVG generator for all 52 cards
// Usage: node src/utils/generateCardSVG.js
const fs = require("fs");
const path = require("path");

const suits = [
  { name: "hearts", symbol: "♥", color: "#dc2626", code: "H" },
  { name: "diamonds", symbol: "♦", color: "#dc2626", code: "D" },
  { name: "clubs", symbol: "♣", color: "#222", code: "C" },
  { name: "spades", symbol: "♠", color: "#222", code: "S" },
];
const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

function getFileName(rank, suitCode) {
  return `${rank}${suitCode}.svg`;
}

function getSVG(rank, suit) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
  <rect width="200" height="300" rx="16" fill="white" stroke="black" stroke-width="4"/>
  <text x="20" y="50" font-size="56" font-family="serif" font-weight="bold" fill="${suit.color}">${rank}</text>
  <text x="180" y="285" font-size="56" font-family="serif" font-weight="bold" fill="${suit.color}" text-anchor="end">${rank}</text>
  <text x="100" y="160" font-size="80" font-family="serif" fill="${suit.color}" text-anchor="middle" alignment-baseline="middle">${suit.symbol}</text>
</svg>`;
}

const outDir = path.join(__dirname, "../../public/assets/cards");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const suit of suits) {
  for (const rank of ranks) {
    const fileName = getFileName(rank, suit.code);
    const svg = getSVG(rank, suit);
    fs.writeFileSync(path.join(outDir, fileName), svg);
  }
}

console.log("All card SVGs generated in", outDir);
