/**
 * rules.js — pure scoring for one play. Every bonus is earned by the cards
 * actually laid down, so the number on the banner is never a mystery.
 */

import { SUITS, counterTo } from './deck.js';

export function scorePlay(cards, rivalIntent) {
  const damage = cards.reduce((sum, card) => sum + card.value, 0);
  const notes = [];
  const counts = new Map();
  const present = new Set();

  for (const card of cards) {
    counts.set(card.suit, (counts.get(card.suit) ?? 0) + 1);
    present.add(card.suit);
  }

  let resonance = 0;
  for (const times of counts.values()) resonance += (times - 1) * 2;
  if (resonance > 0) {
    notes.push(`Resonance +${resonance}`);
  }

  let prism = 0;
  if (present.size === 3 && cards.length >= 3) {
    prism = 4;
    notes.push('Prism +4');
  }

  const weakness = counterTo(rivalIntent?.suit);
  let exploit = 0;
  if (weakness && present.has(weakness)) {
    exploit = 3;
    notes.push(`Exploit +${3}`);
  }

  const parrySuit = counterTo(rivalIntent?.suit);
  const parried = Boolean(parrySuit && present.has(parrySuit));
  const incoming = Math.max(0, (rivalIntent?.value ?? 0) - (parried ? 3 : 0));

  return {
    damage: damage + resonance + prism + exploit,
    incoming,
    reflected: parried ? 2 : 0,
    parried,
    notes,
    banner: notes[0] ?? 'CLEAN STRIKE',
  };
}

export function suitLabel(suitId) {
  return SUITS[suitId]?.name ?? 'Unknown';
}
