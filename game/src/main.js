/**
 * main.js — the duel's state machine. It owns the turn sequence, keeps the
 * rival's intent honest, and feeds the same renderer for play and screenshots.
 */

import { buildDeck, drawCards, makeRandom, counterTo, SUITS } from './deck.js';
import { scorePlay } from './rules.js';
import { chooseRivalIntent, chooseRivalPlay } from './opponent.js';
import {
  showScreen, drawHand, updateHandClasses, renderStatus,
  renderArena, renderResult, setPlayEnabled,
} from './render.js';
import { bindInput } from './input.js';

const HAND_SIZE = 5;
const MAX_LIGHT = 4;

const state = {
  seed: 1,
  random: makeRandom(1),
  drawPile: [],
  discardPile: [],
  hand: [],
  rivalHand: [],
  rivalLife: 20,
  playerLife: 20,
  energy: MAX_LIGHT,
  intent: { suit: 'tide', value: 4 },
  selected: new Set(),
  turn: 1,
  lastPlayerSuit: null,
  lastParry: false,
  arena: [],
  banner: '',
  busy: false,
  stats: { dealt: 0, best: 0 },
};

function selectedCost() {
  let total = 0;
  for (const index of state.selected) total += state.hand[index].cost;
  return total;
}

function selectedCards() {
  return [...state.selected].sort((a, b) => a - b).map((index) => state.hand[index]);
}

function refreshHands() {
  drawHand('player-hand', state.hand, { selected: state.selected, energy: state.energy });
  drawHand('rival-hand', state.rivalHand, { faceDown: true });
}

function refreshAll() {
  refreshHands();
  renderStatus(state);
  renderArena(state.arena, state.banner);
  setPlayEnabled(!state.busy && state.selected.size > 0);
}

function newGame(seed = Date.now() % 1000000) {
  state.seed = seed;
  state.random = makeRandom(seed);
  state.drawPile = buildDeck(seed);
  state.discardPile = [];
  state.hand = drawCards(state.drawPile, state.discardPile, HAND_SIZE, state.random);
  state.rivalHand = drawCards(state.drawPile, state.discardPile, HAND_SIZE, state.random);
  state.rivalLife = 20;
  state.playerLife = 20;
  state.energy = MAX_LIGHT;
  state.intent = chooseRivalIntent(state.random, null);
  state.selected.clear();
  state.turn = 1;
  state.lastPlayerSuit = null;
  state.lastParry = false;
  state.arena = [];
  state.banner = '';
  state.busy = false;
  state.stats = { dealt: 0, best: 0 };
  showScreen('play');
  refreshAll();
}

function toggleCard(index) {
  if (state.busy || index < 0 || index >= state.hand.length) return;
  if (state.selected.has(index)) {
    state.selected.delete(index);
  } else {
    const nextCost = selectedCost() + state.hand[index].cost;
    if (nextCost > state.energy) return;
    state.selected.add(index);
  }
  updateHandClasses('player-hand', state.hand, state.selected, state.energy);
  setPlayEnabled(state.selected.size > 0);
}

function refill(cards, discarded) {
  state.discardPile.push(...discarded);
  cards.push(...drawCards(state.drawPile, state.discardPile, discarded.length, state.random));
}

function finish(won) {
  state.busy = false;
  renderResult(state, won);
}

function playSelected() {
  if (state.busy || state.selected.size === 0) return;
  const cards = selectedCards();
  const outcome = scorePlay(cards, state.intent);
  const played = [...state.selected];

  state.busy = true;
  setPlayEnabled(false);
  state.rivalLife = Math.max(0, state.rivalLife - outcome.damage - outcome.reflected);
  state.stats.dealt += outcome.damage;
  state.stats.best = Math.max(state.stats.best, outcome.damage);
  state.lastParry = outcome.parried;
  state.arena = cards;
  state.banner = outcome.notes.length > 1 ? outcome.notes.join(' · ') : outcome.banner;
  state.energy -= selectedCost();
  state.lastPlayerSuit = cards[cards.length - 1].suit;
  renderStatus(state);
  renderArena(state.arena, state.banner);

  const spent = played.map((index) => state.hand[index]);
  refill(state.hand, spent);
  state.selected.clear();
  updateHandClasses('player-hand', state.hand, state.selected, state.energy);
  setPlayEnabled(false);

  if (state.rivalLife <= 0) {
    window.setTimeout(() => finish(true), 850);
    return;
  }

  window.setTimeout(() => {
    const rivalCards = chooseRivalPlay(state.rivalHand, state.intent, state.lastPlayerSuit);
    const rivalIndices = rivalCards.map((card) => state.rivalHand.indexOf(card));
    state.playerLife = Math.max(0, state.playerLife - outcome.incoming);
    refill(state.rivalHand, rivalCards);
    void rivalIndices;
    state.intent = chooseRivalIntent(state.random, state.lastPlayerSuit);
    state.energy = MAX_LIGHT;
    state.turn += 1;
    state.busy = false;
    if (state.playerLife <= 0) finish(false);
    else refreshAll();
  }, 950);
}

function enterAction() {
  const active = document.querySelector('.screen.active')?.id;
  if (active === 'screen-title') newGame();
  else if (active === 'screen-play') playSelected();
  else newGame();
}

function shotMode(shot) {
  newGame(7);
  if (shot === 'start') {
    showScreen('title');
    return;
  }
  if (shot === 'play') {
    state.rivalLife = 13;
    state.playerLife = 16;
    state.energy = 2;
    state.turn = 3;
    state.intent = { suit: 'tide', value: 5 };
    state.lastParry = false;
    const cheap = state.hand
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => card.cost <= 1)
      .slice(0, 2);
    for (const { index } of cheap) state.selected.add(index);
    state.arena = [state.hand[2], state.hand[3]].filter(Boolean);
    state.banner = 'RESONANCE +2 · EXPLOIT +3';
    renderStatus(state);
    renderArena(state.arena, state.banner);
    updateHandClasses('player-hand', state.hand, state.selected, state.energy);
    setPlayEnabled(state.selected.size > 0);
    return;
  }
  if (shot === 'win') {
    state.rivalLife = 0;
    state.playerLife = 11;
    state.turn = 7;
    state.stats = { dealt: 63, best: 17 };
    renderResult(state, true);
    return;
  }
  if (shot === 'loss') {
    state.playerLife = 0;
    state.rivalLife = 8;
    state.turn = 6;
    state.stats = { dealt: 44, best: 13 };
    renderResult(state, false);
  }
}

bindInput({ start: () => newGame(), play: playSelected, restart: () => newGame(), toggle: toggleCard, enter: enterAction });

const shot = new URLSearchParams(location.search).get('shot');
if (shot) shotMode(shot);
else showScreen('title');
