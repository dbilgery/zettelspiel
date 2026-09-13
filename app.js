(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const screens = $$('.screen');
  const STORAGE_KEY = 'zettelspiel-state-v2';
  const LEGACY_KEY = 'zettelspiel-state';

  const rounds = [
    { title: 'Erklären', rule: 'Erkläre den Begriff, ohne ihn selbst oder Teile davon zu sagen.', emoji: '🗣️' },
    { title: 'Ein Wort', rule: 'Du darfst pro Begriff genau ein einziges Hinweiswort sagen.', emoji: '☝️' },
    { title: 'Pantomime', rule: 'Nur darstellen. Nicht sprechen, keine Geräusche und keine Buchstaben in die Luft schreiben.', emoji: '🎭' }
  ];

  const fresh = () => ({
    duration: 60,
    perPlayer: 3,
    players: [],
    teams: ['Team 1', 'Team 2'],
    teamMembers: [[], []],
    teamMode: 'random',
    teamTurnIndex: [0, 0],
    collectIndex: 0,
    allTerms: [],
    round: 0,
    activeTeam: 0,
    scores: [0, 0],
    roundScores: [0, 0],
    pile: [],
    turnPoints: 0,
    current: null,
    started: false,
    phase: 'home'
  });

  let state = normalize(loadState() || fresh());
  let timerId = null;
  let timeLeft = state.duration;
  let drag = null;

  function makeId() {
    return window.crypto?.randomUUID?.() || `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function normalize(input) {
    const base = fresh();
    const s = { ...base, ...(input || {}) };

    s.duration = [30, 45, 60, 90].includes(+s.duration) ? +s.duration : 60;
    s.perPlayer = [2, 3, 4, 5].includes(+s.perPlayer) ? +s.perPlayer : 3;
    s.teams = ['Team 1', 'Team 2'];
    s.teamMode = s.teamMode === 'manual' ? 'manual' : 'random';

    if (!Array.isArray(s.players)) s.players = [];
    s.players = s.players
      .map((p) => typeof p === 'string' ? { id: makeId(), name: cleanName(p) } : { id: p?.id || makeId(), name: cleanName(p?.name || '') })
      .filter((p) => p.name);

    if (!Array.isArray(s.teamMembers) || s.teamMembers.length !== 2) s.teamMembers = [[], []];
    const validIds = new Set(s.players.map((p) => p.id));
    const used = new Set();
    s.teamMembers = s.teamMembers.map((team) => Array.isArray(team)
      ? team.filter((id) => validIds.has(id) && !used.has(id) && used.add(id))
      : []
    );

    if (!Array.isArray(s.teamTurnIndex) || s.teamTurnIndex.length !== 2) s.teamTurnIndex = [0, 0];
    s.teamTurnIndex = s.teamTurnIndex.map((n) => Number.isFinite(+n) ? Math.max(0, +n) : 0);

    if (!Array.isArray(s.allTerms)) s.allTerms = [];
    if (!Array.isArray(s.pile)) s.pile = [];
    if (!Array.isArray(s.scores) || s.scores.length !== 2) s.scores = [0, 0];
    if (!Array.isArray(s.roundScores) || s.roundScores.length !== 2) s.roundScores = [0, 0];

    s.collectIndex = Math.max(0, Math.min(+s.collectIndex || 0, s.players.length));
    s.round = Math.max(0, Math.min(+s.round || 0, 2));
    s.activeTeam = +s.activeTeam === 1 ? 1 : 0;
    s.phase = typeof s.phase === 'string' ? s.phase : 'home';
    return s;
  }

  function loadState() {
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current) return JSON.parse(current);
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) return JSON.parse(legacy);
    } catch (_) {}
    return null;
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    $('#resetTop').hidden = !state.started;
  }

  function show(id, { savePhase = true } = {}) {
    if (savePhase) state.phase = id;
    screens.forEach((screen) => screen.classList.toggle('active', screen.id === id));
    window.scrollTo({ top: 0, behavior: 'instant' });
    save();
  }

  function cleanName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function escapeHtml(value) {
    const node = document.createElement('div');
    node.textContent = String(value ?? '');
    return node.innerHTML;
  }

  function shuffle(items) {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function vibrate(pattern = 30) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function setError(element, message = '') {
    element.textContent = message;
    element.hidden = !message;
  }

  function playerById(id) {
    return state.players.find((player) => player.id === id) || null;
  }

  function currentExplainer() {
    const members = state.teamMembers[state.activeTeam] || [];
    if (!members.length) return null;
    const idx = state.teamTurnIndex[state.activeTeam] % members.length;
    return playerById(members[idx]);
  }

  function scoreHTML(active = -1) {
    return state.teams.map((team, i) => `
      <div class="score ${i === active ? 'active' : ''}">
        <span>${escapeHtml(team)}</span>
        <strong>${state.scores[i]}</strong>
        <small class="muted">${state.roundScores[i]} in dieser Runde</small>
      </div>
    `).join('');
  }

  $('#setupStart').addEventListener('click', () => {
    clearTimer();
    state = fresh();
    state.duration = +$('#duration').value;
    state.perPlayer = +$('#perPlayer').value;
    state.started = true;
    renderPlayers();
    show('players');
    requestAnimationFrame(() => $('#newPlayer').focus());
  });

  $('#playerForm').addEventListener('submit', (event) => {
    event.preventDefault();
    addPlayer();
  });

  function addPlayer() {
    const input = $('#newPlayer');
    const name = cleanName(input.value);
    setError($('#playerError'));

    if (!name) {
      setError($('#playerError'), 'Bitte gib einen Namen ein.');
      input.focus();
      return;
    }
    if (state.players.some((p) => p.name.localeCompare(name, 'de', { sensitivity: 'accent' }) === 0)) {
      setError($('#playerError'), 'Diesen Namen gibt es bereits.');
      input.select();
      return;
    }

    state.players.push({ id: makeId(), name });
    input.value = '';
    renderPlayers();
    save();
    input.focus();
  }

  function removePlayer(id) {
    state.players = state.players.filter((p) => p.id !== id);
    state.teamMembers = state.teamMembers.map((team) => team.filter((playerId) => playerId !== id));
    state.teamTurnIndex = [0, 0];
    renderPlayers();
    save();
  }

  function renderPlayers() {
    const list = $('#playerList');
    if (!state.players.length) {
      list.innerHTML = '<div class="hint">Noch keine Spieler eingetragen.</div>';
    } else {
      list.innerHTML = state.players.map((player, index) => `
        <div class="playerRow">
          <div class="playerIdentity">
            <span class="playerNumber">${index + 1}</span>
            <span class="playerName">${escapeHtml(player.name)}</span>
          </div>
          <button class="iconBtn" type="button" data-remove-player="${player.id}" aria-label="${escapeHtml(player.name)} entfernen">✕</button>
        </div>
      `).join('');
    }

    $$('[data-remove-player]').forEach((button) => {
      button.addEventListener('click', () => removePlayer(button.dataset.removePlayer));
    });

    const count = state.players.length;
    $('#playerSetupHint').textContent = count < 2
      ? `Noch ${2 - count} Spieler benötigt.`
      : `${count} Spieler eingetragen.`;
    $('#toTeams').disabled = count < 2;
  }

  $('#toTeams').addEventListener('click', () => {
    if (state.players.length < 2) return;
    if (state.teamMode === 'random') assignRandomTeams();
    else ensureManualAssignment();
    renderTeams();
    show('teams');
  });

  function setTeamMode(mode) {
    state.teamMode = mode === 'manual' ? 'manual' : 'random';
    setError($('#teamError'));
    if (state.teamMode === 'random') assignRandomTeams();
    else ensureManualAssignment();
    renderTeamMode();
    renderTeams();
    save();
  }

  function renderTeamMode() {
    const manual = state.teamMode === 'manual';
    $('#randomTab').classList.toggle('active', !manual);
    $('#manualTab').classList.toggle('active', manual);
    $('#randomTab').setAttribute('aria-selected', String(!manual));
    $('#manualTab').setAttribute('aria-selected', String(manual));
    $('#randomControls').hidden = manual;
    $('#manualControls').hidden = !manual;
    $('#teamColumns').classList.toggle('manual', manual);
  }

  $('#randomTab').addEventListener('click', () => setTeamMode('random'));
  $('#manualTab').addEventListener('click', () => setTeamMode('manual'));
  $('#shuffleTeams').addEventListener('click', () => {
    assignRandomTeams();
    renderTeams();
    vibrate(20);
  });

  function assignRandomTeams() {
    const ids = shuffle(state.players.map((p) => p.id));
    state.teamMembers = [[], []];
    ids.forEach((id, index) => state.teamMembers[index % 2].push(id));
    state.teamTurnIndex = [0, 0];
    save();
  }

  function ensureManualAssignment() {
    const valid = new Set(state.players.map((p) => p.id));
    const used = new Set();
    state.teamMembers = state.teamMembers.map((team) => team.filter((id) => {
      if (!valid.has(id) || used.has(id)) return false;
      used.add(id);
      return true;
    }));

    state.players.forEach((player) => {
      if (!used.has(player.id)) {
        const target = state.teamMembers[0].length <= state.teamMembers[1].length ? 0 : 1;
        state.teamMembers[target].push(player.id);
        used.add(player.id);
      }
    });

    rebalanceEmptyTeam();
    state.teamTurnIndex = [0, 0];
  }

  function rebalanceEmptyTeam() {
    if (state.players.length < 2) return;
    if (!state.teamMembers[0].length && state.teamMembers[1].length > 1) state.teamMembers[0].push(state.teamMembers[1].shift());
    if (!state.teamMembers[1].length && state.teamMembers[0].length > 1) state.teamMembers[1].push(state.teamMembers[0].pop());
  }

  function renderTeams() {
    renderTeamMode();
    const columns = $('#teamColumns');
    columns.innerHTML = state.teamMembers.map((members, teamIndex) => `
      <section class="teamBox" data-team="${teamIndex}" aria-label="Team ${teamIndex + 1}">
        <h3><span>Team ${teamIndex + 1}</span><span class="teamCount">${members.length}</span></h3>
        <div class="teamMembers">
          ${members.length ? members.map((id) => {
            const player = playerById(id);
            if (!player) return '';
            return `
              <div class="member" data-player-id="${id}" data-team-index="${teamIndex}" ${state.teamMode === 'manual' ? 'role="button" tabindex="0" aria-label="' + escapeHtml(player.name) + ' verschieben"' : ''}>
                ${state.teamMode === 'manual' ? '<span class="dragHandle" aria-hidden="true">⠿</span>' : ''}
                <span>${escapeHtml(player.name)}</span>
              </div>
            `;
          }).join('') : '<div class="emptyTeam">Spieler hier ablegen</div>'}
        </div>
      </section>
    `).join('');

    if (state.teamMode === 'manual') bindDragAndDrop();
    validateTeams(false);
  }

  function movePlayerToTeam(playerId, targetTeam) {
    const from = state.teamMembers.findIndex((team) => team.includes(playerId));
    if (from < 0 || from === targetTeam) return;
    setError($('#teamError'));
    state.teamMembers[from] = state.teamMembers[from].filter((id) => id !== playerId);
    state.teamMembers[targetTeam].push(playerId);
    state.teamTurnIndex = [0, 0];
    renderTeams();
    save();
    vibrate(18);
  }

  function bindDragAndDrop() {
    $$('.member[data-player-id]').forEach((member) => {
      member.addEventListener('pointerdown', startDrag);
      member.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          const playerId = member.dataset.playerId;
          const from = +member.dataset.teamIndex;
          movePlayerToTeam(playerId, 1 - from);
        }
      });
    });
  }

  function startDrag(event) {
    if (state.teamMode !== 'manual' || event.button > 0) return;
    const member = event.currentTarget;
    const playerId = member.dataset.playerId;
    const player = playerById(playerId);
    if (!player) return;

    event.preventDefault();
    member.setPointerCapture?.(event.pointerId);
    const ghost = document.createElement('div');
    ghost.className = 'dragGhost';
    ghost.textContent = player.name;
    document.body.appendChild(ghost);

    drag = { pointerId: event.pointerId, playerId, from: +member.dataset.teamIndex, member, ghost, target: null };
    member.classList.add('dragging');
    positionGhost(event.clientX, event.clientY);
    updateDropTarget(event.clientX, event.clientY);
    member.addEventListener('pointermove', dragMove);
    member.addEventListener('pointerup', endDrag, { once: true });
    member.addEventListener('pointercancel', cancelDrag, { once: true });
  }

  function dragMove(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    positionGhost(event.clientX, event.clientY);
    updateDropTarget(event.clientX, event.clientY);
  }

  function positionGhost(x, y) {
    if (!drag) return;
    drag.ghost.style.left = `${x}px`;
    drag.ghost.style.top = `${y}px`;
  }

  function updateDropTarget(x, y) {
    if (!drag) return;
    $$('.teamBox').forEach((box) => box.classList.remove('dropTarget'));
    const element = document.elementFromPoint(x, y);
    const box = element?.closest?.('.teamBox');
    if (!box) {
      drag.target = null;
      return;
    }
    drag.target = +box.dataset.team;
    if (drag.target !== drag.from) box.classList.add('dropTarget');
  }

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const { playerId, from, target } = drag;
    cleanupDrag();
    if (target !== null && target !== from) movePlayerToTeam(playerId, target);
  }

  function cancelDrag() {
    cleanupDrag();
  }

  function cleanupDrag() {
    if (!drag) return;
    drag.member.classList.remove('dragging');
    drag.member.removeEventListener('pointermove', dragMove);
    drag.ghost.remove();
    $$('.teamBox').forEach((box) => box.classList.remove('dropTarget'));
    drag = null;
  }

  function validateTeams(showMessage = true) {
    const assigned = state.teamMembers.flat();
    const valid = assigned.length === state.players.length
      && new Set(assigned).size === state.players.length
      && state.teamMembers.every((team) => team.length > 0);
    $('#confirmTeams').disabled = !valid;
    if (showMessage) setError($('#teamError'), valid ? '' : 'Bitte verteile alle Spieler auf zwei nicht-leere Teams.');
    return valid;
  }

  $('#backToPlayers').addEventListener('click', () => {
    cleanupDrag();
    renderPlayers();
    show('players');
  });

  $('#confirmTeams').addEventListener('click', () => {
    if (!validateTeams(true)) return;
    state.teams = ['Team 1', 'Team 2'];
    state.collectIndex = 0;
    state.allTerms = [];
    state.teamTurnIndex = [0, 0];
    renderCollect();
    show('collect');
  });

  function renderCollect() {
    const player = state.players[state.collectIndex];
    if (!player) {
      prepareGame();
      return;
    }
    $('#collectPlayerBadge').textContent = `👤 ${player.name}`;
    $('#termsLabel').textContent = `${player.name}: deine ${state.perPlayer} Begriffe`;
    $('#termHint').textContent = `Bitte genau ${state.perPlayer} ${state.perPlayer === 1 ? 'Begriff' : 'Begriffe'} eingeben – einen pro Zeile.`;
    $('#collectedCount').textContent = `${state.allTerms.length} ${state.allTerms.length === 1 ? 'Begriff' : 'Begriffe'} gesammelt`;
    $('#collectProgress').textContent = `Person ${state.collectIndex + 1} von ${state.players.length}`;
    $('#termsInput').value = '';
    setError($('#termError'));
  }

  function parseTerms() {
    return $('#termsInput').value.split(/\n/).map((value) => value.trim()).filter(Boolean);
  }

  $('#savePlayer').addEventListener('click', () => {
    const terms = parseTerms();
    setError($('#termError'));
    if (terms.length !== state.perPlayer) {
      setError($('#termError'), `Bitte genau ${state.perPlayer} Begriffe eingeben – einen pro Zeile.`);
      $('#termsInput').focus();
      return;
    }

    state.allTerms.push(...terms);
    state.collectIndex += 1;
    vibrate(20);
    if (state.collectIndex >= state.players.length) {
      $('#privacyText').textContent = 'Alle Begriffe sind gesammelt. Gebt das Handy an die Gruppe zurück.';
      $('#nextPlayer').textContent = 'Spiel starten';
    } else {
      const next = state.players[state.collectIndex];
      $('#privacyText').textContent = `Begriffe gespeichert. Gib das Handy an ${next.name} weiter.`;
      $('#nextPlayer').textContent = `Weiter zu ${next.name}`;
    }
    show('privacy');
  });

  $('#nextPlayer').addEventListener('click', () => {
    if (state.collectIndex >= state.players.length) {
      prepareGame();
      return;
    }
    renderCollect();
    show('collect');
    requestAnimationFrame(() => $('#termsInput').focus());
  });

  function prepareGame() {
    if (!validateStoredSetup()) {
      renderPlayers();
      show('players');
      return;
    }
    const expected = state.players.length * state.perPlayer;
    if (state.allTerms.length !== expected) {
      state.collectIndex = Math.min(state.collectIndex, state.players.length - 1);
      renderCollect();
      show('collect');
      return;
    }

    state.round = 0;
    state.activeTeam = 0;
    state.scores = [0, 0];
    state.roundScores = [0, 0];
    state.pile = shuffle(state.allTerms);
    state.current = null;
    state.teamTurnIndex = [0, 0];
    renderRoundIntro();
    show('roundIntro');
  }

  function validateStoredSetup() {
    const all = state.teamMembers.flat();
    return state.players.length >= 2
      && state.teamMembers.every((team) => team.length > 0)
      && all.length === state.players.length
      && new Set(all).size === state.players.length;
  }

  function renderRoundIntro() {
    const round = rounds[state.round];
    const player = currentExplainer();
    $('#roundBadge').textContent = `Runde ${state.round + 1} von 3 · ${round.emoji}`;
    $('#roundTitle').textContent = round.title;
    $('#roundRule').textContent = round.rule;
    $('#introScores').innerHTML = scoreHTML(state.activeTeam);
    $('#startsText').textContent = `${state.teams[state.activeTeam]} beginnt${player ? ` – ${player.name} ist zuerst dran.` : '.'}`;
  }

  $('#startRound').addEventListener('click', () => {
    renderTurnReady();
    show('turnReady');
  });

  function renderTurnReady() {
    const round = rounds[state.round];
    const player = currentExplainer();
    $('#turnRoundBadge').textContent = `Runde ${state.round + 1}: ${round.title}`;
    $('#turnTeam').textContent = state.teams[state.activeTeam];
    $('#turnPlayer').textContent = player ? `👤 ${player.name}` : '👤 Spieler';
    $('#turnEmoji').textContent = round.emoji;
    $('#turnInstruction').textContent = state.round === 0
      ? 'Du erklärst jetzt die Begriffe für dein Team.'
      : state.round === 1 ? 'Ein Hinweiswort pro Begriff – nicht mehr.' : 'Nur darstellen. Kein Wort, kein Geräusch.';
  }

  $('#beginTurn').addEventListener('click', startTurn);

  function startTurn() {
    if (!state.pile.length) {
      finishRound();
      return;
    }
    const player = currentExplainer();
    state.turnPoints = 0;
    state.current = null;
    timeLeft = state.duration;
    $('#timer').textContent = timeLeft;
    $('#timer').classList.remove('danger');
    $('#playRound').textContent = `${state.teams[state.activeTeam]} · ${rounds[state.round].title}`;
    $('#playPlayer').textContent = player ? `👤 ${player.name}` : '';
    nextWord();
    show('play');
    clearTimer();
    timerId = window.setInterval(() => {
      timeLeft -= 1;
      $('#timer').textContent = timeLeft;
      if (timeLeft <= 10) $('#timer').classList.add('danger');
      if (timeLeft <= 0) endTurn();
    }, 1000);
  }

  function nextWord() {
    if (!state.pile.length) {
      finishRound(true);
      return;
    }
    state.current = state.pile[0];
    $('#currentWord').textContent = state.current;
  }

  $('#gotWord').addEventListener('click', () => {
    if (!state.current || !state.pile.length) return;
    vibrate(18);
    state.pile.shift();
    state.turnPoints += 1;
    state.scores[state.activeTeam] += 1;
    state.roundScores[state.activeTeam] += 1;
    state.current = null;
    save();
    if (!state.pile.length) finishRound(true);
    else nextWord();
  });

  $('#skipWord').addEventListener('click', () => {
    if (state.pile.length <= 1) return;
    const skipped = state.pile.shift();
    state.pile.push(skipped);
    state.current = null;
    nextWord();
    vibrate(10);
  });

  function advanceExplainer(teamIndex) {
    const count = state.teamMembers[teamIndex]?.length || 0;
    if (count) state.teamTurnIndex[teamIndex] = (state.teamTurnIndex[teamIndex] + 1) % count;
  }

  function endTurn() {
    if (state.phase !== 'play') return;
    clearTimer();
    state.current = null;
    vibrate([70, 45, 70]);
    $('#turnPoints').textContent = state.turnPoints;
    $('#endScores').innerHTML = scoreHTML(state.activeTeam);
    advanceExplainer(state.activeTeam);
    show('turnEnd');
  }

  $('#nextTurn').addEventListener('click', () => {
    state.activeTeam = 1 - state.activeTeam;
    renderTurnReady();
    show('turnReady');
  });

  function finishRound(advanceCurrentExplainer = false) {
    clearTimer();
    state.current = null;
    if (advanceCurrentExplainer) advanceExplainer(state.activeTeam);
    vibrate([55, 40, 55]);
    $('#roundEndTitle').textContent = `${rounds[state.round].title} geschafft`;
    $('#roundEndText').textContent = `Alle ${state.allTerms.length} Begriffe sind durch.`;
    $('#roundEndScores').innerHTML = scoreHTML();
    $('#nextRound').textContent = state.round === 2 ? 'Ergebnis ansehen' : 'Nächste Runde';
    show('roundEnd');
  }

  $('#nextRound').addEventListener('click', () => {
    if (state.round >= 2) {
      finishGame();
      return;
    }
    state.round += 1;
    state.roundScores = [0, 0];
    state.pile = shuffle(state.allTerms);
    state.activeTeam = 1 - state.activeTeam;
    renderRoundIntro();
    show('roundIntro');
  });

  function finishGame() {
    $('#finalScores').innerHTML = scoreHTML();
    if (state.scores[0] === state.scores[1]) {
      $('#winnerText').textContent = 'Unentschieden!';
      $('#winnerSub').textContent = `${state.scores[0]} : ${state.scores[1]} – das schreit nach einer Revanche.`;
    } else {
      const winner = state.scores[0] > state.scores[1] ? 0 : 1;
      $('#winnerText').textContent = `${state.teams[winner]} gewinnt!`;
      $('#winnerSub').textContent = `${state.scores[winner]} Punkte. Starke Runde.`;
    }
    show('finish');
  }

  $('#restartSame').addEventListener('click', () => {
    const keep = {
      duration: state.duration,
      perPlayer: state.perPlayer,
      players: state.players.map((p) => ({ ...p })),
      teams: ['Team 1', 'Team 2'],
      teamMembers: state.teamMembers.map((team) => [...team]),
      teamMode: state.teamMode
    };
    state = { ...fresh(), ...keep, started: true, phase: 'collect' };
    renderCollect();
    show('collect');
  });

  function clearTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function hardReset() {
    clearTimer();
    cleanupDrag();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
    state = fresh();
    $('#duration').value = '60';
    $('#perPlayer').value = '3';
    $('#resetTop').hidden = true;
    show('home');
  }

  $('#fullReset').addEventListener('click', hardReset);
  $('#resetTop').addEventListener('click', () => {
    if (confirm('Aktuelles Spiel wirklich verwerfen?')) hardReset();
  });

  function resume() {
    $('#duration').value = String(state.duration);
    $('#perPlayer').value = String(state.perPlayer);
    $('#resetTop').hidden = !state.started;

    if (!state.started) {
      show('home');
      return;
    }

    const phase = state.phase;
    if (phase === 'players') {
      renderPlayers();
      show('players');
      return;
    }
    if (phase === 'teams') {
      if (state.teamMode === 'manual') ensureManualAssignment();
      else if (!validateStoredSetup()) assignRandomTeams();
      renderTeams();
      show('teams');
      return;
    }
    if ((phase === 'collect' || phase === 'privacy') && state.collectIndex < state.players.length) {
      renderCollect();
      if (phase === 'privacy') {
        const next = state.players[state.collectIndex];
        $('#privacyText').textContent = `Begriffe gespeichert. Gib das Handy an ${next.name} weiter.`;
        $('#nextPlayer').textContent = `Weiter zu ${next.name}`;
      }
      show(phase);
      return;
    }
    if (phase === 'privacy' && state.collectIndex >= state.players.length) {
      $('#privacyText').textContent = 'Alle Begriffe sind gesammelt. Gebt das Handy an die Gruppe zurück.';
      $('#nextPlayer').textContent = 'Spiel starten';
      show('privacy');
      return;
    }

    const hasCompleteTerms = state.allTerms.length === state.players.length * state.perPlayer && state.allTerms.length > 0;
    if (!hasCompleteTerms || !validateStoredSetup()) {
      renderPlayers();
      show('players');
      return;
    }
    if (phase === 'play') {
      state.current = null;
      renderTurnReady();
      show('turnReady');
      return;
    }
    if (phase === 'turnReady') {
      renderTurnReady();
      show('turnReady');
      return;
    }
    if (phase === 'turnEnd') {
      $('#turnPoints').textContent = state.turnPoints || 0;
      $('#endScores').innerHTML = scoreHTML(state.activeTeam);
      show('turnEnd');
      return;
    }
    if (phase === 'roundEnd') {
      $('#roundEndTitle').textContent = `${rounds[state.round].title} geschafft`;
      $('#roundEndText').textContent = `Alle ${state.allTerms.length} Begriffe sind durch.`;
      $('#roundEndScores').innerHTML = scoreHTML();
      $('#nextRound').textContent = state.round === 2 ? 'Ergebnis ansehen' : 'Nächste Runde';
      show('roundEnd');
      return;
    }
    if (phase === 'finish') {
      finishGame();
      return;
    }
    renderRoundIntro();
    show('roundIntro');
  }

  resume();
})();
