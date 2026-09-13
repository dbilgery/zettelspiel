'use strict';

const TIME_UP_BEEP_AT = 0.12;
const timeUpAudio = new Audio('data:audio/wav;base64,UklGRq8KAABXQVZFZm10IBAAAAABAAEAcBcAAHAXAAABAAgAZGF0YYsKAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYODgHx2c3uKk46Eem1jbYqhno59aVVZf6mxnINqTUVrp8Owj3BLM1Caz8efeVAoM3/M17CGXjInYrjbwJNsPyRHndjNoXlPKDOAzNewhl4yJ2K428CTbD8kR53YzaF5Tygzf8zXsIZeMidiuNvAk2w/JEed2M2heU8oM4DM17CGXjInYrjbwJNsPyRHndjNoXlPKDOAzNewhl4yJ2K428CTbD8kR53YzaF5TygzgMzXsIZeMidiuNvAk2w/JEed2M2heU8oM3/M17CGXjInYrjbwJNsPyRHndjNoXlPKDOAzNewhl4yJ2K428CTbD8kR53YzaF5Tygzf8zXsIZeMidiuNvAk2w/JEed2M2heU8oM4DM17CGXjInYrjbwJNsPyRHndjNoXlPKDN/zNewhl4yJ2K428CTbD8kR53YzaF5TygzgMzXsIZeMidiuNvAk2w/JEed2M2heU8oM3/M17CGXjInYrjbwJNsPyRHndjNoXlPKDOAzNewhl4yJ2K428CTbD8kR53YzaF5Tygzf8zXsIZeMidiuNvAk2w/JEed2M2heU8oM4DM17CGXjInYrjbwJNsPyRHndjNoXlPKDOAzNewhl4yJ2K428CTbD8kR53YzaF5TygzgMzXsIZeMidiuNvAk2w/JEed2M2heU8oM4DM17CGXjInYrjbwJNsPyRHndjNoXlPKDN/zNewhl4yJ2K428CTbD8kR53YzaF5TygzgMzXsIZeMidiuNvAk2w/JEed2M2heU8oM4DM17CGXjInYrjbwJNsPyRHndjNoXlPKDOAzNewhl4yJ2K428CTbD8kR53YzaF5Tygzf8zXsIZeMidiuNvAk2w/JEed2M2heU8oM3/M17CGXjInYrjbwJNsPyRHndjNoXlPKDOAzNewhl4yJ2K428CTbD8kR53YzaF5Tygzf8zXsIZeMidiuNvAk2w/JEed2M2heU8oM3/M17CGXjInYrjbwJNsPyRHndjNoXlPKDN/zNewhl4yJ2K428CTbD8kR53YzaF5TygzgMzXsIZeMidiuNvAk2w/JEed2M2heU8oM3/M17CGXjInYrjbwJNsPyRHndjNoXlPKDN/zNewhl4yJ2K428CTbD8kR53YzaF5TygzgMzXsIZeMidiuNvAk2w/JEed2M2heU8oM4DM17CGXjInYrjbwJNsPyRHndjNoXlPKDOAzNewhl4yJ2K428CTbD8kR53YzaF5Tygzf8zXsIZeMidiuNvAk2w/JEed2M2heU8oM4DM17CGXjInYrjbwJNsPyRHndjNoXlPKDOAzNewhl4yJ2K428CTbD8kR53YzaF5TygzgMzXsIZeMidiuNvAk2w/JEed2M2heU8oM3/M17CGXjInYrjbwJNsPyRHndjNoXlPKDOAzNewhl4yJ2K428CTbD8kR53YzaF5TygzgMzXsIZeMidiuNvAk2w/JEed2M2heU8oM3/M17CGXjInYrjbwJNsPyRHndjNoXlPKDN/zNewhl4yJ2K428CTbD8kR53YzaF5TygzgMzXsIZeMidiuNvAk2w/JEed2M2heU8oM4DM17CGXjInYrjbwJNsPyRHndjNoXlPKDN/zNewhl4yJ2K428CTbD8kR53YzaF5TygzgMzXsIZeMidiuNvAk2w/JEed2M2heU8oM4DM17CGXjInYrjbwJNsPyRHndjNoXlPKDN/zNewhl4yJ2K428CTbD8kR53YzaF5Tygzf8zXsIZeMidiuNvAk2w/JEed2M2heU8oM4DM17CGXjInYrjbwJNsPyRHndjNoXlPKDOAzNewhl4yJ2K428CTbD8kSJ3XzKB5UCs2f8jSrYVgOC5ks9O5kW5HL06ZzMOcelY1QH+/yKeFZEE5aKzIso9wTjlVlsK5mHtcQEmAtr2ihGhKQ2ulvaqMc1ZEXJK3sJR8YkpSf62znINsU05vn7KiinVeT2KPraeQfGhVW3+jqJaCcF1Ycpinm4h3ZVppi6KejH1tX2R/mp6QgnRmY3aRnJOFem1lcIiXlIh+c2ptgJGUioF4b216ipGLg3x1cHaEjYuEf3l0dn+IiYWAfHh4fYSGhIF+fHt9gYKCgH9/f3+AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==');
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
          timeUpAudio.currentTime = TIME_UP_BEEP_AT;
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
    timeUpAudio.currentTime = TIME_UP_BEEP_AT;
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
  window.setTimeout(() => vibrate([180,80,180]), 0);
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
});
