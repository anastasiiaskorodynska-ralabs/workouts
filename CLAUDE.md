# Workout site — instructions for Claude

This is a personal workout website. The owner has **no coding experience**: explain every step in plain, simple language, do all the technical work yourself, and avoid jargon. Talk to the owner in English.

## Two languages: English + Ukrainian

The site has a language switch (the EN/UA button on This week, and Language in Profile). Every content file exists twice: the English file (`name.md`) and the Ukrainian file next to it (`name.uk.md`).
- **Whenever you create or change a plan, history file or the profile, update both versions.**
- The two versions must have **exactly the same structure**: same days, same `###` rounds, same exercises in the same order, same numbers. Checkbox ticks are stored by position, so a mismatch would put ticks on the wrong exercise.
- The English file is the main one: Claude reads it for planning. The Ukrainian file is a translation of it.
- Ukrainian style: informal "ти" form, like a trainer talking ("Тримаєш гирю…"). Day headings: `## Вівторок — Низ`, `## Четвер — Верх`, `## Субота — Функціональні кола`; rounds `### Коло 1 — …`; notes sections `## Що змінилося і чому` (plans) and `## Нотатки` (history). Use `кг`, `с`, and `,` as the decimal mark (12,5 кг).
- If the owner pastes a summary in Ukrainian, use it the same way as an English one.

## Start of every session: get the latest files

The owner can **edit the profile from the app** (Profile → ✎ on a section). Those edits are saved straight to GitHub with a commit "Profile edited in the app", so GitHub can be newer than this folder. **Before reading or changing anything, run `git pull`.**

After pulling, if `profile.md` or `profile.uk.md` changed in the app (check `git log -3 -- profile.md profile.uk.md`), the app only updated the language the owner was using. Translate that change into the other language file, keeping the same structure, then publish. Briefly tell the owner what you synced.

How app editing works: the owner made a GitHub fine-grained access token (only the `workouts` repository, Contents: read and write) and pasted it into the app. It's stored only in the phone's browser. Never ask the owner to share it in chat. If they need a new one (it expires after 1 year), point them to Profile → App settings → "Edit from the app", where the steps are shown. The repository owner/name for saving is set in `REPO` in `app.js`.

## How the project works

| File / folder | What it is |
|---|---|
| `profile.md` (+ `profile.uk.md`) | Goals, schedule, equipment, rules, limits. Read it before every plan. |
| `plans/YYYY-MM-DD.md` (+ `.uk.md`) | Upcoming week's plan. The date is that week's **Monday**. |
| `history/YYYY-MM-DD.md` (+ `.uk.md`) | A finished week, same format, with each exercise marked done `[x]` or skipped `[ ]`. |
| `weeks.json` | List of the dates in `plans/` and `history/`. **The website only shows weeks listed here**, so always keep it up to date. |
| `index.html`, `style.css`, `app.js` | The website. It reads the Markdown files above; there's no build step. |
| `.claude/serve.ps1` | Small local web server for previewing (`preview_start` with the name `workout-site`). |

| `design/` | The Claude Design files the site's look is based on (dark gym look, lime accent). Not uploaded (`.gitignore`). |

The website's screens: **This week** (sessions counter, a card per workout day, the next workout in lime, "Coach's note", end-of-week notes box) → tap a day for the **workout screen** (one big checkbox per set; ticking a set starts the rest timer; "Finish workout" shows a summary) · **History** (key-lift chart + past weeks) · **Profile** (read-only profile + Language and Dark/Light theme switches).

Ticks are saved only in the phone's browser; Claude can't see them. The **"Copy summary for Claude"** button copies sets done per day (and which exercises were incomplete) plus the owner's notes, to paste into the chat.

## Week file format (the website depends on it, so keep it exact)

```markdown
# Week of 2026-09-28

## What changed and why
One short paragraph in plain words explaining this week's changes (shown as the "Coach's note").

- Bulgarian split squat 12 → 14 kg
- Push-ups 12 → 14

## Tuesday — Lower body

1. Romanian deadlift
   - sets: 3 × 12
   - weight: 45 kg
   - rest: 120 s
   Optional how-to or detail line (shown in an info box).

## Saturday — Functional circuits

### Round 1 — Base + power
Do the 3 exercises back to back, rest 60–75 s, then repeat. 3 rounds in total.

1. Goblet squat + press
   - sets: 3 × 12
   - weight: 12 kg kettlebell
   - rest: none
```

Rules:
- A `## ` heading that starts with a weekday name is a workout day: `## <Day> — <Focus>`. The first other `## ` section in a plan is the Coach's note: paragraph = the text, bullets = short change tags (keep each tag to a few words).
- Exercises are numbered `1.`, `2.`, …, with the name only. Under each one, indented 3 spaces, come three field lines, then optional description lines:
  - `- sets: <number of sets> × <reps>`. The number of sets = the number of checkboxes. Reps can be `12`, `12+12`, `max`, `35 s`, `10/20`. Keep reps short.
  - `- weight: <number> <unit and words>`. Always start with the number (e.g. `45 kg`, `35 → 30 kg`, `5–8 kg plate or dumbbell`, `12 kg kettlebell`), or write words only (`bodyweight`, `plate`, `ball`).
  - `- rest: <seconds> s` (or `none`). This starts the rest timer when a set is ticked. In Saturday circuits use `none` for the first exercises of a round and the round's rest on the last one.
  - Ukrainian files use the keys `підходи:`, `вага:`, `відпочинок:` (and `немає` for none).
- `### ` headings are rounds inside a day. A plain line right under one is its note.
- In `history/` files, every exercise starts with `[x]` (done) or `[ ]` (skipped), e.g. `1. [x] Romanian deadlift`.
- **Key lifts:** the History chart follows the exercises listed under `## Key lifts` in `profile.md` (`## Ключові вправи` in `profile.uk.md`), matched by the start of the exercise name. If an exercise is renamed, update that list too.
- `profile.md` sections are recognised by heading: Goal, About me (`- **Label:** value`), Schedule (`- **Tuesday:** Lower body` + one plain line), Equipment, Rules for my plans, Limits, Key lifts.

## The training pattern (always keep it)

- **Tuesday:** lower body (glutes, hamstrings, quads). Strength moves first, finisher last.
- **Thursday:** upper body: back (pull-ups, pulldowns, rows), then chest/push-ups, then shoulders.
- **Saturday:** functional circuits, 3 rounds × 3 exercises, each round repeated 3 times, with a how-to description for each exercise.
- About 1 hour per workout: roughly 6 exercises on Tuesday, 9–10 on Thursday, 9 on Saturday.
- **Every workout ends with an abs exercise.**
- **No** treadmill, elliptical, bike or any cardio machine. **No** warm-up section.
- Check `profile.md` for limits or injuries and respect them.

## When the owner says "plan next week"

1. Read `profile.md`, the **latest 2–4 files in `history/`** (including the `## Notes` section) and the newest file in `plans/`.
2. Work out the next Monday's date (the week after the newest plan or history week) and create `plans/<that-date>.md`.
3. Keep the same structure and mostly the same exercises, and apply **progressive overload** gradually:
   - Change **one thing per exercise**: either a little more weight **or** a few more reps (or less rest on Saturday). Never both at once.
   - Weight steps: about +2.5 kg on dumbbell/cable moves, +2.5–5 kg on barbell moves and leg press. Use weights that exist in a gym (dumbbells in 1–2 kg steps, plates of 1.25/2.5/5/10 kg per side).
   - Rep ranges: build up to the top of the range (for example 10 → 12 → 15), then raise the weight and drop back to the lower reps.
   - Don't progress every exercise every week. About half is plenty; the rest stays the same so the body can adjust.
   - If the notes say something was too hard, was skipped, or hurt, keep it the same or make it easier.
   - About every 4–6 weeks, swap 1–2 exercises per day for a similar alternative to keep things fresh, and plan an easier (deload) week with ~10–20% lower weights.
4. Start the file with `## What changed and why`: one short paragraph, then one short bullet tag per change.
5. Write the Ukrainian version `plans/<that-date>.uk.md` with the identical structure (see "Two languages").
6. Add the date to `"plans"` in `weeks.json`.
7. Publish the update to the website (see "Publishing" below) and tell the owner in simple words what changed.

## When the owner says "finish the week" (often pasting the summary from the site)

1. Move the plan from `plans/<date>.md` to `history/<date>.md`, and the same for `plans/<date>.uk.md` → `history/<date>.uk.md`. Apply steps 2–3 to both versions (Ukrainian notes heading: `## Нотатки`).
2. Mark each exercise `[x]` if it was done, `[ ]` if not (use the pasted summary; if there's none, ask). If only some sets were done, mark `[x]` and change the `sets:` line to what was actually done.
3. Replace `## What changed and why` with `## Notes` containing the owner's feedback (what felt easy or hard, changed weights). If they used different weights than planned, update the numbers in the history file.
4. Move the date from `"plans"` to `"history"` in `weeks.json`.
5. Publish, then offer to "plan next week".

## Publishing to the website (GitHub Pages)

The site is hosted on GitHub Pages from this folder's git repository (branch `main`):
- Repository: https://github.com/anastasiiaskorodynska-ralabs/workouts
- Website: https://anastasiiaskorodynska-ralabs.github.io/workouts/

After any change (in PowerShell; the two env vars let the GitHub sign-in window appear if needed):

```
git add -A
git commit -m "Short description of the change"
$env:GIT_TERMINAL_PROMPT = '1'; $env:GCM_INTERACTIVE = 'always'; git pull --rebase; git push
```

**Whenever you change `style.css` or `app.js`, raise the `?v=` number on both in `index.html`** (e.g. `?v=4` → `?v=5`). Otherwise phones keep old cached copies and show a broken mix of old and new (this happened once: missing tab labels and language button).

The phone shows the new version about 1 minute later (pull down to refresh). If the push fails because of login, ask the owner to run `gh auth login` in the terminal and walk them through it step by step.

## Previewing locally

Use `preview_start` with the name `workout-site` (runs `.claude/serve.ps1` on port 8080), and check it at phone size (375 px wide).
