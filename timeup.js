'use strict';

const TIME_UP_SIGNAL_START = 0.06;

function createTimeUpSignalUrl() {
  const sampleRate = 22050;
  const duration = 3.32;
  const sampleCount = Math.floor(sampleRate * duration);
  const bytesPerSample = 2;
  const dataSize = sampleCount * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Three modern two-note chimes. Clean sine-based spectrum with a soft shimmer,
  // deliberately avoiding a harsh alarm or metallic kitchen-timer character.
  const groups = [0.06, 1.08, 2.10];
  const notes = groups.flatMap((start) => [
    { start, frequency: 880.0, gain: 0.82 },
    { start: start + 0.145, frequency: 1318.51, gain: 0.94 },
  ]);

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / sampleRate;
    let sample = 0;

    for (const note of notes) {
      const local = t - note.start;
      if (local < 0 || local > 0.92) continue;

      const attack = Math.min(1, local / 0.008);
      const mainDecay = Math.exp(-3.65 * local);
      const overtoneDecay = Math.exp(-6.2 * local);
      const shimmerDecay = Math.exp(-4.8 * local);
      const f = note.frequency;

      // A tiny pitch settle and close detuned companion create the polished,
      // glassy movement of a modern phone chime without sounding synthetic.
      const settle = 1 + 0.0035 * Math.exp(-12 * local);
      const phase = 2 * Math.PI * f * settle * local;
      const core = Math.sin(phase);
      const companion = Math.sin(2 * Math.PI * (f + 2.2) * local + 0.08);
      const octave = Math.sin(2 * Math.PI * f * 2 * local + 0.16);
      const sparkle = Math.sin(2 * Math.PI * f * 2.997 * local + 0.31);
      const body = Math.sin(2 * Math.PI * (f / 2) * local + 0.05);

      sample += note.gain * attack * (
        mainDecay * (core * 0.52 + companion * 0.22 + body * 0.12) +
        overtoneDecay * octave * 0.10 +
        shimmerDecay * sparkle * 0.04
      );
    }

    // Gentle limiting keeps it clear on iPhone speakers without becoming shrill.
    const driven = Math.tanh(sample * 1.08) * 0.76;
    view.setInt16(44 + i * bytesPerSample, Math.round(driven * 32767), true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

const timeUpSignalUrl = createTimeUpSignalUrl();
const timeUpAudio = new Audio(timeUpSignalUrl);
timeUpAudio.preload = 'auto';
timeUpAudio.setAttribute('playsinline', '');
timeUpAudio.load();

let timeUpAudioUnlocked = false;
let timerTurnLocked = true;

const timeUpStyle = document.createElement('style');
timeUpStyle.textContent = `
  body.timeUpSignal::after{
    content:'ZEIT!';
    position:fixed;
    inset:0;
    z-index:99999;
    display:grid;
    place-items:center;
    background:#0f172a;
    color:#fff;
    font-size:clamp(56px,18vw,92px);
    font-weight:800;
    letter-spacing:-.05em;
    pointer-events:none;
    animation:timeUpFlash .62s ease-out both;
  }
  @keyframes timeUpFlash{
    0%{opacity:0}
    10%{opacity:1}
    72%{opacity:1}
    100%{opacity:0}
  }
  #gotWord:disabled,#skipWord:disabled{pointer-events:none;opacity:.45}
`;
document.head.appendChild(timeUpStyle);

function unlockTimeUpSound() {
  if (timeUpAudioUnlocked) return;
  try {
    timeUpAudio.pause();
    timeUpAudio.currentTime = 0;
    const playback = timeUpAudio.play();
    const arm = () => {
      window.setTimeout(() => {
        try {
          timeUpAudio.pause();
          timeUpAudio.currentTime = TIME_UP_SIGNAL_START;
          timeUpAudioUnlocked = true;
        } catch (_) {}
      }, 40);
    };
    if (playback && typeof playback.then === 'function') playback.then(arm).catch(() => {});
    else arm();
  } catch (_) {}
}

function playTimeUpSound() {
  try {
    timeUpAudio.pause();
    timeUpAudio.currentTime = TIME_UP_SIGNAL_START;
    const playback = timeUpAudio.play();
    if (playback && typeof playback.catch === 'function') playback.catch(() => {});
  } catch (_) {}
}

function flashTimeUp() {
  document.body.classList.remove('timeUpSignal');
  void document.body.offsetWidth;
  document.body.classList.add('timeUpSignal');
  window.setTimeout(() => document.body.classList.remove('timeUpSignal'), 650);
}

function setTurnControlsDisabled(disabled) {
  const correct = el('gotWord');
  const skip = el('skipWord');
  if (correct) correct.disabled = disabled;
  if (skip) skip.disabled = disabled;
}

function turnActionAllowed() {
  if (timerTurnLocked || state.phase !== 'play') return false;
  if (Date.now() >= turnDeadline) {
    endTurn();
    return false;
  }
  return true;
}

const originalStartTurn = startTurn;
startTurn = function startTurnWithLock() {
  timerTurnLocked = false;
  setTurnControlsDisabled(false);
  return originalStartTurn();
};

const originalFinishRound = finishRound;
finishRound = function finishRoundWithLock(...args) {
  timerTurnLocked = true;
  setTurnControlsDisabled(true);
  return originalFinishRound(...args);
};

const originalEndTurn = endTurn;
endTurn = function endTurnWithSignal() {
  if (timerTurnLocked || state.phase !== 'play') return;
  timerTurnLocked = true;
  setTurnControlsDisabled(true);
  playTimeUpSound();
  flashTimeUp();
  const result = originalEndTurn();
  window.setTimeout(() => vibrate([260,740,260,740,260]), 0);
  return result;
};

const beginTurnButton = el('beginTurn');
if (beginTurnButton) {
  beginTurnButton.addEventListener('pointerdown', unlockTimeUpSound, { passive:true });
  beginTurnButton.addEventListener('click', unlockTimeUpSound, true);
}

['gotWord','skipWord'].forEach((id) => {
  const button = el(id);
  if (!button) return;
  button.addEventListener('click', (event) => {
    if (turnActionAllowed()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
});

window.addEventListener('pagehide', () => {
  try { timeUpAudio.pause(); } catch (_) {}
  try { URL.revokeObjectURL(timeUpSignalUrl); } catch (_) {}
});
