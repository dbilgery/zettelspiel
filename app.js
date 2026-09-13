(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const el = (id) => document.getElementById(id);
  const on = (id, event, handler) => { const node = el(id); if (node) node.addEventListener(event, handler); };
  const screens = $$('.screen');
  const STORAGE_KEY = 'zettelspiel-state-v4';
  const LEGACY_KEY = 'zettelspiel-state-v3';

  const rounds = [
    { title: 'Erklären', rule: 'Erkläre den Begriff, ohne ihn selbst oder Teile davon zu sagen.', emoji: '🗣️' },
    { title: 'Ein Wort', rule: 'Du darfst pro Begriff genau ein einziges Hinweiswort sagen.', emoji: '☝️' },
    { title: 'Pantomime', rule: 'Nur darstellen. Nicht sprechen, keine Geräusche und keine Buchstaben in die Luft schreiben.', emoji: '🎭' }
  ];

  const WORD_POOL = [
    'Eiffelturm','Pinguin','Zahnbürste','Harry Potter','Pizza','Feuerwehr','Kaktus','Titanic','Schneemann','Batman',
    'Staubsauger','Mount Everest','Spaghetti','Darth Vader','Waschmaschine','Giraffe','Disco','Schloss','Superman','Popcorn',
    'Känguru','Mona Lisa','Toaster','Sherlock Holmes','Vulkan','Klopapier','Astronaut','Las Vegas','Sonnenbrille','Dracula',
    'Bagger','Meerjungfrau','Hamburger','Pyramide','Roboter','Krokodil','Fallschirm','Mozart','Mikrowelle','Cowboy',
    'Nutella','Freiheitsstatue','Detektiv','Skateboard','Dinosaurier','James Bond','Kaffeemaschine','Zirkus','Eisberg','Wikinger',
    'Spongebob','Luftballon','Krankenhaus','Banane','Tarzan','Kühlschrank','Sushi','Leuchtturm','Piraten','Hamster',
    'Basketball','Marilyn Monroe','Kopfhörer','Safari','Schornsteinfeger','Donut','Ritter','Taxi','Kamel','Avatar',
    'Schaukel','Albert Einstein','Pommes','U-Boot','Hexe','Kino','Papagei','Schokolade','Napoleon','Rolltreppe',
    'Gummibärchen','Polizei','Yoda','Koffer','Wasserfall','Mickey Mouse','Tennis','Föhn','Burg','Elvis Presley',
    'Regenschirm','Zebra','Rakete','Cappuccino','Spiderman','Kettensäge','London','Clown','Kokosnuss','Formel 1',
    'Barbie','Panda','Bohrmaschine','Nordpol','Fußball','Charlie Chaplin','Laptop','Hai','Achterbahn','Hotdog',
    'Aladdin','Schnecke','Flughafen','Kerze','Hulk','Biene','Camping','Käsekuchen','Fernbedienung','King Kong',
    'Taschenlampe','Oper','Messer','Simba','Wüste','Erdbeere','Gefängnis','Eule','Motorrad','Mumie',
    'Brezel','Tower Bridge','Schildkröte','Indiana Jones','Wecker','Sauna','Gorilla','Ketchup','Zauberer','Traktor',
    'Chinesische Mauer','Piratenschiff','Gitarre','Cinderella','Delfin','Bowling','Kaffee','Schneewittchen','Hubschrauber','Pferd',
    'Venedig','Käse','Minions','Rucksack','Wolkenkratzer','Löwe','Trompete','Schach','Einhorn','Tankstelle',
    'Pfannkuchen','Robin Hood','Kamera','Moskito','Hochzeit','Ananas','Ghostbusters','Surfbrett','Elefant','Big Ben',
    'Lasagne','Ninja','Klimaanlage','Koala','Casino','Croissant','Popeye','Schlüssel','Iglu','Flamingo',
    'Supermarkt','Cupcake','Homer Simpson','Teleskop','Krake','Brandenburger Tor','Kaugummi','Karate','Pinocchio','Kanu',
    'Eisbär','McDonalds','Zauberstab','Schiedsrichter','Matratze','Rom','Erdmännchen','Waffel','Shrek','Roller',
    'Waschbär','Autobahn','Vampir','Schraubenzieher','Mallorca','Pistazie','Rockstar','Kran','Wal','Museum',
    'Muffin','Hänsel und Gretel','Mikrofon','Schmetterling','Berlin','Gulasch','Joker','Snowboard','Lama','Kathedrale',
    'Avocado','Biene Maja','Drohne','Kinoabend','Pfau','Kuchen','Gladiator','Tretboot','Nashorn','Opernhaus',
    'Pommesgabel','Peter Pan','Ventilator','Frosch','Bahnhof','Mango','Terminator','Kletterwand','Otter','Sagrada Familia',
    'Milchshake','Pippi Langstrumpf','Staubsaugerroboter','Seehund','Festival','Taco','Rocky','Hängematte','Rentier','Colosseum',
    'Smoothie','Bugs Bunny','Werkzeugkoffer','Pelikan','Bibliothek','Burrito','Rambo','Trampolin','Faultier','Niagarafälle',
    'Käsebrot','Asterix','Kopierer','Gans','Zoo','Kartoffel','Mr. Bean','E-Scooter','Orang-Utan','Hollywood',
    'Müsli','Obelix','Wasserkocher','Huhn','Schwimmbad','Nudeln','Forrest Gump','Geldautomat','Mondlandung','König',
    'Zeitmaschine','Bügeleisen','Karaoke','Vogelhaus','Geisterbahn','Pommesbude','Schatzkarte','Tischtennis','Lagerfeuer','Einkaufswagen',
    'Schlafsack','Kuckucksuhr','Schneeballschlacht','Dosenöffner','Wetterfrosch','Kochlöffel','Seifenblase','Gartenzwerg','Discokugel','Wackelpudding'
  ];

  const fresh = () => ({
    duration: 60,
    mode: 'own',
    soundEnabled: true,
    players: [],
    teams: ['Team 1', 'Team 2'],
    teamMembers: [[], []],
    teamMode: 'random',
    teamTurnIndex: [0, 0],
    termTarget: 6,
    targetLocked: false,
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
  let countdownTimers = [];
  let timeLeft = state.duration;
  let drag = null;
  let audioContext = null;

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function cleanName(value) { return String(value || '').trim().replace(/\s+/g, ' '); }
  function cleanTerm(value) { return String(value || '').trim().replace(/\s+/g, ' '); }

  function normalize(input) {
    const s = { ...fresh(), ...(input || {}) };
    s.duration = [30, 45, 60, 90].includes(+s.duration) ? +s.duration : 60;
    s.mode = s.mode === 'random' ? 'random' : 'own';
    s.soundEnabled = s.soundEnabled !== false;
    s.teamMode = s.teamMode === 'manual' ? 'manual' : 'random';
    s.teams = ['Team 1', 'Team 2'];
    s.termTarget = Math.max(6, Math.min(80, +s.termTarget || 6));
    s.targetLocked = !!s.targetLocked;

    if (!Array.isArray(s.players)) s.players = [];
    s.players = s.players
      .map((p) => typeof p === 'string'
        ? { id: makeId(), name: cleanName(p) }
        : { id: p && p.id ? p.id : makeId(), name: cleanName(p && p.name ? p.name : '') })
      .filter((p) => p.name);

    if (!Array.isArray(s.teamMembers) || s.teamMembers.length !== 2) s.teamMembers = [[], []];
    const validIds = new Set(s.players.map((p) => p.id));
    const used = new Set();
    s.teamMembers = s.teamMembers.map((team) => Array.isArray(team)
      ? team.filter((id) => {
          if (!validIds.has(id) || used.has(id)) return false;
          used.add(id);
          return true;
        })
      : []
    );

    if (!Array.isArray(s.teamTurnIndex) || s.teamTurnIndex.length !== 2) s.teamTurnIndex = [0, 0];
    s.teamTurnIndex = s.teamTurnIndex.map((value) => Math.max(0, +value || 0));
    if (!Array.isArray(s.allTerms)) s.allTerms = [];
    s.allTerms = [...new Set(s.allTerms.map(cleanTerm).filter(Boolean))];
    if (!Array.isArray(s.pile)) s.pile = [];
    s.pile = s.pile.map(cleanTerm).filter(Boolean);
    if (!Array.isArray(s.scores) || s.scores.length !== 2) s.scores = [0, 0];
    if (!Array.isArray(s.roundScores) || s.roundScores.length !== 2) s.roundScores = [0, 0];
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
    if (el('resetTop')) el('resetTop').hidden = !state.started;
    renderSoundToggle();
  }

  function show(id) {
    state.phase = id;
    screens.forEach((screen) => screen.classList.toggle('active', screen.id === id));
    window.scrollTo({ top: 0, behavior: 'instant' });
    save();
  }

  function setError(element, message = '') {
    if (!element) return;
    element.textContent = message;
    element.hidden = !message;
  }

  function setSuccess(message = '') {
    const node = el('termSuccess');
    if (!node) return;
    node.textContent = message;
    node.hidden = !message;
  }

  function escapeHtml(value) {
    const node = document.createElement('div');
    node.textContent = String(value == null ? '' : value);
    return node.innerHTML;
  }

  function shuffle(items) {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function vibrate(pattern = 30) { if (navigator.vibrate) navigator.vibrate(pattern); }
  function playerById(id) { return state.players.find((player) => player.id === id) || null; }

  function explainerFor(teamIndex) {
    const members = state.teamMembers[teamIndex] || [];
    if (!members.length) return null;
    const idx = state.teamTurnIndex[teamIndex] % members.length;
    return playerById(members[idx]);
  }

  function currentExplainer() { return explainerFor(state.activeTeam); }

  function scoreHTML(active = -1) {
    return state.teams.map((team, i) => `
      <div class="score ${i === active ? 'active' : ''}">
        <span>${escapeHtml(team)}</span>
        <strong>${state.scores[i]}</strong>
        <small class="muted">+${state.roundScores[i]} in dieser Runde</small>
      </div>
    `).join('');
  }

  function recommendedTarget() { return Math.max(6, Math.min(80, state.players.length * 3)); }
  function syncTargetToRecommendation() { if (!state.targetLocked) state.termTarget = recommendedTarget(); }

  function setMode(mode) {
    state.mode = mode === 'random' ? 'random' : 'own';
    $$('[data-mode]').forEach((button) => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-checked', String(active));
    });
    save();
  }

  $$('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));

  function renderSoundToggle() {
    const button = el('soundToggle');
    if (!button) return;
    button.textContent = state.soundEnabled ? '🔊' : '🔇';
    button.setAttribute('aria-label', state.soundEnabled ? 'Ton ausschalten' : 'Ton einschalten');
    button.title = state.soundEnabled ? 'Ton ausschalten' : 'Ton einschalten';
  }

  on('soundToggle', 'click', () => {
    state.soundEnabled = !state.soundEnabled;
    if (state.soundEnabled) {
      ensureAudio();
      tone(720, 0.08, 0.035);
    }
    save();
  });

  function ensureAudio() {
    if (!state.soundEnabled) return null;
    try {
      if (!audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        audioContext = new AudioCtx();
      }
      if (audioContext.state === 'suspended') audioContext.resume();
      return audioContext;
    } catch (_) { return null; }
  }

  function tone(frequency, duration = 0.08, volume = 0.04, type = 'sine', delay = 0) {
    if (!state.soundEnabled) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  function soundCorrect() { tone(880, 0.065, 0.025); }
  function soundCountdown(value) { tone(value === 'LOS!' ? 980 : 560 + (3 - Number(value)) * 90, value === 'LOS!' ? 0.18 : 0.08, 0.045, 'sine'); }
  function soundWarning() { tone(520, 0.06, 0.03, 'square'); }
  function soundTimeUp() { tone(240, 0.18, 0.055, 'sawtooth'); tone(180, 0.25, 0.05, 'sawtooth', 0.2); }
  function soundRoundComplete() { tone(660, 0.08, 0.035, 'sine'); tone(820, 0.1, 0.04, 'sine', 0.1); tone(1040, 0.18, 0.045, 'sine', 0.22); }
  function soundGameComplete() { tone(660, 0.1, 0.035, 'sine'); tone(880, 0.12, 0.04, 'sine', 0.12); tone(1100, 0.22, 0.05, 'sine', 0.26); }

  on('setupStart', 'click', () => {
    clearTimer();
    clearCountdown();
    const mode = state.mode;
    const soundEnabled = state.soundEnabled;
    state = fresh();
    state.mode = mode;
    state.soundEnabled = soundEnabled;
    state.duration = +el('duration').value;
    state.started = true;
    renderPlayers();
    show('players');
    requestAnimationFrame(() => el('newPlayer').focus());
  });

  on('playerForm', 'submit', (event) => { event.preventDefault(); addPlayer(); });

  function addPlayer() {
    const input = el('newPlayer');
    const name = cleanName(input.value);
    setError(el('playerError'));
    if (!name) { setError(el('playerError'), 'Bitte gib einen Namen ein.'); input.focus(); return; }
    if (state.players.some((p) => p.name.localeCompare(name, 'de', { sensitivity: 'accent' }) === 0)) {
      setError(el('playerError'), 'Diesen Namen gibt es bereits.'); input.select(); return;
    }
    state.players.push({ id: makeId(), name });
    syncTargetToRecommendation();
    input.value = '';
    renderPlayers();
    save();
    input.focus();
  }

  function removePlayer(id) {
    state.players = state.players.filter((p) => p.id !== id);
    state.teamMembers = state.teamMembers.map((team) => team.filter((playerId) => playerId !== id));
    state.teamTurnIndex = [0, 0];
    syncTargetToRecommendation();
    renderPlayers();
    save();
  }

  function renderPlayers() {
    const list = el('playerList');
    list.innerHTML = state.players.length ? state.players.map((player, index) => `
      <div class="playerRow">
        <div class="playerIdentity"><span class="playerNumber">${index + 1}</span><span class="playerName">${escapeHtml(player.name)}</span></div>
        <button class="iconBtn" type="button" data-remove-player="${player.id}" aria-label="${escapeHtml(player.name)} entfernen">✕</button>
      </div>`).join('') : '<div class="hint">Noch keine Spieler eingetragen.</div>';

    $$('[data-remove-player]').forEach((button) => button.addEventListener('click', () => removePlayer(button.dataset.removePlayer)));
    const count = state.players.length;
    el('playerSetupHint').textContent = count < 2 ? `Noch ${2 - count} Spieler benötigt.` : `${count} Spieler eingetragen.`;
    el('toTeams').disabled = count < 2;
    el('targetCard').hidden = count < 2;
    el('targetTitle').textContent = state.mode === 'random' ? 'Zufällige Begriffe im Spiel' : 'Begriffe insgesamt';
    if (count >= 2) {
      const recommendation = recommendedTarget();
      if (!state.targetLocked) state.termTarget = recommendation;
      el('termTarget').value = String(state.termTarget);
      el('targetHint').textContent = state.mode === 'random'
        ? `Empfohlen: ${recommendation} Begriffe – werden automatisch gewählt`
        : `Empfohlen: ${recommendation} Begriffe (≈ 3 pro Person)`;
    }
  }

  function setTarget(value, lock = true) {
    const parsed = Math.max(6, Math.min(80, Math.round(+value || 6)));
    state.termTarget = parsed;
    if (lock) state.targetLocked = true;
    el('termTarget').value = String(parsed);
    save();
  }

  on('termTarget', 'change', () => setTarget(el('termTarget').value, true));
  on('targetMinus', 'click', () => setTarget(state.termTarget - 1, true));
  on('targetPlus', 'click', () => setTarget(state.termTarget + 1, true));
  on('useRecommendedTarget', 'click', () => { state.targetLocked = false; setTarget(recommendedTarget(), false); renderPlayers(); });

  on('toTeams', 'click', () => {
    if (state.players.length < 2) return;
    const typedTarget = Math.max(6, Math.min(80, Math.round(+el('termTarget').value || recommendedTarget())));
    setTarget(typedTarget, state.targetLocked || typedTarget !== recommendedTarget());
    if (state.teamMode === 'random') assignRandomTeams(); else ensureManualAssignment();
    renderTeams();
    show('teams');
  });

  function setTeamMode(mode) {
    state.teamMode = mode === 'manual' ? 'manual' : 'random';
    setError(el('teamError'));
    if (state.teamMode === 'random') assignRandomTeams(); else ensureManualAssignment();
    renderTeams();
    save();
  }

  function renderTeamMode() {
    const manual = state.teamMode === 'manual';
    el('randomTab').classList.toggle('active', !manual);
    el('manualTab').classList.toggle('active', manual);
    el('randomTab').setAttribute('aria-selected', String(!manual));
    el('manualTab').setAttribute('aria-selected', String(manual));
    el('randomControls').hidden = manual;
    el('manualControls').hidden = !manual;
    el('teamColumns').classList.toggle('manual', manual);
  }

  on('randomTab', 'click', () => setTeamMode('random'));
  on('manualTab', 'click', () => setTeamMode('manual'));
  on('shuffleTeams', 'click', () => { assignRandomTeams(); renderTeams(); vibrate(20); });

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
      used.add(id); return true;
    }));
    state.players.forEach((player) => {
      if (!used.has(player.id)) {
        const target = state.teamMembers[0].length <= state.teamMembers[1].length ? 0 : 1;
        state.teamMembers[target].push(player.id); used.add(player.id);
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
    el('teamColumns').innerHTML = state.teamMembers.map((members, teamIndex) => `
      <section class="teamBox" data-team="${teamIndex}" aria-label="Team ${teamIndex + 1}">
        <h3><span>Team ${teamIndex + 1}</span><span class="teamCount">${members.length}</span></h3>
        <div class="teamMembers">
          ${members.length ? members.map((id) => {
            const player = playerById(id); if (!player) return '';
            return `<div class="member" data-player-id="${id}" data-team-index="${teamIndex}" ${state.teamMode === 'manual' ? `role="button" tabindex="0" aria-label="${escapeHtml(player.name)} verschieben"` : ''}>
              ${state.teamMode === 'manual' ? '<span class="dragHandle" aria-hidden="true">⠿</span>' : ''}<span>${escapeHtml(player.name)}</span></div>`;
          }).join('') : '<div class="emptyTeam">Spieler hier ablegen</div>'}
        </div>
      </section>`).join('');
    if (state.teamMode === 'manual') bindDragAndDrop();
    validateTeams(false);
  }

  function movePlayerToTeam(playerId, targetTeam) {
    const from = state.teamMembers.findIndex((team) => team.includes(playerId));
    if (from < 0 || from === targetTeam) return;
    setError(el('teamError'));
    state.teamMembers[from] = state.teamMembers[from].filter((id) => id !== playerId);
    state.teamMembers[targetTeam].push(playerId);
    state.teamTurnIndex = [0, 0];
    renderTeams(); save(); vibrate(18);
  }

  function bindDragAndDrop() {
    $$('.member[data-player-id]').forEach((member) => {
      member.addEventListener('pointerdown', startDrag);
      member.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); movePlayerToTeam(member.dataset.playerId, 1 - +member.dataset.teamIndex); }
      });
    });
  }

  function startDrag(event) {
    if (state.teamMode !== 'manual' || event.button > 0) return;
    const member = event.currentTarget;
    const player = playerById(member.dataset.playerId);
    if (!player) return;
    event.preventDefault();
    if (member.setPointerCapture) member.setPointerCapture(event.pointerId);
    const ghost = document.createElement('div');
    ghost.className = 'dragGhost'; ghost.textContent = player.name; document.body.appendChild(ghost);
    drag = { pointerId: event.pointerId, playerId: member.dataset.playerId, from: +member.dataset.teamIndex, member, ghost, target: null };
    member.classList.add('dragging'); positionGhost(event.clientX, event.clientY); updateDropTarget(event.clientX, event.clientY);
    member.addEventListener('pointermove', dragMove);
    member.addEventListener('pointerup', endDrag, { once: true });
    member.addEventListener('pointercancel', cancelDrag, { once: true });
  }

  function dragMove(event) { if (!drag || event.pointerId !== drag.pointerId) return; event.preventDefault(); positionGhost(event.clientX, event.clientY); updateDropTarget(event.clientX, event.clientY); }
  function positionGhost(x, y) { if (!drag) return; drag.ghost.style.left = `${x}px`; drag.ghost.style.top = `${y}px`; }
  function updateDropTarget(x, y) {
    if (!drag) return;
    $$('.teamBox').forEach((box) => box.classList.remove('dropTarget'));
    const element = document.elementFromPoint(x, y);
    const box = element && element.closest ? element.closest('.teamBox') : null;
    if (!box) { drag.target = null; return; }
    drag.target = +box.dataset.team;
    if (drag.target !== drag.from) box.classList.add('dropTarget');
  }
  function endDrag(event) { if (!drag || event.pointerId !== drag.pointerId) return; const { playerId, from, target } = drag; cleanupDrag(); if (target !== null && target !== from) movePlayerToTeam(playerId, target); }
  function cancelDrag() { cleanupDrag(); }
  function cleanupDrag() { if (!drag) return; drag.member.classList.remove('dragging'); drag.member.removeEventListener('pointermove', dragMove); drag.ghost.remove(); $$('.teamBox').forEach((box) => box.classList.remove('dropTarget')); drag = null; }

  function validateTeams(showMessage = true) {
    const assigned = state.teamMembers.flat();
    const valid = assigned.length === state.players.length && new Set(assigned).size === state.players.length && state.teamMembers.every((team) => team.length > 0);
    el('confirmTeams').disabled = !valid;
    if (showMessage) setError(el('teamError'), valid ? '' : 'Bitte verteile alle Spieler auf zwei nicht-leere Teams.');
    return valid;
  }

  on('backToPlayers', 'click', () => { cleanupDrag(); renderPlayers(); show('players'); });

  on('confirmTeams', 'click', () => {
    if (!validateTeams(true)) return;
    state.teams = ['Team 1', 'Team 2'];
    state.teamTurnIndex = [0, 0];
    state.allTerms = [];
    if (state.mode === 'random') {
      state.allTerms = createRandomTerms(state.termTarget);
      prepareGame();
    } else {
      renderCollect(); show('collect'); requestAnimationFrame(() => el('termInput').focus());
    }
  });

  function createRandomTerms(count) {
    const unique = [...new Set(WORD_POOL)];
    return shuffle(unique).slice(0, Math.min(count, unique.length));
  }

  function renderCollect() {
    const count = state.allTerms.length;
    const target = state.termTarget;
    const remaining = Math.max(0, target - count);
    const complete = count >= target;
    el('poolCount').textContent = `${count} von ${target}`;
    el('poolRemaining').textContent = complete ? 'Pool komplett ✓' : `Noch ${remaining} ${remaining === 1 ? 'Begriff' : 'Begriffe'} fehlen`;
    el('progressFill').style.width = `${Math.min(100, Math.round((count / target) * 100))}%`;
    el('addTerm').disabled = complete;
    el('suggestTerm').disabled = complete;
    el('termInput').disabled = complete;
    el('passPhone').hidden = complete;
    el('startCollectedGame').hidden = !complete;
    if (complete) {
      el('termInput').value = '';
      setError(el('termError'));
      setSuccess('Pool komplett. Ihr könnt direkt starten.');
    }
  }

  function isDuplicateTerm(term) { return state.allTerms.some((existing) => existing.localeCompare(term, 'de', { sensitivity: 'base' }) === 0); }

  function addCurrentTerm() {
    const input = el('termInput');
    const term = cleanTerm(input.value);
    setError(el('termError')); setSuccess('');
    if (state.allTerms.length >= state.termTarget) { renderCollect(); return; }
    if (!term) { setError(el('termError'), 'Bitte gib zuerst einen Begriff ein.'); input.focus(); return; }
    if (isDuplicateTerm(term)) { setError(el('termError'), 'Diesen Begriff gibt es schon im Pool.'); input.select(); return; }
    state.allTerms.push(term);
    input.value = '';
    save(); renderCollect(); vibrate(18);
    if (state.allTerms.length < state.termTarget) { setSuccess('Gespeichert ✓'); input.focus(); }
  }

  on('addTerm', 'click', addCurrentTerm);
  on('termInput', 'keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); addCurrentTerm(); } });
  on('suggestTerm', 'click', () => {
    const used = new Set(state.allTerms.map((term) => term.toLocaleLowerCase('de')));
    const current = cleanTerm(el('termInput').value).toLocaleLowerCase('de');
    const options = [...new Set(WORD_POOL)].filter((term) => { const key = term.toLocaleLowerCase('de'); return !used.has(key) && key !== current; });
    if (!options.length) { setError(el('termError'), 'Keine weiteren Vorschläge verfügbar.'); return; }
    const suggestion = options[Math.floor(Math.random() * options.length)];
    el('termInput').value = suggestion;
    setError(el('termError')); setSuccess('Vorschlag eingefügt – übernehmen, ändern oder nochmal würfeln.');
    el('termInput').focus(); el('termInput').select();
  });

  on('passPhone', 'click', () => {
    el('termInput').value = ''; setError(el('termError')); setSuccess('');
    el('privacyText').textContent = `${state.allTerms.length} von ${state.termTarget} Begriffen sind gesammelt. Gib das Handy einfach weiter.`;
    show('privacy');
  });
  on('continueCollect', 'click', () => { renderCollect(); show('collect'); requestAnimationFrame(() => el('termInput').focus()); });
  on('startCollectedGame', 'click', () => { if (state.allTerms.length >= state.termTarget) prepareGame(); });

  function validateStoredSetup() {
    const all = state.teamMembers.flat();
    return state.players.length >= 2 && state.teamMembers.every((team) => team.length > 0) && all.length === state.players.length && new Set(all).size === state.players.length;
  }

  function prepareGame() {
    if (!validateStoredSetup()) { renderPlayers(); show('players'); return; }
    if (state.allTerms.length < state.termTarget) {
      if (state.mode === 'random') state.allTerms = createRandomTerms(state.termTarget);
      else { renderCollect(); show('collect'); return; }
    }
    state.round = 0;
    state.activeTeam = 0;
    state.scores = [0, 0];
    state.roundScores = [0, 0];
    state.pile = shuffle(state.allTerms);
    state.current = null;
    state.teamTurnIndex = [0, 0];
    renderRoundIntro(); show('roundIntro');
  }

  function renderRoundIntro() {
    const round = rounds[state.round];
    const player = currentExplainer();
    el('roundBadge').textContent = `Runde ${state.round + 1} von 3`;
    el('roundEmoji').textContent = round.emoji;
    el('roundTitle').textContent = round.title;
    el('roundRule').textContent = round.rule;
    el('roundMeta').innerHTML = `<span class="metaPill">${state.allTerms.length} Begriffe</span><span class="metaPill">${state.duration} Sek. pro Zug</span>`;
    el('introScores').innerHTML = scoreHTML(state.activeTeam);
    el('startsText').textContent = `${state.teams[state.activeTeam]} beginnt${player ? ` – ${player.name} ist zuerst dran.` : '.'}`;
  }

  on('startRound', 'click', () => { renderTurnReady(); show('turnReady'); });

  function renderTurnReady() {
    const round = rounds[state.round];
    const player = currentExplainer();
    el('turnRoundBadge').textContent = `Runde ${state.round + 1}: ${round.title}`;
    el('turnTeam').textContent = state.teams[state.activeTeam];
    el('turnPlayer').textContent = player ? `👤 ${player.name}` : '👤 Spieler';
    el('turnEmoji').textContent = round.emoji;
    el('turnInstruction').textContent = state.round === 0
      ? 'Erkläre so viele Begriffe wie möglich – ohne den Begriff selbst zu nennen.'
      : state.round === 1
        ? 'Pro Begriff ist genau ein Hinweiswort erlaubt.'
        : 'Nur darstellen: kein Wort, kein Geräusch.';
  }

  on('beginTurn', 'click', startCountdown);

  function startCountdown() {
    if (!state.pile.length) { finishRound(false); return; }
    clearCountdown();
    ensureAudio();
    const player = currentExplainer();
    el('countdownRound').textContent = `Runde ${state.round + 1}: ${rounds[state.round].title}`;
    el('countdownTeam').textContent = `${state.teams[state.activeTeam]}${player ? ` · ${player.name}` : ''}`;
    show('countdown');
    const sequence = [3, 2, 1, 'LOS!'];
    sequence.forEach((value, index) => {
      const timeout = window.setTimeout(() => {
        const number = el('countdownNumber');
        number.textContent = String(value);
        number.classList.remove('pulse');
        void number.offsetWidth;
        number.classList.add('pulse');
        soundCountdown(value);
        if (value === 'LOS!') vibrate(35);
      }, index * 850);
      countdownTimers.push(timeout);
    });
    countdownTimers.push(window.setTimeout(startTurn, 3350));
  }

  function clearCountdown() {
    countdownTimers.forEach((id) => clearTimeout(id));
    countdownTimers = [];
  }

  function startTurn() {
    clearCountdown();
    if (!state.pile.length) { finishRound(false); return; }
    const player = currentExplainer();
    state.turnPoints = 0;
    state.current = null;
    timeLeft = state.duration;
    el('timer').textContent = timeLeft;
    el('timer').classList.remove('danger');
    el('playRound').textContent = `${state.teams[state.activeTeam]} · ${rounds[state.round].title}`;
    el('playPlayer').textContent = player ? `👤 ${player.name}` : '';
    el('liveTurnPoints').textContent = '0';
    nextWord();
    show('play');
    clearTimer();
    timerId = window.setInterval(() => {
      timeLeft -= 1;
      el('timer').textContent = timeLeft;
      if (timeLeft <= 10) el('timer').classList.add('danger');
      if (timeLeft > 0 && timeLeft <= 3) soundWarning();
      if (timeLeft <= 0) endTurn();
    }, 1000);
  }

  function nextWord() {
    if (!state.pile.length) { finishRound(true); return; }
    state.current = state.pile[0];
    el('currentWord').textContent = state.current;
    el('remainingWords').textContent = String(state.pile.length);
    el('skipWord').disabled = state.pile.length <= 1;
    const card = el('wordCard');
    card.classList.remove('wordPop');
    void card.offsetWidth;
    card.classList.add('wordPop');
    save();
  }

  on('gotWord', 'click', () => {
    if (!state.current || !state.pile.length) return;
    vibrate(18); soundCorrect();
    state.pile.shift();
    state.turnPoints += 1;
    state.scores[state.activeTeam] += 1;
    state.roundScores[state.activeTeam] += 1;
    state.current = null;
    el('liveTurnPoints').textContent = String(state.turnPoints);
    save();
    if (!state.pile.length) finishRound(true); else nextWord();
  });

  on('skipWord', 'click', () => {
    if (state.pile.length <= 1) return;
    const skipped = state.pile.shift();
    state.pile.push(skipped);
    state.current = null;
    nextWord(); vibrate(10);
  });

  function advanceExplainer(teamIndex) {
    const count = state.teamMembers[teamIndex] ? state.teamMembers[teamIndex].length : 0;
    if (count) state.teamTurnIndex[teamIndex] = (state.teamTurnIndex[teamIndex] + 1) % count;
  }

  function renderTurnEnd() {
    const justPlayed = state.activeTeam;
    const nextTeam = 1 - justPlayed;
    const nextPlayer = explainerFor(nextTeam);
    el('turnEndTeam').textContent = state.teams[justPlayed];
    el('turnPoints').textContent = String(state.turnPoints);
    el('turnPointsLabel').textContent = state.turnPoints === 1 ? 'Begriff' : 'Begriffe';
    el('endScores').innerHTML = scoreHTML(justPlayed);
    el('nextUpText').textContent = `${state.teams[nextTeam]} ist als Nächstes dran${nextPlayer ? ` – ${nextPlayer.name} übernimmt.` : '.'}`;
  }

  function endTurn() {
    if (state.phase !== 'play') return;
    clearTimer();
    state.current = null;
    soundTimeUp(); vibrate([80, 45, 80]);
    advanceExplainer(state.activeTeam);
    renderTurnEnd();
    show('turnEnd');
  }

  on('nextTurn', 'click', () => { state.activeTeam = 1 - state.activeTeam; renderTurnReady(); show('turnReady'); });

  function renderRoundEnd() {
    el('roundEndTitle').textContent = `${rounds[state.round].title} geschafft`;
    el('roundEndText').textContent = `Alle ${state.allTerms.length} Begriffe wurden erraten.`;
    el('roundResult').innerHTML = state.teams.map((team, i) => `<div class="roundGain"><span>${escapeHtml(team)} · Runde</span><strong>+${state.roundScores[i]}</strong></div>`).join('');
    el('roundEndScores').innerHTML = scoreHTML();
    const r0 = state.roundScores[0], r1 = state.roundScores[1];
    if (r0 === r1) el('roundLeader').textContent = `Diese Runde endet ${r0}:${r1} unentschieden.`;
    else {
      const roundWinner = r0 > r1 ? 0 : 1;
      el('roundLeader').textContent = `${state.teams[roundWinner]} holt diese Runde mit ${state.roundScores[roundWinner]} Punkten.`;
    }
    el('nextRound').textContent = state.round === 2 ? 'Ergebnis ansehen' : `Weiter: ${rounds[state.round + 1].title}`;
  }

  function finishRound(advanceCurrentExplainer = false) {
    clearTimer(); clearCountdown();
    state.current = null;
    if (advanceCurrentExplainer) advanceExplainer(state.activeTeam);
    soundRoundComplete(); vibrate([55, 40, 55]);
    renderRoundEnd();
    show('roundEnd');
  }

  on('nextRound', 'click', () => {
    if (state.round >= 2) { finishGame(); return; }
    state.round += 1;
    state.roundScores = [0, 0];
    state.pile = shuffle(state.allTerms);
    state.activeTeam = 1 - state.activeTeam;
    renderRoundIntro(); show('roundIntro');
  });

  function finishGame() {
    el('finalScores').innerHTML = scoreHTML();
    if (state.scores[0] === state.scores[1]) {
      el('winnerText').textContent = 'Unentschieden!';
      el('winnerSub').textContent = `${state.scores[0]} : ${state.scores[1]} – perfekte Ausgangslage für eine Revanche.`;
    } else {
      const winner = state.scores[0] > state.scores[1] ? 0 : 1;
      const diff = Math.abs(state.scores[0] - state.scores[1]);
      el('winnerText').textContent = `${state.teams[winner]} gewinnt!`;
      el('winnerSub').textContent = `${state.scores[winner]} Punkte und ${diff} ${diff === 1 ? 'Punkt' : 'Punkte'} Vorsprung.`;
    }
    soundGameComplete(); vibrate([60, 45, 60, 45, 100]);
    show('finish');
  }

  on('restartSame', 'click', () => {
    const keep = {
      duration: state.duration,
      mode: state.mode,
      soundEnabled: state.soundEnabled,
      players: state.players.map((p) => ({ ...p })),
      teams: ['Team 1', 'Team 2'],
      teamMembers: state.teamMembers.map((team) => [...team]),
      teamMode: state.teamMode,
      termTarget: state.termTarget,
      targetLocked: state.targetLocked
    };
    state = { ...fresh(), ...keep, started: true };
    if (state.mode === 'random') { state.allTerms = createRandomTerms(state.termTarget); prepareGame(); }
    else { renderCollect(); show('collect'); }
  });

  function clearTimer() { if (timerId !== null) { clearInterval(timerId); timerId = null; } }

  function hardReset() {
    clearTimer(); clearCountdown(); cleanupDrag();
    localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(LEGACY_KEY);
    const soundEnabled = state.soundEnabled;
    state = fresh(); state.soundEnabled = soundEnabled;
    el('duration').value = '60'; setMode('own'); el('resetTop').hidden = true; show('home');
  }

  on('fullReset', 'click', hardReset);
  on('resetTop', 'click', () => { if (confirm('Aktuelles Spiel wirklich verwerfen?')) hardReset(); });

  function resume() {
    el('duration').value = String(state.duration);
    setMode(state.mode);
    renderSoundToggle();
    el('resetTop').hidden = !state.started;

    if (!state.started) { show('home'); return; }
    const phase = state.phase;
    if (phase === 'players') { renderPlayers(); show('players'); return; }
    if (phase === 'teams') {
      if (state.teamMode === 'manual') ensureManualAssignment(); else if (!validateStoredSetup()) assignRandomTeams();
      renderTeams(); show('teams'); return;
    }
    if (phase === 'collect' || phase === 'privacy') {
      if (state.mode === 'random') { if (!state.allTerms.length) state.allTerms = createRandomTerms(state.termTarget); prepareGame(); return; }
      renderCollect();
      if (phase === 'privacy') {
        el('privacyText').textContent = `${state.allTerms.length} von ${state.termTarget} Begriffen sind gesammelt. Gib das Handy einfach weiter.`;
        show('privacy');
      } else show('collect');
      return;
    }

    const hasTerms = state.allTerms.length >= state.termTarget && state.allTerms.length > 0;
    if (!hasTerms || !validateStoredSetup()) { renderPlayers(); show('players'); return; }

    if (phase === 'play' || phase === 'countdown') {
      state.current = null;
      renderTurnReady(); show('turnReady'); return;
    }
    if (phase === 'turnReady') { renderTurnReady(); show('turnReady'); return; }
    if (phase === 'turnEnd') { renderTurnEnd(); show('turnEnd'); return; }
    if (phase === 'roundEnd') { renderRoundEnd(); show('roundEnd'); return; }
    if (phase === 'finish') { finishGame(); return; }
    renderRoundIntro(); show('roundIntro');
  }

  resume();
})();
