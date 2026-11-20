// Leonida Trophy Compendium — offline GTA VI trophy guide & tracker.
// Loads app/data/trophies.json (55 official trophies, guides in this entry's own
// words, every step cited) and app/data/sources.json. Progress lives in
// localStorage and can be exported to / imported from a JSON file.
const KEY = 'leonida-trophy-compendium-v1';
const $ = (id) => document.getElementById(id);
const data = await (await fetch('data/trophies.json')).json();
const srcData = await (await fetch('data/sources.json')).json();
const trophies = data.trophies;
const sources = srcData.sources;
const byId = new Map(trophies.map((t) => [t.id, t]));
const byName = new Map(sources.map((s) => [s.n, s]));

let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
let filter = 'all';
let tab = 'checklist';
let selected = 28; // open on the one possibly missable trophy
let spoiler = false;

const KIND_LABEL = { story: 'Story', completion: 'Completion', activities: 'Activities', side: 'Side', collectibles: 'Collectibles', crime: 'Crime', world: 'World', misc: 'Misc', money: 'Money' };
const STAGES = [
  { n: 1, title: 'Stage 1 — Play the story, save the meditation', hours: '60–80h', text: 'Finish Chapters 1–2 and the missions in them. Scan vehicles and study animals as you travel — both count toward 100% later. Most important: do the Chapter 1 balcony meditation at Jason’s house before Chapter 1 ends; it is gone after it.' },
  { n: 2, title: 'Stage 2 — Story continues', hours: 'part of the story', text: 'Finish Chapters 3–4 and their missions. Side questlines open as the story goes — take them as they appear.' },
  { n: 3, title: 'Stage 3 — Finale & free roam', hours: 'story ends', text: 'Finish the final mission. The story is over, but free roam continues and every quest giver tied to a trophy comes back.' },
  { n: 4, title: 'Stage 4 — Side questlines', hours: 'part of the story', text: 'Finish the character questlines as they open: Andy (Lucia only), Kenton, Billy, Randy, Tyrone (Jason only) and Bret (Jason only). They stay open after the story. Watch Yago’s race in Chapter 3 — it is time-sensitive, so save first.' },
  { n: 5, title: 'Stage 5 — Robberies open up', hours: 'along the way', text: 'Yasmin’s jobs unlock the Snap Gun and jewelry robberies; partner robberies, bank vaults and armored trucks follow. Do them with your partner where the trophy asks for it.' },
  { n: 6, title: 'Stage 6 — Activities and collectibles', hours: 'along the way', text: 'Stunts, races, shooting ranges, drone races, fishing, arcade games, cards, WAiNK spots, challenges, vehicles and areas. Scan vehicles and study animals from the start — 100% needs 200 of 277 vehicles and 100 of 255 animals.' },
  { n: 7, title: 'Stage 7 — Money, world & cleanup', hours: 'about 10h', text: 'Launder $250,000 in marked bills, spend $100,000 in shops, buy all 8 garages and register 10 vehicles. Finish the 100% checklist, then mop up whatever is left. The platinum pops with the last trophy.' },
];

function save() { localStorage.setItem(KEY, JSON.stringify([...earned])); }
function gradeOf(t) { return t.grade; }
function isHiddenName(t) { return spoiler && t.story && !earned.has(t.id); }
function displayName(t) { return isHiddenName(t) ? 'Hidden story trophy' : t.name; }
function displayDesc(t) { return isHiddenName(t) ? 'Earn this trophy to reveal its name and description.' : t.description; }

function auditText() {
  const g = (x) => trophies.filter((t) => t.grade === x).length;
  const steps = trophies.reduce((a, t) => a + t.steps.length, 0);
  const cited = trophies.reduce((a, t) => a + t.steps.filter((s) => s.c && s.c.length).length, 0);
  const citedGuides = trophies.filter((t) => t.sources && t.sources.length).length;
  return `<b>AUDIT</b> ${trophies.length} official · 1P ${g('gold')}G ${g('silver')}S ${g('bronze')}B · ${trophies.filter((t) => t.hidden).length} hidden · ${citedGuides}/${trophies.length} guides cite a source · ${cited}/${steps} steps cited · ${sources.length} sources read ${srcData.read} · ${trophies.filter((t) => t.missable).length} possibly missable · ${trophies.filter((t) => t.watch).length} watch · ${trophies.filter((t) => t.unconfirmed).length} unconfirmed · ${trophies.filter((t) => t.disagree).length} disagree`;
}

function filterDefs() {
  const count = (f) => trophies.filter((t) => f(t)).length;
  return [
    ['all', `All ${trophies.length}`, () => true],
    ['platinum', `Platinum ${count((t) => t.grade === 'platinum')}`, (t) => t.grade === 'platinum'],
    ['story', `Story ${count((t) => t.kind === 'story')}`, (t) => t.kind === 'story'],
    ['completion', `Completion ${count((t) => t.kind === 'completion' && t.grade !== 'platinum')}`, (t) => t.kind === 'completion' && t.grade !== 'platinum'],
    ['activities', `Activities ${count((t) => t.kind === 'activities')}`, (t) => t.kind === 'activities'],
    ['side', `Side ${count((t) => t.kind === 'side')}`, (t) => t.kind === 'side'],
    ['collectibles', `Collectibles ${count((t) => t.kind === 'collectibles')}`, (t) => t.kind === 'collectibles'],
    ['crime', `Crime ${count((t) => t.kind === 'crime')}`, (t) => t.kind === 'crime'],
    ['world', `World ${count((t) => t.kind === 'world')}`, (t) => t.kind === 'world'],
    ['misc', `Misc ${count((t) => t.kind === 'misc')}`, (t) => t.kind === 'misc'],
    ['money', `Money ${count((t) => t.kind === 'money')}`, (t) => t.kind === 'money'],
    ['missable', `Missable ${count((t) => t.missable)}`, (t) => t.missable],
    ['watch', `Watch ${count((t) => t.watch)}`, (t) => t.watch],
    ['unconfirmed', `Unconfirmed ${count((t) => t.unconfirmed)}`, (t) => t.unconfirmed],
    ['disagree', `Disagree ${count((t) => t.disagree)}`, (t) => t.disagree],
  ];
}
let activeFilterFn = () => true;

function renderAudit() { $('audit').innerHTML = auditText(); }

function renderFilters() {
  const box = $('filters');
  box.replaceChildren();
  for (const [key, label, fn] of filterDefs()) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (filter === key ? ' active' : '');
    b.textContent = label;
    b.addEventListener('click', () => { filter = key; activeFilterFn = fn; renderFilters(); renderList(); });
    box.append(b);
  }
  const e = document.createElement('span');
  e.className = 'chip';
  e.textContent = `Earned ${earned.size}`;
  box.append(e);
}

function flagsHtml(t) {
  let h = '';
  if (t.missable) h += '<span class="flag miss">Possibly missable</span>';
  if (t.watch) h += '<span class="flag watch">Watch</span>';
  if (t.unconfirmed) h += '<span class="flag unc">Unconfirmed</span>';
  if (t.disagree) h += '<span class="flag dis">Sources disagree</span>';
  return h;
}

function renderList() {
  const ul = $('trophyList');
  ul.replaceChildren();
  const shown = trophies.filter(activeFilterFn);
  $('earnedCount').textContent = `Earned ${earned.size} · showing ${shown.length} of ${trophies.length}`;
  for (const t of shown) {
    const li = document.createElement('li');
    if (t.id === selected) li.className = 'selected';
    if (earned.has(t.id)) li.classList.add('earned');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', 'earned: ' + t.name);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      save(); renderAll();
    });
    box.addEventListener('click', (e) => e.stopPropagation());
    const div = document.createElement('div');
    const nm = document.createElement('div');
    nm.className = 'tname';
    nm.textContent = displayName(t);
    const ds = document.createElement('div');
    ds.className = 'tdesc';
    ds.textContent = displayDesc(t);
    const mt = document.createElement('div');
    mt.className = 'tmeta';
    mt.innerHTML = `<span class="grade ${t.grade}">${t.grade}</span> ${KIND_LABEL[t.kind] ?? t.kind} · Stage ${t.stage}${t.count ? ' · ' + t.count : ''}`;
    const fl = document.createElement('span');
    fl.innerHTML = flagsHtml(t);
    mt.append(fl);
    div.append(nm, ds, mt);
    li.append(box, div);
    li.addEventListener('click', () => { selected = t.id; renderList(); renderDetail(); });
    ul.append(li);
  }
}

function citeHtml(nums) {
  return nums.map((n) => `<a class="cite" href="#src-${n}">[${n}]</a>`).join(' ');
}

function renderDetail() {
  const t = byId.get(selected) ?? trophies[0];
  const d = $('detail');
  d.replaceChildren();
  const h = document.createElement('h3');
  h.textContent = displayName(t);
  const off = document.createElement('p');
  off.className = 'official';
  off.textContent = `“${displayDesc(t)}” — official description · ${t.grade} · ${KIND_LABEL[t.kind] ?? t.kind} · Stage ${t.stage}${t.count ? ' · Count: ' + t.count : ''}`;
  d.append(h, off);
  const fl = document.createElement('div');
  fl.innerHTML = flagsHtml(t);
  d.append(fl);
  if (t.missable) {
    const w = document.createElement('div');
    w.className = 'warn';
    w.innerHTML = '<b>Possibly missable:</b> the Chapter 1 balcony meditation is gone after Chapter 1, and it is unconfirmed whether the trophy needs it. Do it anyway and keep a Chapter 1 manual save.';
    d.append(w);
  }
  if (t.unconfirmed) {
    const w = document.createElement('div');
    w.className = 'warn';
    w.innerHTML = '<b>Unconfirmed:</b> no launch-day guide gives a method yet. This guide says so rather than guessing — check back as guides update.';
    d.append(w);
  }
  const ol = document.createElement('ol');
  ol.className = 'steps';
  for (const s of t.steps) {
    const li = document.createElement('li');
    li.textContent = s.t + ' ';
    const sp = document.createElement('span');
    sp.innerHTML = citeHtml(s.c);
    li.append(sp);
    ol.append(li);
  }
  d.append(ol);
  const sf = document.createElement('div');
  sf.className = 'srcfor';
  sf.innerHTML = '<b>Sources for this guide</b><br>' + t.sources.map((n) => {
    const s = byName.get(n);
    return s ? `[${n}] ${s.name} — ${s.title}${s.url ? ` <a href="${s.url}" target="_blank" rel="noopener">${s.url}</a>` : ''}` : `[${n}]`;
  }).join('<br>');
  d.append(sf);
}

function renderSourcesPanel() {
  const p = $('sourcesPanel');
  p.replaceChildren();
  const h = document.createElement('h2');
  h.textContent = `Sources — read ${srcData.read}`;
  p.append(h);
  const ol = document.createElement('ol');
  for (const s of sources) {
    const li = document.createElement('li');
    const citedBy = trophies.filter((t) => (t.sources || []).includes(s.n)).length;
    li.innerHTML = `<span class="sname">[${s.n}] ${s.name}</span> — ${s.title}<br><span class="scited">cited by ${citedBy} of ${trophies.length} guides</span>${s.url ? `<br><a href="${s.url}" target="_blank" rel="noopener">${s.url}</a>` : ''}`;
    ol.append(li);
  }
  p.append(ol);
  const note = document.createElement('p');
  note.className = 'snote';
  note.textContent = 'Every step cites its source by number. The official list gives each trophy its name, description and grade.';
  p.append(note);
}

function renderRoadmap() {
  const box = $('stages');
  box.replaceChildren();
  for (const st of STAGES) {
    const card = document.createElement('div');
    card.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = st.title;
    const hrs = document.createElement('div');
    hrs.className = 'hours';
    hrs.textContent = st.hours;
    const p = document.createElement('p');
    p.textContent = st.text;
    const chips = document.createElement('div');
    chips.className = 'chips';
    const members = trophies.filter((t) => t.stage === st.n);
    for (const t of members) {
      const c = document.createElement('span');
      c.className = 'tchip' + (earned.has(t.id) ? ' done' : '');
      c.textContent = (earned.has(t.id) ? '✓ ' : '') + displayName(t);
      c.title = t.name;
      chips.append(c);
    }
    const cnt = document.createElement('div');
    cnt.className = 'count';
    cnt.textContent = `${members.filter((t) => earned.has(t.id)).length} / ${members.length} earned in this stage`;
    card.append(h, hrs, p, chips, cnt);
    box.append(card);
  }
}

function renderMissables() {
  const box = $('missGrid');
  box.replaceChildren();
  const miss = trophies.filter((t) => t.missable);
  const watch = trophies.filter((t) => t.watch);
  const unc = trophies.filter((t) => t.unconfirmed);
  const dis = trophies.filter((t) => t.disagree);
  const cleared = trophies.filter((t) => !t.missable && !t.watch && !t.unconfirmed && !t.disagree);
  const cards = [
    ['Possibly missable — ' + miss.length, miss.map((t) => `<b>${t.name}</b>: meditate at every spot. The Chapter 1 balcony meditation at Jason’s house is gone after Chapter 1, and no guide has confirmed whether the trophy needs it. Do it anyway and keep a Chapter 1 manual save. ${citeHtml([1, 3])}`)],
    ['Watch — ' + watch.length, watch.map((t) => `<b>${t.name}</b>: Yago’s race in Chapter 3 is time-sensitive (hourglass icon). Save first and race it the moment it appears, or the strand can fail. ${citeHtml([1, 2])}`)],
    ['Unconfirmed — ' + unc.length, unc.map((t) => `<b>${t.name}</b> — no launch-day guide gives a method yet. ${citeHtml([4])}`)],
    ['Sources disagree — ' + dis.length + ' (both versions shown)', dis.map((t) => {
      if (t.id === 7) return `<b>${t.name}</b> — PowerPyx places the final mission after the five chapters; eGamers quotes guides that put it in Chapter 5. ${citeHtml([1, 4])}`;
      if (t.id === 25) return `<b>${t.name}</b> — PowerPyx counts 4 counting strands; other guides count all 8. Finish all 8 and you are covered either way. ${citeHtml([1, 2])}`;
      if (t.id === 28) return `<b>${t.name}</b> — guides say 18 meditations for the trophy while the 100% list says 15. Do all 18. ${citeHtml([1, 3])}`;
      if (t.id === 40) return `<b>${t.name}</b> — PowerPyx lists 8 large bank vaults; KeenGamer’s 100% table counts 22 bank jobs. Different categories, both shown. ${citeHtml([1, 2])}`;
      return `<b>${t.name}</b>`;
    })],
    ['Cleared — everything else', [`Cleared, not missable: ${cleared.length} trophies. Every other trophy is earnable in free roam after the story. Cheats disable trophies and saving — keep them off a trophy save. ${citeHtml([1, 2])}`]],
  ];
  for (const [title, items] of cards) {
    const card = document.createElement('div');
    card.className = 'misscard';
    const h = document.createElement('h3');
    h.textContent = title;
    card.append(h);
    const ul = document.createElement('ul');
    for (const it of items) {
      const li = document.createElement('li');
      li.innerHTML = it;
      ul.append(li);
    }
    card.append(ul);
    box.append(card);
  }
}

function renderSourcesView() {
  const ol = $('sourceList');
  ol.replaceChildren();
  for (const s of sources) {
    const citedBy = trophies.filter((t) => (t.sources || []).includes(s.n)).length;
    const li = document.createElement('li');
    li.id = 'src-' + s.n;
    li.innerHTML = `<b>[${s.n}] ${s.name} — ${s.title}</b><br>${s.covers}<br><span class="scited">cited by ${citedBy} of ${trophies.length} guides</span>${s.url ? `<br><a href="${s.url}" target="_blank" rel="noopener">${s.url}</a>` : ''}`;
    ol.append(li);
  }
}

function renderProgress() {
  $('earnedBig').textContent = `${earned.size} / ${trophies.length} earned`;
  $('barFill').style.width = `${(earned.size / trophies.length) * 100}%`;
}

function renderAll() {
  renderProgress(); renderAudit(); renderFilters(); renderList(); renderDetail(); renderSourcesPanel(); renderRoadmap(); renderMissables(); renderSourcesView();
}

function setTab(next) {
  tab = next;
  for (const x of document.querySelectorAll('#tabs button')) x.classList.toggle('active', x.dataset.tab === tab);
  for (const v of document.querySelectorAll('.view')) v.classList.toggle('active', v.id === 'view-' + tab);
  if (location.hash !== '#' + tab) history.replaceState(null, '', '#' + tab);
}

$('tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-tab]');
  if (!b) return;
  setTab(b.dataset.tab);
});

// Deep-link a tab from the URL hash (#checklist, #roadmap, #missables, #sources)
// so a screenshot or a shared link opens straight on that view.
const hashTab = (location.hash || '').slice(1);
if (['checklist', 'roadmap', 'missables', 'sources'].includes(hashTab)) setTab(hashTab);

$('spoilerToggle').addEventListener('change', (e) => { spoiler = e.target.checked; renderList(); renderDetail(); renderRoadmap(); });
$('exportBtn').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify([...earned])], { type: 'application/json' }));
  a.download = 'trophy-progress.json';
  a.click();
  $('savedNote').textContent = 'Exported — progress file downloaded';
});
$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const ids = JSON.parse(await file.text());
    earned = new Set(ids.filter((id) => byId.has(id)));
    save(); renderAll();
    $('savedNote').textContent = 'Imported — progress restored';
  } catch { $('savedNote').textContent = 'Import failed — not a progress file'; }
});

renderAll();
