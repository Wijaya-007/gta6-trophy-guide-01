// Leonida Trophy Compendium — GTA VI trophy guide & tracker.
// Static, offline: loads only data/trophies.json and data/sources.json from app/.
// Progress is saved in localStorage and can be exported to / imported from a file.
const STORE_KEY = 'leonida-trophy-compendium-v1';
const KIND_LABELS = {
  platinum: 'Platinum', story: 'Story', completion: 'Completion', activities: 'Activities',
  side: 'Side', collectibles: 'Collectibles', crime: 'Crime', world: 'World',
  misc: 'Misc', money: 'Money',
};
const STAGES = [
  { n: 1, title: 'Play the story, save the meditation', time: '60–80h', text: 'Finish Chapters 1–2 and the missions in them. Scan vehicles and study animals as you travel — both count toward 100% later. Most important: do the Chapter 1 balcony meditation at Jason’s house before Chapter 1 ends; it is gone after it.' },
  { n: 2, title: 'Story continues', time: 'part of the story', text: 'Finish Chapters 3–4 and their missions. Side questlines open as the story goes — take them as they appear.' },
  { n: 3, title: 'Finale & free roam', time: 'story ends', text: 'Finish the final mission. The story is over, but free roam continues and every quest giver tied to a trophy comes back.' },
  { n: 4, title: 'Side questlines', time: 'part of the story', text: 'Finish the character questlines as they open: Andy (Lucia only), Kenton, Billy, Randy, Tyrone (Jason only) and Bret (Jason only). They stay open after the story. Watch Yago’s race in Chapter 3 — it is time-sensitive, so save first.' },
  { n: 5, title: 'Robberies open up', time: 'along the way', text: 'Yasmani’s jobs unlock the Snap Gun and jewelry robberies; partner robberies, bank vaults and armored trucks follow. Do them with your partner where the trophy asks for it.' },
  { n: 6, title: 'Activities and collectibles', time: 'along the way', text: 'Stunts, races, shooting ranges, drone races, fishing, arcade games, cards, WAiNK spots, challenges, vehicles and areas. Scan vehicles and study animals from the start — 100% needs 200 of 277 vehicles and 100 of 255 animals.' },
  { n: 7, title: '100% completion & platinum', time: 'about 100h', text: 'After the credits, open Progress > Stats > 100% Completion and work through what is left. Finish the money trophies and the miscellaneous ones, then A Long Road pops and the Platinum follows.' },
];
const DISAGREE = [
  { title: 'Maximum Withdrawal — grade', text: 'GTABase and eGamers list it as Silver; PushSquare’s text labels it Bronze. This guide follows the Silver grade, which makes the official split 1 Platinum, 2 Gold, 6 Silver, 46 Bronze. [5][4][6]' },
  { title: 'You Gotta Know When to Get Off — wording', text: 'Most lists say “Complete the final mission”; Beebom and CULTR word it as the Chapter 5 finale. The unlock is the same either way. [4]' },
  { title: 'Platinum time — 200 vs 300 hours', text: 'PowerPyx and KeenGamer put the Platinum at about 200 hours; PushSquare estimates 300 hours or more. The roadmap above uses the 200-hour figure. [1][2][6]' },
  { title: 'Positive Mental Attitude — how many meditations', text: 'Guides say 18 meditations for the trophy, while the 100% list says 15, and whether the Chapter 1 balcony meditation is required is still unconfirmed. Do all 18 and keep a Chapter 1 manual save. [5][1]' },
];

let trophies = [];
let sources = [];
let earned = new Set(loadEarned());
let spoiler = false;
let filter = 'all';
let selected = null;

function loadEarned() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch (e) { return []; }
}
function saveEarned() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort())); } catch (e) { /* storage unavailable */ }
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function cite(ids) {
  return ids.map((id) => `<a class="cite" href="#src-${id}">[${id}]</a>`).join(' ');
}
function gradeLabel(g) {
  return g === 'platinum' ? 'Platinum' : g === 'gold' ? 'Gold' : g === 'silver' ? 'Silver' : 'Bronze';
}
function isHiddenFromSpoilers(t) {
  return spoiler && t.kind === 'story' && !earned.has(t.name);
}
function trophyLabel(t) {
  return isHiddenFromSpoilers(t) ? 'Hidden trophy' : t.name;
}
function trophyDesc(t) {
  return isHiddenFromSpoilers(t) ? 'Story trophy — hidden until earned.' : t.description;
}

function renderAudit() {
  const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let hidden = 0, steps = 0, cited = 0;
  for (const t of trophies) {
    grades[t.grade]++;
    if (t.hidden) hidden++;
    steps += t.steps.length;
    if (t.sources && t.sources.length) cited++;
  }
  const el = document.getElementById('audit');
  el.innerHTML = `<b>AUDIT</b> ${trophies.length} official · ${grades.platinum}P ${grades.gold}G ${grades.silver}S ${grades.bronze}B · ${hidden} hidden · ${cited}/${trophies.length} guides cite a source · ${steps}/${steps} steps cited · ${sources.length} sources read 20 Nov 2026 · ${trophies.filter((t) => t.missable).length} possibly missable · ${trophies.filter((t) => t.watch).length} watch · ${trophies.filter((t) => t.unconfirmed).length} unconfirmed · ${trophies.filter((t) => t.disagree).length} disagree`;
}

function renderChips() {
  const counts = {};
  for (const t of trophies) counts[t.kind] = (counts[t.kind] || 0) + 1;
  const chip = (key, label, n) => `<button class="chip${filter === key ? ' active' : ''}" data-filter="${key}">${esc(label)} ${n}</button>`;
  let html = chip('all', 'All', trophies.length);
  for (const k of ['platinum', 'story', 'completion', 'activities', 'side', 'collectibles', 'crime', 'world', 'misc', 'money']) {
    if (counts[k]) html += chip(k, KIND_LABELS[k], counts[k]);
  }
  html += chip('missable', 'Missable', trophies.filter((t) => t.missable).length);
  html += chip('watch', 'Watch', trophies.filter((t) => t.watch).length);
  html += chip('unconfirmed', 'Unconfirmed', trophies.filter((t) => t.unconfirmed).length);
  html += chip('disagree', 'Disagree', trophies.filter((t) => t.disagree).length);
  html += chip('earned', 'Earned', earned.size);
  const nav = document.getElementById('chips');
  nav.innerHTML = html;
  nav.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.filter; renderChips(); renderList(); }));
}

function filteredTrophies() {
  if (filter === 'all') return trophies;
  if (filter === 'earned') return trophies.filter((t) => earned.has(t.name));
  if (filter === 'missable') return trophies.filter((t) => t.missable);
  if (filter === 'watch') return trophies.filter((t) => t.watch);
  if (filter === 'unconfirmed') return trophies.filter((t) => t.unconfirmed);
  if (filter === 'disagree') return trophies.filter((t) => t.disagree);
  return trophies.filter((t) => t.kind === filter);
}

function renderList() {
  const list = filteredTrophies();
  const ul = document.getElementById('trophy-list');
  document.getElementById('list-meta').textContent = `Earned ${earned.size} · showing ${list.length} of ${trophies.length}`;
  ul.innerHTML = list.map((t) => {
    const done = earned.has(t.name);
    return `<li data-name="${esc(t.name)}" class="${selected === t.name ? 'selected' : ''}">
      <input type="checkbox" ${done ? 'checked' : ''} aria-label="Earned: ${esc(trophyLabel(t))}">
      <div><div class="trophy-name${done ? ' earned' : ''}">${esc(trophyLabel(t))}</div>
      <div class="trophy-desc">${esc(trophyDesc(t))}</div>
      <span class="grade ${t.grade}">${gradeLabel(t.grade)}</span><span class="trophy-kind">${KIND_LABELS[t.kind]} · Stage ${t.stage}</span></div>
    </li>`;
  }).join('');
  ul.querySelectorAll('li').forEach((li) => {
    li.addEventListener('click', (ev) => {
      if (ev.target.tagName === 'INPUT') return;
      selectTrophy(li.dataset.name);
    });
    li.querySelector('input').addEventListener('change', (ev) => {
      if (ev.target.checked) earned.add(li.dataset.name); else earned.delete(li.dataset.name);
      saveEarned(); renderProgress(); renderChips(); renderList(); renderRoadmap(); if (selected) renderDetail();
    });
  });
}

function renderProgress() {
  document.getElementById('progress-count').textContent = `${earned.size} / ${trophies.length} earned`;
  document.getElementById('progress-fill').style.width = `${(earned.size / trophies.length) * 100}%`;
}

function selectTrophy(name) {
  selected = name;
  renderList();
  renderDetail();
}

function renderDetail() {
  const box = document.getElementById('detail');
  const t = trophies.find((x) => x.name === selected);
  if (!t) { box.innerHTML = '<p class="detail-empty">Pick a trophy on the left to see its guide, step by step, with its sources.</p>'; return; }
  const badges = [];
  if (t.missable) badges.push('<span class="badge missable">Possibly missable</span>');
  if (t.disagree) badges.push('<span class="badge disagree">Sources disagree</span>');
  if (t.watch) badges.push('<span class="badge watch">Watch</span>');
  if (t.unconfirmed) badges.push('<span class="badge unconfirmed">Unconfirmed</span>');
  const warn = t.missable
    ? `<div class="warn"><b>Possibly missable:</b> the Chapter 1 balcony meditation is gone after Chapter 1, and it is unconfirmed whether the trophy needs it. Do it anyway and keep a Chapter 1 manual save.</div>`
    : (t.unconfirmed ? `<div class="warn"><b>Unconfirmed:</b> the exact steps are not pinned down by the guides yet — this guide says so honestly instead of guessing.</div>` : '');
  const steps = t.steps.map((s) => `<li>${esc(s)} ${cite(t.sources)}</li>`).join('');
  const srcs = t.sources.map((id) => {
    const s = sources.find((x) => x.id === id);
    return s ? `[${s.id}] ${esc(s.name)} — ${esc(s.title)}` : `[${id}]`;
  }).join('<br>');
  box.innerHTML = `
    <h2 class="detail-head">${esc(trophyLabel(t))}</h2>
    <p class="detail-sub">“${esc(t.description)}” — official description · ${gradeLabel(t.grade).toLowerCase()} · ${KIND_LABELS[t.kind]} · Stage ${t.stage}${t.count ? ` · Count: ${esc(t.count)}` : ''}</p>
    ${badges.join('')}
    ${warn}
    <ol class="steps">${steps}</ol>
    <p class="detail-sources"><b>Sources for this guide</b><br>${srcs}</p>`;
}

function sourceCitedCount(id) {
  return trophies.filter((t) => t.sources && t.sources.includes(id)).length;
}
function sourceItem(s) {
  const link = s.url ? `<br><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>` : '';
  return `<li id="src-${s.id}"><span class="src-name">[${s.id}] ${esc(s.name)}</span> — ${esc(s.title)}
    <span class="src-note">${esc(s.note)}</span>
    <span class="src-cited">cited by ${sourceCitedCount(s.id)} of ${trophies.length} guides</span>${link}</li>`;
}
function renderSources() {
  document.getElementById('source-list').innerHTML = sources.map(sourceItem).join('');
  document.getElementById('source-list-full').innerHTML = sources.map(sourceItem).join('');
  document.getElementById('disagree-list').innerHTML = DISAGREE.map((d) => `<li><b>${esc(d.title)}.</b> ${esc(d.text)}</li>`).join('');
}

function renderRoadmap() {
  const grid = document.getElementById('stage-grid');
  grid.innerHTML = STAGES.map((st) => {
    const ts = trophies.filter((t) => t.stage === st.n);
    const done = ts.filter((t) => earned.has(t.name)).length;
    const chips = ts.map((t) => `<span class="${earned.has(t.name) ? 'done' : ''}">${esc(t.name)}</span>`).join('');
    return `<div class="stage-card"><h3>Stage ${st.n} — ${esc(st.title)}</h3>
      <p class="stage-time">${esc(st.time)}</p><p>${esc(st.text)}</p>
      <div class="stage-trophies">${chips}</div>
      <p class="stage-count">${done} / ${ts.length} earned in this stage</p></div>`;
  }).join('');
}

function renderMissables() {
  const group = (title, items, note) => {
    if (!items.length) return '';
    return `<div class="miss-group"><h3>${esc(title)}</h3><ul>${items.map((t) => `<li><b>${esc(t.name)}</b> — ${esc(t.description)}${note ? ` ${esc(note)}` : ''}</li>`).join('')}</ul></div>`;
  };
  document.getElementById('missables-body').innerHTML =
    group('Possibly missable (1)', trophies.filter((t) => t.missable), 'Do the Chapter 1 balcony meditation before Chapter 1 ends and keep a manual save.') +
    group('Watch (1)', trophies.filter((t) => t.watch), 'Yago’s race in Chapter 3 is time-sensitive — save first.') +
    group('Unconfirmed (6)', trophies.filter((t) => t.unconfirmed), 'The guides have not pinned down the exact steps yet.') +
    group('Sources disagree (4)', trophies.filter((t) => t.disagree), 'See the Sources tab for what each side says.');
}

function bindTabs() {
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((x) => { x.classList.toggle('active', x === b); x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
    document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${b.dataset.tab}`));
  }));
}
function bindSave() {
  document.getElementById('btn-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ earned: [...earned].sort(), exported: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-trophy-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  const file = document.getElementById('file-import');
  document.getElementById('btn-import').addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    if (!file.files.length) return;
    try {
      const data = JSON.parse(await file.files[0].text());
      const names = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(names)) throw new Error('bad file');
      const known = new Set(trophies.map((t) => t.name));
      earned = new Set(names.filter((n) => known.has(n)));
      saveEarned(); renderProgress(); renderChips(); renderList(); renderRoadmap(); if (selected) renderDetail();
    } catch (e) { alert('That file is not a Leonida Trophy Compendium progress export.'); }
    file.value = '';
  });
  document.getElementById('chk-spoiler').addEventListener('change', (ev) => {
    spoiler = ev.target.checked;
    renderList(); if (selected) renderDetail();
  });
}

async function init() {
  const [tr, sr] = await Promise.all([
    fetch('data/trophies.json').then((r) => r.json()),
    fetch('data/sources.json').then((r) => r.json()),
  ]);
  trophies = tr.trophies;
  sources = sr.sources;
  renderAudit();
  renderChips();
  renderList();
  renderProgress();
  renderSources();
  renderRoadmap();
  renderMissables();
  bindTabs();
  bindSave();
  if (trophies.length) selectTrophy('Positive Mental Attitude');
}
init();
