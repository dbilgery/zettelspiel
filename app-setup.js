'use strict';
function renderPlayers() {
  const list = el('playerList');
  if (!state.players.length) {
    list.innerHTML = '<div class="playerRow"><span class="playerName" style="color:var(--muted)">Noch keine Spieler</span></div>';
  } else {
    list.innerHTML = state.players.map((player, index) => `
      <div class="playerRow">
        <div class="playerIdentity">
          <span class="playerNumber">${index + 1}</span>
          <span class="playerName">${escapeHtml(player.name)}</span>
        </div>
        <button class="removePlayer" type="button" data-remove="${player.id}" aria-label="${escapeHtml(player.name)} entfernen">−</button>
      </div>
    `).join('');
  }
  $$('[data-remove]').forEach((button) => button.addEventListener('click', () => removePlayer(button.dataset.remove)));
  const count = state.players.length;
  el('playerSetupHint').textContent = count < 2 ? `Noch ${2 - count}` : `${count} Spieler`;
  el('toTeams').disabled = count < 2;
}

function addPlayer() {
  const input = el('newPlayer');
  const name = clean(input.value);
  setError(el('playerError'));
  if (!name) {
    setError(el('playerError'), 'Name fehlt.');
    input.focus();
    return;
  }
  if (state.players.some((p) => p.name.localeCompare(name, 'de', { sensitivity: 'accent' }) === 0)) {
    setError(el('playerError'), 'Name bereits vorhanden.');
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
  state.teamTurnIndex = [0,0];
  renderPlayers();
  syncTermTarget();
}

function assignRandomTeams() {
  const ids = shuffle(state.players.map((p) => p.id));
  state.teamMembers = [[],[]];
  ids.forEach((id, index) => state.teamMembers[index % 2].push(id));
  state.teamTurnIndex = [0,0];
  syncTermTarget();
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
  if (!state.teamMembers[0].length && state.teamMembers[1].length > 1) state.teamMembers[0].push(state.teamMembers[1].shift());
  if (!state.teamMembers[1].length && state.teamMembers[0].length > 1) state.teamMembers[1].push(state.teamMembers[0].pop());
  state.teamTurnIndex = [0,0];
  syncTermTarget();
}

function setTeamMode(mode) {
  state.teamMode = mode === 'manual' ? 'manual' : 'random';
  if (state.teamMode === 'random') assignRandomTeams();
  else ensureManualAssignment();
  renderTeams();
  save();
}

function renderTeams() {
  el('randomTab').classList.toggle('active', state.teamMode === 'random');
  el('manualTab').classList.toggle('active', state.teamMode === 'manual');
  el('randomTab').setAttribute('aria-selected', String(state.teamMode === 'random'));
  el('manualTab').setAttribute('aria-selected', String(state.teamMode === 'manual'));
  el('shuffleTeams').hidden = state.teamMode !== 'random';

  el('teamColumns').innerHTML = state.teamMembers.map((members, teamIndex) => `
    <section class="teamBox" data-team="${teamIndex}">
      <h3><span>Team ${teamIndex + 1}</span><span class="teamCount">${members.length}</span></h3>
      <div class="teamMembers">
        ${members.length ? members.map((id) => {
          const player = playerById(id);
          if (!player) return '';
          return `<div class="member" data-player="${id}" data-from="${teamIndex}">
            ${state.teamMode === 'manual' ? '<span class="dragHandle" aria-hidden="true">≡</span>' : ''}
            <span>${escapeHtml(player.name)}</span>
            ${state.teamMode === 'manual' ? `<button class="moveMember" type="button" data-move="${id}" data-from="${teamIndex}" aria-label="${escapeHtml(player.name)} verschieben">↔</button>` : ''}
          </div>`;
        }).join('') : '<div class="emptyTeam">Hier ablegen</div>'}
      </div>
    </section>
  `).join('');

  $$('[data-move]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation();
    movePlayerToTeam(button.dataset.move, 1 - Number(button.dataset.from));
  }));

  if (state.teamMode === 'manual') bindDragAndDrop();
  renderTermSettings();
  validateTeams(false);
}

function validateTeams(showMessage = true) {
  const all = state.teamMembers.flat();
  const valid = state.players.length >= 2 && state.teamMembers.every((team) => team.length > 0) && all.length === state.players.length && new Set(all).size === state.players.length;
  el('confirmTeams').disabled = !valid;
  if (showMessage) setError(el('teamError'), valid ? '' : 'Beide Teams brauchen Spieler.');
  return valid;
}

function renderTermSettings() {
  const value = Math.round(clamp(state.termsPerPlayer[0], 3, 5));
  state.termsPerPlayer = [value, value];
  $$('[data-terms-choice]').forEach((button) => {
    const active = Number(button.dataset.termsChoice) === value;
    button.classList.toggle('active', active);
    button.setAttribute('aria-checked', String(active));
  });
  state.termTarget = Math.min(WORD_POOL.length, state.players.length * value);
  const summary = el('termSummary');
  if (summary) summary.textContent = `${state.players.length} Spieler · ${state.termTarget} Wörter insgesamt`;
}

function movePlayerToTeam(playerId, targetTeam) {
  const from = state.teamMembers.findIndex((team) => team.includes(playerId));
  if (from < 0 || from === targetTeam) return;
  state.teamMembers[from] = state.teamMembers[from].filter((id) => id !== playerId);
  state.teamMembers[targetTeam].push(playerId);
  state.teamTurnIndex = [0,0];
  renderTeams();
  save();
  vibrate(15);
}

function bindDragAndDrop() {
  $$('.member[data-player]').forEach((member) => {
    member.addEventListener('pointerdown', (event) => {
      if (event.target.closest('button') || event.button > 0) return;
      const playerId = member.dataset.player;
      const player = playerById(playerId);
      if (!player) return;
      event.preventDefault();
      const ghost = document.createElement('div');
      ghost.className = 'dragGhost';
      ghost.textContent = player.name;
      document.body.appendChild(ghost);
      member.classList.add('dragging');
      drag = { pointerId:event.pointerId, playerId, from:Number(member.dataset.from), member, ghost, target:null };
      if (member.setPointerCapture) member.setPointerCapture(event.pointerId);
      positionGhost(event.clientX, event.clientY);
      updateDropTarget(event.clientX, event.clientY);
      const move = (e) => {
        if (!drag || e.pointerId !== drag.pointerId) return;
        e.preventDefault();
        positionGhost(e.clientX, e.clientY);
        updateDropTarget(e.clientX, e.clientY);
      };
      const end = (e) => {
        if (!drag || e.pointerId !== drag.pointerId) return;
        const target = drag.target;
        const id = drag.playerId;
        const from = drag.from;
        cleanupDrag();
        if (target !== null && target !== from) movePlayerToTeam(id, target);
      };
      member.addEventListener('pointermove', move);
      member.addEventListener('pointerup', end, { once:true });
      member.addEventListener('pointercancel', () => cleanupDrag(), { once:true });
      drag.move = move;
    });
  });
}

function positionGhost(x, y) {
  if (!drag) return;
  drag.ghost.style.left = `${x}px`;
  drag.ghost.style.top = `${y}px`;
}

function updateDropTarget(x, y) {
  if (!drag) return;
  $$('.teamBox').forEach((box) => box.classList.remove('dropTarget'));
  const targetNode = document.elementFromPoint(x, y);
  const box = targetNode && targetNode.closest ? targetNode.closest('.teamBox') : null;
  if (!box) { drag.target = null; return; }
  drag.target = Number(box.dataset.team);
  if (drag.target !== drag.from) box.classList.add('dropTarget');
}

function cleanupDrag() {
  if (!drag) return;
  drag.member.classList.remove('dragging');
  if (drag.move) drag.member.removeEventListener('pointermove', drag.move);
  if (drag.ghost && drag.ghost.parentNode) drag.ghost.remove();
  $$('.teamBox').forEach((box) => box.classList.remove('dropTarget'));
  drag = null;
}

function createRandomTerms(count) {
  if (count > WORD_POOL.length) return [];
  return shuffle(WORD_POOL).slice(0, count);
}

function renderCollect() {
  const count = state.allTerms.length;
  const target = state.termTarget;
  const remaining = Math.max(0, target - count);
  const done = target > 0 && count >= target;
  el('poolCount').textContent = `${count} von ${target}`;
  el('poolRemaining').textContent = done ? 'Fertig' : `Noch ${remaining}`;
  el('progressFill').style.width = `${target ? Math.min(100, Math.round((count / target) * 100)) : 0}%`;
  el('termInput').disabled = done;
  el('addTerm').disabled = done;
  el('suggestTerm').disabled = done;
  el('startCollectedGame').hidden = !done;
  if (done) {
    el('termInput').value = '';
    setError(el('termError'));
    setSuccess('Fertig');
  }
}

function isDuplicateTerm(term) {
  return state.allTerms.some((existing) => existing.localeCompare(term, 'de', { sensitivity:'base' }) === 0);
}

function addCurrentTerm() {
  const input = el('termInput');
  const term = clean(input.value);
  setError(el('termError'));
  setSuccess('');
  if (!term) {
    setError(el('termError'), 'Wort fehlt.');
    input.focus();
    return;
  }
  if (isDuplicateTerm(term)) {
    setError(el('termError'), 'Schon vorhanden.');
    input.select();
    return;
  }
  if (state.allTerms.length >= state.termTarget) return;
  state.allTerms.push(term);
  input.value = '';
  renderCollect();
  save();
  vibrate(12);
  if (state.allTerms.length < state.termTarget) input.focus();
}
