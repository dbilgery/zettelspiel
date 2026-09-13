'use strict';

let cardMotionBusy = false;
const reduceCardMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

function setCardActionButtonsDisabled(disabled) {
  if (typeof setTurnControlsDisabled === 'function') {
    setTurnControlsDisabled(disabled);
    return;
  }
  const correct = el('gotWord');
  const skip = el('skipWord');
  if (correct) correct.disabled = disabled;
  if (skip) skip.disabled = disabled;
}

function cardTurnIsStillActive() {
  const timeLockOpen = typeof timerTurnLocked === 'undefined' || !timerTurnLocked;
  return state.phase === 'play' && timeLockOpen && Date.now() < turnDeadline;
}

function createCardFlyer(card) {
  if (!card) return null;
  const rect = card.getBoundingClientRect();
  const style = window.getComputedStyle(card);
  const flyer = card.cloneNode(true);
  flyer.removeAttribute('id');
  flyer.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
  flyer.classList.remove('pop');
  flyer.setAttribute('aria-hidden', 'true');

  Object.assign(flyer.style, {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    zIndex: '9000',
    pointerEvents: 'none',
    transformOrigin: '50% 78%',
    willChange: 'transform, opacity',
    background: style.background,
    border: style.border,
    borderRadius: style.borderRadius,
    boxShadow: '0 18px 44px rgba(15,23,42,.14)',
    color: style.color,
  });

  document.body.appendChild(flyer);
  return flyer;
}

function animateCardOut(flyer, direction) {
  if (!flyer) return Promise.resolve();
  const sign = direction > 0 ? 1 : -1;

  if (typeof flyer.animate !== 'function') {
    flyer.remove();
    return Promise.resolve();
  }

  if (reduceCardMotion) {
    const animation = flyer.animate([
      { transform: 'translate3d(0,0,0)', opacity: 1 },
      { transform: `translate3d(${sign * 70}px,0,0)`, opacity: 0 },
    ], { duration: 170, easing: 'ease-out', fill: 'forwards' });
    return animation.finished.catch(() => {}).then(() => flyer.remove());
  }

  const distance = Math.max(window.innerWidth * 1.08, flyer.getBoundingClientRect().width * 1.45);
  const animation = flyer.animate([
    {
      transform: 'translate3d(0,0,0) rotate(0deg) scale(1)',
      opacity: 1,
    },
    {
      offset: .18,
      transform: `translate3d(${sign * 18}px,-3px,0) rotate(${sign * 1.8}deg) scale(1.015)`,
      opacity: 1,
    },
    {
      offset: .58,
      transform: `translate3d(${sign * 145}px,-18px,0) rotate(${sign * 6.5}deg) scale(.99)`,
      opacity: .98,
    },
    {
      transform: `translate3d(${sign * distance}px,-54px,0) rotate(${sign * 13}deg) scale(.92)`,
      opacity: 0,
    },
  ], {
    duration: 430,
    easing: 'cubic-bezier(.16,.78,.18,1)',
    fill: 'forwards',
  });

  return animation.finished.catch(() => {}).then(() => {
    animation.cancel();
    flyer.remove();
  });
}

function animateNextCardIn(card, direction) {
  if (!card || typeof card.animate !== 'function') return;
  card.classList.remove('pop');
  card.getAnimations().forEach((animation) => animation.cancel());

  const sign = direction > 0 ? -1 : 1;

  if (reduceCardMotion) {
    card.animate([
      { transform: `translate3d(${sign * 12}px,0,0)`, opacity: .72 },
      { transform: 'translate3d(0,0,0)', opacity: 1 },
    ], { duration: 160, easing: 'ease-out' });
    return;
  }

  card.animate([
    {
      transform: `translate3d(${sign * 58}px,16px,0) rotate(${sign * 2.4}deg) scale(.945)`,
      opacity: .28,
      boxShadow: '0 4px 12px rgba(15,23,42,.03)',
    },
    {
      offset: .55,
      transform: `translate3d(${sign * 8}px,3px,0) rotate(${sign * .45}deg) scale(.992)`,
      opacity: .88,
      boxShadow: '0 8px 22px rgba(15,23,42,.05)',
    },
    {
      transform: 'translate3d(0,0,0) rotate(0deg) scale(1)',
      opacity: 1,
      boxShadow: '0 8px 24px rgba(15,23,42,.06)',
    },
  ], {
    duration: 330,
    delay: 45,
    easing: 'cubic-bezier(.18,.82,.22,1)',
    fill: 'backwards',
  });
}

function unlockCardActionsSoon() {
  window.setTimeout(() => {
    cardMotionBusy = false;
    if (cardTurnIsStillActive()) setCardActionButtonsDisabled(false);
  }, reduceCardMotion ? 130 : 245);
}

function handleCardAction(kind, event) {
  event.preventDefault();
  event.stopImmediatePropagation();

  if (cardMotionBusy || state.phase !== 'play' || !state.current || !state.pile.length) return;
  if (Date.now() >= turnDeadline) {
    endTurn();
    return;
  }

  cardMotionBusy = true;
  setCardActionButtonsDisabled(true);

  const card = el('wordCard');
  const direction = kind === 'correct' ? 1 : -1;
  const flyer = createCardFlyer(card);
  const exitFinished = animateCardOut(flyer, direction);

  if (kind === 'correct') {
    state.pile.shift();
    state.turnPoints += 1;
    state.scores[state.activeTeam] += 1;
    state.roundScores[state.activeTeam] += 1;
    state.current = null;
    vibrate(10);
    save();

    if (!state.pile.length) {
      clearTimer();
      turnDeadline = Number.POSITIVE_INFINITY;
      exitFinished.finally(() => {
        cardMotionBusy = false;
        if (state.phase === 'play') finishRound(true);
      });
      return;
    }
  } else {
    const skipped = state.pile.shift();
    state.pile.push(skipped);
    state.current = null;
    vibrate(8);
  }

  if (!cardTurnIsStillActive()) {
    cardMotionBusy = false;
    endTurn();
    return;
  }

  nextWord();
  animateNextCardIn(card, direction);
  unlockCardActionsSoon();
}

const correctButtonForMotion = el('gotWord');
const skipButtonForMotion = el('skipWord');

if (correctButtonForMotion) {
  correctButtonForMotion.addEventListener('click', (event) => handleCardAction('correct', event), true);
}
if (skipButtonForMotion) {
  skipButtonForMotion.addEventListener('click', (event) => handleCardAction('skip', event), true);
}
