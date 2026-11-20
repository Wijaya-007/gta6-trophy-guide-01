// Leonida Trophy Compendium — tracker logic.
// Loads app/data/trophies.json + app/data/sources.json, renders the checklist,
// roadmap and missable flags, and saves progress in localStorage (export/import).
// No network requests beyond these two local files.

const STORAGE_KEY = 'leonida-trophy-progress-v1';
const ROADMAP = [
  { name: 'Story — Chapters 1 to 4', detail: 'Play the story in order. Chapters 1–4 and their missions unlock most story trophies; nothing here is missable if you keep playing.' },
  { name: 'Story — the final mission and character strands', detail: 'Finish the final mission, then the last missions for Andy, Kenton, Billy, Randy and Tyrone. These close out the story trophies.' },
  { name: 'Strangers & Freaks', detail: 'Complete 8 stranger mission strands across Leonida. Start them early — they run alongside the story.' },
  { name: 'Activities — races, shooting range, fishing, arcade', detail: 'Win 20 different races, gold every Shooting Range challenge, beat Cal at fishing, finish an arcade game, and try every activity type once.' },
  { name: 'Collectibles — cards, WAiNK, vehicles, exploration', detail: 'Complete 3 Collectible Card sets, WAiNK It at 100 locations, discover 100 vehicles, and explore all of Leonida.' },
  { name: 'Combat and robberies', detail: 'Bank vaults, armored trucks, jewelry stores, illegal operations, Combat Focus and the Rhino tank. Bring a partner where the trophy asks for one.' },
  { name: 'Clean-up and 100% completion', detail: 'Mop up challenges, shops, properties and laundering, then attain 100% completion for the gold, and the platinum follows.' },
];

const state = {
  trophies: [],
  sources: [],
  earned: new Set(),
  filter: 'all',
  query: '',
  spoiler: false,
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const ids = JSON.parse(raw);
    if (Array.isArray(ids)) state.earned = new Set(ids.filter((n) => Number.isInteger(n)));
  } catch { /* corrupted save: start fresh */ }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.earned].sort((a, b) => a - b)));
}

function gradeLabel(t) { return t.grade; }

function kindOf(t) {
  if (t.kind) return t.kind;
  return 'activities';
}

function isMissable(t) { return !!t.missable; }

function trophyMatches(t) {
  const q = state.query.trim().toLowerCase();
  if (q && !(t.name.toLowerCase().includes(q) || (t.guide || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))) return false;
  switch (state.filter) {
    case 'all': return true;
    case 'story': return kindOf(t) === 'story';
    case 'missable': return isMissable(t);
    case 'collectibles': return kindOf(t) === 'collectibles';
    case 'activities': return kindOf(t) === 'activities';
    case 'online': return kindOf(t) === 'online';
    case 'earned': return state.earned.has(t.id);
    case 'todo': return !state.earned.has(t.id);
    default: return true;
  }
}

function flagClass(m) {
  return { possible: '', watch: 'watch', unconfirmed: 'unconfirmed', disputed: 'disputed' }[m] || '';
}

function flagText(m) {
  return { possible: 'Possibly missable', watch: 'Watch', unconfirmed: 'Unconfirmed', disputed: 'Sources disagree' }[m] || 'Missable';
}

function renderProgress() {
  const n = state.earned.size;
  const total = state.trophies.length || 55;
  document.getElementById('progressFill').style.width = `${Math.round((n / total) * 100)}%`;
  document.getElementById('progressText').textContent = `${n} of ${total} earned — ${Math.round((n / total) * 100)}% to the platinum`;
}

function renderRoadmap() {
  const list = document.getElementById('roadmapList');
  list.innerHTML = '';
  for (const stage of ROADMAP) {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.className = 'stage-name';
    name.textContent = stage.name;
    const detail = document.createElement('span');
    detail.className = 'stage-detail';
    detail.textContent = ` ${stage.detail}`;
    li.append(name, detail);
    list.append(li);
  }
}

function renderMissables() {
  const list = document.getElementById('missableList');
  list.innerHTML = '';
  const flagged = state.trophies.filter(isMissable);
  if (!flagged.length) {
    const li = document.createElement('li');
    li.textContent = 'No trophy in this guide is confirmed missable. Play at your own pace.';
    list.append(li);
    return;
  }
  for (const t of flagged) {
    const li = document.createElement('li');
    const flag = document.createElement('span');
    flag.className = `flag ${flagClass(t.missable)}`;
    flag.textContent = flagText(t.missable);
    const name = document.createElement('strong');
    name.textContent = t.name;
    const note = document.createElement('span');
    note.textContent = ` — ${t.missableNote || t.guide}`;
    li.append(flag, name, note);
    list.append(li);
  }
}

function renderSources() {
  const list = document.getElementById('sourceList');
  list.innerHTML = '';
  for (const s of state.sources) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.textContent = s.name;
    a.target = '_blank';
    a.rel = 'noopener';
    li.append(a, document.createTextNode(` — ${s.note || ''}`));
    list.append(li);
  }
}

function renderList() {
  const host = document.getElementById('trophyList');
  host.innerHTML = '';
  const shown = state.trophies.filter(trophyMatches);
  if (!shown.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'No trophies match this filter.';
    host.append(p);
    return;
  }
  for (const t of shown) {
    const card = document.createElement('article');
    card.className = `trophy${state.earned.has(t.id) ? ' earned' : ''}`;
    const head = document.createElement('div');
    head.className = 'trophy-head';
    const h = document.createElement('h3');
    h.textContent = t.name;
    if (state.spoiler && t.hidden && !state.earned.has(t.id)) h.classList.add('spoiler');
    const grade = document.createElement('span');
    grade.className = `grade ${t.grade}`;
    grade.textContent = gradeLabel(t);
    head.append(h, grade);
    if (t.hidden) {
      const tag = document.createElement('span');
      tag.className = 'hidden-tag';
      tag.textContent = 'Hidden on PS5';
      head.append(tag);
    }
    if (t.missable) {
      const flag = document.createElement('span');
      flag.className = `flag ${flagClass(t.missable)}`;
      flag.textContent = flagText(t.missable);
      head.append(flag);
    }
    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = t.description;
    if (state.spoiler && t.hidden && !state.earned.has(t.id)) desc.classList.add('spoiler');
    const guide = document.createElement('p');
    guide.className = 'trophy-guide';
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = 'Guide: ';
    guide.append(label, document.createTextNode(t.guide));
    const src = document.createElement('p');
    src.className = 'trophy-source';
    src.textContent = 'Source: ';
    const a = document.createElement('a');
    a.href = t.sourceUrl;
    a.textContent = t.sourceName;
    a.target = '_blank';
    a.rel = 'noopener';
    src.append(a);
    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'earn';
    btn.textContent = state.earned.has(t.id) ? 'Earned ✓' : 'Mark as earned';
    btn.addEventListener('click', () => {
      if (state.earned.has(t.id)) state.earned.delete(t.id);
      else state.earned.add(t.id);
      saveProgress();
      renderProgress();
      renderList();
    });
    const kind = document.createElement('span');
    kind.textContent = `Kind: ${kindOf(t)} · Stage: ${t.stage || '—'}`;
    meta.append(btn, kind);
    card.append(head, desc, guide, src, meta);
    host.append(card);
  }
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderMissables();
  renderSources();
  renderList();
  document.body.classList.toggle('spoiler-hidden', state.spoiler);
}

async function boot() {
  const [tRes, sRes] = await Promise.all([
    fetch('data/trophies.json'),
    fetch('data/sources.json'),
  ]);
  const tData = await tRes.json();
  const sData = await sRes.json();
  state.trophies = Array.isArray(tData) ? tData : tData.trophies;
  state.sources = Array.isArray(sData) ? sData : sData.sources;
  loadProgress();

  document.getElementById('search').addEventListener('input', (e) => {
    state.query = e.target.value;
    renderList();
  });
  document.getElementById('spoiler').addEventListener('change', (e) => {
    state.spoiler = e.target.checked;
    renderAll();
  });
  document.getElementById('filters').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    state.filter = btn.dataset.filter;
    for (const b of document.querySelectorAll('#filters button')) b.classList.toggle('active', b === btn);
    renderList();
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ app: 'leonida-trophy-compendium', earned: [...state.earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-trophy-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const ids = Array.isArray(data) ? data : data.earned;
      if (Array.isArray(ids)) {
        state.earned = new Set(ids.filter((n) => Number.isInteger(n)));
        saveProgress();
        renderAll();
      }
    } catch { alert('That file is not a valid progress export.'); }
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned trophies?')) return;
    state.earned = new Set();
    saveProgress();
    renderAll();
  });

  renderAll();
}

boot();
