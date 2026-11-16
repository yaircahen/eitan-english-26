# Eitan's English game: project notes for Claude

A game for one child (Eitan, grade 4, age 9) to prepare for his English test on **Wednesday 25 Nov 2026** (Unit 1 "Legendary", the `ch` / `sh` blends, and Food and Drinks). Static PWA: vanilla JS, no build step, no backend. State is in `localStorage`. The UI copy is Hebrew; English words, names and the player cards are English. He plays on an iPad.

This is a sibling of Gilad's game (`yaircahen/english-practice-nov26`). Same family of rules, much smaller scope. Do not copy Gilad's `app.js`; it is 200 KB of tracks this test does not have. Borrow patterns from it, not files.

## Read first
- `prd.md` is the source of truth. Build from it.
- Before any design or study-plan work, read `actionable-gamification-reference.md` (Octalysis) and `leitner-system-reference.md` (Leitner). Do not re-derive the frameworks.

## Rules that matter
- **Kid-facing copy never mentions his level or any weakness.** App strings, and anything a parent reads aloud. Nothing about getting stuck, being slow, improving, or "soon you'll be able to". The words are the opponents: they hide, they are nervous, he is coming for them. Humor targets the words (and rivals), never him.
- **No streak-loss punishment.** A missed day is a rest day. No lives, no hearts, no shaming. Demotion is one level, shown as a word sliding back, never "you failed".
- **Visuals come from the Barcelona skin (prd.md §9).** Blue-and-garnet stripes. No crest, no photos, no player likenesses: names as text only. Avoid the generic look of cream cards and pill buttons.
- **The test is the teacher's list, not the practice copy's text.** No copyrighted material in the repo. The word lists come from the teacher's parent letters (facts). The reading passage is written by us, original. Do not quote the teacher's worksheet. Describe its shape.
- **No head-to-head with Gilad.** No shared leaderboard, no comparison. Separate origin, separate save, a different icon.
- **Nothing in free play moves a box.** The training ground never promotes or demotes a word.
- **Deployment is manual and last.** The owner publishes from a personal account (GitHub Pages, `main`, root). Work on branches and open PRs only when asked. Do not merge or publish on your own.

## Running and testing
- Preview: `python3 -m http.server 8765 --bind 127.0.0.1`, then open `http://localhost:8765/`.
- Engine tests: `node --test tests/engine.test.js`. Play-through (needs the preview server): `node tests/e2e.js`.
- `?day=2026-11-17` opens the game as if it were that day; `?reset` wipes the save.
- **Stale-cache trap:** `index.html` stamps the JS and CSS with `?v=`. After an edit, bump the stamp or Safari may serve old files.
- Speech uses `speechSynthesis` and needs a tap first on iOS. Stub it in tests.
- Progress is tied to the page's origin. A new address means a fresh save.
