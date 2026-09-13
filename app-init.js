'use strict';
  $$('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
  on('soundToggle', 'click', () => {
    state.soundEnabled = !state.soundEnabled;
    if (state.soundEnabled) {
      ensureAudio();
      tone(760, .06, .025);
    }
    save();
  });
  on('resetTop', 'click', () => {
    if (confirm('Aktuelles Spiel wirklich neu starten?')) fullReset();
  });
  on('backButton', 'click', goBack);

  on('setupStart', 'click', () => {
    const mode = state.mode;
    const soundEnabled = state.soundEnabled;
    const duration = +el('duration').value;
    state = fresh();
    state.mode = mode;
    state.soundEnabled = soundEnabled;
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

  on('team1Terms', 'input', (event) => {
    state.termsPerPlayer[0] = Math.round(clamp(event.target.value, 3, 5));
    syncTermTarget();
  });
  on('team2Terms', 'input', (event) => {
    state.termsPerPlayer[1] = Math.round(clamp(event.target.value, 3, 5));
    syncTermTarget();
  });

  on('confirmTeams', 'click', () => {
    if (!validateTeams(true)) return;
    state.termTarget = computeTermTarget();
    state.allTerms = [];
    state.teamTurnIndex = [0,0];
    if (state.mode === 'random') {
      prepareGame();
    } else {
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
      setError(el('termError'), 'Keine weiteren Vorschläge verfügbar.');
      return;
    }
    el('termInput').value = options[Math.floor(Math.random() * options.length)];
    setError(el('termError'));
    setSuccess('Vorschlag eingesetzt – übernehmen oder ändern.');
    el('termInput').focus();
    el('termInput').select();
  });
  on('passPhone', 'click', () => {
    el('termInput').value = '';
    setError(el('termError'));
    setSuccess('');
    el('privacyText').textContent = `${state.allTerms.length} von ${state.termTarget} Begriffen sind gesammelt.`;
    show('privacy');
  });
  on('continueCollect', 'click', () => {
    renderCollect();
    show('collect');
    requestAnimationFrame(() => el('termInput').focus());
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
    soundCorrect();
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
