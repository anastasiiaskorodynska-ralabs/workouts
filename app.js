// My Workouts — reads the Markdown files in plans/, history/ and profile.md
// and shows them as phone-friendly pages. Checkbox ticks are saved on this device.

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const app = document.getElementById('app');
const CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV_SVG = '<svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';

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

// ---------- dates ----------

const parseDate = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const toIso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const short = d => `${MONTHS[d.getMonth()]} ${d.getDate()}`;
const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const mondayOf = d => addDays(d, -((d.getDay() + 6) % 7));
const weekRange = iso => { const m = parseDate(iso); return `${short(m)} – ${short(addDays(m, 6))}`; };

// ---------- Markdown parsing ----------

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
      const dayName = DAYS.find(d => title.toLowerCase().startsWith(d.toLowerCase()));
      if (dayName) {
        const focus = title.slice(dayName.length).replace(/^\s*[—–:-]\s*/, '');
        section = { type: 'day', day: dayName, focus, groups: [] };
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

function dayDate(weekIso, dayName) {
  return addDays(parseDate(weekIso), DAYS.indexOf(dayName));
}

function exerciseHtml(item, key, checks, editable) {
  const desc = item.desc ? `<span class="ex-desc">${inline(item.desc)}</span>` : '';
  const text = `<span class="ex-text"><span class="ex-name">${inline(item.name)}</span>${item.dose ? `<span class="ex-dose">${inline(item.dose)}</span>` : ''}${desc}</span>`;
  if (editable) {
    return `<label class="ex"><input type="checkbox" data-key="${key}" ${checks[key] ? 'checked' : ''}><span class="box">${CHECK_SVG}</span>${text}</label>`;
  }
  const mark = item.done === true ? '<span class="mark yes" title="Done">✓</span>'
    : item.done === false ? '<span class="mark no" title="Skipped">–</span>'
    : '<span class="mark none">•</span>';
  return `<div class="ex">${mark}${text}</div>`;
}

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
    const date = dayDate(weekIso, s.day);
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
          <span class="day-title"><h2>${s.day}${isToday ? '<span class="badge">Today</span>' : ''}</h2><small>${inline(s.focus)} · ${short(date)}</small></span>
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
    <div class="progress-label"><span>${done} of ${total} exercises done</span><span>${pct}%</span></div></div>`;
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
  const out = [`Week of ${weekIso} — results`];
  week.sections.forEach((s, si) => {
    if (s.type !== 'day') return;
    const missed = [];
    let total = 0, done = 0;
    s.groups.forEach((g, gi) => g.items.forEach((it, ii) => {
      total++;
      if (checks[`${si}-${gi}-${ii}`]) done++; else missed.push(it.name);
    }));
    out.push(`${s.day}: ${done}/${total} done${missed.length ? ` (not done: ${missed.join(', ')})` : ''}`);
  });
  const notes = (store(`notes:${weekIso}`) || '').trim();
  if (notes) out.push(`My notes: ${notes}`);
  return out.join('\n');
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  }
}

// ---------- pages ----------

let weeks = { plans: [], history: [] };
let pageListeners = null;

function pickCurrentPlan() {
  const plans = [...weeks.plans].sort();
  const thisMonday = toIso(mondayOf(today()));
  if (plans.includes(thisMonday)) return { iso: thisMonday, label: 'This week' };
  const future = plans.filter(p => p > thisMonday);
  if (future.length) return { iso: future[0], label: 'Next week' };
  const past = plans.filter(p => p < thisMonday);
  if (past.length) return { iso: past[past.length - 1], label: 'Latest plan' };
  return null;
}

async function pagePlan(iso, label) {
  const week = parseWeek(await getText(`plans/${iso}.md`));
  const { done, total } = weekTotals(iso, week);
  const nextPlan = weeks.plans.filter(p => p > iso).sort()[0];
  const notes = store(`notes:${iso}`) || '';

  app.innerHTML = `
    <p class="eyebrow">${label}</p>
    <h1>${weekRange(iso)}</h1>
    <p class="sub">Tap an exercise to tick it off.</p>
    <div id="progress">${progressHtml(done, total)}</div>
    ${weekHtml(iso, week, { editable: true })}
    <section class="card finish">
      <h2>End of the week</h2>
      <p>Write how it went (what felt easy or hard, weights you changed). Then tap the button and paste the text to Claude with “finish the week”.</p>
      <textarea id="notes" placeholder="e.g. Romanian deadlift felt easy, shoulders tired on Thursday">${esc(notes)}</textarea>
      <button class="btn" id="copy">Copy summary for Claude</button>
    </section>
    ${nextPlan ? `<a class="link-row" href="#/plan/${nextPlan}">See next week’s plan →</a>` : ''}`;

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
    const t = weekTotals(iso, week);
    document.getElementById('progress').innerHTML = progressHtml(t.done, t.total);
    if (c.done === c.total && e.target.checked) toast(`${week.sections[si].day} done — great work! 💪`);
  }, { signal: pageListeners.signal });

  document.getElementById('notes').addEventListener('input', e => store(`notes:${iso}`, e.target.value));
  document.getElementById('copy').addEventListener('click', async () => {
    toast((await copy(summaryText(iso, week))) ? 'Copied! Paste it to Claude.' : 'Could not copy — try again');
  });
}

async function pageHistoryList() {
  const list = [...weeks.history].sort().reverse();
  if (!list.length) {
    app.innerHTML = '<h1>Past Weeks</h1><p class="empty">No finished weeks yet.</p>';
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
      <span class="day-title">${weekRange(iso)}<small>Week of ${iso}</small></span>
      <span class="count ${total && done === total ? 'all' : ''}">${done} / ${total}</span>
      <svg class="chev" style="transform:rotate(-90deg)" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
    </a>`;
  }));
  app.innerHTML = `<h1>Past Weeks</h1><p class="sub">${list.length} finished week${list.length === 1 ? '' : 's'}</p>${rows.join('')}`;
}

async function pageHistoryWeek(iso) {
  const week = parseWeek(await getText(`history/${iso}.md`));
  app.innerHTML = `
    <a class="back" href="#/history">← Past Weeks</a>
    <p class="eyebrow">Finished week</p>
    <h1>${weekRange(iso)}</h1>
    <p class="sub">✓ done · – skipped</p>
    ${weekHtml(iso, week, { editable: false })}`;
}

async function pageProfile() {
  const lines = (await getText('profile.md')).split(/\r?\n/);
  const title = (lines.find(l => l.startsWith('# ')) || '# My Profile').slice(2);
  // Each "##" heading becomes its own card.
  const cards = [];
  let cur = null;
  for (const l of lines) {
    if (l.startsWith('# ')) continue;
    if (l.startsWith('## ')) { cur = { title: l.slice(3), lines: [] }; cards.push(cur); continue; }
    if (cur) cur.lines.push(l);
  }
  app.innerHTML = `<h1>${inline(title)}</h1><p class="sub">Edit <code>profile.md</code> (or ask Claude) to change this.</p>` +
    cards.map(c => `<section class="card note"><h2>${inline(c.title)}</h2>${renderMarkdown(c.lines)}</section>`).join('');
}

// ---------- router ----------

async function route() {
  // Remove the previous page's listeners so they don't pile up.
  if (pageListeners) pageListeners.abort();
  pageListeners = new AbortController();

  const hash = location.hash.replace(/^#/, '') || '/';
  const tab = hash.startsWith('/history') ? 'history' : hash.startsWith('/profile') ? 'profile' : 'week';
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
  window.scrollTo(0, 0);

  try {
    let m;
    if ((m = hash.match(/^\/history\/(\d{4}-\d{2}-\d{2})$/))) await pageHistoryWeek(m[1]);
    else if (hash === '/history') await pageHistoryList();
    else if (hash === '/profile') await pageProfile();
    else if ((m = hash.match(/^\/plan\/(\d{4}-\d{2}-\d{2})$/))) {
      await pagePlan(m[1], m[1] > toIso(mondayOf(today())) ? 'Next week' : 'Plan');
    } else {
      const cur = pickCurrentPlan();
      if (cur) await pagePlan(cur.iso, cur.label);
      else app.innerHTML = '<h1>This Week</h1><p class="empty">No plan yet.<br>Ask Claude to “plan next week”.</p>';
    }
  } catch (err) {
    app.innerHTML = `<p class="empty">Something went wrong loading your files.<br><small>${esc(err.message)}</small></p>`;
  }
}

(async function start() {
  try { weeks = JSON.parse(await getText('weeks.json')); } catch { /* keep empty lists */ }
  window.addEventListener('hashchange', route);
  route();
})();
