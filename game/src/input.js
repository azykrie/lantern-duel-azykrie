/**
 * input.js — mouse and keyboard controls for the duel.
 * Cards are clickable and numbered 1–5; Enter plays, Space restarts.
 */

export function bindInput(actions) {
  document.getElementById('btn-start').addEventListener('click', actions.start);
  document.getElementById('btn-play').addEventListener('click', actions.play);
  for (const button of document.querySelectorAll('[data-restart]')) {
    button.addEventListener('click', actions.restart);
  }

  document.getElementById('player-hand').addEventListener('click', (event) => {
    const card = event.target.closest('.card[data-index]');
    if (card) actions.toggle(Number(card.dataset.index));
  });

  window.addEventListener('keydown', (event) => {
    if (event.key >= '1' && event.key <= '5') {
      actions.toggle(Number(event.key) - 1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      actions.enter();
    }
    if (event.code === 'Space') {
      event.preventDefault();
      actions.restart();
    }
  });
}
