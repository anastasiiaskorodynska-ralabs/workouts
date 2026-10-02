# Workout site — instructions for Claude

This is a personal workout website. The owner has **no coding experience**: explain every step in plain, simple language, do all the technical work yourself, and avoid jargon. Everything (site, plans, notes) is in **English**.

## How the project works

| File / folder | What it is |
|---|---|
| `profile.md` | Goals, schedule, equipment, rules, limits. Read it before every plan. |
| `plans/YYYY-MM-DD.md` | Upcoming week's plan. The date is that week's **Monday**. |
| `history/YYYY-MM-DD.md` | A finished week, same format, with each exercise marked done `[x]` or skipped `[ ]`. |
| `weeks.json` | List of the dates in `plans/` and `history/`. **The website only shows weeks listed here**, so always keep it up to date. |
| `index.html`, `style.css`, `app.js` | The website. It reads the Markdown files above; there's no build step. |
| `.claude/serve.ps1` | Small local web server for previewing (`preview_start` with the name `workout-site`). |

The website's main page shows the plan for the current week (or the next one if there isn't one for this week). Checkbox ticks are saved only in the phone's browser; Claude can't see them. The page has a **"Copy summary for Claude"** button that copies what was done plus the owner's notes, to paste into the chat.

## Week file format (the website depends on it, so keep it exact)

```markdown
# Week of 2026-09-28

## What changed and why
- Short bullet points (plans only; history files use "## Notes" instead)

## Tuesday — Lower body

1. Exercise name — weight · sets × reps
2. Another exercise — 12 kg × 12, then bodyweight × 12 · 3 sets

## Saturday — Functional circuits

### Round 1 — Base + power
Rest 60–75 s, repeat the round 3 times.

1. Goblet squat + press — 12 kg kettlebell · 12 reps
   Optional how-to description, indented 3 spaces, directly under the exercise.
```

Rules:
- A `## ` heading that starts with a weekday name is a workout day: `## <Day> — <Focus>`. Any other `## ` heading is shown as a note card.
- Exercises are numbered `1.`, `2.`, … Name and dose are separated by ` — ` (an em dash with spaces). Use `×` for sets × reps and `·` before the sets.
- `### ` headings are rounds/groups inside a day. A plain line right under one becomes its note (rest time, rounds).
- In `history/` files, every exercise starts with `[x]` (done) or `[ ]` (skipped).

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
4. Start the file with `## What changed and why`: 2–5 short bullets explaining the changes in plain words.
5. Add the date to `"plans"` in `weeks.json`.
6. Publish the update to the website (see "Publishing" below) and tell the owner in simple words what changed.

## When the owner says "finish the week" (often pasting the summary from the site)

1. Move the plan from `plans/<date>.md` to `history/<date>.md`.
2. Mark each exercise `[x]` if it was done, `[ ]` if not (use the pasted summary; if there's none, ask).
3. Replace `## What changed and why` with `## Notes` containing the owner's feedback (what felt easy or hard, changed weights). If they used different weights than planned, update the numbers in the history file.
4. Move the date from `"plans"` to `"history"` in `weeks.json`.
5. Publish, then offer to "plan next week".

## Publishing to the website (GitHub Pages)

The site is hosted on GitHub Pages from this folder's git repository (branch `main`). After any change:

```
git add -A
git commit -m "Short description of the change"
git push
```

The phone shows the new version about 1 minute later (pull down to refresh). If the push fails because of login, ask the owner to run `gh auth login` in the terminal and walk them through it step by step.

## Previewing locally

Use `preview_start` with the name `workout-site` (runs `.claude/serve.ps1` on port 8080), and check it at phone size (375 px wide).
