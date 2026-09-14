'use strict';

const TIME_UP_SIGNAL_START = 0.06;

function createTimeUpSignalUrl() {
  const sampleRate = 22050;
  const duration = 3.2;
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

  // Three unmistakable timer rings. Each ring is a quick double strike with a metallic tail.
  const groups = [0.06, 1.06, 2.06];
  const strikes = groups.flatMap((start) => [
    { start, pitch: 1 },
    { start: start + 0.18, pitch: 1.055 },
  ]);

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / sampleRate;
    let sample = 0;

    for (const strike of strikes) {
      const local = t - strike.start;
      if (local < 0 || local > 0.78) continue;

      const attack = Math.min(1, local / 0.0045);
      const decay = Math.exp(-5.2 * local);
      const tail = Math.exp(-2.8 * local);
      const p = strike.pitch;

      // Bell/alarm spectrum: strong body plus inharmonic metallic overtones.
      const body = Math.sin(2 * Math.PI * 784 * p * local);
      const bright = Math.sin(2 * Math.PI * 1176 * p * local + 0.12);
      const metal1 = Math.sin(2 * Math.PI * 1568 * p * local + 0.31);
      const metal2 = Math.sin(2 * Math.PI * 2135 * p * local + 0.47);
      const shimmer = Math.sin(2 * Math.PI * 2744 * p * local + 0.19);

      sample += attack * (
        decay * (body * 0.46 + bright * 0.31 + metal1 * 0.15) +
        tail * (metal2 * 0.055 + shimmer * 0.025)
      );
    }

    // Tiny soft-clipping keeps the alarm present on phone speakers without sounding harsh.
    const driven = Math.tanh(sample * 1.42) * 0.82;
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
