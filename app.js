// Träningslogg Application
document.addEventListener('DOMContentLoaded', () => {
  // ===== Program & regler
  const PROGRAM = {
    1: [
      { id: 'deadlift', name: 'Marklyft', range: [5, 8], progression: { type: 'weekly_weight', increment: 2.5 } },
      { id: 'ohp', name: 'Press över huvudet', range: [8, 10], progression: { type: 'weekly_weight', increment: 1 } },
      {
        id: 'pullups', name: 'Pullups', range: [5, 10], progression: { type: 'weekly_rep' }, bw: true,
        note: 'Öka 1 rep/vecka. Ta bort band när du når 10 reps.'
      },
      {
        id: 'tri-bi', name: 'Triceps/Biceps (varannan övning)', range: [10, 15], progression: { type: 'weekly_rep' }, defaultSets: 6,
        note: 'En extra rep/vecka. Öka vikt när du klarar 15 reps.'
      },
    ],
    2: [
      { id: 'bench', name: 'Bänkpress', range: [5, 8], progression: { type: 'weekly_weight', increment: 2.5 } },
      { id: 'row', name: 'Stångrodd', range: [10, 10], progression: { type: 'weekly_weight', increment: 2.5 } },
      {
        id: 'lunge-db', name: 'Utfall med hantlar (per ben)', range: [10, 15], progression: { type: 'weekly_weight', increment: 1.25 },
        note: 'Öka i vikt när du är uppe på 15 reps.'
      },
      {
        id: 'lat-raise', name: 'Sidolyft med hantlar', range: [10, 15], progression: { type: 'weekly_weight', increment: 1 },
        note: 'Samma princip som ovan.'
      },
    ],
    3: [
      { id: 'squat', name: 'Knäböj', range: [5, 8], progression: { type: 'weekly_weight', increment: 2.5 } },
      {
        id: 'pushups', name: 'Armhävningar', range: [8, 999], progression: { type: 'weekly_rep' }, bw: true,
        note: 'Öka 1 rep/vecka.'
      },
      {
        id: 'ringrow', name: 'Ringrodd', range: [8, 15], progression: { type: 'weekly_rep' }, bw: true,
        note: 'Öka 1 rep/vecka. Luta dig mer bakåt när du klarar 15.'
      },
      {
        id: 'tri-bi', name: 'Triceps/Biceps (varannan övning)', range: [10, 15], progression: { type: 'weekly_rep' }, defaultSets: 6,
        note: 'En extra rep/vecka. Öka vikt när du klarar 15 reps.'
      },
    ]
  };

  // ===== Lagring
  const STORAGE_KEY = 'trainingLogsV1';
  const readLogs = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const writeLogs = logs => localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));

  // ===== GitHub Sync
  const GH_KEY = 'trainingGithubCfgV1';
  const GH = { owner: 'Xzyrxios', repo: 'gym', branch: 'main', path: 'data/traningslogg.json', token: '' };

  function loadGhCfg() {
    Object.assign(GH, JSON.parse(localStorage.getItem(GH_KEY) || '{}'));
  }

  function saveGhCfg() {
    localStorage.setItem(GH_KEY, JSON.stringify(GH));
  }

  function b64EncodeUnicode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function b64DecodeUnicode(str) {
    return decodeURIComponent(escape(atob(str)));
  }

  async function ghGetFile() {
    if (!GH.owner || !GH.repo || !GH.path || !GH.branch || !GH.token) {
      throw new Error('Saknar GitHub-inställningar.');
    }
    const url = `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${GH.path}?ref=${encodeURIComponent(GH.branch)}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${GH.token}`,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`GitHub GET misslyckades: ${res.status} - ${errorText}`);
    }
    return await res.json();
  }

  async function ghPutFile(jsonText) {
    const existing = await ghGetFile();
    const body = {
      message: 'Update training logs',
      content: b64EncodeUnicode(jsonText),
      branch: GH.branch
    };
    if (existing && existing.sha) body.sha = existing.sha;

    const url = `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${GH.path}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${GH.token}`,
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`GitHub PUT misslyckades: ${res.status} - ${errorText}`);
    }
    return await res.json();
  }

  // ===== UI Helper Functions
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function setButtonLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
      button.disabled = true;
      button.classList.add('loading');
      button.setAttribute('aria-busy', 'true');
    } else {
      button.disabled = false;
      button.classList.remove('loading');
      button.setAttribute('aria-busy', 'false');
    }
  }

  // ===== Hjälpfunktioner
  const fmtRange = r => r[0] === r[1] ? `${r[0]} reps` : `${r[0]}–${r[1]} reps`;
  const todayISO = () => new Date().toISOString().slice(0, 10);

  const h = (tag, attrs = {}, ...children) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    for (const ch of children) el.append(ch);
    return el;
  };

  // ===== Dagar
  let selectedDay = null;
  ['1', '2', '3'].forEach(d => {
    const b = document.getElementById(`btn-day-${d}`);
    if (b) {
      b.addEventListener('click', () => selectDay(Number(d)));
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', 'false');
    }
  });

  const selectedDayLabel = document.getElementById('selectedDayLabel');

  function selectDay(day) {
    selectedDay = day;
    document.querySelectorAll('.day-btn').forEach(el => {
      el.classList.remove('active');
      el.setAttribute('aria-selected', 'false');
    });
    const activeBtn = document.getElementById(`btn-day-${day}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
      activeBtn.setAttribute('aria-selected', 'true');
    }
    if (selectedDayLabel) selectedDayLabel.textContent = `Dag ${day}`;
    renderExercises();
  }

  // ===== Historik & hintar
  const historyBody = document.getElementById('historyBody');

  function updateHistory() {
    const logs = readLogs();
    if (!historyBody) return;
    if (!logs.length) {
      historyBody.textContent = 'Inget sparat ännu.';
      return;
    }
    const recent = logs.slice(-6).reverse();
    historyBody.innerHTML = '';
    recent.forEach(l => {
      const dd = new Date(l.date).toLocaleDateString('sv-SE');
      const box = h('details', {}, h('summary', {}, `${dd} – Dag ${l.day}`));
      const ul = h('ul', {});
      l.entries.forEach(e => {
        const txt = `${e.exercise}: ${e.sets.map(s => `${s.reps}x${s.weight || 0}kg`).join(', ')}`;
        ul.append(h('li', {}, txt));
      });
      box.append(ul);
      historyBody.append(box);
    });
  }

  function lastFor(exId) {
    const logs = readLogs().slice().reverse();
    for (const l of logs) {
      const e = l.entries.find(x => x.id === exId);
      if (e) return e;
    }
    return null;
  }

  function updateHint(ex, el) {
    const last = lastFor(ex.id);
    if (!el) return;
    if (!last) {
      el.textContent = 'Tips: logga första passet, så får du förslag nästa gång.';
      return;
    }
    const p = ex.progression || {};
    let msg = 'Senast: ' + last.sets.map(s => `${s.reps}x${s.weight || 0}kg`).join(', ');
    if (p.type === 'weekly_weight') {
      const maxW = Math.max(...last.sets.map(s => Number(s.weight) || 0));
      msg += ` → Förslag: ~${(maxW + (p.increment || 0)).toFixed(1)} kg.`;
    } else if (p.type === 'weekly_rep') {
      const maxR = Math.max(...last.sets.map(s => Number(s.reps) || 0));
      msg += ` → Förslag: +1 rep (t.ex. ${maxR + 1}).`;
    }
    el.textContent = msg;
  }

  // ===== Övningar
  const exercisesPanel = document.getElementById('exercisesPanel');

  function renderExercises() {
    if (!exercisesPanel) return;
    exercisesPanel.innerHTML = '';
    if (!selectedDay) {
      exercisesPanel.append(h('p', { class: 'empty' }, 'Välj en dag ovan.'));
      return;
    }
    const list = PROGRAM[selectedDay];

    list.forEach(ex => {
      const container = h('div', { class: 'exercise' });
      const title = h('h3', {}, ex.name);
      const range = h('span', { class: 'pill' }, fmtRange(ex.range));
      const hint = h('div', { class: 'hint', id: `hint-${ex.id}`, 'aria-live': 'polite' });

      const head = h('div', { class: 'sets-head' },
        h('label', {}, 'Set#'),
        h('label', {}, 'Reps'),
        h('label', {}, ex.bw ? 'Vikt (valfritt)' : 'Vikt (kg)'),
        h('div', {})
      );

      const sets = h('div', { class: 'sets', role: 'region', 'aria-label': `Sets för ${ex.name}` });
      sets.append(head);

      // Senaste vikter
      const last = lastFor(ex.id);
      const lastWeights = (!ex.bw && last && Array.isArray(last.sets))
        ? last.sets.map(s => (s && s.weight != null && !isNaN(Number(s.weight))) ? Number(s.weight) : null)
        : [];
      const lastMaxWeight = lastWeights.filter(v => v != null).length
        ? Math.max(...lastWeights.filter(v => v != null))
        : null;

      const addSetRow = (i = 1, reps = '', weight = '') => {
        let suggested = weight;
        if (suggested === '' && !ex.bw) {
          suggested = (lastWeights[i - 1] != null) ? lastWeights[i - 1]
            : (lastMaxWeight != null ? lastMaxWeight : '');
        }
        const row = h('div', { class: 'set-row' });
        const repsInput = h('input', {
          type: 'number',
          inputmode: 'numeric',
          min: 0,
          step: 1,
          placeholder: 'reps',
          value: reps,
          'aria-label': `Repetitioner för set ${i}`
        });
        const weightInput = h('input', {
          type: 'number',
          inputmode: 'decimal',
          min: 0,
          step: ex.progression?.increment || 0.5,
          placeholder: ex.bw ? 'valfritt' : 'kg',
          value: suggested,
          'aria-label': `Vikt för set ${i}`
        });
        const removeBtn = h('button', {
          class: 'ghost',
          type: 'button',
          'aria-label': `Ta bort set ${i}`,
          onclick: () => {
            row.remove();
            renumber(sets);
          }
        }, '✕');

        row.append(
          h('div', { class: 'muted' }, `#${i}`),
          repsInput,
          weightInput,
          removeBtn
        );
        sets.append(row);
      };

      function renumber(grid) {
        let i = 1;
        [...grid.querySelectorAll('.set-row')].forEach(r => {
          r.firstChild.textContent = `#${i}`;
          const inputs = r.querySelectorAll('input');
          if (inputs[0]) inputs[0].setAttribute('aria-label', `Repetitioner för set ${i}`);
          if (inputs[1]) inputs[1].setAttribute('aria-label', `Vikt för set ${i}`);
          const btn = r.querySelector('button');
          if (btn) btn.setAttribute('aria-label', `Ta bort set ${i}`);
          i++;
        });
      }

      const initialSets = Number(ex.defaultSets || 3);
      for (let i = 1; i <= initialSets; i++) addSetRow(i);

      const addBtn = h('button', {
        class: 'ghost',
        type: 'button',
        'aria-label': `Lägg till nytt set för ${ex.name}`,
        onclick: () => {
          addSetRow(sets.querySelectorAll('.set-row').length + 1);
        }
      }, '+ Lägg till set');

      container.append(
        h('div', { class: 'row', style: 'align-items:baseline;justify-content:space-between' },
          h('div', {}, title, ' ', range),
          addBtn
        ),
        sets,
        h('div', { class: 'note' }, ex.note || ruleText(ex)),
        hint
      );

      exercisesPanel.append(container);
      updateHint(ex, hint);
    });
  }

  function ruleText(ex) {
    if (!ex.progression) return '';
    const p = ex.progression;
    if (p.type === 'weekly_weight') return `Riktlinje: öka ~${p.increment} kg/vecka när tekniken känns bra.`;
    if (p.type === 'weekly_rep') return `Riktlinje: öka ~1 rep/vecka.`;
    return '';
  }

  // ===== Knappar & inputs
  const dateInput = document.getElementById('date');
  const saveBtn = document.getElementById('saveBtn');
  const syncBtn = document.getElementById('syncBtn');
  const pullBtn = document.getElementById('pullBtn');
  const cfgBtn = document.getElementById('cfgBtn');
  const clearBtn = document.getElementById('clearBtn');

  if (dateInput) {
    dateInput.value = todayISO();
    dateInput.setAttribute('aria-label', 'Välj träningsdatum');
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!selectedDay) {
        showToast('Välj dag först.', 'error');
        return;
      }
      const list = PROGRAM[selectedDay];
      const entries = [];
      const exEls = [...document.querySelectorAll('.exercise')];
      exEls.forEach((wrap, idx) => {
        const ex = list[idx];
        const rows = [...wrap.querySelectorAll('.set-row')];
        const sets = rows.map(r => {
          const [lbl, repsEl, wEl] = r.children;
          return {
            reps: Number(repsEl.value || 0),
            weight: Number(wEl.value || 0) || (ex.bw ? null : 0)
          };
        }).filter(s => (s.reps || 0) > 0);
        if (sets.length) entries.push({ id: ex.id, exercise: ex.name, sets });
      });
      if (!entries.length) {
        showToast('Fyll i minst ett set.', 'error');
        return;
      }
      const log = { date: dateInput.value, day: selectedDay, entries };
      const logs = readLogs();
      logs.push(log);
      writeLogs(logs);
      updateHistory();
      PROGRAM[selectedDay].forEach(ex => {
        const el = document.getElementById(`hint-${ex.id}`);
        if (el) updateHint(ex, el);
      });
      showToast('Träningspass sparat!', 'success');
    });
  }

  // ===== SÄKER MERGE
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj || null));
  }

  function keyWorkout(w) {
    return `${w.date}|${w.day}`;
  }

  function keySet(s) {
    const w = (s.weight === null || s.weight === undefined) ? '' : Number(s.weight);
    return `${Number(s.reps || 0)}@${w}`;
  }

  function keyExercise(e) {
    return (e.id || e.exercise || '').toString();
  }

  function mergeLogs(localArr, remoteArr) {
    const A = Array.isArray(localArr) ? clone(localArr) : [];
    const B = Array.isArray(remoteArr) ? clone(remoteArr) : [];
    const map = new Map();
    for (const w of B) {
      map.set(keyWorkout(w), w);
    }
    for (const w of A) {
      const k = keyWorkout(w);
      if (!map.has(k)) {
        map.set(k, w);
        continue;
      }
      const base = map.get(k);
      const byEx = new Map();
      for (const e of (base.entries || [])) {
        byEx.set(keyExercise(e), clone(e));
      }
      for (const e of (w.entries || [])) {
        const id = keyExercise(e);
        if (!byEx.has(id)) {
          byEx.set(id, clone(e));
          continue;
        }
        const target = byEx.get(id);
        const seen = new Set((target.sets || []).map(keySet));
        for (const s of (e.sets || [])) {
          const kset = keySet(s);
          if (!seen.has(kset)) {
            (target.sets = target.sets || []).push(clone(s));
            seen.add(kset);
          }
        }
      }
      base.entries = Array.from(byEx.values());
    }
    const out = Array.from(map.values());
    out.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return out;
  }

  // GitHub sync
  async function doSync() {
    setButtonLoading(syncBtn, true);
    try {
      loadGhCfg();
      let remote = [];
      try {
        const obj = await ghGetFile();
        if (obj) {
          remote = JSON.parse(b64DecodeUnicode(obj.content));
        }
      } catch (e) {
        console.warn('Could not fetch remote file:', e);
      }
      const local = readLogs();
      const merged = mergeLogs(local, remote);
      const txt = JSON.stringify(merged, null, 2);
      await ghPutFile(txt);
      showToast('Synk klar! Data mergad utan förlust.', 'success');
    } catch (e) {
      console.error('Sync error:', e);
      showToast(`Synk fel: ${e.message}`, 'error');
    } finally {
      setButtonLoading(syncBtn, false);
    }
  }

  async function doPull() {
    setButtonLoading(pullBtn, true);
    try {
      loadGhCfg();
      const obj = await ghGetFile();
      if (!obj) {
        showToast('Filen finns inte i repo ännu. Kör "Synka" först.', 'error');
        return;
      }
      const remote = JSON.parse(b64DecodeUnicode(obj.content));
      const local = readLogs();
      const merged = mergeLogs(local, remote);
      writeLogs(merged);
      updateHistory();
      if (selectedDay) renderExercises();
      showToast('Hämtat & sammanslaget från GitHub!', 'success');
    } catch (e) {
      console.error('Pull error:', e);
      showToast(`Hämtningsfel: ${e.message}`, 'error');
    } finally {
      setButtonLoading(pullBtn, false);
    }
  }

  if (syncBtn) syncBtn.addEventListener('click', doSync);
  if (pullBtn) pullBtn.addEventListener('click', doPull);

  // Rensa lokalt
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Rensa alla lokala loggar på den här enheten? Detta tar inte bort något på GitHub.')) {
        localStorage.removeItem(STORAGE_KEY);
        updateHistory();
        if (exercisesPanel) exercisesPanel.innerHTML = '<p class="empty">Välj en dag ovan.</p>';
        showToast('Lokala loggar rensade.', 'success');
      }
    });
  }

  // ===== Inställningsmodal
  const cfgModal = document.getElementById('cfgModal');
  const cfgClose = document.getElementById('cfgClose');
  const cfgSave = document.getElementById('cfgSave');
  const ghOwner = document.getElementById('ghOwner');
  const ghRepo = document.getElementById('ghRepo');
  const ghBranch = document.getElementById('ghBranch');
  const ghPath = document.getElementById('ghPath');
  const ghToken = document.getElementById('ghToken');

  if (cfgBtn) {
    cfgBtn.addEventListener('click', () => {
      loadGhCfg();
      if (ghOwner) ghOwner.value = GH.owner || 'Xzyrxios';
      if (ghRepo) ghRepo.value = GH.repo || 'gym';
      if (ghBranch) ghBranch.value = GH.branch || 'main';
      if (ghPath) ghPath.value = GH.path || 'data/traningslogg.json';
      if (ghToken) ghToken.value = GH.token || '';
      cfgModal?.classList.add('open');
      cfgModal?.setAttribute('aria-hidden', 'false');
    });
  }

  if (cfgClose) {
    cfgClose.addEventListener('click', () => {
      cfgModal?.classList.remove('open');
      cfgModal?.setAttribute('aria-hidden', 'true');
    });
  }

  if (cfgSave) {
    cfgSave.addEventListener('click', () => {
      GH.owner = ghOwner?.value.trim() || 'Xzyrxios';
      GH.repo = ghRepo?.value.trim() || 'gym';
      GH.branch = ghBranch?.value.trim() || 'main';
      GH.path = ghPath?.value.trim() || 'data/traningslogg.json';
      GH.token = ghToken?.value.trim();
      saveGhCfg();
      cfgModal?.classList.remove('open');
      cfgModal?.setAttribute('aria-hidden', 'true');
      showToast('Inställningar sparade.', 'success');
    });
  }

  // Close modal on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cfgModal?.classList.contains('open')) {
      cfgModal.classList.remove('open');
      cfgModal.setAttribute('aria-hidden', 'true');
    }
  });

  // Init
  if (dateInput) dateInput.value = todayISO();
  updateHistory();
});
