/**
 * deck.js — the three flames, a deterministic deck and the draw pile.
 * Amber ▲ outshines Moss ◆, Moss ◆ outgrows Tide ●, Tide ● quenches Amber ▲.
 */

export const SUITS = {
  amber: { id: 'amber', name: 'Amber', glyph: '▲', color: '#ff8a3d', beats: 'moss' },
  tide: { id: 'tide', name: 'Tide', glyph: '●', color: '#4fd7ff', beats: 'amber' },
  moss: { id: 'moss', name: 'Moss', glyph: '◆', color: '#9be36a', beats: 'tide' },
};

export const SUIT_IDS = Object.keys(SUITS);

export function makeRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cardCost(value) {
  if (value <= 2) return 1;
  if (value <= 4) return 2;
  return 3;
}

export function buildDeck(seed) {
  const random = makeRandom(seed);
  const cards = [];
  let serial = 0;
  for (const suit of SUIT_IDS) {
    for (let value = 1; value <= 5; value += 1) {
      for (let copy = 0; copy < 3; copy += 1) {
        cards.push({
          id: `c${serial++}`,
          suit,
          value,
          cost: cardCost(value),
        });
      }
    }
  }
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function drawCards(drawPile, discardPile, count, random) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break;
      drawPile.push(...discardPile.splice(0));
      for (let k = drawPile.length - 1; k > 0; k -= 1) {
        const j = Math.floor(random() * (k + 1));
        [drawPile[k], drawPile[j]] = [drawPile[j], drawPile[k]];
      }
    }
    drawn.push(drawPile.pop());
  }
  return drawn;
}

export function counterTo(suitId) {
  return SUIT_IDS.find((id) => SUITS[id].beats === suitId) ?? null;
}
