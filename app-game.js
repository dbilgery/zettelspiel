'use strict';
function renderScores(containerId, active = -1) {
  el(containerId).innerHTML = state.teams.map((team, index) => `
    <div class="scoreRow ${index === active ? 'active' : ''}">
      <div><span>${team}</span><small>+${state.roundScores[index]} in dieser Runde</small></div>
      <strong>${state.scores[index]}</strong>
    </div>
  `).join('');
}

function prepareGame() {
  if (!validateTeams(true)) {
    show('teams');
    return;
  }
  if (state.termTarget <= 0) return;
  if (state.mode === 'random') state.allTerms = createRandomTerms(state.termTarget);
  if (state.allTerms.length < state.termTarget) {
    renderCollect();
    show('collect');
    return;
  }
  state.round = 0;
  state.activeTeam = 0;
  state.scores = [0,0];
  state.roundScores = [0,0];
  state.teamTurnIndex = [0,0];
  state.pile = shuffle(state.allTerms);
  state.current = null;
  state.turnPoints = 0;
  renderRoundIntro();
  show('roundIntro');
}

function renderRoundIntro() {
  const round = rounds[state.round];
  const player = currentExplainer();
  el('roundBadge').textContent = `Runde ${state.round + 1} von 3`;
  el('roundEmoji').textContent = round.emoji;
  el('roundTitle').textContent = round.title;
  el('roundRule').textContent = round.rule;
  renderScores('introScores', state.activeTeam);
  el('startsText').textContent = `${state.teams[state.activeTeam]} beginnt${player ? ` · ${player.name}` : ''}`;
}

function renderTurnReady() {
  const round = rounds[state.round];
  const player = currentExplainer();
  el('turnRoundBadge').textContent = `Runde ${state.round + 1} · ${round.title}`;
  el('turnEmoji').textContent = round.emoji;
  el('turnTeam').textContent = state.teams[state.activeTeam];
  el('turnPlayer').textContent = player ? player.name : 'Spieler';
  el('turnInstruction').textContent = round.rule;
}

function startCountdown() {
  clearCountdown();
  clearTimer();

  const round = rounds[state.round];
  const player = currentExplainer();
  el('countdownRound').textContent = `Runde ${state.round + 1} · ${round.title}`;
  el('countdownTeam').textContent = `${state.teams[state.activeTeam]}${player ? ` · ${player.name}` : ''}`;
  show('countdown');

  const values = ['3','2','1','LOS!'];
  let index = 0;

  const step = () => {
    if (index >= values.length) {
      countdownId = window.setTimeout(startTurn, 320);
      return;
    }
    const value = values[index];
    const number = el('countdownNumber');
    number.textContent = value;
    number.classList.remove('animate');
    void number.offsetWidth;
    number.classList.add('animate');
    if (value === 'LOS!') vibrate(25);
    index += 1;
    countdownId = window.setTimeout(step, value === 'LOS!' ? 420 : 720);
  };

  step();
}

function clearCountdown() {
  if (countdownId !== null) {
    clearTimeout(countdownId);
    countdownId = null;
  }
}

function startTurn() {
  clearCountdown();
  if (!state.pile.length) {
    finishRound(false);
    return;
  }
  state.turnPoints = 0;
  state.current = null;
  turnDeadline = Date.now() + state.duration * 1000;
  el('playRound').textContent = rounds[state.round].title;
  const player = currentExplainer();
  el('playPlayer').textContent = player ? player.name : '';
  nextWord();
  show('play');
  updateTimer();
  timerId = window.setInterval(updateTimer, 200);
}

function updateTimer() {
  const remainingMs = Math.max(0, turnDeadline - Date.now());
  const seconds = Math.ceil(remainingMs / 1000);
  const timer = el('timer');
  timer.textContent = String(seconds);
  timer.classList.toggle('danger', seconds <= 10);
  if (remainingMs <= 0) endTurn();
}

function clearTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function nextWord() {
  if (!state.pile.length) {
    finishRound(true);
    return;
  }
  state.current = state.pile[0];
  el('currentWord').textContent = state.current;
  const card = el('wordCard');
  card.classList.remove('pop');
  void card.offsetWidth;
  card.classList.add('pop');
  save();
}

function advanceExplainer(teamIndex) {
  const count = state.teamMembers[teamIndex].length;
  if (count) state.teamTurnIndex[teamIndex] = (state.teamTurnIndex[teamIndex] + 1) % count;
}

function endTurn() {
  if (state.phase !== 'play') return;
  clearTimer();
  state.current = null;
  vibrate([60,30,60]);
  advanceExplainer(state.activeTeam);

  const justPlayed = state.activeTeam;
  const nextTeam = 1 - justPlayed;
  const nextPlayer = explainerFor(nextTeam);
  el('turnEndTeam').textContent = state.teams[justPlayed];
  el('turnPoints').textContent = String(state.turnPoints);
  el('turnPointsLabel').textContent = state.turnPoints === 1 ? 'Begriff' : 'Begriffe';
  el('nextUpText').textContent = `${state.teams[nextTeam]} ist als Nächstes dran${nextPlayer ? ` · ${nextPlayer.name}` : ''}.`;
  renderScores('endScores', justPlayed);
  show('turnEnd');
}

function renderRoundEnd() {
  el('roundEndTitle').textContent = `${rounds[state.round].title} geschafft`;
  el('roundResult').innerHTML = state.teams.map((team, i) => `
    <div class="roundGain"><span>${team} · Runde</span><strong>+${state.roundScores[i]}</strong></div>
  `).join('');
  renderScores('roundEndScores');
  if (state.roundScores[0] === state.roundScores[1]) {
    el('roundLeader').textContent = 'Unentschieden.';
  } else {
    const winner = state.roundScores[0] > state.roundScores[1] ? 0 : 1;
    el('roundLeader').textContent = `${state.teams[winner]} gewinnt die Runde.`;
  }
  el('nextRound').textContent = state.round === 2 ? 'Ergebnis ansehen' : `Weiter mit ${rounds[state.round + 1].title}`;
}

function finishRound(advanceCurrent = false) {
  clearTimer();
  clearCountdown();
  state.current = null;
  if (advanceCurrent) advanceExplainer(state.activeTeam);
  vibrate([35,25,35]);
  renderRoundEnd();
  show('roundEnd');
}

function finishGame() {
  renderScores('finalScores');
  if (state.scores[0] === state.scores[1]) {
    el('winnerText').textContent = 'Unentschieden';
    el('winnerSub').textContent = `${state.scores[0]} : ${state.scores[1]}`;
  } else {
    const winner = state.scores[0] > state.scores[1] ? 0 : 1;
    el('winnerText').textContent = `${state.teams[winner]} gewinnt`;
    el('winnerSub').textContent = `${state.scores[0]} : ${state.scores[1]}`;
  }
  show('finish');
}

function fullReset() {
  clearTimer();
  clearCountdown();
  cleanupDrag();
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  clearLegacy();
  state = fresh();
  setMode('own');
  el('duration').value = '60';
  show('home');
}

function restartSame() {
  const keep = {
    mode: state.mode,
    duration: state.duration,
    players: state.players.map((p) => ({ ...p })),
    teams: ['Team 1','Team 2'],
    teamMembers: state.teamMembers.map((team) => [...team]),
    teamMode: state.teamMode,
    termsPerPlayer: [...state.termsPerPlayer]
  };
  state = { ...fresh(), ...keep, started: true };
  syncTermTarget();
  if (state.mode === 'random') prepareGame();
  else {
    state.allTerms = [];
    renderCollect();
    show('collect');
  }
}

function goBack() {
  if (state.phase === 'players') {
    fullReset();
    return;
  }
  if (state.phase === 'teams') {
    renderPlayers();
    show('players');
    return;
  }
  if (state.phase === 'collect') {
    renderTeams();
    show('teams');
  }
}

function resume() {
  el('duration').value = String(state.duration);
  setMode(state.mode);
  renderNav();

  if (!state.started) {
    show('home');
    return;
  }
  if (state.phase === 'players') {
    renderPlayers();
    show('players');
    return;
  }
  if (state.phase === 'teams') {
    if (state.teamMode === 'random' && !validateTeams(false)) assignRandomTeams();
    else ensureManualAssignment();
    renderTeams();
    show('teams');
    return;
  }
  if (state.phase === 'collect' || state.phase === 'privacy') {
    if (state.mode === 'random') {
      prepareGame();
      return;
    }
    renderCollect();
    show(state.phase);
    return;
  }

  const validGame = state.allTerms.length >= state.termTarget && state.termTarget > 0 && validateTeams(false);
  if (!validGame) {
    renderPlayers();
    show('players');
    return;
  }

  if (state.phase === 'play' || state.phase === 'countdown') {
    state.current = null;
    renderTurnReady();
    show('turnReady');
    return;
  }
  if (state.phase === 'turnReady') {
    renderTurnReady();
    show('turnReady');
    return;
  }
  if (state.phase === 'turnEnd') {
    const justPlayed = state.activeTeam;
    const nextTeam = 1 - justPlayed;
    el('turnEndTeam').textContent = state.teams[justPlayed];
    el('turnPoints').textContent = String(state.turnPoints || 0);
    el('turnPointsLabel').textContent = state.turnPoints === 1 ? 'Begriff' : 'Begriffe';
    const nextPlayer = explainerFor(nextTeam);
    el('nextUpText').textContent = `${state.teams[nextTeam]} ist als Nächstes dran${nextPlayer ? ` · ${nextPlayer.name}` : ''}.`;
    renderScores('endScores', justPlayed);
    show('turnEnd');
    return;
  }
  if (state.phase === 'roundEnd') {
    renderRoundEnd();
    show('roundEnd');
    return;
  }
  if (state.phase === 'finish') {
    finishGame();
    return;
  }

  renderRoundIntro();
  show('roundIntro');
}
