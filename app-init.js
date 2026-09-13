'use strict';

const sharedTermsLayout = el('termsPerPlayer') && el('termsPerPlayer').closest('.termsSettings');
if (sharedTermsLayout) sharedTermsLayout.style.gridTemplateColumns = '1fr';

$$('[data-mode]').forEach((button) => button.addEventListener('click', () => {
  setMode(button.dataset.mode);
  el('modeDescription').textContent = state.mode === 'own' ? 'Eigene Begriffe gemeinsam sammeln.' : 'Begriffe automatisch wählen.';
}));

on('resetTop', 'click', () => {
  if (confirm('Spiel neu starten?')) fullReset();
});
on('backButton', 'click', goBack);

on('setupStart', 'click', () => {
  const mode = state.mode;
  const duration = +el('duration').value;
  state = fresh();
  state.mode = mode;
  state.duration = duration;
  state.started = true;
  renderPlayers();
  show('players');
  requestAnimationFrame(() => el('newPlayer').focus());
});

on('playerForm', 'submit', (event) => {
  event.preventDefault();
  addPlayer();
});

on('toTeams', 'click', () => {
  if (state.players.length < 2) return;
  if (state.teamMode === 'random') assignRandomTeams();
  else ensureManualAssignment();
  renderTeams();
  show('teams');
});

on('randomTab', 'click', () => setTeamMode('random'));
on('manualTab', 'click', () => setTeamMode('manual'));
on('shuffleTeams', 'click', () => {
  assignRandomTeams();
  renderTeams();
  vibrate(15);
});

on('termsPerPlayer', 'input', (event) => {
  const value = Math.round(clamp(event.target.value, 3, 5));
  state.termsPerPlayer = [value, value];
  syncTermTarget();
});

on('confirmTeams', 'click', () => {
  if (!validateTeams(true)) return;
  state.termTarget = computeTermTarget();
  state.allTerms = [];
  state.teamTurnIndex = [0,0];
  if (state.mode === 'random') prepareGame();
  else {
    renderCollect();
    show('collect');
    requestAnimationFrame(() => el('termInput').focus());
  }
});

on('addTerm', 'click', addCurrentTerm);
on('termInput', 'keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addCurrentTerm();
  }
});

on('suggestTerm', 'click', () => {
  const used = new Set(state.allTerms.map((term) => term.toLocaleLowerCase('de')));
  const current = clean(el('termInput').value).toLocaleLowerCase('de');
  const options = WORD_POOL.filter((term) => {
    const key = term.toLocaleLowerCase('de');
    return !used.has(key) && key !== current;
  });
  if (!options.length) {
    setError(el('termError'), 'Keine Vorschläge mehr.');
    return;
  }
  const input = el('termInput');
  input.blur();
  input.value = options[Math.floor(Math.random() * options.length)];
  setError(el('termError'));
  setSuccess('');
});

on('startCollectedGame', 'click', prepareGame);
on('startRound', 'click', () => {
  renderTurnReady();
  show('turnReady');
});
on('beginTurn', 'click', startCountdown);

on('gotWord', 'click', () => {
  if (!state.current || !state.pile.length) return;
  state.pile.shift();
  state.turnPoints += 1;
  state.scores[state.activeTeam] += 1;
  state.roundScores[state.activeTeam] += 1;
  state.current = null;
  vibrate(10);
  save();
  if (!state.pile.length) finishRound(true);
  else nextWord();
});

on('skipWord', 'click', () => {
  if (!state.pile.length) return;
  const skipped = state.pile.shift();
  state.pile.push(skipped);
  state.current = null;
  nextWord();
  vibrate(8);
});

on('nextTurn', 'click', () => {
  state.activeTeam = 1 - state.activeTeam;
  renderTurnReady();
  show('turnReady');
});

on('nextRound', 'click', () => {
  if (state.round >= 2) {
    finishGame();
    return;
  }
  state.round += 1;
  state.roundScores = [0,0];
  state.pile = shuffle(state.allTerms);
  state.activeTeam = 1 - state.activeTeam;
  state.current = null;
  renderRoundIntro();
  show('roundIntro');
});

on('restartSame', 'click', restartSame);
on('fullReset', 'click', fullReset);

window.addEventListener('pagehide', () => {
  clearTimer();
  clearCountdown();
});

resume();
