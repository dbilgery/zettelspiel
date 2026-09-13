'use strict';
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const el = (id) => document.getElementById(id);
  const on = (id, event, handler) => {
    const node = el(id);
    if (node) node.addEventListener(event, handler);
  };

  const STORAGE_KEY = 'zettelspiel-state-v5';
  const LEGACY_KEYS = ['zettelspiel-state-v4', 'zettelspiel-state-v3'];
  const screens = $$('.screen');

  const rounds = [
    { title: 'Erklären', rule: 'Erkläre den Begriff frei, ohne ihn selbst oder Teile davon zu nennen.', emoji: '🗣️' },
    { title: 'Ein Wort', rule: 'Pro Begriff ist genau ein einziges Hinweiswort erlaubt.', emoji: '☝️' },
    { title: 'Pantomime', rule: 'Nur darstellen. Nicht sprechen und keine Geräusche machen.', emoji: '🎭' }
  ];

  const WORD_POOL = [...new Set([
    'Eiffelturm','Pinguin','Zahnbürste','Harry Potter','Pizza','Feuerwehr','Kaktus','Titanic','Schneemann','Batman',
    'Staubsauger','Mount Everest','Spaghetti','Darth Vader','Waschmaschine','Giraffe','Disco','Schloss','Superman','Popcorn',
    'Mona Lisa','Toaster','Sherlock Holmes','Vulkan','Klopapier','Astronaut','Las Vegas','Sonnenbrille','Dracula','Bagger',
    'Meerjungfrau','Hamburger','Pyramide','Roboter','Krokodil','Fallschirm','Mozart','Mikrowelle','Cowboy','Nutella',
    'Freiheitsstatue','Detektiv','Skateboard','Dinosaurier','James Bond','Kaffeemaschine','Zirkus','Eisberg','Wikinger','SpongeBob',
    'Luftballon','Krankenhaus','Banane','Tarzan','Kühlschrank','Sushi','Leuchtturm','Pirat','Hamster','Basketball',
    'Marilyn Monroe','Kopfhörer','Safari','Schornsteinfeger','Donut','Ritter','Taxi','Kamel','Avatar','Schaukel',
    'Albert Einstein','Pommes','U-Boot','Hexe','Kino','Papagei','Schokolade','Napoleon','Rolltreppe','Gummibärchen',
    'Polizei','Yoda','Koffer','Wasserfall','Mickey Mouse','Tennis','Föhn','Burg','Elvis Presley','Regenschirm',
    'Zebra','Rakete','Cappuccino','Spider-Man','Kettensäge','London','Clown','Kokosnuss','Formel 1','Barbie',
    'Panda','Bohrmaschine','Nordpol','Fußball','Charlie Chaplin','Laptop','Hai','Achterbahn','Hotdog','Aladdin',
    'Schnecke','Flughafen','Kerze','Hulk','Biene','Camping','Käsekuchen','Fernbedienung','King Kong','Taschenlampe',
    'Oper','Messer','Simba','Wüste','Erdbeere','Gefängnis','Eule','Motorrad','Mumie','Brezel',
    'Tower Bridge','Schildkröte','Indiana Jones','Wecker','Sauna','Gorilla','Ketchup','Zauberer','Traktor','Chinesische Mauer',
    'Piratenschiff','Gitarre','Cinderella','Delfin','Bowling','Kaffee','Schneewittchen','Hubschrauber','Pferd','Venedig',
    'Käse','Minions','Rucksack','Wolkenkratzer','Löwe','Trompete','Schach','Einhorn','Tankstelle','Pfannkuchen',
    'Robin Hood','Kamera','Moskito','Hochzeit','Ananas','Ghostbusters','Surfbrett','Elefant','Big Ben','Lasagne',
    'Ninja','Klimaanlage','Koala','Casino','Croissant','Popeye','Schlüssel','Iglu','Flamingo','Supermarkt',
    'Cupcake','Homer Simpson','Teleskop','Krake','Brandenburger Tor','Kaugummi','Karate','Pinocchio','Kanu','Eisbär',
    'McDonald’s','Zauberstab','Schiedsrichter','Matratze','Rom','Erdmännchen','Waffel','Shrek','Roller','Waschbär',
    'Autobahn','Vampir','Schraubenzieher','Mallorca','Pistazie','Rockstar','Kran','Wal','Museum','Muffin',
    'Hänsel und Gretel','Mikrofon','Schmetterling','Berlin','Gulasch','Joker','Snowboard','Lama','Kathedrale','Avocado',
    'Biene Maja','Drohne','Kinoabend','Pfau','Kuchen','Gladiator','Tretboot','Nashorn','Opernhaus','Pommesgabel',
    'Peter Pan','Ventilator','Frosch','Bahnhof','Mango','Terminator','Kletterwand','Otter','Sagrada Familia','Milchshake',
    'Pippi Langstrumpf','Staubsaugerroboter','Seehund','Festival','Taco','Rocky','Hängematte','Rentier','Kolosseum','Smoothie',
    'Bugs Bunny','Werkzeugkoffer','Pelikan','Bibliothek','Burrito','Rambo','Trampolin','Faultier','Niagarafälle','Käsebrot',
    'Asterix','Kopierer','Gans','Zoo','Kartoffel','Mr. Bean','E-Scooter','Orang-Utan','Hollywood','Müsli',
    'Obelix','Wasserkocher','Huhn','Schwimmbad','Nudeln','Forrest Gump','Geldautomat','Mondlandung','König','Zeitmaschine',
    'Bügeleisen','Karaoke','Vogelhaus','Geisterbahn','Pommesbude','Schatzkarte','Tischtennis','Lagerfeuer','Einkaufswagen','Schlafsack',
    'Kuckucksuhr','Schneeballschlacht','Dosenöffner','Wetterfrosch','Kochlöffel','Seifenblase','Gartenzwerg','Discokugel','Wackelpudding','Regenbogen',
    'Sonnenuntergang','Schlüsselbund','Kronleuchter','Rettungsring','Briefkasten','Kaugummiautomat','Wasserpistole','Schneekugel','Kuscheltier','Jalousie',
    'Kochmütze','Schaukelstuhl','Müllabfuhr','Fahrradhelm','Stoppuhr','Schnorchel','Korkenzieher','Liegestuhl','Fahrstuhl','Keksdose',
    'Bademantel','Kopfkissen','Sonnencreme','Feuerwerk','Wasserrutsche','Einkaufstüte','Kühlschrankmagnet','Straßenlaterne','Wäschekorb','Taschenrechner',
    'Wanderschuh','Schokobrunnen','Zahnspange','Sicherheitsgurt','Pizzakarton','Wasserflasche','Katzenklo','Luftmatratze','Picknickkorb','Telefonzelle'
  ])];

  const fresh = () => ({
    mode: 'own',
    duration: 60,
    soundEnabled: true,
    players: [],
    teams: ['Team 1', 'Team 2'],
    teamMembers: [[], []],
    teamMode: 'random',
    termsPerPlayer: [3, 3],
    termTarget: 6,
    allTerms: [],
    teamTurnIndex: [0, 0],
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
  let countdownId = null;
  let turnDeadline = 0;
  let drag = null;
  let audioContext = null;

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function clean(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || min));
  }

  function normalize(input) {
    const s = { ...fresh(), ...(input || {}) };
    s.mode = s.mode === 'random' ? 'random' : 'own';
    s.duration = [30,45,60,90].includes(+s.duration) ? +s.duration : 60;
    s.soundEnabled = s.soundEnabled !== false;
    s.teamMode = s.teamMode === 'manual' ? 'manual' : 'random';
    s.teams = ['Team 1','Team 2'];
    if (!Array.isArray(s.players)) s.players = [];
    s.players = s.players.map((p) => typeof p === 'string' ? { id: makeId(), name: clean(p) } : {
      id: p && p.id ? p.id : makeId(),
      name: clean(p && p.name ? p.name : '')
    }).filter((p) => p.name);

    if (!Array.isArray(s.teamMembers) || s.teamMembers.length !== 2) s.teamMembers = [[],[]];
    const valid = new Set(s.players.map((p) => p.id));
    const seen = new Set();
    s.teamMembers = s.teamMembers.map((team) => Array.isArray(team) ? team.filter((id) => {
      if (!valid.has(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    }) : []);

    if (!Array.isArray(s.termsPerPlayer) || s.termsPerPlayer.length !== 2) s.termsPerPlayer = [3,3];
    s.termsPerPlayer = s.termsPerPlayer.map((v) => Math.round(clamp(v, 3, 5)));
    if (!Array.isArray(s.teamTurnIndex) || s.teamTurnIndex.length !== 2) s.teamTurnIndex = [0,0];
    s.teamTurnIndex = s.teamTurnIndex.map((v) => Math.max(0, +v || 0));
    if (!Array.isArray(s.allTerms)) s.allTerms = [];
    s.allTerms = [...new Set(s.allTerms.map(clean).filter(Boolean))];
    if (!Array.isArray(s.pile)) s.pile = [];
    s.pile = s.pile.map(clean).filter(Boolean);
    if (!Array.isArray(s.scores) || s.scores.length !== 2) s.scores = [0,0];
    if (!Array.isArray(s.roundScores) || s.roundScores.length !== 2) s.roundScores = [0,0];
    s.round = Math.max(0, Math.min(2, +s.round || 0));
    s.activeTeam = +s.activeTeam === 1 ? 1 : 0;
    s.phase = typeof s.phase === 'string' ? s.phase : 'home';
    s.termTarget = computeTermTarget(s);
    return s;
  }

  function loadState() {
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current) return JSON.parse(current);
      for (const key of LEGACY_KEYS) {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      }
    } catch (_) {}
    return null;
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
    renderNav();
  }

  function clearLegacy() {
    LEGACY_KEYS.forEach((key) => {
      try { localStorage.removeItem(key); } catch (_) {}
    });
  }

  function computeTermTarget(source = state) {
    const t0 = source.teamMembers && source.teamMembers[0] ? source.teamMembers[0].length : 0;
    const t1 = source.teamMembers && source.teamMembers[1] ? source.teamMembers[1].length : 0;
    const p0 = source.termsPerPlayer && source.termsPerPlayer[0] ? source.termsPerPlayer[0] : 3;
    const p1 = source.termsPerPlayer && source.termsPerPlayer[1] ? source.termsPerPlayer[1] : 3;
    const total = t0 * p0 + t1 * p1;
    return Math.max(0, Math.min(WORD_POOL.length, total));
  }

  function syncTermTarget() {
    state.termTarget = computeTermTarget();
    renderTermSettings();
    save();
  }

  function show(id) {
    state.phase = id;
    screens.forEach((screen) => screen.classList.toggle('active', screen.id === id));
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderNav();
    save();
  }

  function setError(node, message = '') {
    if (!node) return;
    node.textContent = message;
    node.hidden = !message;
  }

  function setSuccess(message = '') {
    const node = el('termSuccess');
    if (!node) return;
    node.textContent = message;
    node.hidden = !message;
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value == null ? '' : value);
    return div.innerHTML;
  }

  function shuffle(items) {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function playerById(id) {
    return state.players.find((player) => player.id === id) || null;
  }

  function explainerFor(teamIndex) {
    const members = state.teamMembers[teamIndex] || [];
    if (!members.length) return null;
    return playerById(members[state.teamTurnIndex[teamIndex] % members.length]);
  }

  function currentExplainer() {
    return explainerFor(state.activeTeam);
  }

  function vibrate(pattern = 20) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

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
    } catch (_) {
      return null;
    }
  }

  function tone(frequency, duration = .08, volume = .035, type = 'sine', delay = 0) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + .03);
  }

  function soundCountdown(value) {
    tone(value === 'LOS!' ? 920 : 520 + (3 - Number(value)) * 80, value === 'LOS!' ? .16 : .07, .04);
  }
  function soundCorrect() { tone(880, .055, .022); }
  function soundWarning() { tone(520, .055, .025, 'square'); }
  function soundTimeUp() {
    tone(260, .16, .05, 'sawtooth');
    tone(190, .22, .045, 'sawtooth', .18);
  }
  function soundRoundComplete() {
    tone(660, .08, .03);
    tone(820, .1, .035, 'sine', .1);
    tone(1020, .15, .04, 'sine', .22);
  }

  function renderNav() {
    const reset = el('resetTop');
    const back = el('backButton');
    const title = el('navTitle');
    const sound = el('soundToggle');
    if (reset) reset.hidden = !state.started;
    if (sound) {
      sound.textContent = state.soundEnabled ? '🔊' : '🔇';
      sound.setAttribute('aria-label', state.soundEnabled ? 'Ton ausschalten' : 'Ton einschalten');
    }
    if (title) title.textContent = state.phase === 'home' ? 'Zettelspiel' : pageTitleFor(state.phase);
    if (back) back.hidden = !['players','teams','collect'].includes(state.phase);
  }

  function pageTitleFor(phase) {
    if (phase === 'players') return 'Spieler';
    if (phase === 'teams') return 'Teams';
    if (phase === 'collect') return 'Begriffe';
    if (phase === 'roundIntro') return `Runde ${state.round + 1}`;
    if (phase === 'turnReady' || phase === 'countdown' || phase === 'play') return state.teams[state.activeTeam];
    return 'Zettelspiel';
  }

  function setMode(mode) {
    state.mode = mode === 'random' ? 'random' : 'own';
    $$('[data-mode]').forEach((button) => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-checked', String(active));
    });
    el('modeDescription').textContent = state.mode === 'own'
      ? 'Ihr sammelt gemeinsam eigene Begriffe. Niemand muss eine feste Anzahl beitragen.'
      : 'Die App erzeugt den kompletten Wortpool automatisch. Niemand kennt die Begriffe vorher.';
    save();
  }
