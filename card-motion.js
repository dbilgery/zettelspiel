'use strict';

let cardMotionBusy = false;
const reduceCardMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    transformOrigin: '50% 72%',
    willChange: 'transform, opacity',
  });
  document.body.appendChild(flyer);
  return flyer;
}

function animateCardOut(flyer, direction) {
  if (!flyer) return Promise.resolve();
  if (reduceCardMotion || typeof flyer.animate !== 'function') {
    flyer.remove();
    return Promise.resolve();
  }

  const distance = Math.max(window.innerWidth * 0.82, flyer.getBoundingClientRect().width * 1.15);
  const sign = direction > 0 ? 1 : -1;
  const animation = flyer.animate([
    {
      transform: 'translate3d(0,0,0) rotate(0deg) scale(1)',
      opacity: 1,
    },
    {
      offset: 0.28,
      transform: `translate3d(${sign * 22}px,-2px,0) rotate(${sign * 1.2}deg) scale(1.006)`,
      opacity: 1,
    },
    {
      transform: `translate3d(${sign * distance}px,-28px,0) rotate(${sign * 9}deg) scale(.95)`,
      opacity: 0,
    },
  ], {
    duration: 270,
    easing: 'cubic-bezier(.2,.72,.18,1)',
    fill: 'forwards',
  });

  return animation.finished.catch(() => {}).then(() => {
    animation.cancel();
    flyer.remove();
  });
}

function animateNextCardIn(card, direction) {
  if (!card || reduceCardMotion || typeof card.animate !== 'function') return;
  card.classList.remove('pop');
  card.getAnimations().forEach((animation) => animation.cancel());

  const sign = direction > 0 ? -1 : 1;
  card.animate([
    {
      transform: `translate3d(${sign * 34}px,9px,0) rotate(${sign * 1.4}deg) scale(.982)`,
      opacity: .46,
    },
    {
      offset: .62,
      transform: `translate3d(${sign * -2}px,0,0) rotate(${sign * -.15}deg) scale(1.003)`,
      opacity: 1,
    },
    {
      transform: 'translate3d(0,0,0) rotate(0deg) scale(1)',
      opacity: 1,
    },
  ], {
    duration: 210,
    easing: 'cubic-bezier(.2,.8,.2,1)',
  });
}

function unlockCardActionsSoon() {
  window.setTimeout(() => {
    cardMotionBusy = false;
    if (cardTurnIsStillActive()) setCardActionButtonsDisabled(false);
  }, reduceCardMotion ? 0 : 105);
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
