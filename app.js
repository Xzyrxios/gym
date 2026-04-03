document.addEventListener('DOMContentLoaded', () => {
  // ===== Program & regler
  // Program 1:
  // Samma basövningar varje dag, men kan ändras per dag via overrides.
  //
  // Program 2:
  // Ditt nuvarande upplägg med olika övningar per dag.

  const PROGRAMS = {
    1: {
      name: 'Program 1',
      type: 'template',
      baseExercises: [
        {
          id: 'prog1-standing-cable-row',
          name: 'Stående rodd med rep',
          range: [10, 10],
          progression: { type: 'weekly_weight', increment: 1.25 },
          defaultSets: 3,
          startWeight: 21.25
        },
        {
          id: 'prog1-triceps-press',
          name: 'Triceps press',
          range: [10, 10],
          progression: { type: 'weekly_weight', increment: 1.25 },
          defaultSets: 3,
          startWeight: 18.75
        },
        {
          id: 'prog1-leg-press',
          name: 'Benpress',
          range: [10, 10],
          progression: { type: 'weekly_weight', increment: 5 },
          defaultSets: 3,
          startWeight: 85
        },
        {
          id: 'prog1-forearm-1',
          name: 'Underarm 1',
          range: [10, 10],
          progression: { type: 'weekly_weight', increment: 0.5 },
          defaultSets: 3,
          startWeight: 5
        },
        {
          id: 'prog1-forearm-2',
          name: 'Underarm 2',
          range: [12, 12],
          progression: { type: 'weekly_weight', increment: 0.5 },
          defaultSets: 3,
          startWeight: 8
        },
        {
          id: 'prog1-close-lat-pulldown',
          name: 'Latsdrag smal',
          range: [10, 10],
          progression: { type: 'weekly_weight', increment: 1.25 },
          defaultSets: 3,
          startWeight: 18.25
        },
        {
          id: 'prog1-barbell-biceps-curl',
          name: 'Biceps curl stång',
          range: [10, 10],
          progression: { type: 'weekly_weight', increment: 0.5 },
          defaultSets: 3,
          startWeight: 7.5
        },
        {
          id: 'prog1-flies',
          name: 'Flies',
          range: [10, 10],
          progression: { type: 'weekly_weight', increment: 0.5 },
          defaultSets: 3,
          startWeight: 5
        },
        {
          id: 'prog1-dumbbell-shrugs',
          name: 'Shrugs hantlar',
          range: [10, 10],
          progression: { type: 'weekly_weight', increment: 1 },
          defaultSets: 3,
          startWeight: 20
        }
      ],
      dayOverrides: {
        1: [],
        2: [],
        3: []
      }
    },

    2: {
      name: 'Program 2',
      type: 'days',
      days: {
        1: [
          {
            id: 'deadlift',
            name: 'Marklyft',
            range: [5, 8],
            progression: { type: 'weekly_weight', increment: 2.5 }
          },
          {
            id: 'ohp',
            name: 'Press över huvudet',
            range: [8, 10],
            progression: { type: 'weekly_weight', increment: 1 }
          },
          {
            id: 'pullups',
            name: 'Pullups',
            range: [5, 10],
            progression: { type: 'weekly_rep' },
            bw: true,
            note: 'Öka 1 rep/vecka. Ta bort band när du når 10 reps.'
          },
          {
            id: 'tri-bi',
            name: 'Triceps/Biceps (varannan övning)',
            range: [10, 15],
            progression: { type: 'weekly_rep' },
            defaultSets: 6,
            note: 'En extra rep/vecka. Öka vikt när du klarar 15 reps.'
          }
        ],
        2: [
          {
            id: 'bench',
            name: 'Bänkpress',
            range: [5, 8],
            progression: { type: 'weekly_weight', increment: 2.5 }
          },
          {
            id: 'row',
            name: 'Stångrodd',
            range: [10, 10],
            progression: { type: 'weekly_weight', increment: 2.5 }
          },
          {
            id: 'lunge-db',
            name: 'Utfall med hantlar (per ben)',
            range: [10, 15],
            progression: { type: 'weekly_weight', increment: 1.25 },
            note: 'Öka i vikt när du är uppe på 15 reps.'
          },
          {
            id: 'lat-raise',
            name: 'Sidolyft med hantlar',
            range: [10, 15],
            progression: { type: 'weekly_weight', increment: 1 },
            note: 'Samma princip som ovan.'
          }
        ],
        3: [
          {
            id: 'squat',
            name: 'Knäböj',
            range: [5, 8],
            progression: { type: 'weekly_weight', increment: 2.5 }
          },
          {
            id: 'pushups',
            name: 'Armhävningar',
            range: [8, 999],
            progression: { type: 'weekly_rep' },
            bw: true,
            note: 'Öka 1 rep/vecka.'
          },
          {
            id: 'ringrow',
            name: 'Ringrodd',
            range: [8, 15],
            progression: { type: 'weekly_rep' },
            bw: true,
            note: 'Öka 1 rep/vecka. Luta dig mer bakåt när du klarar 15.'
          },
          {
            id: 'tri-bi',
            name: 'Triceps/Biceps (varannan övning)',
            range: [10, 15],
            progression: { type: 'weekly_rep' },
            defaultSets: 6,
            note: 'En extra rep/vecka. Öka vikt när du klarar 15 reps.'
          }
        ]
      }
    }
  };

  // ===== Lagring
  const STORAGE_KEY = 'trainingLogsV2';
  const LEGACY_STORAGE_KEY = 'trainingLogsV1';

  function readLogs() {
    const v2 = localStorage.getItem(STORAGE_KEY);
    if (v2) return JSON.parse(v2);

    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || '[]');
    return legacy.map(x => ({
      ...x,
      program: x.program || 2
    }));
  }

  function writeLogs(logs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }

  // ===== GitHub Sync
  const GH_KEY = 'trainingGithubCfgV1';
  const GH = {
    owner: 'Xzyrxios',
    repo: 'gym',
    branch: 'main',
    path: 'data/traningslogg.json',
    token: ''
  };

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

  // ===== UI helpers
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
  const fmtRange = r => {
    if (!Array.isArray(r) || r.length < 2) return '';
    return r[0] === r[1] ? `${r[0]} reps` : `${r[0]}–${r[1]} reps`;
  };

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

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj || null));
  }

  // ===== Programupplösning
  function resolveExercisesForDay(programId, day) {
    const program = PROGRAMS[programId];
    if (!program || !day) return [];

    if (program.type === 'days') {
      return clone(program.days?.[day] || []);
    }

    if (program.type === 'template') {
      const base = clone(program.baseExercises || []);
      const overrides = clone(program.dayOverrides?.[day] || []);
      const byId = new Map(base.map(ex => [ex.id, ex]));

      for (const ov of overrides) {
        if (!ov || !ov.id) continue;

        if (ov.disabled === true) {
          byId.delete(ov.id);
          continue;
        }

        if (byId.has(ov.id)) {
          byId.set(ov.id, { ...byId.get(ov.id), ...ov });
        } else {
          byId.set(ov.id, ov);
        }
      }

      return Array.from(byId.values());
    }

    return [];
  }

  function getProgramName(programId) {
    return PROGRAMS[programId]?.name || `Program ${programId}`;
  }

  // ===== State
  let selectedProgram = 2;
  let selectedDay = null;

  function getCurrentExercises() {
    return resolveExercisesForDay(selectedProgram, selectedDay);
  }

  // ===== DOM
  const exercisesPanel = document.getElementById('exercisesPanel');
  const historyBody = document.getElementById('historyBody');

  const selectedDayLabel = document.getElementById('selectedDayLabel');
  const selectedProgramLabel = document.getElementById('selectedProgramLabel');

  const dateInput = document.getElementById('date');
  const saveBtn = document.getElementById('saveBtn');
  const syncBtn = document.getElementById('syncBtn');
  const pullBtn = document.getElementById('pullBtn');
  const cfgBtn = document.getElementById('cfgBtn');
  const clearBtn = document.getElementById('clearBtn');

  const cfgModal = document.getElementById('cfgModal');
  const cfgClose = document.getElementById('cfgClose');
  const cfgSave = document.getElementById('cfgSave');

  const ghOwner = document.getElementById('ghOwner');
  const ghRepo = document.getElementById('ghRepo');
  const ghBranch = document.getElementById('ghBranch');
  const ghPath = document.getElementById('ghPath');
  const ghToken = document.getElementById('ghToken');

  // ===== Program & dagval
  function selectProgram(program) {
    selectedProgram = program;

    document.querySelectorAll('.program-btn').forEach(el => {
      el.classList.remove('active');
      el.setAttribute('aria-pressed', 'false');
    });

    const activeBtn = document.getElementById(`btn-program-${program}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
      activeBtn.setAttribute('aria-pressed', 'true');
    }

    if (selectedProgramLabel) {
      selectedProgramLabel.textContent = getProgramName(program);
    }

    renderExercises();
    updateHistory();
  }

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

    if (selectedDayLabel) {
      selectedDayLabel.textContent = `Dag ${day}`;
    }

    renderExercises();
  }

  ['1', '2'].forEach(p => {
    const b = document.getElementById(`btn-program-${p}`);
    if (b) {
      b.addEventListener('click', () => selectProgram(Number(p)));
      b.setAttribute('aria-pressed', p === '2' ? 'true' : 'false');
    }
  });

  ['1', '2', '3'].forEach(d => {
    const b = document.getElementById(`btn-day-${d}`);
    if (b) {
      b.addEventListener('click', () => selectDay(Number(d)));
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', 'false');
    }
  });

  // ===== Historik & hintar
  function updateHistory() {
    const logs = readLogs();

    if (!historyBody) return;

    if (!logs.length) {
      historyBody.textContent = 'Inget sparat ännu.';
      return;
    }

    const recent = logs.slice(-10).reverse();
    historyBody.innerHTML = '';

    recent.forEach(l => {
      const dd = new Date(l.date).toLocaleDateString('sv-SE');
      const programName = getProgramName(Number(l.program || 2));

      const box = h(
        'details',
        {},
        h('summary', {}, `${dd} – ${programName} – Dag ${l.day}`)
      );

      const ul = h('ul', {});
      (l.entries || []).forEach(e => {
        const txt = `${e.exercise}: ${(e.sets || []).map(s => `${s.reps}x${s.weight || 0}kg`).join(', ')}`;
        ul.append(h('li', {}, txt));
      });

      box.append(ul);
      historyBody.append(box);
    });
  }

  function lastFor(exId) {
    const logs = readLogs().slice().reverse();

    for (const l of logs) {
      if (Number(l.program || 2) !== Number(selectedProgram)) continue;
      const e = (l.entries || []).find(x => x.id === exId);
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
    let msg = 'Senast: ' + (last.sets || []).map(s => `${s.reps}x${s.weight || 0}kg`).join(', ');

    if (p.type === 'weekly_weight') {
      const validWeights = (last.sets || []).map(s => Number(s.weight) || 0);
      const maxW = validWeights.length ? Math.max(...validWeights) : 0;
      msg += ` → Förslag: ~${(maxW + (p.increment || 0)).toFixed(1)} kg.`;
    } else if (p.type === 'weekly_rep') {
      const validReps = (last.sets || []).map(s => Number(s.reps) || 0);
      const maxR = validReps.length ? Math.max(...validReps) : 0;
      msg += ` → Förslag: +1 rep (t.ex. ${maxR + 1}).`;
    }

    el.textContent = msg;
  }

  // ===== Rendera övningar
  function ruleText(ex) {
    if (!ex.progression) return '';
    const p = ex.progression;

    if (p.type === 'weekly_weight') {
      return `Riktlinje: öka ~${p.increment} kg/vecka när tekniken känns bra.`;
    }

    if (p.type === 'weekly_rep') {
      return 'Riktlinje: öka ~1 rep/vecka.';
    }

    return '';
  }

  function renderExercises() {
    if (!exercisesPanel) return;

    exercisesPanel.innerHTML = '';

    if (!selectedDay) {
      exercisesPanel.append(h('p', { class: 'empty' }, 'Välj en dag ovan för att se dina övningar.'));
      return;
    }

    const list = getCurrentExercises();

    if (!list.length) {
      exercisesPanel.append(
        h('p', { class: 'empty' }, 'Det finns inga övningar definierade för detta program/dag ännu.')
      );
      return;
    }

    list.forEach(ex => {
      const container = h('div', {
        class: 'exercise',
        'data-exercise-id': ex.id
      });

      const title = h('h3', {}, ex.name);
      const range = h('span', { class: 'pill' }, fmtRange(ex.range));
      const hint = h('div', {
        class: 'hint',
        id: `hint-${selectedProgram}-${ex.id}`,
        'aria-live': 'polite'
      });

      const head = h(
        'div',
        { class: 'sets-head' },
        h('label', {}, 'Set#'),
        h('label', {}, 'Reps'),
        h('label', {}, ex.bw ? 'Vikt (valfritt)' : 'Vikt (kg)'),
        h('div', {})
      );

      const sets = h('div', {
        class: 'sets',
        role: 'region',
        'aria-label': `Sets för ${ex.name}`
      });

      sets.append(head);

      const last = lastFor(ex.id);
      const lastWeights = (!ex.bw && last && Array.isArray(last.sets))
        ? last.sets.map(s => (s && s.weight != null && !isNaN(Number(s.weight))) ? Number(s.weight) : null)
        : [];

      const validLastWeights = lastWeights.filter(v => v != null);
      const lastMaxWeight = validLastWeights.length ? Math.max(...validLastWeights) : null;

      const addSetRow = (i = 1, reps = '', weight = '') => {
        let suggested = weight;

        if (suggested === '' && !ex.bw) {
          suggested = (lastWeights[i - 1] != null)
            ? lastWeights[i - 1]
            : (lastMaxWeight != null ? lastMaxWeight : (ex.startWeight ?? ''));
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
        h(
          'div',
          { class: 'row', style: 'align-items:baseline;justify-content:space-between' },
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

  // ===== Spara
  if (dateInput) {
    dateInput.value = todayISO();
    dateInput.setAttribute('aria-label', 'Välj träningsdatum');
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!selectedProgram) {
        showToast('Välj program först.', 'error');
        return;
      }

      if (!selectedDay) {
        showToast('Välj dag först.', 'error');
        return;
      }

      const list = getCurrentExercises();
      const entries = [];
      const exEls = [...document.querySelectorAll('.exercise')];

      exEls.forEach((wrap, idx) => {
        const ex = list[idx];
        if (!ex) return;

        const rows = [...wrap.querySelectorAll('.set-row')];
        const sets = rows.map(r => {
          const [, repsEl, wEl] = r.children;
          return {
            reps: Number(repsEl.value || 0),
            weight: Number(wEl.value || 0) || (ex.bw ? null : 0)
          };
        }).filter(s => (s.reps || 0) > 0);

        if (sets.length) {
          entries.push({
            id: ex.id,
            exercise: ex.name,
            sets
          });
        }
      });

      if (!entries.length) {
        showToast('Fyll i minst ett set.', 'error');
        return;
      }

      const log = {
        date: dateInput.value,
        program: selectedProgram,
        day: selectedDay,
        entries
      };

      const logs = readLogs();
      logs.push(log);
      writeLogs(logs);

      updateHistory();

      getCurrentExercises().forEach(ex => {
        const el = document.getElementById(`hint-${selectedProgram}-${ex.id}`);
        if (el) updateHint(ex, el);
      });

      showToast('Träningspass sparat!', 'success');
    });
  }

  // ===== Merge / sync
  function keyWorkout(w) {
    return `${w.date}|${w.program || 2}|${w.day}`;
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

    for (const w of A) {
      if (!w.program) w.program = 2;
    }
    for (const w of B) {
      if (!w.program) w.program = 2;
    }

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
    out.sort((a, b) => {
      const da = String(a.date || '');
      const db = String(b.date || '');
      if (da !== db) return da.localeCompare(db);
      return String(a.program || 2).localeCompare(String(b.program || 2));
    });

    return out;
  }

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
      writeLogs(merged);

      showToast('Synk klar! Data mergad utan förlust.', 'success');
      updateHistory();

      if (selectedDay) renderExercises();
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

  // ===== Rensa lokalt
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Rensa alla lokala loggar på den här enheten? Detta tar inte bort något på GitHub.')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        updateHistory();
        if (exercisesPanel) {
          exercisesPanel.innerHTML = '<p class="empty">Välj en dag ovan för att se dina övningar.</p>';
        }
        showToast('Lokala loggar rensade.', 'success');
      }
    });
  }

  // ===== Inställningar
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

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && cfgModal?.classList.contains('open')) {
      cfgModal.classList.remove('open');
      cfgModal.setAttribute('aria-hidden', 'true');
    }
  });

  // ===== Init
  if (dateInput) dateInput.value = todayISO();
  selectProgram(2);
  updateHistory();
});