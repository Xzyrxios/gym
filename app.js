// app.js – logik för träningsappen

// ===== Program & regler
const PROGRAM = {
  1: [
    { id:'deadlift', name:'Marklyft', range:[5,8], progression:{type:'weekly_weight', increment:2.5} },
    { id:'ohp', name:'Press över huvudet', range:[8,10], progression:{type:'weekly_weight', increment:1} },
    { id:'pullups', name:'Pullups', range:[5,10], progression:{type:'weekly_rep'}, bw:true,
      note:'Öka 1 rep/vecka. Ta bort band när du når 10 reps.' },
    { id:'tri-bi', name:'Triceps/Biceps (varannan övning)', range:[10,15], progression:{type:'weekly_rep'},
      note:'En extra rep/vecka. Öka vikt när du klarar 15 reps.' },
  ],
  2: [
    { id:'bench', name:'Bänkpress', range:[5,8], progression:{type:'weekly_weight', increment:2.5} },
    { id:'row', name:'Stångrodd', range:[10,10], progression:{type:'weekly_weight', increment:2.5} },
    { id:'lunge-db', name:'Utfall med hantlar (per ben)', range:[10,15], progression:{type:'weekly_weight', increment:1.25},
      note:'Öka i vikt när du är uppe på 15 reps.' },
    { id:'lat-raise', name:'Sidolyft med hantlar', range:[10,15], progression:{type:'weekly_weight', increment:1},
      note:'Samma princip som ovan.' },
  ],
  3: [
    { id:'squat', name:'Knäböj', range:[5,8], progression:{type:'weekly_weight', increment:2.5} },
    { id:'pushups', name:'Armhävningar', range:[8,999], progression:{type:'weekly_rep'}, bw:true,
      note:'Öka 1 rep/vecka.' },
    { id:'ringrow', name:'Ringrodd', range:[8,15], progression:{type:'weekly_rep'}, bw:true,
      note:'Öka 1 rep/vecka. Luta dig mer bakåt när du klarar 15.' },
    { id:'bi-tri', name:'Biceps/Triceps (varannan övning)', range:[10,15], progression:{type:'weekly_rep'},
      note:'Samma som dag 1.' },
  ]
};

// ===== Lagring lokalt
const STORAGE_KEY = 'trainingLogsV1';
const readLogs = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const writeLogs = logs => localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));

// ===== GitHub Sync
const GH_KEY = 'trainingGithubCfgV1';
const GH = { owner:'', repo:'', branch:'main', path:'data/traningslogg.json', token:'' };
function loadGhCfg(){ Object.assign(GH, JSON.parse(localStorage.getItem(GH_KEY) || '{}')); }
function saveGhCfg(){ localStorage.setItem(GH_KEY, JSON.stringify(GH)); }
function b64EncodeUnicode(str){ return btoa(unescape(encodeURIComponent(str))); }
function b64DecodeUnicode(str){ return decodeURIComponent(escape(atob(str))); }

async function ghGetFile(){
  if(!GH.owner||!GH.repo||!GH.path||!GH.branch||!GH.token) throw new Error('Saknar GitHub-inställningar.');
  const url = `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${GH.path}?ref=${encodeURIComponent(GH.branch)}`;
  const res = await fetch(url, { headers:{ 'Accept':'application/vnd.github+json','Authorization':`Bearer ${GH.token}`,'X-GitHub-Api-Version':'2022-11-28' } });
  if(res.status===404) return null;
  if(!res.ok) throw new Error('GitHub GET misslyckades: '+res.status);
  return await res.json();
}
async function ghPutFile(jsonText){
  const existing = await ghGetFile();
  const body = { message: 'Update training logs', content: b64EncodeUnicode(jsonText), branch: GH.branch };
  if(existing && existing.sha) body.sha = existing.sha;
  const url = `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${GH.path}`;
  const res = await fetch(url, { method:'PUT', headers:{ 'Accept':'application/vnd.github+json','Authorization':`Bearer ${GH.token}`,'X-GitHub-Api-Version':'2022-11-28' }, body: JSON.stringify(body) });
  if(!res.ok) throw new Error('GitHub PUT misslyckades: '+res.status);
  return await res.json();
}

// ===== Hjälpfunktioner UI
const fmtRange = r => r[0]===r[1] ? `${r[0]} reps` : `${r[0]}–${r[1]} reps`;
const todayISO = () => new Date().toISOString().slice(0,10);
const h = (tag, attrs={}, ...children) => { const el = document.createElement(tag); for (const [k,v] of Object.entries(attrs)) { if (k==='class') el.className = v; else if (k==='html') el.innerHTML = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k,v);} for (const ch of children) el.append(ch); return el; };

// ===== UI: dagar
const selectedDayLabel = document.getElementById('selectedDayLabel');
let selectedDay = null;
['1','2','3'].forEach(d=>{
  document.getElementById(`btn-day-${d}`).addEventListener('click', ()=>selectDay(Number(d)));
});
function selectDay(day){
  selectedDay = day;
  document.querySelectorAll('.day-btn').forEach(el=>{ el.classList.remove('active'); });
  document.getElementById(`btn-day-${day}`).classList.add('active');
  selectedDayLabel.textContent = `Dag ${day}`;
  renderExercises();
}

// ===== UI: övningar
const exercisesPanel = document.getElementById('exercisesPanel');
function renderExercises(){
  exercisesPanel.innerHTML = '';
  if(!selectedDay){ exercisesPanel.append(h('p',{class:'empty'},'Välj en dag ovan.')); return; }
  const list = PROGRAM[selectedDay];
  list.forEach(ex => {
    const container = h('div',{class:'exercise'});
    const title = h('h3',{}, ex.name);
    const range = h('span',{class:'pill'}, fmtRange(ex.range));
    const hint = h('div',{class:'hint', id:`hint-${ex.id}`});

    const sets = h('div',{class:'sets'});
    sets.append(h('label',{},'Set#'), h('label',{},'Reps'), h('label',{}, ex.bw ? 'Vikt (valfritt)' : 'Vikt (kg)'), h('div'));

    const addSetRow = (i=1, reps='', weight='')=>{
      const row = h('div',{class:'set-row'});
      row.append(
        h('div',{class:'muted'}, `#${i}`),
        h('input',{type:'number', min:0, step:1, placeholder:'reps', value:reps}),
        h('input',{type:'number', min:0, step: ex.progression?.increment || 0.5, placeholder: ex.bw ? 'valfritt' : 'kg', value:weight}),
        h('button',{class:'ghost', type:'button', onclick:()=>{ row.remove(); renumber(sets); }}, '✕')
      );
      sets.append(row);
    };
    function renumber(grid){ let i=1; [...grid.querySelectorAll('.set-row')].forEach(r=>{ r.firstChild.textContent = `#${i++}`; }); }

    for(let i=1;i<=3;i++) addSetRow(i);
    const addBtn = h('button',{class:'ghost', type:'button', onclick:()=>{ addSetRow(sets.querySelectorAll('.set-row').length+1); }}, '+ Lägg till set');

    container.append(
      h('div',{class:'row', style:'align-items:baseline;justify-content:space-between'}, h('div',{}, title, ' ', range), addBtn),
      sets,
      h('div',{class:'note'}, ex.note || ruleText(ex)),
      hint
    );
    exercisesPanel.append(container);
    updateHint(ex, hint);
  });
}
function ruleText(ex){ if(!ex.progression) return ''; const p = ex.progression; if(p.type==='weekly_weight') return `Riktlinje: öka ~${p.increment} kg/vecka`; if(p.type==='weekly_rep') return `Riktlinje: öka ~1 rep/vecka`; return ''; }

// ===== Historik
const historyBody = document.getElementById('historyBody');
function updateHistory(){ const logs = readLogs(); if(!logs.length){ historyBody.textContent = 'Inget sparat ännu.'; return; } const recent = logs.slice(-6).reverse(); historyBody.innerHTML = ''; recent.forEach(l => { const dd = new Date(l.date).toLocaleDateString('sv-SE'); const box = h('details',{}, h('summary',{}, `${dd} – Dag ${l.day}`)); const ul = h('ul',{}); l.entries.forEach(e => { const txt = `${e.exercise}: ${e.sets.map(s=>`${s.reps}x${s.weight||0}kg`).join(', ')}`; ul.append(h('li',{}, txt)); }); box.append(ul); historyBody.append(box); }); }
function lastFor(exId){ const logs = readLogs().slice().reverse(); for(const l of logs){ const e = l.entries.find(x=>x.id===exId); if(e) return e; } return null; }
function updateHint(ex, hintEl){ const last = lastFor(ex.id); if(!last){ hintEl.textContent = 'Tips: logga första passet.'; return; } const p = ex.progression || {}; let msg = 'Senast: ' + last.sets.map(s=>`${s.reps}x${s.weight||0}kg`).join(', '); if(p.type==='weekly_weight'){ const maxW = Math.max(...last.sets.map(s=>Number(s.weight)||0)); msg += ` → Förslag: ${(maxW + (p.increment||0)).toFixed(1)} kg`; } else if (p.type==='weekly_rep'){ const maxR = Math.max(...last.sets.map(s=>Number(s.reps)||0)); msg += ` → Förslag: +1 rep (t.ex. ${maxR+1})`; } hintEl.textContent = msg; }

// ===== Knappar
const dateInput = document.getElementById('date');
const saveBtn = document.getElementById('saveBtn');
const exportBtn = document.getElementById('exportBtn');
const syncBtn = document.getElementById('syncBtn');
const pullBtn = document.getElementById('pullBtn');
const cfgBtn = document.getElementById('cfgBtn');
const cfgModal = document.getElementById('cfgModal');
const ghOwner = document.getElementById('ghOwner');
const ghRepo  = document.getElementById('ghRepo');
const ghBranch= document.getElementById('ghBranch');
const ghPath  = document.getElementById('ghPath');
const ghToken = document.getElementById('ghToken');
const cfgSave = document.getElementById('cfgSave');
const cfgClose= document.getElementById('cfgClose');

dateInput.value = todayISO();

saveBtn.addEventListener('click', ()=>{
  if(!selectedDay){ alert('Välj dag först.'); return; }
  const list = PROGRAM[selectedDay];
  const entries = [];
  const exEls = [...exercisesPanel.querySelectorAll('.exercise')];
  exEls.forEach((wrap, idx)=>{
    const ex = list[idx];
    const rows = [...wrap.querySelectorAll('.set-row')];
    const sets = rows.map(r=>{ const [lbl, repsEl, wEl] = r.children; return { reps: Number(repsEl.value||0), weight: Number(wEl.value||0) || (ex.bw? null : 0) }; }).filter(s=> (s.reps||0) > 0 );
    if(sets.length) entries.push({ id: ex.id, exercise: ex.name, sets });
  });
  if(!entries.length){ alert('Fyll i minst ett set.'); return; }
  const log = { date: dateInput.value, day: selectedDay, entries };
  const logs = readLogs(); logs.push(log); writeLogs(logs); updateHistory(); PROGRAM[selectedDay].forEach(ex=>{ const el = document.getElementById(`hint-${ex.id}`); if(el) updateHint(ex, el); }); alert('Sparat!');
});

exportBtn.addEventListener('click', ()=>{ const data = JSON.stringify(readLogs(), null, 2); const blob = new Blob([data], {type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'traningslogg.json'; a.click(); URL.revokeObjectURL(a.href); });

syncBtn.addEventListener('click', async ()=>{ try{ loadGhCfg(); const txt = JSON.stringify(readLogs(), null, 2); await ghPutFile(txt); alert('Uppladdat!'); } catch(e){ alert('Synk fel: '+ e.message); } });

pullBtn.addEventListener('click', async ()=>{ try{ loadGhCfg(); const obj = await ghGetFile(); if(!obj){ alert('Ingen fil i repo ännu.'); return; } const json = JSON.parse(b64DecodeUnicode(obj.content)); writeLogs(json); updateHistory(); if(selectedDay) renderExercises(); alert('Hämtat!'); } catch(e){ alert('Fel vid hämtning: '+ e.message); } });

cfgBtn.addEventListener('click', ()=>{ loadGhCfg(); ghOwner.value=GH.owner||''; ghRepo.value=GH.repo||''; ghBranch.value=GH.branch||'main'; ghPath.value=GH.path||'data/traningslogg.json'; ghToken.value=GH.token||''; cfgModal.classList.add('open'); });
cfgClose.addEventListener('click', ()=>{ cfgModal.classList.remove('open'); });
cfgSave.addEventListener('click', ()=>{ GH.owner=ghOwner.value.trim(); GH.repo=ghRepo.value.trim(); GH.branch=ghBranch.value.trim()||'main'; GH.path=ghPath.value.trim()||'data/traningslogg.json'; GH.token=ghToken.value.trim(); saveGhCfg(); cfgModal.classList.remove('open'); alert('Inställningar sparade.'); });

// Init
updateHistory();

