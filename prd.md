# Eitan's English game: PRD v1

**Status:** draft for the owner's review, 16 Nov 2026 (day 1). Companion files: `leitner-system-reference.md`, `actionable-gamification-reference.md`, `CLAUDE.md`.

**One line:** a Barcelona career game for Eitan (9). Every word is an opponent to beat, every drill is one of the test's exercises, and the last match is the test itself. Nine days, one iPad, Hebrew UI, English words.

---

## 1. Summary

- **Learner:** Eitan, grade 4, reads Hebrew comfortably, very competitive, loves football, plays on an iPad. Responds strongly to points, tables, packs and collections.
- **Test:** Wednesday 25 Nov 2026. School's English test for grade 4, Unit 1: the `ch` and `sh` blends, Food and Drinks, the ABC letter pairs, spelling his own name in English, plus prior knowledge (in / on / under / near, colours in writing). See §4.
- **Target:** every word at the top Leitner level by **Monday 23 Nov** (day 8). Tuesday is a free buffer, Wednesday is the test.
- **Engine:** Leitner boxes, session-based, with an in-session fast track on the first three levels and a day-gated lock on the last two (§6).
- **Wrapper:** an Octalysis game, a Barcelona career from the academy to the Clásico (§7).
- **Parent:** in the background. The game runs alone; a parent-only screen (PIN) shows the day's report and sets the training-ground cap (§8).
- **Deploy:** manual and last, GitHub Pages from `main`, personal account.

## 2. Goals and success metrics

| Metric | Target | When |
|---|---|---|
| Words at top level (5), of ~61 words + ~10 phrases | ≥ 95% (all, if the buffer day is used) | Mon 23 Nov |
| Letter pairs Aa–Zz (26) and his name at top level | 100% | Mon 23 Nov |
| Colours and prepositions at top level | 100% | Mon 23 Nov |
| Mock match ("the Clásico") score on the test-shaped screen | ≥ 90% | Tue 24 Nov |
| Sessions played | 1 per day, every day, never skipped | 16–24 Nov |
| Session length | 15–20 min; up to 25–30 min on days 2–4 | |

**Business metric (Octalysis box 1):** the test score.

## 3. The learner

- Reads Hebrew; reads simple English. Types on the iPad's on-screen keyboard.
- Competitive and drawn to cheap, effective gamification (points, tables, packs, collections). The design uses that on purpose.
- Football: Barcelona. He knows the squad. He will choose his favourite from it.
- The test is on **paper**. The game must make him produce spellings (type them), not only recognise them.
- Sessions: some alone, some with a parent in the background, a few minutes with a parent present at most. Nothing in the daily loop may require a parent.

## 4. Scope: the test material

Source: the teacher's parent letters (1, 2 and 16 Nov), including her own description of the test. Word lists are used as given. The practice worksheet's text is **not** reproduced: its shape is described and the reading passage is original.

### 4.1 The test (from the teacher's letter)

Eight exercises:

| # | Exercise | Game drill |
|---|---|---|
| 1 | Hear a word, write the blend (`sh` / `ch`). E.g. she says *brush*, he writes `sh` | **Whistle** |
| 2 | Match a sentence or picture to a word from a word bank; write it next to the picture | **Word bank** |
| 3 | Sort foods into colour columns (yellow / brown / red on the sample). Two foods per column | **Kit room** (colour sort) |
| 4 | Complete the missing blend under a picture, e.g. `fi__ __` | **Missing letters** |
| 5 | "I want to make a pizza. I need ___" (an ingredient from the word bank) | **Team dinner** |
| 6 | Complete the ABC letter pairs (capital + small) | **Kit numbers** |
| 7 | Match a sentence start to the missing word (e.g. *I eat in the… kitchen*) | **Sentence fill** |
| 8 | A short text with yes/no questions and one-word sentence completions | **Match report** |

Also required: spelling the name in English (E-I-T-A-N), reading and translating the words to Hebrew, recognising the blend when it is missing, knowing *in / on / under / near*, knowing the colour words in writing.

Not confirmed: whether the real test has audio (exercise 1 is read aloud by the teacher), which colours appear in exercise 3 beyond yellow / brown / red, and the exact passage length. Ask the owner.

### 4.2 Vocabulary (61 words)

Hebrew as in the teacher's letter. Words in both lists are counted once.

**`ch` (11):** chicken תרנגולת/עוף · chips צ'יפס · chocolate שוקולד · sandwich כריך · cheese גבינה · chair כיסא · teacher מורה · children ילדים · kitchen מטבח · spinach תרד · school בית ספר (exception: the `ch` is silent, a special card).

**`sh` (12):** milkshake מילקשייק · share לחלוק/לשתף · shop לקנות/חנות · short קצר/נמוך · wash לשטוף/לרחוץ · fish דג/ים · shopping קניות · brush מברשת · sheep כבשה · shirt חולצה · shorts מכנסיים קצרים · shoes נעליים.

**Food and Drinks, new beyond the above (38):** food מאכלים · drinks משקאות · apples תפוחים · bananas בננות · lemon לימון · oranges תפוזים · bread לחם · eggs ביצים · pizza פיצה · salad סלט · meat בשר · hamburger המבורגר · jam ריבה · cookie עוגיה · cake עוגה · ice cream גלידה · water מים · milk חלב · juice מיץ · coffee קפה · tea תה · carrots גזרים · fruit פירות · onions בצלים · peppers פלפלים · tomatoes עגבניות · vegetables ירקות · restaurant מסעדה · table שולחן · eat לאכול · drink לשתות · want לרצות · like לאהוב · don't like לא לאהוב · make להכין · hungry רעב · need צריך · shopping list רשימת קניות.

### 4.3 Phrases (as cards)

I like… · I don't like… · I want… · I need… · I'm hungry · Do you like…? · Yes, I do / No, I don't · What do you want to eat / drink? · I want to eat / drink…

### 4.4 Small sets

- **Prepositions:** in, on, under, near.
- **Colours** (written): red, blue, green, yellow, orange, brown, black, white, purple, grey (owner, 19 Nov).
- **Letter pairs Aa–Zz:** 26 pairs, in sets of about six.
- **His name:** Eitan.

### 4.5 Foods for the colour sort

Only the clear cases go in the sort pool: red: tomatoes, apples · yellow: bananas, lemon, cheese, chips · brown: chocolate, bread, cookie · orange: oranges, carrots · green: spinach, salad · white: milk, eggs. Blue, black, purple and grey have no food in the list: they are practised as colour words only (built 19 Nov). Peppers, coffee, jam and the rest are left out as unclear.

### 4.6 The reading passage

Original text of about 8–10 short sentences, using only test words, with 3 yes/no items and 3 one-word completions. Written at build time and reviewed by the owner. Not derived from the worksheet.

## 5. Constraints and assumptions

1. **Time:** day 1 is Mon 16 Nov, the day the build starts. The plan has about one day of slack. Two lost days are not recoverable.
2. **Device:** iPad, Safari, added to the home screen. Offline after the first load. Progress is on the iPad only, so the parent screen includes an export.
3. **Audio:** `speechSynthesis`, English voice, started by a tap. No recorded or copyrighted audio. If the voice is missing the game shows the word and says so to the parent screen only.
4. **Pictures:** emoji only. No images of the club or of people.
5. **Copyright and trademarks:** no crest, no photos. Club and player names as text. Teacher's material is not copied beyond the word lists.
6. **Session:** one scheduled session per day carries streak, boxes and packs. The training ground carries none of them (§7.7).

## 6. Learning design

### 6.1 Leitner engine

Session-based, not calendar-based. Five levels:

| Level | Name in the game | How a word gets here |
|---|---|---|
| 1 | New | First seen |
| 2 | Warming up | One correct answer in a row |
| 3 | In the squad | **3 correct answers in a row**, across at least 2 different drills, in one sitting |
| 4 | Starter | A correct answer on a **later day** than the day it reached level 3 |
| 5 | Legend (mastered) | A correct answer on a **later day** than the day it reached level 4 |

- **Fast track (levels 1–3):** a word can climb from 1 to 3 inside a single sitting. A miss resets the streak, not the level above 3.
- **The lock (levels 4–5):** one promotion per word per calendar day, always on a different day than the previous promotion. The days do not need to be consecutive, so one skipped night does not undo the chain.
- **Demotion:** a miss drops the word one level, never below 3 once it reached 3. Failed words reappear at the end of the same sitting with no box change on the retry.
- **Level 5 words** are spot-checked: about one in four appears in each sitting, and a miss drops it to level 4.
- **Review order:** highest due level first, down to level 1, shuffled within a level.
- **Leech rule:** four misses on a word makes it a "tricky" word, which gets a picture cue, a Hebrew memory line, and a mention on the parent screen.
- **Strict marking:** spellings are exact. A wrong letter is shown in place so a miss teaches.
- **Spelling is for the shoot-out only (decided 17 Nov).** The test asks the children to read, translate, pick a word from a bank and fill in a missing blend, never to write a whole word from memory. So levels climb only on those faces. Full spelling is the penalty shoot-out at the end of every match: points and combo, no box move.
- **A long review waits (built 19 Nov).** On a day with new words and more than 20 words due, the new words open the match and the review follows half-time. Entries that are not one plain word (*ice cream*, *don't like*, *shopping list*) are read and picked, never typed whole in the shoot-out.
- **New-word schedule (target):** day 1 about 10, days 2 and 3 about 20 each, day 4 about 10, none after day 4. A simulation of these rules (about 12 s per interaction, 85% accuracy on fresh items, 75–85% later) gives 91–97% mastery by Mon 23 Nov for this schedule. The build verifies the model against the real engine.

### 6.2 Card types

Each word is one card with several faces. The drill chosen depends on its level.

| Face | Question | Used at |
|---|---|---|
| Recognise | Hear or see the English word → pick the Hebrew (or picture) | levels 1–2 |
| Translate | Hebrew → pick the English word | levels 2–3 |
| Spell | Hebrew or picture → **type** the word on the keyboard | shoot-out only, never moves a box |
| Blend | Word with the blend missing → pick or type `sh` / `ch` | any |
| Whistle | Hear the word → which blend? | any, `ch` / `sh` words only |
| Sentence | A sentence with the word blanked → pick | level 3 and up |

### 6.3 Test-shaped sets

Not Leitner cards, but queue items: **Kit room** (colour sort), **Team dinner** (ingredients), **Kit numbers** (letter pairs, which are also cards per pair), **Sentence fill**, **Match report**, and the **Name** card (Eitan on the jersey, typed). They enter the day's queue once the words they use are at level 2 or more.

## 7. Game design (Octalysis)

### 7.1 Narrative, theme and voice (CD1, CD4)

- **Frame:** a Barcelona career. Stages: the academy trial, the youth side, the first team, the Champions League night, the **Clásico** (the last mock match against Real Madrid). The test is the final.
- **Skin:** blue and garnet stripes, a stadium backdrop drawn in CSS, a bold sports font. No crest.
- **The words** are the opposition: they hide, they shout, they are nervous, they bluff. Eitan is the striker who comes for them. Humor targets the words and the rival team's names, never him.
- **Kid-facing copy rule (carried over from Gilad's game):** no mention of his level or of any weakness. Nothing about being slow, stuck, improving or "soon you'll be able to". Even a before/after frame judges the "before".
- **Sample voice (Hebrew in the app, glossed here):** "The word *chicken* is hiding behind the chair. Catch it!" · "Goal! The word fell." · "Half-time. A pack is waiting."

### 7.2 Autonomy (CD3)

The team is fixed, so the choices are elsewhere:

- **His idol:** he picks one player from the current Barcelona first team. The idol is his captain: on his screen and in celebrations, and slightly more likely in his packs.
- **His position:** striker (spelling and penalties), midfielder (matching and sorting) or goalkeeper (listening and blends). It sets the drill flavour of his session, and he can switch it daily.
- **His jersey:** the shirt number, and his name typed in English (the name-spelling practice).
- **His order:** the drills of the day, within the day's required set.
- **His goal:** a daily target for the optional training ground.
- **His starting eleven:** he builds it from the cards he collects.

### 7.3 Core-drive mapping

| Drive | Where | Guardrail |
|---|---|---|
| CD1 Epic meaning | A career, the Clásico, the final | No pressure language |
| CD2 Accomplishment | Points, combo, level of each word, stages, the table | A word's level is shown as a card climbing, never as a grade |
| CD3 Creativity and feedback | Idol, position, number, drill order, starting XI | |
| CD4 Ownership | His jersey, his card album, his XI | |
| CD5 Social | Brag card for the parent to send; the league table against clubs | Never compared to Gilad or to classmates |
| CD6 Scarcity | One pack at half-time and one at full-time, never more per day | |
| CD7 Unpredictability | Pack contents, a random golden-ball bonus inside a session | |
| CD8 Loss | A word that slips drops one level and slides back; a rest day is allowed | No lives, no hearts, no streak wipe |

### 7.4 Session loop

The daily session is **15–20 minutes** and carries the streak, the box moves and the packs. Heavy days (2–4) run up to 25–30 minutes, split in two halves with the half-time pack between them.

1. **Open (30 s):** the career screen: stage, table, streak, today's match. One glowing button.
2. **Warm-up (about 3 min):** due words, highest level first.
3. **First half:** new words of the day (day 1–4) via fast-track drills, plus the day's test-shaped set.
4. **Half-time:** a pack opens (§7.5). The heavy days stop here and he can go on or return later the same day.
5. **Second half:** mixed drills across his position's flavour and one other.
6. **Full time:** a short penalty shoot-out of the day's words. Score, combo and the table update.
7. **Close:** numbers count up, the stage flag rises, the second pack opens, the brag card is ready.

### 7.5 Rewards (Chou's six types)

- **Points and a combo meter.** Streaks of correct answers raise a multiplier that resets quietly.
- **The pack:** player cards in rarity tiers (common, silver, gold). Duplicates become points. Current players only, names as text.
- **The collection:** a card album and a starting eleven.
- **The table:** a league of fictional clubs plus Real Madrid as the rival of the Clásico. His points are what move it.
- **Sounds and motion:** all generated in the browser. No asset files.
- **Surprise:** a golden ball may appear mid-session for a bonus. It shows up on a schedule he cannot predict, and it never takes anything away.

### 7.6 Feedback mechanics

Every answer returns a reaction in under 300 ms: a sound, a card animation, the combo count. A miss shows the right spelling with the wrong letter marked, and the card slides one level down.

### 7.7 The daily session is capped; the training ground is not

- **The training ground** is free play: any drill on any word, with a tally of "training minutes" and nothing else. It **never moves a box**, grants a pack or changes the streak.
- **The cap** is set by a parent (§8): minutes or rounds, default 15 minutes a day. When the cap is reached the game ends on a high note ("training over, back tomorrow") and never as a punishment.

## 8. The parent

The parent is in the background. A parent-only screen behind a 4-digit PIN (the game is on his iPad, so the PIN is simple) shows:

- Today's report: time played, words promoted and dropped, words at top level so far, a short list of tricky words in plain terms. **Never shown to Eitan.**
- The training-ground cap.
- Export and import of the save as text, so progress survives a new address.
- The streak freeze and a "reset today" button.

Same as Gilad's game: a screenshot-ready **brag card** at the end of each session, showing the day, words at top level and the streak, for the parent to send to relatives.

## 9. Product

### 9.1 Platform

- Static PWA: `index.html`, `styles.css`, `content.js`, `app.js`, `manifest.webmanifest`, icons. No build step, no backend, no analytics, no accounts.
- iPad Safari, home-screen app, offline after first load.
- State in `localStorage`; versioned save; export / import (§8).
- Own icon and name, clearly different from Gilad's, since the two games may live on the same iPad.

### 9.2 Screens

Career map · session player · drill screens (one per face and per set) · pack opening · card album and starting XI · training ground · jersey and idol setup (first run) · parent screen · brag card.

### 9.3 Data model (minimal)

`profile` (name, number, idol, position) · `cards[wordId]` (level, level-3 day, level-4 day, last promotion day, misses, tricky) · `session` (today, queue, current) · `streak` · `album` (cards owned, XI) · `table` · `settings` (PIN, cap, freezes) · `log` (per day: minutes, promoted, dropped).

### 9.4 Non-goals

No accounts, no sibling features, no real-time multiplayer, no recorded audio, no images, no analytics. Nothing is published until the owner decides.

## 10. Schedule

Day 1 is Monday 16 Nov. Words introduced per day follow §6.1.

| Day | Date | New content | Notes |
|---|---|---|---|
| 1 | Mon 16 | the 11 `ch` words, jersey, idol, letters 1 | ~10 min, light first night |
| 2 | Tue 17 | the 12 `sh` words, 8 food words, letters 2 | up to 25 min |
| 3 | Wed 18 | 12 food words (lemon, tomatoes, cookie, oranges, juice, salad, meat, hamburger, jam, carrots, tea, coffee), colours, prepositions, letters 3 | up to 30 min. Split decided 17 Nov: 31 reviews are already due, so fewer new words |
| 4 | Thu 19 | the remaining 18 food words (incl. verbs, ice cream, shopping list), letters 4–5 | up to 25 min. New words in the first half, review in the second |
| 5 | Fri 20 | the ten phrases (moved from day 4 by the owner, 19 Nov), the Kit room opens (colours, colour sort, in / on / under / near), review and the reading passage | |
| 6 | Sat 21 | none, review | short |
| 7 | Sun 22 | none, review, the first test-shaped mock | |
| 8 | Mon 23 | none. **Target day: every word at level 5** | second mock |
| 9 | Tue 24 | none. Buffer and the **Clásico** mock | |
| 10 | Wed 25 | test day: a 5-minute optional warm-up | |

## 11. Open questions

1. ~~Is there audio in the real test?~~ Answered by the teacher's letter of 16 Nov: she says the word aloud and the children write the blend.
2. ~~Which colours appear in exercise 3?~~ Answered by the owner, 19 Nov: red, blue, green, yellow, orange, brown, black, white, purple, grey. Which foods map to each is still to settle when the Kit room is built.
3. The current Barcelona first-team list. To be taken from a public source at build time and confirmed by the owner. Not guessed.
4. ~~Which fictional clubs for the table?~~ Decided 17 Nov: a football word every child knows (Maccabi, Hapoel, Beitar, Inter, United, City, FC) plus a test word, and Real Madrid. The list is in `content.js`.
5. ~~Parent PIN.~~ Decided 17 Nov: as in Gilad's game, chosen on the first open of the coach screen.
6. Does the owner want the passage reviewed before it goes in?

## 12. Risks

| Risk | Mitigation |
|---|---|
| Day 1 slips because the build takes the evening | Milestone 1 is the smallest playable game (§13); the schedule has about a day of slack |
| iPad speech is missing or unnatural | Test on the real iPad; the parent screen shows when the voice is missing; the text stays on screen |
| Tapping instead of writing on a paper test | The Missing-letters drill types the blend; every match ends with a typed shoot-out |
| The 25–30 minute heavy days feel long | Two halves, a half-time pack, the golden ball, the combo meter |
| Streak anxiety | Rest days, a free freeze, no wipe |
| Real names or club marks cause a problem | Names as text only; no crest, no photos; the owner decides what to publish |
| Two games on one iPad get mixed up | Different icon, name and colours; separate origin |

## 13. Build plan

Order each milestone test-facing first.

| M | By | Contents |
|---|---|---|
| **M1** | Mon 16, tonight | Engine (levels, fast track, lock, save). `ch` words. Recognise, Whistle, Spell and Missing-letters drills. Jersey with his name, idol pick, speech. Combo and sounds. Career screen. Day 1's content. |
| **M2** | Tue 17 | `sh` words and the first food words. Word bank, Sentence fill. Packs, album, the table. Parent screen with PIN, cap and export. Day-2 content. |
| **M3** | Wed 18 | Remaining food words, phrases, colours, prepositions, letter pairs. Kit room, Team dinner, Kit numbers. Training ground. Day-3 content. |
| **M4** | Thu 19 | Match report with the original passage. Starting XI. Golden ball. Day-4 content, brag card. |
| **M5** | Fri 20 – Sat 21 | Test-shaped mock and the Clásico. Polish, a full pass on the iPad, the simulation checked against the engine. |

Deployment is manual, by the owner, and last.
