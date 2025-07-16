// Card deck utilities for Three Putt Poker
export const SUITS = ["hearts", "diamonds", "clubs", "spades"];
export const RANKS = [
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

// Create a deck (optionally multiple decks)
export function createDeck(numDecks = 1) {
  const deck = [];
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank });
      }
    }
  }
  return deck;
}

// Fisher-Yates shuffle
export function shuffleDeck(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Deal n cards from the deck (returns [cards, newDeck])
export function dealCards(deck, n) {
  return [deck.slice(0, n), deck.slice(n)];
}
