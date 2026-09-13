(() => {
  'use strict';

  const STORAGE_KEY = 'zettelspiel-team-term-settings-v1';
  const DEFAULTS = { team1: 3, team2: 3 };
  let settings = loadSettings();

  function loadSettings() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return {
        team1: clamp(parsed && parsed.team1),
        team2: clamp(parsed && parsed.team2)
      };
    } catch (_) {
      return { ...DEFAULTS };
    }
  }

  function clamp(value) {
    const number = Math.round(Number(value) || 3);
    return Math.max(3, Math.min(5, number));
  }

  function saveSettings() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) {}
  }

  function resetSettings() {
    settings = { ...DEFAULTS };
    saveSettings();
    syncControls();
  }

  function injectStyles() {
    if (document.getElementById('teamTargetStyles')) return;
    const style = document.createElement('style');
    style.id = 'teamTargetStyles';
    style.textContent = `
      #targetCard{display:none!important}
      .teamTermTarget{margin-top:14px;padding:18px;border:1px solid var(--line);border-radius:20px;background:rgba(255,255,255,.025)}
      .teamTermTargetHead{margin-bottom:15px}.teamTermTargetHead strong{display:block;font-size:1.02rem;margin-bottom:4px}.teamTermTargetHead p{margin:0}
      .teamTermSliders{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .teamTermSlider{padding:14px;border:1px solid var(--line);border-radius:16px;background:#101015;min-width:0}
      .teamTermSliderTop{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.teamTermSliderTop strong{font-size:.92rem}.teamTermValue{display:grid;place-items:center;min-width:36px;height:30px;padding:0 9px;border-radius:999px;background:var(--panel2);color:var(--accent2);font-weight:850}
      .teamTermSlider input[type=range]{width:100%;padding:0;border:0;background:transparent;box-shadow:none;accent-color:var(--accent);height:28px}
      .teamTermScale{display:flex;justify-content:space-between;color:var(--muted);font-size:.75rem;margin-top:2px}
      .teamTermCalc{margin-top:12px;padding:14px 15px;border-radius:16px;background:rgba(139,92,246,.08);border:1px solid rgba(167,139,250,.18)}
      .teamTermCalcRows{display:grid;gap:5px;margin-bottom:10px}.teamTermCalcRow{display:flex;justify-content:space-between;gap:12px;color:var(--muted);font-size:.86rem}.teamTermCalcRow span:last-child{color:var(--text);font-weight:700;text-align:right}
      .teamTermTotal{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding-top:10px;border-top:1px solid rgba(167,139,250,.16)}.teamTermTotal strong{font-size:1rem}.teamTermTotal span{font-size:1.45rem;font-weight:900;letter-spacing:-.04em;color:var(--accent2)}
      @media(max-width:560px){.teamTermSliders{grid-template-columns:1fr}.teamTermTarget{padding:15px}.teamTermCalcRow{font-size:.82rem}}
    `;
    document.head.appendChild(style);
  }

  function buildUI() {
    const teamColumns = document.getElementById('teamColumns');
    if (!teamColumns || document.getElementById('teamTermTarget')) return;

    const card = document.createElement('section');
    card.id = 'teamTermTarget';
    card.className = 'teamTermTarget';
    card.innerHTML = `
      <div class="teamTermTargetHead">
        <strong>Wie viele Begriffe?</strong>
        <p class="hint">Wählt pro Team 3, 4 oder 5 Begriffe pro Spieler. Daraus berechnet sich automatisch die Größe des gemeinsamen Wortpools.</p>
      </div>
      <div class="teamTermSliders">
        <label class="teamTermSlider" for="team1Terms">
          <span class="teamTermSliderTop"><strong>Team 1 · pro Spieler</strong><span class="teamTermValue" id="team1TermsValue">3</span></span>
          <input id="team1Terms" type="range" min="3" max="5" step="1" value="3" aria-label="Begriffe pro Spieler in Team 1">
          <span class="teamTermScale"><span>3</span><span>4</span><span>5</span></span>
        </label>
        <label class="teamTermSlider" for="team2Terms">
          <span class="teamTermSliderTop"><strong>Team 2 · pro Spieler</strong><span class="teamTermValue" id="team2TermsValue">3</span></span>
          <input id="team2Terms" type="range" min="3" max="5" step="1" value="3" aria-label="Begriffe pro Spieler in Team 2">
          <span class="teamTermScale"><span>3</span><span>4</span><span>5</span></span>
        </label>
      </div>
      <div class="teamTermCalc" aria-live="polite">
        <div class="teamTermCalcRows">
          <div class="teamTermCalcRow"><span id="team1CalcLabel">Team 1</span><span id="team1Calc">–</span></div>
          <div class="teamTermCalcRow"><span id="team2CalcLabel">Team 2</span><span id="team2Calc">–</span></div>
        </div>
        <div class="teamTermTotal"><strong>Begriffe insgesamt</strong><span id="teamTermsTotal">–</span></div>
      </div>
      <p class="hint" style="margin:10px 2px 0">Die Begriffe selbst bleiben anonym im gemeinsamen Pool – die Einstellung bestimmt nur die Gesamtanzahl.</p>
    `;
    teamColumns.insertAdjacentElement('afterend', card);

    document.getElementById('team1Terms').addEventListener('input', (event) => {
      settings.team1 = clamp(event.target.value);
      saveSettings();
      renderCalculation();
    });
    document.getElementById('team2Terms').addEventListener('input', (event) => {
      settings.team2 = clamp(event.target.value);
      saveSettings();
      renderCalculation();
    });

    const observer = new MutationObserver(renderCalculation);
    observer.observe(teamColumns, { childList: true, subtree: true });
    syncControls();
  }

  function countTeam(teamIndex) {
    const box = document.querySelector(`.teamBox[data-team="${teamIndex}"]`);
    return box ? box.querySelectorAll('.member[data-player-id]').length : 0;
  }

  function syncTarget(total) {
    const input = document.getElementById('termTarget');
    if (!input || !Number.isFinite(total) || total < 6) return;
    const capped = Math.min(80, total);
    if (Number(input.value) === capped) return;
    input.value = String(capped);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function renderCalculation() {
    const slider1 = document.getElementById('team1Terms');
    const slider2 = document.getElementById('team2Terms');
    if (!slider1 || !slider2) return;

    slider1.value = String(settings.team1);
    slider2.value = String(settings.team2);
    document.getElementById('team1TermsValue').textContent = String(settings.team1);
    document.getElementById('team2TermsValue').textContent = String(settings.team2);

    const team1Players = countTeam(0);
    const team2Players = countTeam(1);
    const team1Total = team1Players * settings.team1;
    const team2Total = team2Players * settings.team2;
    const rawTotal = team1Total + team2Total;
    const total = Math.min(80, rawTotal);

    document.getElementById('team1Calc').textContent = team1Players ? `${team1Players} × ${settings.team1} = ${team1Total}` : '–';
    document.getElementById('team2Calc').textContent = team2Players ? `${team2Players} × ${settings.team2} = ${team2Total}` : '–';
    document.getElementById('teamTermsTotal').textContent = rawTotal > 80 ? '80 (Maximum)' : (rawTotal ? String(rawTotal) : '–');

    if (team1Players && team2Players) syncTarget(total);
  }

  function syncControls() {
    const slider1 = document.getElementById('team1Terms');
    const slider2 = document.getElementById('team2Terms');
    if (slider1) slider1.value = String(settings.team1);
    if (slider2) slider2.value = String(settings.team2);
    renderCalculation();
  }

  injectStyles();
  buildUI();

  const setupStart = document.getElementById('setupStart');
  if (setupStart) setupStart.addEventListener('click', resetSettings, { capture: true });
  const fullReset = document.getElementById('fullReset');
  if (fullReset) fullReset.addEventListener('click', resetSettings, { capture: true });
})();
