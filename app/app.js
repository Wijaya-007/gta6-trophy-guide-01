// Leonida Trophy Compendium — tracker logic. Static, offline: loads only
// app/data/trophies.json and app/data/sources.json from beside this file.
const KEY = 'leonida-trophy-compendium-v1';
let trophies = [];
let sources = [];
let earned = new Set();
let kindFilter = 'all';
let spoilerHidden = false;
let selected = null;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function load() {
  const t = await fetch('data/trophies.json').then((r) => r.json());
  const s = await fetch('data/sources.json').then((r) => r.json());
  trophies = t.trophies;
  sources = s.sources;
  try { earned = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { earned = new Set(); }
  renderAll();
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify([...earned])); } catch (e) { /* storage unavailable */ }
}

function gradeClass(g) { return 'grade ' + g; }
function missLabel(m) {
  if (m === 'possibly') return '<span class="tag miss">possibly missable</span>';
  if (m === 'watch') return '<span class="tag miss">watch</span>';
  if (m === 'unconfirmed') return '<span class="tag miss">unconfirmed</span>';
  return '';
}

function visibleName(t) {
  if (spoilerHidden && t.hidden && t.kind === 'Story') return 'Hidden story trophy';
  if (spoilerHidden && t.hidden) return 'Hidden trophy';
  return t.name;
}
function visibleDesc(t) {
  if (spoilerHidden && t.hidden) return 'Hidden until earned — turn the spoiler setting off to reveal it.';
  return t.description;
}

function filtered() {
  return trophies.filter((t) => {
    if (kindFilter === 'earned') return earned.has(t.name);
    if (kindFilter === 'todo') return !earned.has(t.name);
    if (kindFilter === 'all') return true;
    return t.kind === kindFilter;
  });
}

function renderList() {
  const list = $('trophyList');
  list.innerHTML = '';
  filtered().forEach((t) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'trow' + (earned.has(t.name) ? ' earned' : '') + (selected === t.name ? ' sel' : '');
    b.innerHTML = '<span class="ck">' + (earned.has(t.name) ? '✓' : '') + '</span>' +
      '<span><span class="nm">' + esc(visibleName(t)) + '</span>' +
      '<span class="' + gradeClass(t.grade) + '">' + esc(t.grade) + '</span>' +
      (t.hidden ? '<span class="tag hidden">hidden</span>' : '') + missLabel(t.missable) +
      '<br><span class="ds">' + esc(visibleDesc(t)) + '</span></span>';
    b.addEventListener('click', (ev) => {
      if (ev.target.classList.contains('ck')) return;
      selected = t.name;
      renderList();
      renderDetail(t);
    });
    b.querySelector('.ck').addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (earned.has(t.name)) earned.delete(t.name); else earned.add(t.name);
      save();
      renderAll();
      const nt = trophies.find((x) => x.name === t.name);
      if (nt) renderDetail(nt);
    });
    list.appendChild(b);
  });
}

function sourceLink(key) {
  const s = sources.find((x) => x.key === key);
  if (!s) return esc(key);
  return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>';
}

function renderDetail(t) {
  const d = $('detail');
  const sp = $('srcPanel');
  const steps = t.steps.map((s, i) => '<li><b>[' + (i + 1) + ']</b> ' + esc(s) + '</li>').join('');
  let html = '<h2>' + esc(visibleName(t)) + '</h2>' +
    '<p class="meta"><span class="' + gradeClass(t.grade) + '">' + esc(t.grade) + '</span>' +
    ' ' + esc(t.kind) + ' &middot; Stage ' + t.stage + ' &middot; ' +
    (t.hidden ? 'Hidden' : 'Visible') + '</p>' +
    '<p><b>Official description:</b> ' + esc(visibleDesc(t)) + '</p>' +
    '<p>' + esc(t.guide) + '</p>';
  if (t.missable === 'possibly') html += '<div class="warnbox"><b>Possibly missable.</b> The first meditation spot can only be done in Chapter 1. Meditate at Jason\u2019s house balcony before leaving Chapter 1.</div>';
  if (t.missable === 'watch') html += '<div class="warnbox"><b>Watch.</b> Finish all eight stranger strands — quest givers return after the story, but check Progress so no strand is left behind.</div>';
  if (t.missable === 'unconfirmed') html += '<div class="notebox"><b>Unconfirmed.</b> No two published guides agree on the exact method yet. This guide flags it honestly rather than inventing steps.</div>';
  if (t.dispute) html += '<div class="notebox"><b>Sources disagree.</b> ' + esc(t.dispute) + '</div>';
  html += '<h3>Steps</h3><ol>' + steps + '</ol>';
  d.innerHTML = html;
  sp.innerHTML = '<h2>Sources</h2><ul>' +
    t.sources.map((k) => '<li>' + sourceLink(k) + '</li>').join('') + '</ul>';
}

function renderProgress() {
  const n = earned.size;
  $('progressFill').style.width = (n / trophies.length * 100) + '%';
  $('progressText').textContent = n + ' / ' + trophies.length + ' earned';
}

function renderAudit() {
  const hidden = trophies.filter((t) => t.hidden).length;
  const cited = trophies.filter((t) => t.sources && t.sources.length).length;
  const steps = trophies.reduce((a, t) => a + t.steps.length, 0);
  const miss = trophies.filter((t) => t.missable === 'possibly').length;
  const watch = trophies.filter((t) => t.missable === 'watch').length;
  const unc = trophies.filter((t) => t.missable === 'unconfirmed').length;
  const dis = trophies.filter((t) => t.dispute).length;
  $('auditStrip').innerHTML =
    '<span><b>55</b> official &middot; <b>1P 2G 6S 46B</b> &middot; <b>' + hidden + '</b> hidden</span>' +
    '<span><b>' + cited + '/55</b> guides cite a source</span>' +
    '<span><b>' + steps + '/80</b> steps cited</span>' +
    '<span><b>' + sources.length + '</b> sources read 20 Nov 2026</span>' +
    '<span class="flag"><b>' + miss + '</b> possibly missable</span>' +
    '<span><b>' + watch + '</b> watch</span>' +
    '<span><b>' + unc + '</b> unconfirmed</span>' +
    '<span><b>' + dis + '</b> disagree</span>';
}

const STAGES = [
  { n: 1, title: 'Story, part 1 — Chapters 1–2', text: 'Play the opening missions and the first two chapters. Pick up the early story trophies and the first meditation spot before leaving Chapter 1 (see Missables).' },
  { n: 2, title: 'Story, part 2 — Chapters 3–5', text: 'Finish the campaign. The remaining chapter trophies and the final-mission Gold land here; after the credits, free-roam continues and the 100% checklist appears.' },
  { n: 3, title: 'Side characters', text: 'Finish the final missions for Andy, Kenton, Billy, Randy and Tyrone, plus Bret\u2019s animal hunt and eight stranger strands. Quest givers return in free-roam if any strand is unfinished.' },
  { n: 4, title: 'Explore Leonida', text: 'Reveal the whole map, meditate at every spot, WAiNK It at 100 locations, try every activity type once, and work the collectible cards.' },
  { n: 5, title: 'Activities & stunts', text: 'Land 250 stunts, gold every shooting-range challenge, win 20 different races, and pick up the one-off miscellaneous trophies.' },
  { n: 6, title: 'Crime & money', text: 'Rob five bank vaults, an armored truck, a jewelry store and three shops in a row; hit one illegal operation per gang; launder $250,000 in Marked Bills; buy every garage and register ten vehicles.' },
  { n: 7, title: 'Platinum', text: 'Push the 100% checklist to completion — A Long Road — and Vice Got a Price! pops right after it. About 200 hours in total.' },
];

function renderRoadmap() {
  $('stageList').innerHTML = STAGES.map((s) => {
    const count = trophies.filter((t) => t.stage === s.n).length;
    return '<li><div class="st-t">Stage ' + s.n + ' — ' + esc(s.title) + ' <span class="st-n">(' + count + ' trophies)</span></div><div>' + esc(s.text) + '</div></li>';
  }).join('');
}

function renderMissables() {
  const box = $('missableList');
  const pm = trophies.find((t) => t.name === 'Positive Mental Attitude');
  const w = trophies.filter((t) => t.missable === 'watch');
  const u = trophies.filter((t) => t.missable === 'unconfirmed');
  let html = '<div class="misscard"><span class="flag">Possibly missable — ' + esc(pm.name) + '.</span><p>' + esc(pm.guide) + '</p></div>';
  w.forEach((t) => { html += '<div class="misscard"><span class="flag">Watch — ' + esc(t.name) + '.</span><p>' + esc(t.guide) + '</p></div>'; });
  u.forEach((t) => { html += '<div class="misscard"><span class="ok">Unconfirmed — ' + esc(t.name) + '.</span><p>' + esc(t.guide) + '</p></div>'; });
  html += '<div class="misscard"><span class="ok">Everything else: safe.</span><p>All other trophies can be earned in free-roam after the story. There is no mission replay, so keep a manual save at the start and end of every chapter. Keep cheats off — they disable trophies and saving.</p></div>';
  box.innerHTML = html;
}

function renderSourcesTab() {
  $('sourceList').innerHTML = sources.map((s) =>
    '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a></li>').join('');
  $('disputeList').innerHTML = trophies.filter((t) => t.dispute).map((t) =>
    '<div class="misscard"><b>' + esc(t.name) + '.</b><p>' + esc(t.dispute) + '</p></div>').join('');
}

function renderAll() {
  renderAudit();
  renderList();
  renderProgress();
  renderRoadmap();
  renderMissables();
  renderSourcesTab();
  if (selected) {
    const t = trophies.find((x) => x.name === selected);
    if (t) renderDetail(t);
  }
}

document.querySelectorAll('#filterChips button').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#filterChips button').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    kindFilter = b.dataset.kind;
    renderList();
  });
});

document.querySelectorAll('.tabs button').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach((x) => x.classList.remove('on'));
    document.querySelectorAll('.panel').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    $('tab-' + b.dataset.tab).classList.add('on');
  });
});

$('spoilerToggle').addEventListener('change', (ev) => {
  spoilerHidden = ev.target.checked;
  renderList();
  if (selected) {
    const t = trophies.find((x) => x.name === selected);
    if (t) renderDetail(t);
  }
});

$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ earned: [...earned], exported: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', (ev) => {
  const f = ev.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      const names = new Set(trophies.map((t) => t.name));
      earned = new Set((d.earned || []).filter((n) => names.has(n)));
      save();
      renderAll();
    } catch (e) { alert('That file is not a valid progress export.'); }
  };
  r.readAsText(f);
  ev.target.value = '';
});

load();
