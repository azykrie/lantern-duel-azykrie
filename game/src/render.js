/**
 * render.js — paints the table, the hands, the intent and the result screens.
 * Only this file touches the DOM; the rules stay pure and testable.
 */

import { SUITS, counterTo } from './deck.js';

const byId = (id) => document.getElementById(id);

export function showScreen(name) {
  for (const screen of document.querySelectorAll('.screen')) {
    screen.classList.toggle('active', screen.id === `screen-${name}`);
  }
}

function pipRow(count) {
  return `<span class="cost">${'<i></i>'.repeat(count)}</span>`;
}

export function createCardElement(card, options = {}) {
  const el = document.createElement('div');
  el.className = `card suit-${card.suit}`;
  if (options.faceDown) el.classList.add('face-down');
  if (options.selected) el.classList.add('selected');
  if (options.unaffordable) el.classList.add('unaffordable');
  if (options.index !== undefined) el.dataset.index = String(options.index);
  const suit = SUITS[card.suit];
  el.style.setProperty('--c', suit.color);
  if (!options.faceDown) {
    el.innerHTML = `
      <span class="value">${card.value}</span>
      <span class="glyph">${suit.glyph}</span>
      ${pipRow(card.cost)}
      <span class="suit-name">${suit.name.toUpperCase()}</span>`;
  }
  return el;
}

export function drawHand(containerId, cards, options = {}) {
  const container = byId(containerId);
  container.replaceChildren();
  cards.forEach((card, index) => {
    container.append(createCardElement(card, {
      ...options,
      index: options.faceDown ? undefined : index,
      selected: options.selected?.has(index) ?? false,
      unaffordable: !options.faceDown && card.cost > options.energy,
    }));
  });
}

export function updateHandClasses(containerId, hand, selected, energy) {
  const container = byId(containerId);
  [...container.children].forEach((el, index) => {
    el.classList.toggle('selected', selected.has(index));
    el.classList.toggle('unaffordable', hand[index].cost > energy);
  });
}

export function renderStatus(state) {
  byId('rival-life').textContent = String(state.rivalLife);
  byId('player-life').textContent = String(state.playerLife);
  byId('rival-life-fill').style.width = `${Math.max(0, state.rivalLife) / 20 * 100}%`;
  byId('player-life-fill').style.width = `${Math.max(0, state.playerLife) / 20 * 100}%`;
  byId('energy-text').textContent = `${state.energy} / 4`;
  byId('energy-pips').innerHTML = '<i></i>'.repeat(0) +
    Array.from({ length: 4 }, (_, i) => `<i class="${i < state.energy ? 'on' : ''}"></i>`).join('');

  const intent = state.intent;
  const suit = SUITS[intent.suit];
  byId('intent-glyph').textContent = suit.glyph;
  byId('intent-glyph').style.color = suit.color;
  byId('intent-text').textContent = `${suit.name} strike`;
  byId('intent-value').textContent = String(intent.value);
  const answer = SUITS[counterTo(intent.suit)];
  byId('intent-counter').textContent = `Counter with ${answer.glyph} ${answer.name} · weak to ${answer.glyph}`;
  byId('intent-panel').classList.toggle('countered', Boolean(state.lastParry));
}

export function renderArena(cards, bannerText) {
  const arena = byId('arena');
  arena.replaceChildren();
  if (cards.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'arena-empty';
    empty.textContent = ' plays a card to begin the exchange';
    arena.append(empty);
  } else {
    cards.forEach((card) => arena.append(createCardElement(card)));
  }
  const banner = byId('banner');
  banner.classList.remove('show');
  if (bannerText) {
    banner.textContent = bannerText;
    void banner.offsetWidth;
    banner.classList.add('show');
  }
}

export function renderResult(state, won) {
  const target = won ? 'win-stats' : 'lose-stats';
  byId(target).innerHTML = `
    <span>ROUNDS <b>${state.turn}</b></span>
    <span>DAMAGE <b>${state.stats.dealt}</b></span>
    <span>BEST PLAY <b>${state.stats.best}</b></span>`;
  showScreen(won ? 'win' : 'lose');
}

export function setPlayEnabled(enabled) {
  byId('btn-play').disabled = !enabled;
}
