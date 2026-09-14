'use strict';

// Keep wording consistent across the game without changing internal state names.
rounds[0].rule = 'Erkläre das Wort frei, ohne es selbst oder Teile davon zu nennen.';
rounds[1].rule = 'Pro Wort ist genau ein einziges Hinweiswort erlaubt.';

const baseRenderNav = renderNav;
renderNav = function renderNavPolished() {
  baseRenderNav();
  const reset = el('resetTop');
  const title = el('navTitle');

  if (reset && ['countdown', 'play'].includes(state.phase)) reset.hidden = true;
  if (title && ['turnReady', 'countdown', 'play'].includes(state.phase)) title.textContent = `Runde ${state.round + 1}`;
  if (title && state.phase === 'collect') title.textContent = 'Wörter';
};

let gameWakeLock = null;

async function requestGameWakeLock() {
  if (!('wakeLock' in navigator) || document.visibilityState !== 'visible' || state.phase !== 'play') return;
  try {
    if (gameWakeLock) return;
    gameWakeLock = await navigator.wakeLock.request('screen');
    gameWakeLock.addEventListener('release', () => { gameWakeLock = null; });
  } catch (_) {
    gameWakeLock = null;
  }
}

async function releaseGameWakeLock() {
  if (!gameWakeLock) return;
  const lock = gameWakeLock;
  gameWakeLock = null;
  try { await lock.release(); } catch (_) {}
}

const baseStartTurn = startTurn;
startTurn = function startTurnPolished() {
  const result = baseStartTurn();
  if (state.phase === 'play') requestGameWakeLock();
  return result;
};

const baseEndTurn = endTurn;
endTurn = function endTurnPolished() {
  releaseGameWakeLock();
  return baseEndTurn();
};

const baseFinishRound = finishRound;
finishRound = function finishRoundPolished(...args) {
  releaseGameWakeLock();
  return baseFinishRound(...args);
};

const baseFinishGame = finishGame;
finishGame = function finishGamePolished() {
  releaseGameWakeLock();
  return baseFinishGame();
};

const baseFullReset = fullReset;
fullReset = function fullResetPolished() {
  releaseGameWakeLock();
  return baseFullReset();
};

// "Mit denselben Wörtern" means exactly that: same teams, settings and word pool.
restartSame = function restartWithSameWords() {
  releaseGameWakeLock();
  const words = [...state.allTerms];
  if (!words.length) {
    fullReset();
    return;
  }

  const keep = {
    mode: state.mode,
    duration: state.duration,
    players: state.players.map((player) => ({ ...player })),
    teams: ['Team 1', 'Team 2'],
    teamMembers: state.teamMembers.map((team) => [...team]),
    teamMode: state.teamMode,
    termsPerPlayer: [...state.termsPerPlayer],
    allTerms: words,
    termTarget: words.length,
    pile: shuffle(words),
  };

  state = { ...fresh(), ...keep, started: true };
  renderRoundIntro();
  show('roundIntro');
};

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.phase === 'play') requestGameWakeLock();
  else releaseGameWakeLock();
});
