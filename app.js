// My Workouts — reads the Markdown files in plans/, history/ and profile.md
// and shows them as phone-friendly pages. Checkbox ticks are saved on this device.
// Ukrainian versions live next to the English ones with a ".uk.md" ending.

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_UK = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя'];
const app = document.getElementById('app');
const CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV_SVG = '<svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';

// ---------- language ----------

const TEXT = {
  en: {
    tabWeek: 'This Week', tabHistory: 'Past Weeks', tabProfile: 'Profile',
    thisWeek: 'This week', nextWeek: 'Next week', latestPlan: 'Latest plan', plan: 'Plan', finishedWeek: 'Finished week',
    tapHint: 'Tap an exercise to tick it off.',
    progress: (d, t) => `${d} of ${t} exercises done`,
    today: 'Today',
    endTitle: 'End of the week',
    endHint: 'Write how it went (what felt easy or hard, weights you changed). Then tap the button and paste the text to Claude with “finish the week”.',
    endPlaceholder: 'e.g. Romanian deadlift felt easy, shoulders tired on Thursday',
    copyBtn: 'Copy summary for Claude',
    copied: 'Copied! Paste it to Claude.', copyFail: 'Could not copy — try again',
    dayDone: day => `${day} done — great work! 💪`,
    seeNext: 'See next week’s plan →',
    back: '← Past Weeks',
    legend: '✓ done · – skipped', done: 'Done', skipped: 'Skipped',
    noHistory: 'No finished weeks yet.',
    historyCount: n => `${n} finished week${n === 1 ? '' : 's'}`,
    weekOf: 'Week of',
    profileHint: 'Edit <code>profile.md</code> (or ask Claude) to change this.',
    noPlan: 'No plan yet.<br>Ask Claude to “plan next week”.',
    error: 'Something went wrong loading your files.',
    fallback: '',
    sumTitle: iso => `Week of ${iso} — results`,
    sumDay: (day, d, t, missed) => `${day}: ${d}/${t} done${missed.length ? ` (not done: ${missed.join(', ')})` : ''}`,
    sumNotes: 'My notes',
  },
  uk: {
    tabWeek: 'Цей тиждень', tabHistory: 'Минулі тижні', tabProfile: 'Профіль',
    thisWeek: 'Цей тиждень', nextWeek: 'Наступний тиждень', latestPlan: 'Останній план', plan: 'План', finishedWeek: 'Завершений тиждень',
    tapHint: 'Натисни на вправу, щоб відмітити її.',
    progress: (d, t) => `Виконано ${d} з ${t} вправ`,
    today: 'Сьогодні',
    endTitle: 'Кінець тижня',
    endHint: 'Напиши, як пройшов тиждень (що було легко чи важко, які ваги змінила). Потім натисни кнопку і встав текст у чат з Claude зі словами “finish the week”.',
    endPlaceholder: 'напр. румунська тяга була легкою, у четвер втомилися плечі',
    copyBtn: 'Скопіювати підсумок для Claude',
    copied: 'Скопійовано! Встав у чат з Claude.', copyFail: 'Не вдалося скопіювати — спробуй ще раз',
    dayDone: day => `${day} — виконано, чудова робота! 💪`,
    seeNext: 'План на наступний тиждень →',
    back: '← Минулі тижні',
    legend: '✓ виконано · – пропущено', done: 'Виконано', skipped: 'Пропущено',
    noHistory: 'Ще немає завершених тижнів.',
    historyCount: n => `Завершених тижнів: ${n}`,
    weekOf: 'Тиждень від',
    profileHint: 'Щоб змінити, відредагуй <code>profile.uk.md</code> (або попроси Claude).',
    noPlan: 'Плану ще немає.<br>Попроси Claude: “plan next week”.',
    error: 'Не вдалося завантажити файли.',
    fallback: 'Українська версія цього тижня ще не готова, тому показано англійською.',
    sumTitle: iso => `Тиждень від ${iso} — результати`,
    sumDay: (day, d, t, missed) => `${day}: виконано ${d}/${t}${missed.length ? ` (не виконано: ${missed.join(', ')})` : ''}`,
    sumNotes: 'Мої нотатки',
  },
};

let lang = store('lang') === 'uk' ? 'uk' : 'en';
const t = key => TEXT[lang][key];

function applyLanguage() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
}

// ---------- small helpers ----------

const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');

function store(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
    localStorage.setItem(key, JSON.stringify(value));
  } catch { return null; }
}

async function getText(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${path}`);
  return res.text();
}

// Loads "name.uk.md" in Ukrainian mode (falls back to "name.md" if it doesn't exist yet).
async function getLocalized(base) {
  if (lang === 'uk') {
    try { return { text: await getText(`${base}.uk.md`), fallback: false }; } catch { /* use English */ }
    return { text: await getText(`${base}.md`), fallback: true };
  }
  return { text: await getText(`${base}.md`), fallback: false };
}

// ---------- dates ----------

const parseDate = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const toIso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const short = d => d.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', { month: 'short', day: 'numeric' });
const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const mondayOf = d => addDays(d, -((d.getDay() + 6) % 7));
const weekRange = iso => { const m = parseDate(iso); return `${short(m)} – ${short(addDays(m, 6))}`; };

// ---------- Markdown parsing ----------

const normApos = s => s.replace(/[’ʼ`]/g, "'").toLowerCase();

// Returns { index (0 = Monday), label } if a heading starts with a weekday name (English or Ukrainian).
function matchDay(title) {
  const lower = normApos(title);
  for (const names of [DAYS, DAYS_UK]) {
    const i = names.findIndex(d => lower.startsWith(normApos(d)));
    if (i >= 0) return { index: i, label: title.slice(0, names[i].length), rest: title.slice(names[i].length) };
  }
  return null;
}

// Turns a week file into { title, sections: [day | note] }.
// Day sections are "## Tuesday — Lower body"; any other "##" section is a note.
function parseWeek(md) {
  const week = { title: '', sections: [] };
  let section = null, group = null, item = null;

  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;

    let m;
    if ((m = line.match(/^# (.+)/))) { week.title = m[1].trim(); continue; }

    if ((m = line.match(/^## (.+)/))) {
      const title = m[1].trim();
      const day = matchDay(title);
      if (day) {
        section = { type: 'day', dayIndex: day.index, day: day.label, focus: day.rest.replace(/^\s*[—–:-]\s*/, ''), groups: [] };
        group = { title: '', note: '', items: [] };
        section.groups.push(group);
      } else {
        section = { type: 'note', title, lines: [] };
        group = null;
      }
      item = null;
      week.sections.push(section);
      continue;
    }

    if (!section) continue;
    if (section.type === 'note') { section.lines.push(line); continue; }

    if ((m = line.match(/^### (.+)/))) {
      group = { title: m[1].trim(), note: '', items: [] };
      section.groups.push(group);
      item = null;
      continue;
    }

    if ((m = line.match(/^\d+\.\s+(.*)/))) {
      let text = m[1], done = null;
      const box = text.match(/^\[( |x|X)\]\s*/);
      if (box) { done = box[1].toLowerCase() === 'x'; text = text.slice(box[0].length); }
      const cut = text.indexOf(' — ');
      item = {
        name: cut >= 0 ? text.slice(0, cut) : text,
        dose: cut >= 0 ? text.slice(cut + 3) : '',
        desc: '',
        done,
      };
      group.items.push(item);
      continue;
    }

    if (/^\s{2,}\S/.test(line) && item) { item.desc += (item.desc ? ' ' : '') + line.trim(); continue; }

    // Plain text line inside a day: a note for the current group (e.g. "Rest 60 s, repeat 3 times").
    group.note += (group.note ? ' ' : '') + line.trim();
    item = null;
  }

  // Drop empty leading groups (days that start straight with "###").
  for (const s of week.sections) if (s.type === 'day') s.groups = s.groups.filter(g => g.items.length || g.note);
  return week;
}

// Very small Markdown renderer for notes and the profile page.
function renderMarkdown(lines) {
  let html = '', list = null;
  const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
  for (const line of lines) {
    let m;
    if (!line.trim()) { closeList(); continue; }
    if ((m = line.match(/^#{1,3} (.+)/))) { closeList(); html += `<h3>${inline(m[1])}</h3>`; continue; }
    if ((m = line.match(/^\s*[-*] (.+)/))) {
      if (list !== 'ul') { closeList(); html += '<ul>'; list = 'ul'; }
      html += `<li>${inline(m[1])}</li>`; continue;
    }
    if ((m = line.match(/^\s*\d+\. (.+)/))) {
      if (list !== 'ol') { closeList(); html += '<ol>'; list = 'ol'; }
      html += `<li>${inline(m[1])}</li>`; continue;
    }
    closeList();
    html += `<p>${inline(line)}</p>`;
  }
  closeList();
  return html;
}

// ---------- rendering ----------

function exerciseHtml(item, key, checks, editable) {
  const desc = item.desc ? `<span class="ex-desc">${inline(item.desc)}</span>` : '';
  const text = `<span class="ex-text"><span class="ex-name">${inline(item.name)}</span>${item.dose ? `<span class="ex-dose">${inline(item.dose)}</span>` : ''}${desc}</span>`;
  if (editable) {
    return `<label class="ex"><input type="checkbox" data-key="${key}" ${checks[key] ? 'checked' : ''}><span class="box">${CHECK_SVG}</span>${text}</label>`;
  }
  const mark = item.done === true ? `<span class="mark yes" title="${t('done')}">✓</span>`
    : item.done === false ? `<span class="mark no" title="${t('skipped')}">–</span>`
    : '<span class="mark none">•</span>';
  return `<div class="ex">${mark}${text}</div>`;
}

// Ticks are stored by position ("day-group-exercise"), so they stay the same in both languages.
function dayCounts(section, si, checks, editable) {
  let total = 0, done = 0;
  section.groups.forEach((g, gi) => g.items.forEach((it, ii) => {
    total++;
    if (editable ? checks[`${si}-${gi}-${ii}`] : it.done) done++;
  }));
  return { total, done };
}

function weekHtml(weekIso, week, { editable }) {
  const checks = editable ? (store(`checks:${weekIso}`) || {}) : {};
  const todayIso = toIso(today());
  let openedOne = false;

  return week.sections.map((s, si) => {
    if (s.type === 'note') {
      // On the plan page notes start folded so the workout comes first.
      return `<details class="card" ${editable ? '' : 'open'}>
        <summary><span class="day-title"><h2>${inline(s.title)}</h2></span>${CHEV_SVG}</summary>
        <div class="card-body note-body">${renderMarkdown(s.lines)}</div>
      </details>`;
    }
    const date = addDays(parseDate(weekIso), s.dayIndex);
    const isToday = toIso(date) === todayIso;
    const { total, done } = dayCounts(s, si, checks, editable);
    // Open the first day that still has work left (or every day for past weeks).
    let open = !editable;
    if (editable && !openedOne && done < total) { open = true; openedOne = true; }

    const body = s.groups.map((g, gi) => `
      ${g.title ? `<h3>${inline(g.title)}</h3>` : ''}
      ${g.note ? `<p class="group-note">${inline(g.note)}</p>` : ''}
      ${g.items.map((it, ii) => exerciseHtml(it, `${si}-${gi}-${ii}`, checks, editable)).join('')}
    `).join('');

    return `
      <details class="card day" data-si="${si}" ${open ? 'open' : ''}>
        <summary>
          <span class="day-title"><h2>${inline(s.day)}${isToday ? `<span class="badge">${t('today')}</span>` : ''}</h2><small>${inline(s.focus)} · ${short(date)}</small></span>
          <span class="count ${done === total ? 'all' : ''}" data-count="${si}">${done} / ${total}</span>
          ${CHEV_SVG}
        </summary>
        <div class="card-body">${body}</div>
      </details>`;
  }).join('');
}

function progressHtml(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<div class="progress"><div class="bar"><span style="width:${pct}%"></span></div>
    <div class="progress-label"><span>${TEXT[lang].progress(done, total)}</span><span>${pct}%</span></div></div>`;
}

function weekTotals(weekIso, week) {
  const checks = store(`checks:${weekIso}`) || {};
  let done = 0, total = 0;
  week.sections.forEach((s, si) => {
    if (s.type !== 'day') return;
    const c = dayCounts(s, si, checks, true);
    done += c.done; total += c.total;
  });
  return { done, total };
}

// Text you can paste to Claude when you say "finish the week".
function summaryText(weekIso, week) {
  const checks = store(`checks:${weekIso}`) || {};
  const L = TEXT[lang];
  const out = [L.sumTitle(weekIso)];
  week.sections.forEach((s, si) => {
    if (s.type !== 'day') return;
    const missed = [];
    let total = 0, done = 0;
    s.groups.forEach((g, gi) => g.items.forEach((it, ii) => {
      total++;
      if (checks[`${si}-${gi}-${ii}`]) done++; else missed.push(it.name);
    }));
    out.push(L.sumDay(s.day, done, total, missed));
  });
  const notes = (store(`notes:${weekIso}`) || '').trim();
  if (notes) out.push(`${L.sumNotes}: ${notes}`);
  return out.join('\n');
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  }
}

const fallbackHtml = fallback => fallback ? `<p class="fallback">${t('fallback')}</p>` : '';

// ---------- pages ----------

let weeks = { plans: [], history: [] };
let pageListeners = null;

function pickCurrentPlan() {
  const plans = [...weeks.plans].sort();
  const thisMonday = toIso(mondayOf(today()));
  if (plans.includes(thisMonday)) return { iso: thisMonday, label: 'thisWeek' };
  const future = plans.filter(p => p > thisMonday);
  if (future.length) return { iso: future[0], label: 'nextWeek' };
  const past = plans.filter(p => p < thisMonday);
  if (past.length) return { iso: past[past.length - 1], label: 'latestPlan' };
  return null;
}

async function pagePlan(iso, label) {
  const { text, fallback } = await getLocalized(`plans/${iso}`);
  const week = parseWeek(text);
  const { done, total } = weekTotals(iso, week);
  const nextPlan = weeks.plans.filter(p => p > iso).sort()[0];
  const notes = store(`notes:${iso}`) || '';

  app.innerHTML = `
    <p class="eyebrow">${t(label)}</p>
    <h1>${weekRange(iso)}</h1>
    <p class="sub">${t('tapHint')}</p>
    ${fallbackHtml(fallback)}
    <div id="progress">${progressHtml(done, total)}</div>
    ${weekHtml(iso, week, { editable: true })}
    <section class="card finish">
      <h2>${t('endTitle')}</h2>
      <p>${t('endHint')}</p>
      <textarea id="notes" placeholder="${esc(t('endPlaceholder'))}">${esc(notes)}</textarea>
      <button class="btn" id="copy">${t('copyBtn')}</button>
    </section>
    ${nextPlan ? `<a class="link-row" href="#/plan/${nextPlan}">${t('seeNext')}</a>` : ''}`;

  app.addEventListener('change', e => {
    const key = e.target.dataset && e.target.dataset.key;
    if (!key) return;
    const checks = store(`checks:${iso}`) || {};
    if (e.target.checked) checks[key] = true; else delete checks[key];
    store(`checks:${iso}`, checks);
    const si = Number(key.split('-')[0]);
    const c = dayCounts(week.sections[si], si, checks, true);
    const badge = app.querySelector(`[data-count="${si}"]`);
    badge.textContent = `${c.done} / ${c.total}`;
    badge.classList.toggle('all', c.done === c.total);
    const tot = weekTotals(iso, week);
    document.getElementById('progress').innerHTML = progressHtml(tot.done, tot.total);
    if (c.done === c.total && e.target.checked) toast(TEXT[lang].dayDone(week.sections[si].day));
  }, { signal: pageListeners.signal });

  document.getElementById('notes').addEventListener('input', e => store(`notes:${iso}`, e.target.value));
  document.getElementById('copy').addEventListener('click', async () => {
    toast((await copy(summaryText(iso, week))) ? t('copied') : t('copyFail'));
  });
}

async function pageHistoryList() {
  const list = [...weeks.history].sort().reverse();
  if (!list.length) {
    app.innerHTML = `<h1>${t('tabHistory')}</h1><p class="empty">${t('noHistory')}</p>`;
    return;
  }
  const rows = await Promise.all(list.map(async iso => {
    let done = 0, total = 0;
    try {
      parseWeek(await getText(`history/${iso}.md`)).sections.forEach(s => {
        if (s.type === 'day') s.groups.forEach(g => g.items.forEach(it => { total++; if (it.done) done++; }));
      });
    } catch { /* show the row anyway */ }
    return `<a class="card week-link" href="#/history/${iso}">
      <span class="day-title">${weekRange(iso)}<small>${t('weekOf')} ${iso}</small></span>
      <span class="count ${total && done === total ? 'all' : ''}">${done} / ${total}</span>
      <svg class="chev" style="transform:rotate(-90deg)" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
    </a>`;
  }));
  app.innerHTML = `<h1>${t('tabHistory')}</h1><p class="sub">${TEXT[lang].historyCount(list.length)}</p>${rows.join('')}`;
}

async function pageHistoryWeek(iso) {
  const { text, fallback } = await getLocalized(`history/${iso}`);
  const week = parseWeek(text);
  app.innerHTML = `
    <a class="back" href="#/history">${t('back')}</a>
    <p class="eyebrow">${t('finishedWeek')}</p>
    <h1>${weekRange(iso)}</h1>
    <p class="sub">${t('legend')}</p>
    ${fallbackHtml(fallback)}
    ${weekHtml(iso, week, { editable: false })}`;
}

async function pageProfile() {
  const { text, fallback } = await getLocalized('profile');
  const lines = text.split(/\r?\n/);
  const title = (lines.find(l => l.startsWith('# ')) || '# My Profile').slice(2);
  // Each "##" heading becomes its own card.
  const cards = [];
  let cur = null;
  for (const l of lines) {
    if (l.startsWith('# ')) continue;
    if (l.startsWith('## ')) { cur = { title: l.slice(3), lines: [] }; cards.push(cur); continue; }
    if (cur) cur.lines.push(l);
  }
  app.innerHTML = `<h1>${inline(title)}</h1><p class="sub">${t('profileHint')}</p>${fallbackHtml(fallback)}` +
    cards.map(c => `<section class="card note"><h2>${inline(c.title)}</h2>${renderMarkdown(c.lines)}</section>`).join('');
}

// ---------- router ----------

async function route({ keepScroll = false } = {}) {
  // Remove the previous page's listeners so they don't pile up.
  if (pageListeners) pageListeners.abort();
  pageListeners = new AbortController();

  const hash = location.hash.replace(/^#/, '') || '/';
  const tab = hash.startsWith('/history') ? 'history' : hash.startsWith('/profile') ? 'profile' : 'week';
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
  const scrollY = window.scrollY;

  try {
    let m;
    if ((m = hash.match(/^\/history\/(\d{4}-\d{2}-\d{2})$/))) await pageHistoryWeek(m[1]);
    else if (hash === '/history') await pageHistoryList();
    else if (hash === '/profile') await pageProfile();
    else if ((m = hash.match(/^\/plan\/(\d{4}-\d{2}-\d{2})$/))) {
      await pagePlan(m[1], m[1] > toIso(mondayOf(today())) ? 'nextWeek' : 'plan');
    } else {
      const cur = pickCurrentPlan();
      if (cur) await pagePlan(cur.iso, cur.label);
      else app.innerHTML = `<h1>${t('tabWeek')}</h1><p class="empty">${t('noPlan')}</p>`;
    }
  } catch (err) {
    app.innerHTML = `<p class="empty">${t('error')}<br><small>${esc(err.message)}</small></p>`;
  }
  window.scrollTo(0, keepScroll ? scrollY : 0);
}

document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.lang === lang) return;
  lang = b.dataset.lang;
  store('lang', lang);
  applyLanguage();
  route({ keepScroll: true });
}));

(async function start() {
  applyLanguage();
  try { weeks = JSON.parse(await getText('weeks.json')); } catch { /* keep empty lists */ }
  window.addEventListener('hashchange', () => route());
  route();
})();
