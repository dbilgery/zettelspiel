(() => {
  const $ = s => document.querySelector(s);
  const screens = [...document.querySelectorAll('.screen')];
  const rounds = [
    {title:'Erklären', rule:'Erkläre den Begriff, ohne ihn selbst oder Teile davon zu sagen.', emoji:'🗣️'},
    {title:'Ein Wort', rule:'Du darfst pro Begriff genau ein einziges Hinweiswort sagen.', emoji:'☝️'},
    {title:'Pantomime', rule:'Nur darstellen. Nicht sprechen, keine Geräusche und keine Buchstaben in die Luft schreiben.', emoji:'🎭'}
  ];
  const fresh = () => ({
    teams:['Team 1','Team 2'], duration:60, perPlayer:3, players:[], teamMembers:[[],[]], teamMode:'random', teamTurnIndex:[0,0],
    collectIndex:0, allTerms:[], round:0, activeTeam:0, scores:[0,0], roundScores:[0,0], pile:[], turnPoints:0, current:null, started:false, phase:'home'
  });
  let state = normalize(load() || fresh());
  let tick = null, timeLeft = state.duration;

  function normalize(s){
    const d=fresh(); s={...d,...s};
    if(!Array.isArray(s.players)) s.players=[];
    s.players=s.players.map((p,i)=>typeof p==='string'?{id:`p${i}-${Date.now()}`,name:p}:{id:p.id||`p${i}-${Date.now()}`,name:p.name||`Spieler ${i+1}`});
    if(!Array.isArray(s.teamMembers)||s.teamMembers.length!==2) s.teamMembers=[[],[]];
    if(!Array.isArray(s.teamTurnIndex)||s.teamTurnIndex.length!==2) s.teamTurnIndex=[0,0];
    return s;
  }
  function save(){ localStorage.setItem('zettelspiel-state', JSON.stringify(state)); $('#resetTop').hidden = !state.started && state.players.length===0; }
  function load(){ try{return JSON.parse(localStorage.getItem('zettelspiel-state'))}catch{return null} }
  function show(id){ state.phase=id; screens.forEach(s=>s.classList.toggle('active', s.id===id)); window.scrollTo({top:0,behavior:'instant'}); save(); }
  function shuffle(a){ a=[...a]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a }
  function vibrate(pattern=35){ if(navigator.vibrate) navigator.vibrate(pattern) }
  function esc(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML }
  function scoreHTML(active=-1){ return state.teams.map((t,i)=>`<div class="score ${i===active?'active':''}"><span>${esc(t)}</span><strong>${state.scores[i]}</strong><small class="muted">${state.roundScores[i]} in dieser Runde</small></div>`).join('') }
  function playerById(id){ return state.players.find(p=>p.id===id) }
  function currentExplainer(){ const members=state.teamMembers[state.activeTeam]; if(!members.length) return null; return playerById(members[state.teamTurnIndex[state.activeTeam] % members.length]) }

  $('#setupStart').onclick = () => {
    state=fresh(); state.duration=+$('#duration').value; state.perPlayer=+$('#perPlayer').value; state.started=true;
    renderPlayers(); show('players'); setTimeout(()=>$('#newPlayer').focus(),80);
  };
  function addPlayer(){
    const name=$('#newPlayer').value.trim(); if(!name){ $('#newPlayer').focus(); return }
    if(state.players.some(p=>p.name.toLowerCase()===name.toLowerCase())){ alert('Diesen Namen gibt es bereits.'); return }
    state.players.push({id:`p-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name}); $('#newPlayer').value='';
    if(state.players.length>=2 && state.teamMode==='random') assignRandomTeams(); else renderPlayers();
    save(); $('#newPlayer').focus();
  }
  $('#addPlayer').onclick=addPlayer; $('#newPlayer').addEventListener('keydown',e=>{if(e.key==='Enter') addPlayer()});
  function removePlayer(id){
    state.players=state.players.filter(p=>p.id!==id); state.teamMembers=state.teamMembers.map(t=>t.filter(pid=>pid!==id));
    if(state.players.length>=2 && state.teamMode==='random') assignRandomTeams(); else renderPlayers(); save();
  }
  function renderPlayers(){
    $('#playerList').innerHTML=state.players.map(p=>`<div class="playerRow"><strong>${esc(p.name)}</strong><button class="iconBtn" data-remove="${p.id}" aria-label="${esc(p.name)} entfernen">✕</button></div>`).join('') || '<div class="hint">Noch keine Spieler eingetragen.</div>';
    document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>removePlayer(b.dataset.remove));
    $('#playerSetupHint').textContent=state.players.length<2?'Mindestens 2 Spieler benötigt.':`${state.players.length} Spieler eingetragen.`;
    $('#teamSetupCard').hidden=state.players.length<2; renderTeams();
  }
  function setMode(mode){ state.teamMode=mode; $('#randomTab').classList.toggle('active',mode==='random'); $('#manualTab').classList.toggle('active',mode==='manual'); $('#randomSetup').hidden=mode!=='random'; $('#manualSetup').hidden=mode!=='manual'; if(mode==='random') assignRandomTeams(); else ensureManualTeams(); renderTeams(); save() }
  $('#randomTab').onclick=()=>setMode('random'); $('#manualTab').onclick=()=>setMode('manual'); $('#shuffleTeams').onclick=()=>{assignRandomTeams();vibrate()};
  function assignRandomTeams(){
    const ids=shuffle(state.players.map(p=>p.id)); state.teamMembers=[[],[]]; ids.forEach((id,i)=>state.teamMembers[i%2].push(id)); renderTeams(); save();
  }
  function ensureManualTeams(){
    const valid=new Set(state.players.map(p=>p.id)); state.teamMembers=state.teamMembers.map(t=>t.filter(id=>valid.has(id)));
    const assigned=new Set(state.teamMembers.flat()); state.players.forEach(p=>{if(!assigned.has(p.id)){ const target=state.teamMembers[0].length<=state.teamMembers[1].length?0:1; state.teamMembers[target].push(p.id)}});
    if(!state.teamMembers[0].length&&state.teamMembers[1].length>1) state.teamMembers[0].push(state.teamMembers[1].shift());
    if(!state.teamMembers[1].length&&state.teamMembers[0].length>1) state.teamMembers[1].push(state.teamMembers[0].pop());
  }
  function movePlayer(id,from){ state.teamMembers[from]=state.teamMembers[from].filter(x=>x!==id); state.teamMembers[1-from].push(id); renderTeams(); save() }
  function renderTeams(){
    if(state.players.length<2) return;
    ensureManualTeams();
    const names=[$('#team1').value.trim()||'Team 1',$('#team2').value.trim()||'Team 2'];
    $('#teamColumns').innerHTML=state.teamMembers.map((members,i)=>`<div class="teamBox"><h3><span>${esc(names[i])}</span><span class="hint">${members.length}</span></h3><div class="teamMembers">${members.map(id=>{const p=playerById(id);return p?`<div class="member"><span>${esc(p.name)}</span>${state.teamMode==='manual'?`<button data-move="${id}" data-from="${i}" aria-label="Team wechseln">${i===0?'→':'←'}</button>`:''}</div>`:''}).join('')}</div></div>`).join('');
    document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>movePlayer(b.dataset.move,+b.dataset.from));
    const assigned=state.teamMembers.flat(); const allAssigned=assigned.length===state.players.length&&new Set(assigned).size===state.players.length;
    $('#confirmTeams').disabled=!(allAssigned&&state.teamMembers[0].length&&state.teamMembers[1].length);
  }
  $('#team1').addEventListener('input',renderTeams); $('#team2').addEventListener('input',renderTeams);
  $('#confirmTeams').onclick=()=>{
    state.teams=[$('#team1').value.trim()||'Team 1',$('#team2').value.trim()||'Team 2']; state.collectIndex=0; state.allTerms=[]; state.teamTurnIndex=[0,0];
    renderCollect(); show('collect');
  };

  function renderCollect(){
    const p=state.players[state.collectIndex]; if(!p){prepareGame();return}
    $('#collectPlayerBadge').textContent=`👤 ${p.name}`; $('#termsLabel').textContent=`${p.name}: deine ${state.perPlayer} Begriffe`; $('#termHint').textContent=`Bitte genau ${state.perPlayer} ${state.perPlayer===1?'Begriff':'Begriffe'} eingeben – einen pro Zeile.`;
    $('#collectedCount').textContent=`${state.allTerms.length} ${state.allTerms.length===1?'Begriff':'Begriffe'} gesammelt`; $('#collectProgress').textContent=`Person ${state.collectIndex+1} von ${state.players.length}`; $('#termsInput').value='';
  }
  function parseTerms(){ return $('#termsInput').value.split(/\n|,/).map(x=>x.trim()).filter(Boolean) }
  $('#savePlayer').onclick=()=>{
    const terms=parseTerms(); if(terms.length!==state.perPlayer){ alert(`Bitte genau ${state.perPlayer} Begriffe eingeben.`); $('#termsInput').focus(); return }
    state.allTerms.push(...terms); state.collectIndex++; vibrate();
    if(state.collectIndex>=state.players.length){ $('#privacyText').textContent='Alle Begriffe sind gesammelt. Gebt das Handy an die Gruppe zurück.'; $('#nextPlayer').textContent='Spiel starten'; }
    else { $('#privacyText').textContent=`Begriffe gespeichert. Gib das Handy an ${state.players[state.collectIndex].name} weiter.`; $('#nextPlayer').textContent=`Weiter zu ${state.players[state.collectIndex].name}`; }
    show('privacy');
  };
  $('#nextPlayer').onclick=()=>{ if(state.collectIndex>=state.players.length) prepareGame(); else {renderCollect();show('collect');setTimeout(()=>$('#termsInput').focus(),80)} };

  function prepareGame(){
    if(state.allTerms.length!==state.players.length*state.perPlayer) return;
    state.round=0; state.activeTeam=0; state.scores=[0,0]; state.roundScores=[0,0]; state.pile=shuffle(state.allTerms); state.current=null; state.teamTurnIndex=[0,0]; renderRoundIntro(); show('roundIntro');
  }
  function renderRoundIntro(){
    const r=rounds[state.round], p=currentExplainer(); $('#roundBadge').textContent=`Runde ${state.round+1} von 3 · ${r.emoji}`; $('#roundTitle').textContent=r.title; $('#roundRule').textContent=r.rule; $('#introScores').innerHTML=scoreHTML(state.activeTeam); $('#startsText').textContent=`${state.teams[state.activeTeam]} beginnt${p?` – ${p.name} ist zuerst dran.`:'.'}`;
  }
  $('#startRound').onclick=()=>{renderTurnReady();show('turnReady')};
  function renderTurnReady(){
    const r=rounds[state.round], p=currentExplainer(); $('#turnRoundBadge').textContent=`Runde ${state.round+1}: ${r.title}`; $('#turnTeam').textContent=state.teams[state.activeTeam]; $('#turnPlayer').textContent=p?`👤 ${p.name}`:'👤 Spieler'; $('#turnEmoji').textContent=r.emoji;
    $('#turnInstruction').textContent=state.round===0?'Du erklärst jetzt die Begriffe für dein Team.':state.round===1?'Ein Hinweiswort pro Begriff – nicht mehr.':'Nur darstellen. Kein Wort, kein Geräusch.';
  }
  $('#beginTurn').onclick=startTurn;
  function startTurn(){
    if(!state.pile.length){finishRound();return} const p=currentExplainer(); state.turnPoints=0; timeLeft=state.duration; $('#timer').textContent=timeLeft; $('#timer').classList.remove('danger'); $('#playRound').textContent=`${state.teams[state.activeTeam]} · ${rounds[state.round].title}`; $('#playPlayer').textContent=p?`👤 ${p.name}`:''; nextWord(); show('play'); clearInterval(tick); tick=setInterval(()=>{timeLeft--;$('#timer').textContent=timeLeft;if(timeLeft<=10)$('#timer').classList.add('danger');if(timeLeft<=0)endTurn()},1000);
  }
  function nextWord(){ if(!state.pile.length){$('#currentWord').textContent='Geschafft!';setTimeout(()=>finishRound(),350);return} state.current=state.pile[0];$('#currentWord').textContent=state.current }
  $('#gotWord').onclick=()=>{ if(!state.current)return;vibrate(25);state.pile.shift();state.turnPoints++;state.scores[state.activeTeam]++;state.roundScores[state.activeTeam]++;state.current=null;save();if(!state.pile.length)finishRound();else nextWord() };
  $('#skipWord').onclick=()=>{ if(state.pile.length>1){const x=state.pile.shift();state.pile.push(x);nextWord();vibrate(10)} };
  function advanceExplainer(team){ const n=state.teamMembers[team].length; if(n) state.teamTurnIndex[team]=(state.teamTurnIndex[team]+1)%n }
  function endTurn(){ clearInterval(tick);tick=null;state.current=null;vibrate([80,50,80]);$('#turnPoints').textContent=state.turnPoints;$('#endScores').innerHTML=scoreHTML(state.activeTeam);advanceExplainer(state.activeTeam);show('turnEnd') }
  $('#nextTurn').onclick=()=>{state.activeTeam=1-state.activeTeam;renderTurnReady();show('turnReady')};
  function finishRound(){ clearInterval(tick);tick=null;state.current=null;vibrate([60,50,60]);$('#roundEndTitle').textContent=`${rounds[state.round].title} geschafft`;$('#roundEndText').textContent=`Alle ${state.allTerms.length} Begriffe sind durch.`;$('#roundEndScores').innerHTML=scoreHTML();$('#nextRound').textContent=state.round===2?'Ergebnis ansehen':'Nächste Runde';show('roundEnd') }
  $('#nextRound').onclick=()=>{ if(state.round>=2){finishGame();return} state.round++;state.roundScores=[0,0];state.pile=shuffle(state.allTerms);state.activeTeam=1-state.activeTeam;renderRoundIntro();show('roundIntro') };
  function finishGame(){ $('#finalScores').innerHTML=scoreHTML(); if(state.scores[0]===state.scores[1]){$('#winnerText').textContent='Unentschieden!';$('#winnerSub').textContent=`${state.scores[0]} : ${state.scores[1]} – das schreit nach einer Revanche.`}else{const w=state.scores[0]>state.scores[1]?0:1;$('#winnerText').textContent=`${state.teams[w]} gewinnt!`;$('#winnerSub').textContent=`${state.scores[w]} Punkte. Starke Runde.`}show('finish') }
  $('#restartSame').onclick=()=>{ const keep={teams:[...state.teams],duration:state.duration,perPlayer:state.perPlayer,players:state.players.map(p=>({...p})),teamMembers:state.teamMembers.map(t=>[...t]),teamMode:state.teamMode}; state={...fresh(),...keep,started:true,phase:'collect'};state.collectIndex=0;renderCollect();show('collect') };
  function hardReset(){clearInterval(tick);localStorage.removeItem('zettelspiel-state');state=fresh();$('#duration').value='60';$('#perPlayer').value='3';$('#team1').value='Team 1';$('#team2').value='Team 2';$('#resetTop').hidden=true;show('home')}
  $('#fullReset').onclick=hardReset;$('#resetTop').onclick=()=>{if(confirm('Aktuelles Spiel wirklich verwerfen?'))hardReset()};

  if(state.started){
    $('#resetTop').hidden=false; $('#duration').value=String(state.duration); $('#perPlayer').value=String(state.perPlayer); $('#team1').value=state.teams[0]||'Team 1'; $('#team2').value=state.teams[1]||'Team 2';
    const phase=state.phase;
    if(phase==='players'){renderPlayers();show('players')}
    else if((phase==='collect'||phase==='privacy')&&state.collectIndex<state.players.length){renderCollect();show(phase)}
    else if(state.allTerms.length===state.players.length*state.perPlayer&&state.allTerms.length){renderRoundIntro();show('roundIntro')}
    else {renderPlayers();show('players')}
  }
})();
