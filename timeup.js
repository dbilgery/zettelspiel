'use strict';

const TIME_UP_SIGNAL_START = 0.1;

function createTimeUpSignalUrl() {
  const sampleRate = 16000;
  const duration = 3.05;
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

  const ringStarts = [0.1, 1.1, 2.1];
  const ringDuration = 0.72;

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / sampleRate;
    let sample = 0;

    for (const start of ringStarts) {
      const local = t - start;
      if (local < 0 || local > ringDuration) continue;

      const attack = Math.min(1, local / 0.012);
      const decay = Math.exp(-4.1 * local / ringDuration);
      const envelope = attack * decay;

      // Bright, bell-like timer signal: clear fundamental plus soft harmonics.
      const fundamental = Math.sin(2 * Math.PI * 1175 * local);
      const harmonic = Math.sin(2 * Math.PI * 1762.5 * local + 0.18);
      const shimmer = Math.sin(2 * Math.PI * 2350 * local + 0.34);
      const body = Math.sin(2 * Math.PI * 783.3 * local + 0.1);
      const pulse = 0.9 + 0.1 * Math.sin(2 * Math.PI * 7.5 * local);

      sample += envelope * pulse * (
        fundamental * 0.58 +
        harmonic * 0.24 +
        shimmer * 0.10 +
        body * 0.08
      );
    }

    const clipped = Math.max(-1, Math.min(1, sample * 0.72));
    view.setInt16(44 + i * bytesPerSample, Math.round(clipped * 32767), true);
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
      }, 45);
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
  window.setTimeout(() => vibrate([250,750,250,750,250]), 0);
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
