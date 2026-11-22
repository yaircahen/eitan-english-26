/* Leitner engine (prd.md §6.1). Pure logic, no DOM: loads in the browser and in Node tests.
   Days are local ISO dates ("2026-11-16"), so string comparison orders them. */
(function (root) {
  'use strict';

  const TRICKY_AFTER = 4;      // misses before a word becomes "tricky"
  const MAX_TURNS_PER_WORD = 9; // fast-track turns for one word in one sitting
  const BATCH = 4;             // new words introduced together

  function newCard() {
    return {
      level: 1, seen: false,
      streak: 0, streakDrills: [], streakDay: null,
      l3Day: null, l4Day: null, lastPromoDay: null,
      misses: 0, tricky: false,
    };
  }

  /* One answer on one card. Mutates the card and returns what happened.
     retry = the end-of-sitting repeat of a missed word: it never moves a box. */
  function answer(card, { drill, correct, today, retry }) {
    const from = card.level;
    let becameTricky = false;
    card.seen = true;

    if (!correct) {
      card.misses += 1;
      if (card.misses >= TRICKY_AFTER && !card.tricky) { card.tricky = true; becameTricky = true; }
      card.streak = 0;
      card.streakDrills = [];
      if (!retry) {
        if (card.level === 2) card.level = 1;
        else if (card.level === 4) { card.level = 3; card.l3Day = today; }
        else if (card.level === 5) { card.level = 4; card.l4Day = today; }
        // level 3 stays: never below 3 once reached
      }
    } else if (!retry) {
      if (card.level < 3) {
        // fast track: the streak only counts inside one sitting (one day)
        if (card.streakDay !== today) { card.streak = 0; card.streakDrills = []; }
        card.streakDay = today;
        card.streak += 1;
        if (!card.streakDrills.includes(drill)) card.streakDrills.push(drill);
        if (card.level === 1) card.level = 2;
        else if (card.streak >= 3 && card.streakDrills.length >= 2) {
          card.level = 3; card.l3Day = today; card.lastPromoDay = today;
        }
      } else if (card.level === 3 && today > card.l3Day) {
        card.level = 4; card.l4Day = today; card.lastPromoDay = today;
      } else if (card.level === 4 && today > card.l4Day) {
        card.level = 5; card.lastPromoDay = today;
      }
    }
    return { from, to: card.level, correct, becameTricky };
  }

  function shuffle(list, rng) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function canWhistle(word, speech) {
    return !!(speech && word.blend && !word.silent);
  }
  /* The second face of a new word: by ear if it has a blend that is heard, by its missing blend if not,
     and from the word bank when it has no blend at all. */
  function secondFace(word, speech) {
    return canWhistle(word, speech) ? 'whistle' : word.blend ? 'missing' : 'bank';
  }
  /* A squad word's turn: one of the faces the test asks for (read and translate, pick from the bank, hear or
     fill the blend). Full spelling is not one of them: it lives in the shoot-out, for points only. */
  function squadFace(word, speech, rng) {
    const faces = ['recognise', 'bank'];
    if (word.blend) faces.push('missing');
    if (canWhistle(word, speech)) faces.push('whistle');
    return faces[Math.floor(rng() * faces.length)];
  }
  const SET_SIZE = 6; // sentences in the day's Sentence fill
  const KICKS = 5;    // shoot-out kicks on a day with no new words
  const LATE_REVIEW = 20; // with new words and more than this many due, the new words go first and the review follows half-time
  // The shoot-out keyboard has letters only: "ice cream" and "don't like" are never typed whole.
  const kickable = (w) => /^[a-z]+$/.test(w.en);

  /* Seen words worth a turn today, highest level first, shuffled inside a level. */
  function dueWords(words, cards, today, rng) {
    const due = words.filter((w) => {
      const c = cards[w.id];
      if (!c || !c.seen) return false;
      if (c.level === 5) return rng() < 0.25;          // spot check
      if (c.level === 4) return today > c.l4Day;       // the lock
      if (c.level === 3) return today > c.l3Day;
      return true;
    });
    const out = [];
    for (let lv = 5; lv >= 1; lv--) {
      out.push(...shuffle(due.filter((w) => cards[w.id].level === lv), rng));
    }
    return out;
  }

  /* The colour sort: three shelves, two foods on each, only foods already met. `want` are foods that must be on it
     (the training ground brings back the ones that went to the wrong shelf). */
  function sortItem(kit, cards, rng, want = []) {
    const met = (id) => cards[id] && cards[id].seen;
    const colOf = (id) => Object.keys(kit.sort).find((c) => kit.sort[c].includes(id));
    const must = [...new Set(want.map(colOf).filter(Boolean))];
    const rest = shuffle(Object.keys(kit.sort).filter((c) => !must.includes(c) && kit.sort[c].filter(met).length >= 2), rng);
    const shelves = must.filter((c) => kit.sort[c].filter(met).length >= 2).concat(rest).slice(0, 3);
    if (shelves.length < 3) return null;
    const foods = shelves.flatMap((c) => {
      const pool = kit.sort[c].filter(met);
      const first = pool.filter((id) => want.includes(id));
      return first.concat(shuffle(pool.filter((id) => !first.includes(id)), rng)).slice(0, 2).map((id) => ({ id, col: c }));
    });
    return { type: 'sort', cols: shelves, foods: shuffle(foods, rng) };
  }

  const KIT_COLOURS = 6; // colour questions a day, out of the ten

  /* The Kit room: colour words (read the word and pick the shirt, or the other way round), the colour sort
     (three shelves, two foods each, only foods already met), and where the ball is. All sets: no box moves. */
  function kitItems(kit, cards, intro, rng) {
    const out = [];
    const set = (x) => Object.assign(x, { set: true, phase: 'second' });
    if (intro) out.push({ type: 'kitintro' });
    shuffle(kit.colours, rng).slice(0, KIT_COLOURS).forEach((c, i) => out.push(set({ type: 'colour', colour: c.en, rev: i % 2 === 1 })));
    const srt = sortItem(kit, cards, rng);
    if (srt) out.push(set(srt));
    if (intro) out.push({ type: 'whereintro' });
    for (const p of shuffle(kit.preps, rng)) out.push(set({ type: 'where', prep: p.en }));
    return out;
  }

  /* The day's queue: warm-up, first half (new words), half-time, second half, shoot-out.
     Items marked `set` (Sentence fill, the shoot-out) never move a box. */
  function buildSession({ words, foils = [], cards, today, dayNum, speech, kit = null, kitIntro = false, report = null, dinner = null, letters = null, mock = null, name = false, testDay = null, rng = Math.random }) {
    // A tricky word (prd.md §6.1) shows its card, the picture and its line, before its first turn of the day.
    const warmTurn = (w) => {
      const c = cards[w.id];
      const t = { type: c.level >= 3 ? squadFace(w, speech, rng) : 'recognise', wordId: w.id, phase: 'warmup' };
      return c.tricky ? [{ type: 'intro', wordId: w.id, phase: 'warmup', tricky: true }, t] : [t];
    };
    // Test day (prd.md §10): a short warm-up. A few words, the craftiest first; no sets, no kicks.
    if (testDay && dayNum >= testDay.day) {
      const seen = shuffle(words.filter((w) => cards[w.id] && cards[w.id].seen), rng)
        .sort((a, b) => (cards[b.id].tricky - cards[a.id].tricky) || (cards[b.id].misses - cards[a.id].misses));
      return seen.slice(0, testDay.words).flatMap(warmTurn);
    }
    // From the first mock day on, the test-shaped sets live in the mock: the match is the review and the kicks.
    if (mock && dayNum >= mock.from) { kit = null; report = null; dinner = null; letters = null; name = false; }
    const warm = dueWords(words, cards, today, rng).flatMap(warmTurn);
    const warmWords = warm.filter((x) => x.type !== 'intro').map((x) => words.find((w) => w.id === x.wordId));

    const fresh = words.filter((w) => !(cards[w.id] && cards[w.id].seen) && w.day <= dayNum);
    // Sentence fill (a test-shaped set, never moves a box): words already in the squad, in a sentence.
    const noSets = !!(mock && dayNum >= mock.from);
    const sentences = noSets ? [] : shuffle(words.filter((w) => w.sent && cards[w.id] && cards[w.id].seen && cards[w.id].level >= 3), rng)
      .slice(0, SET_SIZE).map((w) => ({ type: 'sentence', wordId: w.id, set: true, phase: 'second' }));
    const room = kit && dayNum >= kit.from ? kitItems(kit, cards, kitIntro, rng) : [];
    const set = (x) => Object.assign(x, { set: true, phase: 'second' });
    // his name, typed as on the top of the test paper
    if (name) room.push(set({ type: 'name' }));
    // Kit numbers: the day's letters, half from the capital and half from the small one
    if (letters && dayNum >= letters.from) {
      const k = dayNum - letters.from;
      const todays = k < letters.sets.length ? [...letters.sets[k]] : shuffle([...letters.sets.join('')], rng).slice(0, letters.mixed);
      shuffle(todays, rng).forEach((l, i) => room.push(set({ type: 'letter', letter: l, rev: i % 2 === 1 })));
    }
    // Team dinner: three dishes, one thing each of them needs and three things it does not
    if (dinner && dayNum >= dinner.from) {
      for (const d of shuffle(dinner.dishes, rng).slice(0, 3)) {
        room.push(set({ type: 'dinner', dish: d.dish, a: shuffle(d.need, rng)[0], wrong: shuffle(d.not, rng).slice(0, 3) }));
      }
    }
    // the Match report: one text a day, in turn. A set, like the Kit room.
    if (report && dayNum >= report.from) {
      room.push({ type: 'report', passage: (dayNum - report.from) % report.passages.length, set: true, phase: 'second' });
    }
    if (!fresh.length) {
      if (!warm.length) return [];
      const kickers = shuffle(warmWords.filter(kickable), rng).slice(0, KICKS);
      return warm.concat(room, sentences, kickers.length ? [{ type: 'shootout' }] : [],
        kickers.map((w) => ({ type: 'spell', wordId: w.id, set: true, phase: 'shootout' })));
    }
    // A long review would push the new words too late in the evening: they go first, and the review follows half-time.
    const late = warmWords.length > LATE_REVIEW;
    const q = late ? [] : warm.slice();

    // sh words by ear only are needed while no sh word is on the pitch; after that the whistle has both sides
    const mixed = words.some((w) => w.blend === 'sh' && w.day <= dayNum);
    const foilPool = speech && !mixed ? shuffle(foils, rng) : [];
    for (let i = 0; i < fresh.length; i += BATCH) {
      const batch = fresh.slice(i, i + BATCH);
      for (const w of batch) q.push({ type: 'intro', wordId: w.id, phase: 'first' });
      for (const w of shuffle(batch, rng)) q.push({ type: 'recognise', wordId: w.id, phase: 'first' });
      const second = batch.map((w) => ({
        type: secondFace(w, speech), wordId: w.id, phase: 'first',
      }));
      // They carry no card.
      for (const f of foilPool.splice(0, Math.round(batch.length / 2))) {
        second.push({ type: 'whistle', foil: f, phase: 'first' });
      }
      q.push(...shuffle(second, rng));
    }

    q.push({ type: 'halftime' });
    if (!late) q.push(...room, ...sentences);
    for (const w of shuffle(fresh, rng)) q.push({ type: w.blend ? 'missing' : 'bank', wordId: w.id, phase: 'second' });
    if (late) q.push(...warm, ...room, ...sentences);
    // every match ends with typed kicks: when the new entries cannot be typed (phrases), squad words step up
    const kickers = shuffle(fresh.filter(kickable), rng);
    if (kickers.length < KICKS) {
      const squad = shuffle(warmWords.filter(kickable), rng);
      kickers.push(...squad.slice(0, KICKS - kickers.length));
    }
    if (kickers.length) q.push({ type: 'shootout' });
    for (const w of kickers) q.push({ type: 'spell', wordId: w.id, set: true, phase: 'shootout' });
    return q;
  }

  function nextDrill(card, word, lastType, speech) {
    if (card.level === 1) return 'recognise';
    const cands = ['missing', 'whistle', 'bank', 'recognise'].filter((d) => (
      d === 'whistle' ? canWhistle(word, speech) : d === 'missing' ? !!word.blend : true));
    return cands.find((d) => d !== lastType && !card.streakDrills.includes(d))
      || cands.find((d) => d !== lastType)
      || cands[0];
  }

  /* After an answer: keep a fast-track word coming until it is in the squad,
     and bring a missed squad word back once at the very end (no box change). */
  function followUps(queue, pos, item, card, res, { words, speech }) {
    if (!item.wordId || item.retry || item.set || item.type === 'intro') return;
    const id = item.wordId;
    if (card.level < 3) {
      if (item.phase === 'shootout') return;
      let lim = queue.findIndex((x, k) => k > pos && x.type === 'shootout');
      if (lim < 0) lim = queue.length;
      const pending = queue.slice(pos + 1, lim).some((x) => x.wordId === id && x.type !== 'intro');
      const turns = queue.filter((x) => x.wordId === id && x.type !== 'intro').length;
      if (!pending && turns < MAX_TURNS_PER_WORD) {
        const word = words.find((w) => w.id === id);
        queue.splice(lim, 0, { type: nextDrill(card, word, item.type, speech), wordId: id, phase: 'extra' });
      }
    } else if (!res.correct && res.from >= 3) {
      queue.push({ type: item.type, wordId: id, retry: true, phase: 'retry' });
    }
  }

  /* ---------- the mock match: the test's eight exercises in the test's order, plus the name and extra time ----------
     Every item is a set: a mock never moves a box. `part` names the exercise, for the coach's report. */
  const MOCK_PARTS = ['name', 'whistle', 'bank', 'sort', 'missing', 'dinner', 'letter', 'sentence', 'report', 'extra'];
  const typable = (w) => /^[a-z]+$/.test(w.en);

  /* Exercise 5: three dishes and a bank of three words. A word is never an ingredient of another dish on the board,
     and words that clearly do not go in the other dishes come first, so the bank works by elimination, as on paper. */
  function dinnerBoard(dishes, cards, rng) {
    const met = (id) => cards[id] && cards[id].seen;
    for (let tries = 0; tries < 200; tries++) {
      const ds = shuffle(dishes, rng).slice(0, 3);
      const rows = [];
      for (const d of ds) {
        const others = ds.filter((x) => x !== d);
        const ok = shuffle(d.need, rng)
          .filter((id) => met(id) && others.every((o) => !o.need.includes(id)) && !rows.some((r) => r.a === id))
          .sort((a, b) => others.filter((o) => o.not.includes(b)).length - others.filter((o) => o.not.includes(a)).length);
        if (!ok.length) break;
        rows.push({ dish: d.dish, a: ok[0] });
      }
      if (rows.length === 3) return { type: 'dinnerboard', rows, bank: shuffle(rows.map((r) => r.a), rng) };
    }
    return null;
  }

  /* Exercise 6: half of the alphabet in a table, capitals above and small letters below, with gaps in both rows.
     A column keeps at least one of its two letters, as on the practice page. */
  function abcBoard(half, rng, blanks = 9) {
    const letters = [...'abcdefghijklmnopqrstuvwxyz'].slice(half * 13, half * 13 + 13);
    const cols = shuffle(letters.map((_, i) => i), rng).slice(0, blanks).sort((a, b) => a - b);
    return { type: 'abc', half, letters, blanks: cols.map((i) => ({ i, row: rng() < 0.5 ? 'cap' : 'small' })) };
  }

  /* Exercise 7: four sentence starts and four words, one word from each of four groups. */
  function matchBoard(words, cards, groups, rng) {
    const ok = (id) => { const w = words.find((x) => x.id === id); return w && w.sent && cards[id] && cards[id].seen; };
    const gs = shuffle(groups, rng).slice(0, 4);
    const ids = gs.map((g) => shuffle(g.filter(ok), rng)[0]).filter(Boolean);
    return ids.length === 4 ? { type: 'matchboard', ids: shuffle(ids, rng), words: shuffle(ids, rng) } : null;
  }

  function buildMock({ words, cards, dayNum, speech, kit, dinner, letters, report, shape = {}, rng = Math.random }) {
    const met = words.filter((w) => cards[w.id] && cards[w.id].seen && !w.phrase);
    const isMet = (id) => cards[id] && cards[id].seen;
    const take = (list, n) => shuffle(list, rng).slice(0, n);
    const parts = {};
    parts.name = [{ type: 'name' }];
    // 1. five words by ear, the blend written
    const heard = met.filter((w) => w.blend && !w.silent);
    const ch = take(heard.filter((w) => w.blend === 'ch'), 3), sh = take(heard.filter((w) => w.blend === 'sh'), 3);
    const byEar = shuffle(ch.concat(sh), rng).slice(0, 5);
    parts.whistle = byEar.map((w) => (speech ? { type: 'whistle', wordId: w.id, write: true } : { type: 'missing', wordId: w.id }));
    // 2. five pictures, a bank of five, the word written under each
    const pics = (shape.pictures || met.map((w) => w.id)).filter((id) => isMet(id) && typable(words.find((w) => w.id === id)));
    parts.bank = pics.length >= 5 ? [{ type: 'bankboard', ids: take(pics, 5) }] : take(met, 5).map((w) => ({ type: 'bank', wordId: w.id }));
    // 3. six foods to three colour columns
    const srt = sortItem(kit, cards, rng);
    parts.sort = srt ? [srt] : [];
    // 4. a picture and the word with a gap: the blend written. Picture only, as on paper
    const clear = met.filter((w) => w.blend && (!shape.picBlend || shape.picBlend.includes(w.id)) && !byEar.includes(w));
    parts.missing = take(clear, 4).map((w) => ({ type: 'missing', wordId: w.id, picOnly: true }));
    // 5. three dishes, a bank of three
    const db = dinnerBoard(dinner.dishes, cards, rng);
    parts.dinner = db ? [db] : [];
    // 6. the alphabet table, both halves
    parts.letter = [abcBoard(0, rng), abcBoard(1, rng)];
    // 7. four sentence starts to four words
    const mb = shape.matchGroups ? matchBoard(words, cards, shape.matchGroups, rng) : null;
    parts.sentence = mb ? [mb] : take(met.filter((w) => w.sent), 4).map((w) => ({ type: 'sentence', wordId: w.id }));
    // 8. a story with yes/no and words written from it (the older short texts when there are no stories)
    const k = Math.max(0, dayNum - (shape.storyFrom || 1));
    parts.report = shape.stories && shape.stories.length
      ? [{ type: 'story', story: k % shape.stories.length }]
      : [{ type: 'report', passage: Math.max(0, dayNum - report.from) % report.passages.length }];
    const cols = take(kit.colours, 2), preps = take(kit.preps, 2);
    parts.extra = [{ type: 'colour', colour: cols[0].en, rev: false }, { type: 'where', prep: preps[0].en },
      { type: 'colour', colour: cols[1].en, rev: true }, { type: 'where', prep: preps[1].en }];
    const q = [];
    MOCK_PARTS.forEach((part) => {
      const items = parts[part];
      if (!items.length) return;
      q.push({ type: 'mockpart', part, n: items.length, phase: 'mock' });
      for (const x of items) q.push(Object.assign(x, { set: true, phase: 'mock', part }));
    });
    return q;
  }

  /* One entry per answer: t = the drill, p = the mock part, k = what was asked (a word id, a letter, a colour,
     a dish...), ok. Grouped by drill or by part: right, total, and what was missed. */
  function summarise(log, by = 't') {
    const out = {};
    for (const e of log || []) {
      const g = e[by];
      if (!g) continue;
      const o = out[g] || (out[g] = { right: 0, total: 0, missed: [] });
      o.total++;
      if (e.ok) o.right++;
      else if (e.k != null && !o.missed.includes(e.k)) o.missed.push(e.k);
    }
    return out;
  }

  /* ---------- the training ground: the craftiest opponents get another round ----------
     Words are ranked by their misses (cards) and by the misses on test-shaped sets (history: summaries of past
     matches and mocks). Nothing here moves a box: the app plays every item as a set. */
  const WORD_DRILLS = ['recognise', 'bank', 'whistle', 'missing', 'sentence', 'bankboard', 'matchboard'];
  const SET_OF = { abc: 'letter', dinnerboard: 'dinner' }; // the test-paper boards count with their simple drill
  function trickyPool({ words, cards, history = [] }) {
    const score = {};
    const add = (k, n) => { score[k] = (score[k] || 0) + n; };
    for (const w of words) {
      const c = cards[w.id];
      if (c && c.seen && c.misses) add(w.id, c.misses + (c.tricky ? 3 : 0));
    }
    const sets = { letter: {}, colour: {}, where: {}, dinner: {}, sort: {}, name: {} };
    for (const h of history) {
      for (const [t, o] of Object.entries(h || {})) {
        for (const k of o.missed || []) {
          if (WORD_DRILLS.includes(t)) add(k, 2);
          else if (sets[SET_OF[t] || t]) { const g = sets[SET_OF[t] || t]; g[k] = (g[k] || 0) + 1; }
        }
      }
    }
    const rank = (o) => Object.keys(o).sort((a, b) => o[b] - o[a]);
    const known = new Set(words.filter((w) => cards[w.id] && cards[w.id].seen).map((w) => w.id));
    return {
      words: rank(score).filter((id) => known.has(id)),
      letters: rank(sets.letter), colours: rank(sets.colour), preps: rank(sets.where),
      dishes: rank(sets.dinner), foods: rank(sets.sort), name: !!Object.keys(sets.name).length,
    };
  }

  const TRAIN_WORDS = 5;
  const TRAIN_SETS = 8;
  function buildTraining({ words, cards, history = [], speech, kit, dinner, rng = Math.random }) {
    const pool = trickyPool({ words, cards, history });
    const W = Object.fromEntries(words.map((w) => [w.id, w]));
    // the top of the list, shuffled, so two rounds in a row are not the same round
    let ids = shuffle(pool.words.slice(0, TRAIN_WORDS + 3), rng).slice(0, TRAIN_WORDS);
    if (ids.length < 3) { // nothing crafty yet: the newest climbers step in
      const seen = words.filter((w) => cards[w.id] && cards[w.id].seen && !ids.includes(w.id));
      const low = shuffle(seen, rng).sort((a, b) => cards[a.id].level - cards[b.id].level);
      ids = ids.concat(low.slice(0, TRAIN_WORDS - ids.length).map((w) => w.id));
    }
    const faces = (w) => {
      const f = ['recognise', 'bank'];
      if (!w.phrase && w.blend) f.push('missing');
      if (!w.phrase && canWhistle(w, speech)) f.push('whistle');
      if (w.sent) f.push('sentence');
      return shuffle(f, rng).slice(0, 2);
    };
    const t = (x) => Object.assign(x, { set: true, phase: 'train' });
    const q = [];
    const later = [];
    for (const id of ids) {
      const [a, b] = faces(W[id]);
      q.push({ type: 'intro', wordId: id, phase: 'train' }, t({ type: a, wordId: id }));
      if (b) later.push(t({ type: b, wordId: id }));
    }
    const sets = [];
    pool.letters.slice(0, 4).forEach((l, i) => sets.push(t({ type: 'letter', letter: l, rev: i % 2 === 1 })));
    pool.colours.slice(0, 2).forEach((c, i) => sets.push(t({ type: 'colour', colour: c, rev: i % 2 === 0 })));
    pool.preps.slice(0, 2).forEach((p) => sets.push(t({ type: 'where', prep: p })));
    for (const dish of pool.dishes.slice(0, 2)) {
      const d = dinner.dishes.find((x) => x.dish === dish);
      if (d) sets.push(t({ type: 'dinner', dish: d.dish, a: shuffle(d.need, rng)[0], wrong: shuffle(d.not, rng).slice(0, 3) }));
    }
    if (pool.foods.length) { const srt = sortItem(kit, cards, rng, pool.foods.slice(0, 3)); if (srt) sets.push(t(srt)); }
    if (pool.name) sets.push(t({ type: 'name' }));
    return q.concat(shuffle(later.concat(sets.slice(0, TRAIN_SETS)), rng));
  }

  const Engine = { buildMock, dinnerBoard, abcBoard, matchBoard, MOCK_PARTS, summarise, trickyPool, buildTraining, sortItem, newCard, answer, dueWords, buildSession, followUps, nextDrill, canWhistle, secondFace, squadFace, shuffle };
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
  else root.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
