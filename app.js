// My Workouts — reads the Markdown files in plans/, history/ and profile.md
// and shows them as phone screens. Ticks, notes and settings are saved on this device.
// Ukrainian versions of the files live next to the English ones with a ".uk.md" ending.

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_UK = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя'];
const app = document.getElementById('app');
const dock = document.getElementById('dock');
const overlay = document.getElementById('overlay');

const ICON = {
  check: '<svg class="ic" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  arrow: '<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg class="ic" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
};

// ---------- words in both languages ----------

const plural = (n, one, few, many) => {
  const a = n % 10, b = n % 100;
  return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
};

const TEXT = {
  en: {
    thisWeek: 'This week', nextWeek: 'Next week', plan: 'Plan', week: 'Week',
    history: 'History', profile: 'Profile',
    sessionsDone: 'sessions done', today: 'Today', upNext: 'Up next',
    done: 'Done', upcoming: 'Upcoming', missed: 'Not logged', skipped: 'Skipped',
    partial: (d, t) => `${d}/${t} sets`,
    exercises: n => `${n} exercise${n === 1 ? '' : 's'}`,
    setsN: n => `${n} set${n === 1 ? '' : 's'}`,
    coach: "Coach's note", coachBy: '— Claude',
    setsReps: 'Sets × reps', weight: 'Weight', rest: 'Rest',
    finish: 'Finish workout', resting: 'Rest', go: 'Go!', skip: 'Skip', next: 'Next', set: 'set', setsWord: 'sets',
    wellDone: 'Workout done', sets: 'Sets', volume: 'Volume', time: 'Time', kg: 'kg', min: 'min',
    backToWeek: 'Back to this week',
    keyLifts: 'Key lifts', since: 'since week 1', pastWeeks: 'Past weeks', noHistory: 'No finished weeks yet.', weekShort: 'W',
    readOnly: 'Read-only. To change anything, just tell Claude in chat.',
    settings: 'App settings', language: 'Language', theme: 'Theme', dark: 'Dark', light: 'Light',
    days3: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    endTitle: 'End of the week',
    endHint: 'Write how it went: what felt easy or hard, weights you changed. Then copy the summary and paste it to Claude with “finish the week”.',
    endPlaceholder: 'e.g. Romanian deadlift felt easy, shoulders tired on Thursday',
    copyBtn: 'Copy summary for Claude', copied: 'Copied! Paste it to Claude.', copyFail: 'Could not copy — try again',
    nextReady: 'Next week’s plan is ready',
    noPlan: 'No plan yet.<br>Ask Claude to “plan next week”.',
    error: 'Something went wrong loading your files.',
    sumTitle: iso => `Week of ${iso} — results`,
    sumNotes: 'My notes', sumNotLogged: 'nothing ticked',
    editHint: 'Tap ✎ on any section to change it.',
    editLocked: 'To edit your profile here, connect GitHub once in App settings below.',
    edit: 'Edit', save: 'Save', saving: 'Saving…', cancel: 'Cancel', add: 'Add',
    saved: 'Saved ✓', saveFail: 'Could not save — check your internet and try again',
    otherLang: 'Saved in English. Claude will update the Ukrainian version next time.',
    phLabel: 'Label', phValue: 'Value', phWorkout: 'Workout', phItem: 'New item', phNote: 'Extra note (optional)',
    ghTitle: 'Edit from the app', ghConnected: 'Connected to GitHub ✓ You can edit your profile.',
    ghDisconnect: 'Disconnect', ghConnect: 'Connect', ghChecking: 'Checking…',
    ghOk: 'Connected! You can edit now.', ghBad: 'That key didn’t work. Check the steps and try again.',
    ghSteps: [
      'Open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a> and sign in if asked.',
      'Token name: <b>Workout app</b>. Expiration: <b>1 year</b>.',
      'Repository access: <b>Only select repositories</b> → choose <b>workouts</b>.',
      'Under Permissions, add <b>Contents</b> and set it to <b>Read and write</b>.',
      'Tap <b>Generate token</b>, copy it and paste it below.',
    ],
    ghWarn: 'This key is like a password: it stays on this phone only. Never send it to anyone, not even in chat.',
    ghPlaceholder: 'Paste your key (github_pat_…)',
  },
  uk: {
    thisWeek: 'Цей тиждень', nextWeek: 'Наступний тиждень', plan: 'План', week: 'Тиждень',
    history: 'Історія', profile: 'Профіль',
    sessionsDone: 'тренувань виконано', today: 'Сьогодні', upNext: 'Далі',
    done: 'Виконано', upcoming: 'Заплановано', missed: 'Не відмічено', skipped: 'Пропущено',
    partial: (d, t) => `${d}/${t} підх.`,
    exercises: n => `${n} ${plural(n, 'вправа', 'вправи', 'вправ')}`,
    setsN: n => `${n} ${plural(n, 'підхід', 'підходи', 'підходів')}`,
    coach: 'Нотатка тренера', coachBy: '— Claude',
    setsReps: 'Підходи × повт.', weight: 'Вага', rest: 'Відпочинок',
    finish: 'Завершити тренування', resting: 'Відпочинок', go: 'Час!', skip: 'Далі', next: 'Далі', set: 'підхід', setsWord: 'підходів',
    wellDone: 'Тренування завершено', sets: 'Підходи', volume: 'Обʼєм', time: 'Час', kg: 'кг', min: 'хв',
    backToWeek: 'До цього тижня',
    keyLifts: 'Ключові вправи', since: 'з 1-го тижня', pastWeeks: 'Минулі тижні', noHistory: 'Ще немає завершених тижнів.', weekShort: 'Т',
    readOnly: 'Лише перегляд. Щоб щось змінити, напиши Claude в чаті.',
    settings: 'Налаштування', language: 'Мова', theme: 'Тема', dark: 'Темна', light: 'Світла',
    days3: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
    endTitle: 'Кінець тижня',
    endHint: 'Напиши, як пройшов тиждень: що було легко чи важко, які ваги змінила. Потім скопіюй підсумок і встав його в чат з Claude зі словами “finish the week”.',
    endPlaceholder: 'напр. румунська тяга була легкою, у четвер втомилися плечі',
    copyBtn: 'Скопіювати підсумок для Claude', copied: 'Скопійовано! Встав у чат з Claude.', copyFail: 'Не вдалося скопіювати — спробуй ще раз',
    nextReady: 'План на наступний тиждень готовий',
    noPlan: 'Плану ще немає.<br>Попроси Claude: “plan next week”.',
    error: 'Не вдалося завантажити файли.',
    sumTitle: iso => `Тиждень від ${iso} — результати`,
    sumNotes: 'Мої нотатки', sumNotLogged: 'нічого не відмічено',
    editHint: 'Натисни ✎ на будь-якому розділі, щоб змінити його.',
    editLocked: 'Щоб редагувати профіль тут, один раз підключи GitHub у Налаштуваннях нижче.',
    edit: 'Змінити', save: 'Зберегти', saving: 'Зберігаю…', cancel: 'Скасувати', add: 'Додати',
    saved: 'Збережено ✓', saveFail: 'Не вдалося зберегти — перевір інтернет і спробуй ще раз',
    otherLang: 'Збережено українською. Claude оновить англійську версію наступного разу.',
    phLabel: 'Назва', phValue: 'Значення', phWorkout: 'Тренування', phItem: 'Новий пункт', phNote: 'Додаткова примітка (необовʼязково)',
    ghTitle: 'Редагування в застосунку', ghConnected: 'GitHub підключено ✓ Можна редагувати профіль.',
    ghDisconnect: 'Відключити', ghConnect: 'Підключити', ghChecking: 'Перевіряю…',
    ghOk: 'Підключено! Тепер можна редагувати.', ghBad: 'Ключ не спрацював. Перевір кроки і спробуй ще раз.',
    ghSteps: [
      'Відкрий <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a> і увійди, якщо попросить.',
      'Token name: <b>Workout app</b>. Expiration: <b>1 year</b>.',
      'Repository access: <b>Only select repositories</b> → обери <b>workouts</b>.',
      'У Permissions додай <b>Contents</b> і постав <b>Read and write</b>.',
      'Натисни <b>Generate token</b>, скопіюй ключ і встав його нижче.',
    ],
    ghWarn: 'Цей ключ — як пароль: він зберігається лише на цьому телефоні. Нікому його не надсилай, навіть у чат.',
    ghPlaceholder: 'Встав ключ (github_pat_…)',
  },
};

// ---------- saved settings ----------

function store(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
    localStorage.setItem(key, JSON.stringify(value));
  } catch { return null; }
}

let lang = store('lang') === 'uk' ? 'uk' : 'en';
let theme = store('theme') === 'light' ? 'light' : 'dark';
const T = () => TEXT[lang];

function applySettings() {
  document.documentElement.lang = lang;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'light' ? '#F2F1EA' : '#0E0F0C';
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = T()[el.dataset.i18n]; });
}

// ---------- small helpers ----------

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
const fmt = n => lang === 'uk' ? String(n).replace('.', ',') : String(n);
const mss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const fileCache = {};
function getText(path) {
  if (!fileCache[path]) {
    fileCache[path] = fetch(path, { cache: 'no-cache' }).then(r => {
      if (!r.ok) throw new Error(`Could not load ${path}`);
      return r.text();
    });
    fileCache[path].catch(() => delete fileCache[path]);
  }
  return fileCache[path];
}

// Loads "name.uk.md" in Ukrainian (falls back to "name.md" if it doesn't exist yet).
async function getLocalized(base) {
  if (lang === 'uk') { try { return await getText(`${base}.uk.md`); } catch { /* use English */ } }
  return getText(`${base}.md`);
}
const loadWeek = async (folder, iso) => parseWeek(await getLocalized(`${folder}/${iso}`));

// ---------- dates ----------

const parseDate = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const toIso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const short = d => d.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', { month: 'short', day: 'numeric' }).replace('.', '');
const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const mondayOf = d => addDays(d, -((d.getDay() + 6) % 7));
const weekRange = iso => { const m = parseDate(iso); return `${short(m)} – ${short(addDays(m, 6))}`; };

// ---------- reading the Markdown files ----------

const normApos = s => s.replace(/[’ʼ`]/g, "'").toLowerCase();

// Returns { index (0 = Monday), label, rest } if a heading starts with a weekday (English or Ukrainian).
function matchDay(title) {
  const lower = normApos(title);
  for (const names of [DAYS, DAYS_UK]) {
    const i = names.findIndex(d => lower.startsWith(normApos(d)));
    if (i >= 0) return { index: i, label: title.slice(0, names[i].length), rest: title.slice(names[i].length) };
  }
  return null;
}

const FIELD = { sets: 'sets', 'підходи': 'sets', weight: 'weight', 'вага': 'weight', rest: 'rest', 'відпочинок': 'rest' };

// Turns a week file into { sections: [day | note] }.
// "## Tuesday — Lower body" is a workout day; any other "##" heading is a note.
function parseWeek(md) {
  const week = { sections: [] };
  let section = null, group = null, item = null;

  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    let m;
    if (/^# /.test(line)) continue;

    if ((m = line.match(/^## (.+)/))) {
      const title = m[1].trim();
      const day = matchDay(title);
      if (day) {
        section = { type: 'day', dayIndex: day.index, day: day.label, focus: day.rest.replace(/^\s*[—–:-]\s*/, ''), groups: [] };
        group = { title: '', note: '', items: [] };
        section.groups.push(group);
      } else {
        section = { type: 'note', title, lines: [] };
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
      item = { name: cut >= 0 ? text.slice(0, cut) : text, fields: {}, desc: cut >= 0 ? text.slice(cut + 3) : '', done };
      group.items.push(item);
      continue;
    }

    if (item && /^\s{2,}\S/.test(line)) {
      const f = line.trim().match(/^-\s*([^:]+):\s*(.*)$/);
      const key = f && FIELD[f[1].trim().toLowerCase()];
      if (key) item.fields[key] = f[2].trim();
      else item.desc += (item.desc ? ' ' : '') + line.trim();
      continue;
    }

    // Plain text inside a day: a note for the current round (e.g. rest and how many rounds).
    group.note += (group.note ? ' ' : '') + line.trim();
    item = null;
  }

  for (const s of week.sections) {
    if (s.type !== 'day') continue;
    s.groups = s.groups.filter(g => g.items.length || g.note);
    s.groups.forEach(g => g.items.forEach(enrich));
  }
  return week;
}

// Works out set count, reps, weight and rest seconds from an exercise's fields.
function enrich(it) {
  const sets = it.fields.sets || '';
  const sm = sets.match(/^(\d+)\s*[×x]\s*(.+)$/i);
  it.n = sm ? Math.max(1, Number(sm[1])) : (Number(sets.match(/^\d+/)) || 1);
  it.reps = sm ? sm[2].trim() : '';
  it.sr = sm ? `${it.n} × ${it.reps}` : (sets || '—');

  const w = it.fields.weight || '';
  const wm = w.match(/^([\d.,]+(?:\s*[→–-]\s*[\d.,]+)?)\s*(.*)$/);
  it.wv = wm ? wm[1] : '—';
  it.wu = wm ? wm[2] : w;
  const firstNum = w.match(/[\d]+(?:[.,]\d+)?/);
  it.wnum = firstNum ? Number(firstNum[0].replace(',', '.')) : null;

  const r = it.fields.rest || '';
  const nums = (r.match(/\d+/g) || []).map(Number);
  let sec = nums.length ? nums[nums.length - 1] : 0;
  if (/min|хв/i.test(r)) sec *= 60;
  it.restSec = sec;
}

function noteParts(lines) {
  const text = [], bullets = [];
  for (const l of lines) {
    const b = l.match(/^\s*[-*] (.+)/);
    if (b) bullets.push(b[1]); else text.push(l.trim());
  }
  return { text: text.join(' '), bullets };
}

// ---------- ticks (saved per week, per set) ----------

const ckey = (si, gi, ii, k) => `${si}-${gi}-${ii}-${k}`;
const getChecks = iso => store(`checks:${iso}`) || {};
// Older versions saved one tick per exercise ("si-gi-ii"); that counts as every set done.
const isSetDone = (checks, si, gi, ii, k) => !!(checks[ckey(si, gi, ii, k)] || checks[`${si}-${gi}-${ii}`]);

function exDone(checks, si, gi, ii, it) {
  let c = 0;
  for (let k = 0; k < it.n; k++) if (isSetDone(checks, si, gi, ii, k)) c++;
  return c;
}

function dayStats(section, si, checks) {
  let done = 0, total = 0, exCount = 0;
  section.groups.forEach((g, gi) => g.items.forEach((it, ii) => {
    exCount++; total += it.n; done += exDone(checks, si, gi, ii, it);
  }));
  return { done, total, exCount };
}

// For finished (history) weeks: an exercise is done if it's marked [x].
function historyDayStats(section) {
  let done = 0, total = 0;
  section.groups.forEach(g => g.items.forEach(it => { total++; if (it.done) done++; }));
  return { done, total };
}

// ---------- app state ----------

let weeks = { plans: [], history: [] };
let rest = null;          // { end, total, iso } while the rest timer runs
let restTimer = null;
let openWeek = undefined; // which past week is expanded on History
let liftPick = 0;

const allWeeks = () => [...new Set([...weeks.history, ...weeks.plans])].sort();
const weekNo = iso => allWeeks().indexOf(iso) + 1;
const currentMonday = () => toIso(mondayOf(today()));

function pickCurrentPlan() {
  const plans = [...weeks.plans].sort();
  const mon = currentMonday();
  if (plans.includes(mon)) return mon;
  const future = plans.filter(p => p > mon);
  if (future.length) return future[0];
  return plans[plans.length - 1] || null;
}

function dayStatus(iso, section, si, checks) {
  const date = addDays(parseDate(iso), section.dayIndex);
  const st = dayStats(section, si, checks);
  const finished = (store(`finished:${iso}`) || {})[si];
  const t0 = toIso(today()), d0 = toIso(date);
  let status;
  if (finished || (st.total && st.done === st.total)) status = 'done';
  else if (d0 === t0) status = 'today';
  else if (d0 < t0) status = st.done ? 'partial' : 'missed';
  else status = st.done ? 'partial' : 'up';
  return { date, status, ...st };
}

// ---------- screens ----------

function headHtml(eyebrow, title, withLang) {
  return `<div class="head"><div class="head-text">
      ${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}
      <h1 class="title">${title}</h1></div>
      ${withLang ? `<button class="pill-btn" data-act="toggle-lang" aria-label="Language">${lang === 'en' ? 'EN' : 'UA'}</button>` : ''}
    </div>`;
}

async function screenWeek(iso) {
  if (!iso) { app.innerHTML = `<div class="screen">${headHtml('', T().thisWeek, true)}<p class="empty">${T().noPlan}</p></div>`; return; }
  const week = await loadWeek('plans', iso);
  const checks = getChecks(iso);
  const isCurrent = iso === pickCurrentPlan();
  const days = week.sections.map((s, si) => s.type === 'day' ? { s, si, ...dayStatus(iso, s, si, checks) } : null).filter(Boolean);
  const doneCount = days.filter(d => d.status === 'done').length;
  // The lime "hero" card: today's workout, otherwise the next one still to do.
  const t0 = toIso(today());
  const hero = days.find(d => d.status !== 'done' && toIso(d.date) >= t0);

  const segClass = d => d.status === 'done' ? 'on' : d.status === 'partial' ? 'part' : d.status === 'missed' ? 'miss' : '';
  const cards = days.map(d => {
    const href = `#/w/${iso}/${d.si}`;
    const meta = `${T().exercises(d.exCount)} · ${T().setsN(d.total)}`;
    const when = `<div class="day-when"><b>${T().days3[d.s.dayIndex]}</b><span>${short(d.date)}</span></div>`;
    if (d === hero) {
      return `<a class="day hero" href="${href}">${when}
        <div class="day-main"><em>${d.status === 'today' ? T().today : T().upNext}</em><b>${inline(d.s.focus)}</b><span>${meta}</span></div>
        <div class="go-btn">${ICON.arrow}</div></a>`;
    }
    const right = d.status === 'done' ? `<div class="done-mark">${T().done}<i>${ICON.check}</i></div>`
      : d.status === 'partial' ? `<span class="chip ok">${T().partial(d.done, d.total)}</span>`
      : d.status === 'missed' ? `<span class="chip warn">${T().missed}</span>`
      : `<span class="chip up">${T().upcoming}</span>`;
    return `<a class="day" href="${href}">${when}<div class="day-main"><b>${inline(d.s.focus)}</b><span>${meta}</span></div>${right}</a>`;
  }).join('');

  const noteSec = week.sections.find(s => s.type === 'note');
  let coach = '';
  if (noteSec) {
    const { text, bullets } = noteParts(noteSec.lines);
    coach = `<section class="card">
      <div class="coach-head"><i></i><span class="label">${T().coach}</span></div>
      ${text ? `<p class="coach-text">${inline(text)}</p>` : ''}
      ${bullets.length ? `<div class="tags">${bullets.map(b => `<span>${inline(b)}</span>`).join('')}</div>` : ''}
      <span class="by">${T().coachBy}</span></section>`;
  }

  const nextPlan = weeks.plans.filter(p => p > iso).sort()[0];
  const label = iso === currentMonday() ? T().thisWeek : iso > currentMonday() ? T().nextWeek : T().plan;

  app.innerHTML = `<div class="screen">
    ${headHtml(`${T().week} ${weekNo(iso)} · ${weekRange(iso)}`, label, true)}
    <section class="card">
      <div class="count-row"><span class="count-big">${doneCount}<small>/${days.length}</small></span><span class="count-label">${T().sessionsDone}</span></div>
      <div class="segs">${days.map(d => `<div class="${segClass(d)}"></div>`).join('')}</div>
    </section>
    <div class="stack">${cards}</div>
    ${coach}
    ${nextPlan && isCurrent ? `<a class="card link-card" href="#/w/${nextPlan}">${T().nextReady}${ICON.arrow}</a>` : ''}
    ${isCurrent ? `<section class="card">
      <span class="label">${T().endTitle}</span>
      <p class="hint">${T().endHint}</p>
      <textarea data-notes="${iso}" placeholder="${esc(T().endPlaceholder)}">${esc(store(`notes:${iso}`) || '')}</textarea>
      <button class="btn" data-act="copy" data-iso="${iso}">${T().copyBtn}</button>
    </section>` : ''}
  </div>`;
}

function exerciseHtml(it, idx, setsHtml, extra = '') {
  const desc = it.desc ? `<div class="note">${ICON.info}<span>${inline(it.desc)}</span></div>` : '';
  return `<div class="ex">
    <div class="ex-top"><span class="ex-idx">${String(idx).padStart(2, '0')}</span><span class="ex-name">${inline(it.name)}</span>${extra}</div>
    <div class="stats">
      <div class="stat"><span class="label">${T().setsReps}</span><b class="${it.sr.length > 7 ? 'long' : ''}">${esc(it.sr)}</b></div>
      <div class="stat"><span class="label">${T().weight}</span><b class="${it.wv.length > 5 ? 'long' : ''}">${esc(it.wv)}${it.wu ? `<small>${esc(it.wu)}</small>` : ''}</b></div>
      <div class="stat"><span class="label">${T().rest}</span><b>${it.restSec ? mss(it.restSec) : '—'}</b></div>
    </div>
    ${desc}${setsHtml}
  </div>`;
}

// One workout day. Plans are tickable per set; past weeks are read-only.
async function screenWorkout(folder, iso, si) {
  const editable = folder === 'plans';
  const week = await loadWeek(folder, iso);
  const s = week.sections[si];
  if (!s || s.type !== 'day') { location.hash = '#/'; return; }
  const checks = editable ? getChecks(iso) : {};
  const date = addDays(parseDate(iso), s.dayIndex);
  const st = editable ? dayStats(s, si, checks) : (() => { const h = historyDayStats(s); return { done: h.done, total: h.total }; })();
  const pct = st.total ? (st.done / st.total) * 100 : 0;
  const backHref = editable ? (iso === pickCurrentPlan() ? '#/' : `#/w/${iso}`) : '#/history';

  let idx = 0;
  const body = s.groups.map((g, gi) => {
    const round = g.title || g.note ? `<div class="round">${g.title ? `<b>${inline(g.title)}</b>` : ''}${g.note ? `<span>${inline(g.note)}</span>` : ''}</div>` : '';
    return round + g.items.map((it, ii) => {
      idx++;
      if (!editable) {
        const chip = it.done === false ? `<span class="chip warn sm">${T().skipped}</span>` : it.done ? `<div class="ex-check">${ICON.check}</div>` : '';
        return exerciseHtml(it, idx, '', chip);
      }
      const c = exDone(checks, si, gi, ii, it);
      const sub = it.reps ? `×${esc(it.reps)}` : '';
      let sets = '';
      for (let k = 0; k < it.n; k++) {
        const on = isSetDone(checks, si, gi, ii, k);
        sets += `<button class="set${on ? ' on' : ''}" aria-pressed="${on}" data-act="set" data-set="${si}.${gi}.${ii}.${k}" data-iso="${iso}">
          ${on ? ICON.check : `<b>${k + 1}</b><span>${sub}</span>`}</button>`;
      }
      return exerciseHtml(it, idx, `<div class="sets">${sets}</div>`, c === it.n ? `<div class="ex-check">${ICON.check}</div>` : '');
    }).join('');
  }).join('');

  app.innerHTML = `<div class="screen" style="padding-bottom:${editable ? 300 : 40}px">
    <div class="wo-head">
      <div class="wo-row">
        <a class="circle-btn" href="${backHref}" aria-label="Back">${ICON.back}</a>
        <div class="wo-title"><span>${inline(s.day)} · ${short(date)}</span><b>${inline(s.focus)}</b></div>
        <div class="wo-count"><b>${st.done}<small>/${st.total}</small></b><span>${editable ? T().setsWord : ''}</span></div>
      </div>
      <div class="bar"><div style="width:${pct}%"></div></div>
    </div>
    ${body}
  </div>`;
  if (editable) renderDock(iso, s, si);
}

// The bottom bar on a workout: the rest timer (when running) and "Finish workout".
function renderDock(iso, s, si) {
  const checks = getChecks(iso);
  const st = dayStats(s, si, checks);
  let restHtml = '';
  if (rest && rest.iso === iso) {
    const rem = Math.max(0, Math.ceil((rest.end - Date.now()) / 1000));
    // "Next": the first unticked set from the exercise just ticked onwards, then from the top.
    const order = [];
    s.groups.forEach((g, gi) => g.items.forEach((it, ii) => { for (let k = 0; k < it.n; k++) order.push({ gi, ii, k, it }); }));
    const from = Math.max(0, order.findIndex(o => o.gi === rest.gi && o.ii === rest.ii));
    const pick = [...order.slice(from), ...order.slice(0, from)].find(o => !isSetDone(checks, si, o.gi, o.ii, o.k));
    const next = pick ? `${T().next}: ${pick.it.name} · ${T().set} ${pick.k + 1}` : '';
    restHtml = `<div class="rest">
      <div class="rest-row">
        <div class="rest-time"><span>${rem ? T().resting : T().go}</span><b>${rem ? mss(rem) : T().go}</b></div>
        <button class="plus" data-act="rest-add">+30 ${lang === 'uk' ? 'с' : 's'}</button>
        <button class="skip" data-act="rest-skip">${T().skip}</button>
      </div>
      <div class="rest-bar"><div style="width:${(rem / rest.total) * 100}%"></div></div>
      ${next ? `<span class="rest-next">${esc(next)}</span>` : ''}
    </div>`;
  }
  const all = st.total && st.done === st.total;
  dock.innerHTML = `<div class="dock-in">${restHtml}
    <button class="btn${all ? '' : ' inv'}" data-act="finish" data-iso="${iso}" data-si="${si}">${T().finish}</button></div>`;
}

function startRestTimer() {
  clearInterval(restTimer);
  let buzzed = false;
  restTimer = setInterval(() => {
    if (!rest) { clearInterval(restTimer); return; }
    const left = rest.end - Date.now();
    if (left <= 0 && !buzzed) { buzzed = true; try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch { /* not supported */ } }
    if (left < -3000) { rest = null; clearInterval(restTimer); }
    refreshDock();
  }, 250);
}

let dockCtx = null;
function refreshDock() { if (dockCtx) renderDock(dockCtx.iso, dockCtx.s, dockCtx.si); }

async function toggleSet(iso, si, gi, ii, k) {
  const week = await loadWeek('plans', iso);
  const s = week.sections[si];
  const it = s.groups[gi].items[ii];
  const checks = getChecks(iso);
  // Expand an old whole-exercise tick into per-set ticks first.
  const legacy = `${si}-${gi}-${ii}`;
  if (checks[legacy]) { for (let j = 0; j < it.n; j++) checks[ckey(si, gi, ii, j)] = true; delete checks[legacy]; }
  const key = ckey(si, gi, ii, k);
  const nowOn = !checks[key];
  if (nowOn) checks[key] = true; else delete checks[key];
  store(`checks:${iso}`, checks);

  if (nowOn) {
    const starts = store(`start:${iso}`) || {};
    if (!starts[si]) { starts[si] = Date.now(); store(`start:${iso}`, starts); }
    const st = dayStats(s, si, checks);
    if (it.restSec > 0 && st.done < st.total) { rest = { end: Date.now() + it.restSec * 1000, total: it.restSec, iso, gi, ii }; startRestTimer(); }
  }
  const y = window.scrollY;
  await screenWorkout('plans', iso, si);
  window.scrollTo(0, y);
}

async function finishWorkout(iso, si) {
  const week = await loadWeek('plans', iso);
  const s = week.sections[si];
  const checks = getChecks(iso);
  const finished = store(`finished:${iso}`) || {};
  finished[si] = Date.now();
  store(`finished:${iso}`, finished);
  rest = null; clearInterval(restTimer);

  let sets = 0, total = 0, vol = 0;
  s.groups.forEach((g, gi) => g.items.forEach((it, ii) => {
    const c = exDone(checks, si, gi, ii, it);
    sets += c; total += it.n;
    const reps = Number(it.reps);
    if (c && it.wnum && reps && /kg|кг/.test(it.wu)) vol += c * reps * it.wnum;
  }));
  const start = (store(`start:${iso}`) || {})[si];
  const mins = start ? Math.max(1, Math.round((Date.now() - start) / 60000)) : null;
  const backHref = iso === pickCurrentPlan() ? '#/' : `#/w/${iso}`;

  overlay.innerHTML = `<div class="summary">
    <div class="big-check">${ICON.check}</div>
    <div><h2>${T().wellDone}</h2><p>${inline(s.day)} · ${inline(s.focus)}</p></div>
    <div class="tiles">
      <div class="tile"><span class="label">${T().sets}</span><b>${sets}</b><span>/ ${total}</span></div>
      <div class="tile"><span class="label">${T().volume}</span><b>${vol ? Math.round(vol).toLocaleString(lang === 'uk' ? 'uk-UA' : 'en-US') : '—'}</b><span>${T().kg}</span></div>
      <div class="tile"><span class="label">${T().time}</span><b>${mins ?? '—'}</b><span>${T().min}</span></div>
    </div>
    <a class="btn" href="${backHref}" data-act="close-overlay">${T().backToWeek}</a>
  </div>`;
}

// Past weeks: key-lift chart + an expandable list.
async function screenHistory() {
  const list = [...weeks.history].sort().reverse();
  const parsed = {};
  await Promise.all(allWeeks().map(async iso => {
    const folder = weeks.history.includes(iso) ? 'history' : 'plans';
    try { parsed[iso] = { folder, week: await loadWeek(folder, iso) }; } catch { /* skip missing */ }
  }));

  // Key lifts come from the profile's "Key lifts" list.
  let lifts = [];
  try {
    const sec = profileSections(await loadProfile()).find(x => x.kind === 'keylifts');
    if (sec) lifts = noteParts(sec.lines).bullets;
  } catch { /* no profile */ }
  if (liftPick >= lifts.length) liftPick = 0;

  let chart = '';
  if (lifts.length) {
    const name = normApos(lifts[liftPick]);
    const pts = [];
    allWeeks().filter(iso => iso <= (pickCurrentPlan() || iso)).forEach(iso => {
      const p = parsed[iso];
      if (!p) return;
      let val = null;
      p.week.sections.forEach(s => s.type === 'day' && s.groups.forEach(g => g.items.forEach(it => {
        if (val === null && normApos(it.name).startsWith(name) && it.wnum) val = it.wnum;
      })));
      if (val !== null) pts.push({ iso, v: val });
    });
    if (pts.length) chart = chartHtml(lifts, pts);
  }

  const rows = list.map((iso, i) => {
    const p = parsed[iso];
    if (!p) return '';
    const days = p.week.sections.map((s, si) => s.type === 'day' ? { s, si, ...historyDayStats(s) } : null).filter(Boolean);
    const stOf = d => d.done === d.total ? 'on' : d.done ? 'part' : 'miss';
    const fullDays = days.filter(d => d.done === d.total).length;
    const pct = days.length ? Math.round((fullDays / days.length) * 100) : 0;
    const isOpen = openWeek === undefined ? i === 0 : openWeek === iso;
    const notes = p.week.sections.find(s => s.type === 'note');
    const sess = days.map(d => {
      const chip = d.done === d.total ? `<span class="chip ok sm">${T().done}</span>`
        : d.done ? `<span class="chip ok sm">${d.done}/${d.total}</span>` : `<span class="chip warn sm">${T().skipped}</span>`;
      return `<a class="sess${d.done ? '' : ' dim'}" href="#/h/${iso}/${d.si}"><b>${T().days3[d.s.dayIndex]}</b>
        <div class="sess-main"><b>${inline(d.s.focus)}</b><span>${T().exercises(d.total)}</span></div>${chip}</a>`;
    }).join('');
    return `<div class="wk${isOpen ? ' open' : ''}">
      <button class="wk-btn" data-act="week-toggle" data-iso="${iso}">
        <div class="wk-main"><b>${T().week} ${weekNo(iso)}</b>
          <div class="wk-sub"><span>${weekRange(iso)}</span><div class="wk-segs">${days.map(d => `<div class="${stOf(d)}"></div>`).join('')}</div></div></div>
        <div class="wk-pct"><b style="color:${pct === 100 ? 'var(--accText)' : 'var(--text)'}">${pct}%</b><span>${fullDays}/${days.length}</span></div>
        ${ICON.chev}
      </button>
      ${isOpen ? `<div class="wk-body">${notes ? `<div class="wk-notes">${notes.lines.map(l => `<p>${inline(l.replace(/^\s*[-*] /, ''))}</p>`).join('')}</div>` : ''}${sess}</div>` : ''}
    </div>`;
  }).join('');

  app.innerHTML = `<div class="screen">
    <h1 class="title">${T().history}</h1>
    ${chart}
    <span class="label section-label">${T().pastWeeks}</span>
    ${list.length ? `<div class="stack">${rows}</div>` : `<p class="empty">${T().noHistory}</p>`}
  </div>`;
}

function chartHtml(lifts, pts) {
  const vals = pts.map(p => p.v);
  const mn = Math.floor((Math.min(...vals) - 5) / 10) * 10, mx = Math.ceil((Math.max(...vals) + 5) / 10) * 10;
  const span = mx - mn || 10;
  const step = pts.length > 1 ? 276 / (pts.length - 1) : 0;
  const xf = i => pts.length > 1 ? 20 + i * step : 162;
  const yf = v => 14 + (1 - (v - mn) / span) * 110;
  const P = pts.map((p, i) => ({ x: xf(i), y: yf(p.v), last: i === pts.length - 1, lbl: `${T().weekShort}${weekNo(p.iso)}` }));
  const line = P.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = P.length > 1 ? `${line} L${P[P.length - 1].x.toFixed(1)} 124 L${P[0].x.toFixed(1)} 124 Z` : '';
  const grid = [mn, (mn + mx) / 2, mx].map(v => `<line x1="20" x2="304" y1="${yf(v)}" y2="${yf(v)}" stroke="var(--line)" stroke-dasharray="3 4"/><text x="314" y="${yf(v) - 5}" text-anchor="end" font-size="11">${fmt(v)}</text>`).join('');
  const cur = vals[vals.length - 1], diff = cur - vals[0];
  const opts = lifts.map((l, i) => `<button data-act="lift" data-i="${i}" aria-pressed="${i === liftPick}">${inline(l)}</button>`).join('');
  return `<section class="card">
    <span class="label">${T().keyLifts}</span>
    <div class="segctl">${opts}</div>
    <div class="chart-val"><b>${fmt(cur)}<small>${T().kg}</small></b>${diff ? `<span class="delta">${diff > 0 ? '+' : ''}${fmt(diff)} ${T().kg} ${T().since}</span>` : ''}</div>
    <svg class="chart" viewBox="0 0 320 150" width="100%" style="overflow:visible">
      ${grid}
      ${area ? `<path d="${area}" fill="var(--acc)" opacity=".16"/>` : ''}
      ${P.length > 1 ? `<path d="${line}" fill="none" stroke="var(--accText)" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
      ${P.map(p => `<circle cx="${p.x}" cy="${p.y}" r="${p.last ? 7 : 4.5}" fill="${p.last ? 'var(--acc)' : 'var(--s1)'}" stroke="var(--accText)" stroke-width="2.5"/><text x="${p.x}" y="146" text-anchor="middle" font-size="12" font-weight="600">${p.lbl}</text>`).join('')}
    </svg>
  </section>`;
}

// Splits profile.md into sections and recognises the known ones by their heading.
const KINDS = [
  ['goal', ['goal', 'мета']], ['about', ['about', 'про мене']], ['schedule', ['schedule', 'розклад']],
  ['equipment', ['equipment', 'обладнання']], ['rules', ['rules', 'правила']], ['limits', ['limits', 'обмеження']],
  ['keylifts', ['key lifts', 'ключові']],
];
function profileSections(md) {
  const out = [];
  let cur = null;
  for (const l of md.split(/\r?\n/)) {
    if (l.startsWith('# ')) continue;
    if (l.startsWith('## ')) {
      const title = l.slice(3).trim();
      const kind = (KINDS.find(([, words]) => words.some(w => title.toLowerCase().startsWith(w))) || ['other'])[0];
      cur = { title, kind, lines: [] };
      out.push(cur);
      continue;
    }
    if (cur && l.trim()) cur.lines.push(l);
  }
  return out;
}

const keyVal = b => { const m = b.match(/^\*\*(.+?):?\*\*:?\s*(.*)$/); return m ? { k: m[1].replace(/:$/, ''), v: m[2] } : { k: '', v: b }; };

// ---------- saving the profile to GitHub ----------
// The site itself can't change files, so edits go through GitHub's API using a key
// (a fine-grained access token) that the owner pastes into the app once.

const REPO = { owner: 'anastasiiaskorodynska-ralabs', name: 'workouts', branch: 'main' };
const ghToken = () => store('ghToken');
const profilePath = () => lang === 'uk' ? 'profile.uk.md' : 'profile.md';
const profileCache = {}; // path -> { text, sha } read straight from GitHub (always the newest)

function ghFetch(path, opts = {}, token = ghToken()) {
  return fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.name}/contents/${path}`, {
    ...opts, cache: 'no-store',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', ...(opts.headers || {}) },
  });
}
const b64encode = s => { let bin = ''; new TextEncoder().encode(s).forEach(b => { bin += String.fromCharCode(b); }); return btoa(bin); };
const b64decode = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, '')), c => c.charCodeAt(0)));

// When connected, read the profile from GitHub (the website copy can be a minute behind after a save).
async function loadProfile() {
  const path = profilePath();
  if (ghToken()) {
    try {
      if (!profileCache[path]) {
        const r = await ghFetch(path);
        if (r.ok) { const j = await r.json(); profileCache[path] = { text: b64decode(j.content), sha: j.sha }; }
      }
      if (profileCache[path]) return profileCache[path].text;
    } catch { /* fall back to the website copy */ }
  }
  return getLocalized('profile');
}

async function saveProfile(text) {
  const path = profilePath();
  const latestSha = async () => { const r = await ghFetch(path); return r.ok ? (await r.json()).sha : undefined; };
  const put = sha => ghFetch(path, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Profile edited in the app', content: b64encode(text), branch: REPO.branch, ...(sha ? { sha } : {}) }),
  });
  let sha = profileCache[path] ? profileCache[path].sha : await latestSha();
  let r = await put(sha);
  if (r.status === 409 || r.status === 422) r = await put(await latestSha()); // file changed meanwhile: retry on the newest
  if (!r.ok) throw new Error(r.status === 401 || r.status === 403 || r.status === 404 ? 'auth' : `HTTP ${r.status}`);
  profileCache[path] = { text, sha: (await r.json()).content.sha };
  delete fileCache[path];
}

// ---------- profile screen ----------

let profileState = null; // { head, secs } of the profile being shown
let editingIdx = null;   // which section is open for editing

const PENCIL = '<svg class="ic" viewBox="0 0 24 24" style="width:20px;height:20px;stroke-width:2.2"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>';
const clean = s => s.replace(/[\r\n]+/g, ' ').replace(/^#+\s*/, '').trim();

function editRow(type, item = {}) {
  const del = `<button class="ed-del" data-act="ed-del" aria-label="Remove">✕</button>`;
  if (type === 'kv') {
    return `<div class="ed-row"><input data-k value="${esc(item.k || '')}" placeholder="${esc(T().phLabel)}"><input data-v value="${esc(item.v || '')}" placeholder="${esc(T().phValue)}">${del}</div>`;
  }
  if (type === 'day') {
    const names = lang === 'uk' ? DAYS_UK : DAYS;
    const cur = item.k ? matchDay(item.k) : null;
    const opts = names.map((n, i) => `<option value="${esc(n)}" ${cur && cur.index === i ? 'selected' : ''}>${esc(n)}</option>`).join('');
    return `<div class="ed-row"><select data-k>${opts}</select><input data-v value="${esc(item.v || '')}" placeholder="${esc(T().phWorkout)}">${del}</div>`;
  }
  return `<div class="ed-row"><input data-v value="${esc(item.v || '')}" placeholder="${esc(T().phItem)}">${del}</div>`;
}

function editorHtml(sec, i) {
  const { text, bullets } = noteParts(sec.lines);
  const rows = (type, items) => `<div class="ed-rows">${items.map(it => editRow(type, it)).join('')}</div>
    <button class="ed-add" data-act="ed-add" data-type="${type}">+ ${T().add}</button>`;
  let body;
  switch (sec.kind) {
    case 'goal': body = `<textarea data-f="text">${esc(text || bullets.join(', '))}</textarea>`; break;
    case 'about': body = rows('kv', bullets.map(keyVal)); break;
    case 'schedule': body = rows('day', bullets.map(keyVal)) + `<input data-f="text" value="${esc(text)}" placeholder="${esc(T().phNote)}">`; break;
    case 'equipment': case 'rules': case 'limits': case 'keylifts': body = rows('item', bullets.map(v => ({ v }))); break;
    default: body = `<textarea data-f="text" style="min-height:140px">${esc(sec.lines.join('\n'))}</textarea>`;
  }
  return `<section class="card editing" data-sec="${i}">
    <span class="label">${inline(sec.title)}</span>
    ${body}
    <p class="hint">${T().otherLang}</p>
    <div class="ed-actions">
      <button class="btn sec" data-act="ed-cancel">${T().cancel}</button>
      <button class="btn" data-act="ed-save">${T().save}</button>
    </div>
  </section>`;
}

// Reads the edit form back into Markdown lines for that section.
function collectSection(form, sec) {
  const rows = [...form.querySelectorAll('.ed-row')].map(r => ({
    k: clean((r.querySelector('[data-k]') || {}).value || ''),
    v: clean((r.querySelector('[data-v]') || {}).value || ''),
  }));
  const textEl = form.querySelector('[data-f="text"]');
  const text = textEl ? textEl.value.trim() : '';
  switch (sec.kind) {
    case 'goal': return [clean(text)];
    case 'about': return rows.filter(r => r.k || r.v).map(r => `- **${r.k}:** ${r.v}`);
    case 'schedule': {
      const lines = rows.filter(r => r.v).map(r => `- **${r.k}:** ${r.v}`);
      return text ? [...lines, '', clean(text)] : lines;
    }
    case 'equipment': case 'rules': case 'limits': case 'keylifts':
      return rows.filter(r => r.v).map(r => `- ${r.v}`);
    default: return text.split(/\r?\n/).map(l => l.replace(/^#+\s/, ''));
  }
}

const profileToMd = ({ head, secs }) => `# ${head}\n\n${secs.map(s => `## ${s.title}\n${s.lines.join('\n')}`).join('\n\n')}\n`;

async function screenProfile() {
  const md = await loadProfile();
  const secs = profileSections(md);
  const headLine = md.split(/\r?\n/).find(l => l.startsWith('# '));
  profileState = { head: headLine ? headLine.slice(2).trim() : T().profile, secs };
  const canEdit = !!ghToken();
  const card = (title, inner, cls = '', i) => `<section class="card">
    <div class="card-head"><span class="label${cls}">${inline(title)}</span>
    ${canEdit ? `<button class="edit-btn" data-act="ed-open" data-i="${i}" aria-label="${esc(T().edit)}">${PENCIL}</button>` : ''}</div>${inner}</section>`;
  const html = secs.map((sec, i) => {
    if (i === editingIdx) return editorHtml(sec, i);
    const { text, bullets } = noteParts(sec.lines);
    const card_ = (inner, cls = '') => card(sec.title, inner, cls, i);
    switch (sec.kind) {
      case 'goal': return card_(`<span class="goal">${inline(text || bullets.join(', '))}</span>`);
      case 'about': return card_(`<div class="about">${bullets.map(b => {
        const { k, v } = keyVal(b);
        return `<div><span class="label">${inline(k)}</span><b class="${v.length > 6 ? 'txt' : ''}">${inline(v)}</b></div>`;
      }).join('')}</div>`);
      case 'schedule': {
        const on = new Set();
        const lines = bullets.map(b => { const { k, v } = keyVal(b); const d = matchDay(k); if (d) on.add(d.index); return `<div><b>${inline(k)}</b> — ${inline(v)}</div>`; });
        return card_(`<div class="weekdays">${T().days3.map((l, i) => `<div class="${on.has(i) ? 'on' : ''}">${l}</div>`).join('')}</div>
          <div class="sched">${lines.join('')}</div>${text ? `<span class="strong">${inline(text)}</span>` : ''}`);
      }
      case 'equipment':
      case 'keylifts': return card_(`<div class="tags">${bullets.map(b => `<span>${inline(b)}</span>`).join('')}</div>`);
      case 'rules': return card_(`<div class="rows">${bullets.map(b => `<div class="row">${inline(b)}</div>`).join('')}</div>`);
      case 'limits': {
        const none = bullets.length === 1 && /^(no |none|немає|зараз травм)/i.test(bullets[0]);
        return card_(`<div class="rows">${bullets.map(b => `<div class="row ${none ? 'ok' : 'warn'}">${inline(b)}</div>`).join('')}</div>`, none ? '' : ' warn');
      }
      default: return card_(`<div class="md">${text ? `<p>${inline(text)}</p>` : ''}${bullets.length ? `<ul>${bullets.map(b => `<li>${inline(b)}</li>`).join('')}</ul>` : ''}</div>`);
    }
  }).join('');

  const seg = (cur, val, label, act) => `<button data-act="${act}" data-v="${val}" aria-pressed="${cur === val}">${label}</button>`;
  app.innerHTML = `<div class="screen">
    <h1 class="title">${T().profile}</h1>
    <div class="lock">${canEdit ? PENCIL : ICON.lock}<span>${canEdit ? T().editHint : T().editLocked}</span></div>
    ${html}
    <span class="label section-label">${T().settings}</span>
    <section class="card" style="gap:16px">
      <div class="stack" style="gap:8px"><span class="strong">${T().ghTitle}</span>
        ${canEdit
          ? `<div class="row ok">${T().ghConnected}</div><button class="btn sec" data-act="gh-disconnect">${T().ghDisconnect}</button>`
          : `<ol class="steps">${T().ghSteps.map(s => `<li>${s}</li>`).join('')}</ol>
             <p class="hint">${T().ghWarn}</p>
             <input type="password" data-f="token" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(T().ghPlaceholder)}">
             <button class="btn" data-act="gh-connect">${T().ghConnect}</button>`}
      </div>
      <div class="stack" style="gap:8px"><span class="strong">${T().language}</span>
        <div class="segctl">${seg(lang, 'en', 'English', 'lang')}${seg(lang, 'uk', 'Українська', 'lang')}</div></div>
      <div class="stack" style="gap:8px"><span class="strong">${T().theme}</span>
        <div class="segctl">${seg(theme, 'dark', T().dark, 'theme')}${seg(theme, 'light', T().light, 'theme')}</div></div>
    </section>
  </div>`;
}

// ---------- end-of-week summary for Claude ----------

async function summaryText(iso) {
  const week = await loadWeek('plans', iso);
  const checks = getChecks(iso);
  const out = [T().sumTitle(iso)];
  week.sections.forEach((s, si) => {
    if (s.type !== 'day') return;
    const st = dayStats(s, si, checks);
    out.push(`${s.day} (${s.focus}): ${st.done}/${st.total} ${T().setsWord}${st.done ? '' : ` — ${T().sumNotLogged}`}`);
    if (st.done && st.done < st.total) {
      s.groups.forEach((g, gi) => g.items.forEach((it, ii) => {
        const c = exDone(checks, si, gi, ii, it);
        if (c < it.n) out.push(`  - ${it.name}: ${c}/${it.n}`);
      }));
    }
  });
  const notes = (store(`notes:${iso}`) || '').trim();
  if (notes) out.push(`${T().sumNotes}: ${notes}`);
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

// ---------- taps ----------

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'set') {
    const [si, gi, ii, k] = el.dataset.set.split('.').map(Number);
    toggleSet(el.dataset.iso, si, gi, ii, k);
  } else if (act === 'rest-add' && rest) {
    rest.end = Math.max(rest.end, Date.now()) + 30000;
    rest.total = Math.max(rest.total, Math.ceil((rest.end - Date.now()) / 1000));
    refreshDock();
  } else if (act === 'rest-skip') {
    rest = null; clearInterval(restTimer); refreshDock();
  } else if (act === 'finish') {
    finishWorkout(el.dataset.iso, Number(el.dataset.si));
  } else if (act === 'close-overlay') {
    overlay.innerHTML = '';
  } else if (act === 'copy') {
    toast((await copy(await summaryText(el.dataset.iso))) ? T().copied : T().copyFail);
  } else if (act === 'toggle-lang' || act === 'lang') {
    editingIdx = null;
    lang = act === 'lang' ? el.dataset.v : (lang === 'en' ? 'uk' : 'en');
    store('lang', lang); applySettings(); route(true);
  } else if (act === 'theme') {
    theme = el.dataset.v; store('theme', theme); applySettings(); route(true);
  } else if (act === 'week-toggle') {
    const iso = el.dataset.iso;
    const isOpen = el.parentElement.classList.contains('open');
    openWeek = isOpen ? null : iso;
    route(true);
  } else if (act === 'lift') {
    liftPick = Number(el.dataset.i); route(true);
  } else if (act === 'ed-open') {
    editingIdx = Number(el.dataset.i); await route(true);
    const f = app.querySelector('.editing input, .editing textarea, .editing select');
    if (f) f.focus();
  } else if (act === 'ed-cancel') {
    editingIdx = null; route(true);
  } else if (act === 'ed-add') {
    const box = el.closest('.card').querySelector('.ed-rows');
    box.insertAdjacentHTML('beforeend', editRow(el.dataset.type));
    const inputs = box.querySelectorAll('.ed-row:last-child input');
    if (inputs.length) inputs[0].focus();
  } else if (act === 'ed-del') {
    el.closest('.ed-row').remove();
  } else if (act === 'ed-save') {
    const form = el.closest('.card');
    const sec = profileState.secs[Number(form.dataset.sec)];
    const before = sec.lines;
    sec.lines = collectSection(form, sec);
    el.disabled = true; el.textContent = T().saving;
    try {
      await saveProfile(profileToMd(profileState));
      editingIdx = null;
      toast(T().saved);
      route(true);
    } catch (err) {
      sec.lines = before;
      el.disabled = false; el.textContent = T().save;
      toast(err.message === 'auth' ? T().ghBad : T().saveFail);
    }
  } else if (act === 'gh-connect') {
    const input = app.querySelector('[data-f="token"]');
    const token = input.value.trim();
    if (!token) { input.focus(); return; }
    el.disabled = true; el.textContent = T().ghChecking;
    let ok = false;
    try { ok = (await ghFetch('profile.md', {}, token)).ok; } catch { /* offline */ }
    if (ok) { store('ghToken', token); toast(T().ghOk); route(true); }
    else { el.disabled = false; el.textContent = T().ghConnect; toast(T().ghBad); }
  } else if (act === 'gh-disconnect') {
    try { localStorage.removeItem('ghToken'); } catch { /* ignore */ }
    Object.keys(profileCache).forEach(k => delete profileCache[k]);
    editingIdx = null; route(true);
  }
});

document.addEventListener('input', e => {
  const iso = e.target.dataset && e.target.dataset.notes;
  if (iso) store(`notes:${iso}`, e.target.value);
});

// ---------- router ----------

async function route(keepScroll = false) {
  const hash = location.hash.replace(/^#/, '') || '/';
  const y = window.scrollY;
  if (hash !== '/profile') editingIdx = null;
  const tab = /^\/(history|h\/)/.test(hash) ? 'history' : hash.startsWith('/profile') ? 'profile' : 'week';
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
  overlay.innerHTML = '';
  dock.innerHTML = '';
  dockCtx = null;
  let m;
  try {
    if ((m = hash.match(/^\/w\/(\d{4}-\d{2}-\d{2})\/(\d+)$/))) {
      document.body.classList.add('workout');
      await screenWorkout('plans', m[1], Number(m[2]));
      const week = await loadWeek('plans', m[1]);
      dockCtx = { iso: m[1], s: week.sections[Number(m[2])], si: Number(m[2]) };
      if (rest && rest.iso === m[1]) startRestTimer();
    } else if ((m = hash.match(/^\/h\/(\d{4}-\d{2}-\d{2})\/(\d+)$/))) {
      document.body.classList.add('workout');
      await screenWorkout('history', m[1], Number(m[2]));
    } else {
      document.body.classList.remove('workout');
      if ((m = hash.match(/^\/w\/(\d{4}-\d{2}-\d{2})$/))) await screenWeek(m[1]);
      else if (hash === '/history') await screenHistory();
      else if (hash === '/profile') await screenProfile();
      else await screenWeek(pickCurrentPlan());
    }
  } catch (err) {
    document.body.classList.remove('workout');
    app.innerHTML = `<div class="screen"><p class="empty">${T().error}<br><small>${esc(err.message)}</small></p></div>`;
  }
  window.scrollTo(0, keepScroll ? y : 0);
}

(async function start() {
  applySettings();
  try { weeks = JSON.parse(await getText('weeks.json')); } catch { /* keep empty lists */ }
  window.addEventListener('hashchange', () => route());
  route();
})();
