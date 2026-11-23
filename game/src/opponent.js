/**
 * opponent.js — the rival's telegraphed intent and its hand choice.
 * The rival always favours the flame you leaned on last turn, so its
 * intent is legible and its habits can be countered.
 */

import { SUIT_IDS, counterTo } from './deck.js';

export function chooseRivalIntent(random, lastPlayerSuit) {
  const favoured = SUIT_IDS.includes(lastPlayerSuit) && random() < 0.55
    ? counterTo(lastPlayerSuit)
    : SUIT_IDS[Math.floor(random() * SUIT_IDS.length)];
  return {
    suit: favoured,
    value: 3 + Math.floor(random() * 4),
  };
}

export function chooseRivalPlay(hand, intent, lastPlayerSuit) {
  const wanted = intent?.suit ?? lastPlayerSuit;
  const sorted = [...hand].sort((a, b) => {
    const matchB = (b.suit === wanted ? 10 : 0) + b.value;
    const matchA = (a.suit === wanted ? 10 : 0) + a.value;
    return matchB - matchA;
  });
  return sorted.slice(0, 2);
}
