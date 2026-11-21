// Run: node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const E = require('../engine.js');

const D1 = '2026-11-16', D2 = '2026-11-17', D3 = '2026-11-18';
const hit = (c, drill, today, retry) => E.answer(c, { drill, correct: true, today, retry });
const miss = (c, drill, today, retry) => E.answer(c, { drill, correct: false, today, retry });

test('fast track: 1 to 3 in one sitting needs 3 in a row across 2 drills', () => {
  const c = E.newCard();
  hit(c, 'recognise', D1); assert.equal(c.level, 2);
  hit(c, 'recognise', D1); assert.equal(c.level, 2);
  hit(c, 'recognise', D1); assert.equal(c.level, 2, 'one drill only is not enough');
  hit(c, 'missing', D1); assert.equal(c.level, 3);
  assert.equal(c.l3Day, D1);
});

test('a miss on the fast track resets the streak', () => {
  const c = E.newCard();
  hit(c, 'recognise', D1); hit(c, 'whistle', D1);
  miss(c, 'missing', D1); assert.equal(c.level, 1); assert.equal(c.streak, 0);
  hit(c, 'recognise', D1); hit(c, 'whistle', D1); assert.equal(c.level, 2);
  hit(c, 'missing', D1); assert.equal(c.level, 3);
});

test('the fast-track streak does not carry over to another day', () => {
  const c = E.newCard();
  hit(c, 'recognise', D1); hit(c, 'whistle', D1);
  hit(c, 'missing', D2); assert.equal(c.level, 2);
  hit(c, 'recognise', D2); hit(c, 'missing', D2); assert.equal(c.level, 3);
});

test('the lock: levels 4 and 5 each need a later day', () => {
  const c = E.newCard();
  hit(c, 'recognise', D1); hit(c, 'whistle', D1); hit(c, 'missing', D1);
  hit(c, 'spell', D1); assert.equal(c.level, 3, 'same day: locked');
  hit(c, 'spell', D2); assert.equal(c.level, 4);
  hit(c, 'spell', D2); assert.equal(c.level, 4, 'one promotion a day');
  hit(c, 'spell', '2026-11-20'); assert.equal(c.level, 5, 'days need not be consecutive');
});

test('demotion is one level, never below 3, and re-locks the day', () => {
  const c = Object.assign(E.newCard(), { seen: true, level: 5, l3Day: D1, l4Day: D2 });
  miss(c, 'spell', D3); assert.equal(c.level, 4);
  hit(c, 'spell', D3); assert.equal(c.level, 4, 'no way back up the same day');
  miss(c, 'spell', D3); assert.equal(c.level, 3);
  miss(c, 'spell', D3); assert.equal(c.level, 3);
});

test('a retry never moves a box; four misses make a tricky word', () => {
  const c = Object.assign(E.newCard(), { seen: true, level: 4, l3Day: D1, l4Day: D1 });
  hit(c, 'spell', D2, true); assert.equal(c.level, 4);
  miss(c, 'spell', D2, true); assert.equal(c.level, 4);
  miss(c, 'spell', D2, true); miss(c, 'spell', D2, true);
  assert.equal(c.tricky, false);
  const r = miss(c, 'spell', D2, true);
  assert.equal(r.becameTricky, true); assert.equal(c.tricky, true);
});

const words = ['chicken', 'chips', 'chair', 'cheese', 'kitchen'].map((id) => ({ id, en: id, blend: 'ch', day: 1 }))
  .concat([{ id: 'school', en: 'school', blend: 'ch', silent: true, day: 1 }, { id: 'sheep', en: 'sheep', blend: 'sh', day: 2 }]);
const cardsFor = () => Object.fromEntries(words.map((w) => [w.id, E.newCard()]));

test('day 1 queue: only day-1 words, the silent word is never whistled, spelling comes last', () => {
  const q = E.buildSession({ words, foils: ['shop', 'fish', 'wash'], cards: cardsFor(), today: D1, dayNum: 1, speech: true });
  assert.ok(!q.some((x) => x.wordId === 'sheep'));
  assert.ok(!q.some((x) => x.type === 'whistle' && x.wordId === 'school'));
  assert.equal(q.filter((x) => x.type === 'intro').length, 6);
  assert.ok(q.some((x) => x.type === 'whistle' && x.foil));
  const so = q.findIndex((x) => x.type === 'shootout');
  assert.ok(q.slice(so + 1).every((x) => x.type === 'spell'));
  assert.ok(q.findIndex((x) => x.type === 'halftime') < so);
  for (const w of words.filter((x) => x.day === 1)) { // every word is introduced before it is asked
    assert.ok(q.findIndex((x) => x.type === 'intro' && x.wordId === w.id) < q.findIndex((x) => x.type !== 'intro' && x.wordId === w.id));
  }
});

test('without speech there is no whistle at all', () => {
  const q = E.buildSession({ words, foils: ['shop'], cards: cardsFor(), today: D1, dayNum: 1, speech: false });
  assert.ok(!q.some((x) => x.type === 'whistle'));
});

// play a whole sitting; answers(item) decides right or wrong
function sit(cards, today, dayNum, answers, speech = true) {
  const q = E.buildSession({ words, foils: ['shop', 'fish', 'wash'], cards, today, dayNum, speech });
  let asked = 0;
  for (let pos = 0; pos < q.length; pos++) {
    const item = q[pos];
    if (item.type === 'intro') { cards[item.wordId].seen = true; continue; }
    if (!item.wordId || item.set) continue; // sets and the shoot-out never move a box
    const res = E.answer(cards[item.wordId], { drill: item.type, correct: answers(item, asked++), today, retry: !!item.retry });
    E.followUps(q, pos, item, cards[item.wordId], res, { words, speech });
    assert.ok(q.length < 400, 'the queue must end');
  }
  return q;
}

test('a clean day 1 puts every day-1 word in the squad, with or without speech', () => {
  for (const speech of [true, false]) {
    const cards = cardsFor();
    sit(cards, D1, 1, () => true, speech);
    for (const w of words.filter((x) => x.day === 1)) assert.equal(cards[w.id].level, 3, w.id);
    assert.equal(cards.sheep.seen, false);
  }
});

test('misses bring words back, the sitting still ends, and nothing drops below 3', () => {
  const cards = cardsFor();
  const q = sit(cards, D1, 1, (item, n) => n % 3 !== 0);
  assert.ok(q.some((x) => x.phase === 'extra'));
  assert.ok(Object.values(cards).every((c) => c.level <= 3));
  const all = cardsFor();
  sit(all, D1, 1, () => false);
  assert.ok(Object.values(all).filter((c) => c.seen).every((c) => c.level === 1));
});

test('three clean days take a word to the top; a miss in the squad is retried once', () => {
  const cards = cardsFor();
  sit(cards, D1, 1, () => true);
  const q2 = sit(cards, D2, 1, (item) => !(item.wordId === 'chips' && !item.retry));
  assert.equal(cards.chicken.level, 4);
  assert.equal(cards.chips.level, 3);
  assert.equal(q2.filter((x) => x.retry && x.wordId === 'chips').length, 1);
  sit(cards, D3, 1, () => true);
  assert.equal(cards.chicken.level, 5);
  assert.equal(cards.chips.level, 4);
});

test('due order is highest level first; locked words wait for a later day', () => {
  const cards = cardsFor();
  Object.assign(cards.chicken, { seen: true, level: 3, l3Day: D1 });
  Object.assign(cards.chips, { seen: true, level: 4, l3Day: D1, l4Day: D1 });
  Object.assign(cards.chair, { seen: true, level: 3, l3Day: D2 });
  Object.assign(cards.cheese, { seen: true, level: 2 });
  const ids = E.dueWords(words, cards, D2, Math.random).map((w) => w.id);
  assert.deepEqual(ids, ['chips', 'chicken', 'cheese']);
});

test('day 2: no foils once sh words are on the pitch; a word with no blend goes to the word bank', () => {
  const ws = words.concat([{ id: 'pizza', en: 'pizza', day: 2 }]);
  const cards = Object.fromEntries(ws.map((w) => [w.id, E.newCard()]));
  const q = E.buildSession({ words: ws, foils: ['shop'], cards, today: D2, dayNum: 2, speech: true });
  assert.ok(!q.some((x) => x.foil));
  assert.ok(q.some((x) => x.type === 'whistle' && x.wordId === 'sheep'));
  const faces = q.filter((x) => x.wordId === 'pizza').map((x) => x.type);
  assert.deepEqual(faces, ['intro', 'recognise', 'bank', 'bank', 'spell']);
  // played clean, the word with no blend still reaches the squad
  for (let pos = 0; pos < q.length; pos++) {
    const item = q[pos];
    if (item.type === 'intro') { cards[item.wordId].seen = true; continue; }
    if (!item.wordId || item.set) continue;
    const res = E.answer(cards[item.wordId], { drill: item.type, correct: true, today: D2 });
    E.followUps(q, pos, item, cards[item.wordId], res, { words: ws, speech: true });
  }
  assert.equal(cards.pizza.level, 3);
});

test('sentence fill: only squad words with a sentence, at most six, marked as a set, and no follow-ups', () => {
  const ws = words.map((w) => Object.assign({ sent: ['The ___.', ['a', 'b', 'c']] }, w));
  const cards = Object.fromEntries(ws.map((w) => [w.id, E.newCard()]));
  for (const w of ws.filter((x) => x.day === 1)) Object.assign(cards[w.id], { seen: true, level: 3, l3Day: D1 });
  const q = E.buildSession({ words: ws, cards, today: D2, dayNum: 2, speech: true });
  const set = q.filter((x) => x.type === 'sentence');
  assert.equal(set.length, 6);
  assert.ok(set.every((x) => x.set && x.wordId !== 'sheep'));
  assert.ok(q.findIndex((x) => x.type === 'halftime') < q.indexOf(set[0]));
  const n = q.length;
  E.followUps(q, q.indexOf(set[0]), set[0], cards[set[0].wordId], { correct: false, from: 3, to: 3 }, { words: ws, speech: true });
  assert.equal(q.length, n);
});

test('spelling is only in the shoot-out, marked as a set, and squad words get test faces', () => {
  const cards = cardsFor();
  sit(cards, D1, 1, () => true);
  const q = E.buildSession({ words, cards, today: D2, dayNum: 1, speech: true });
  const so = q.findIndex((x) => x.type === 'shootout');
  assert.ok(so > 0, 'a review day still ends with a shoot-out');
  assert.ok(q.filter((x) => x.type === 'spell').every((x) => x.set && q.indexOf(x) > so));
  assert.equal(q.filter((x) => x.type === 'spell').length, 5);
  assert.ok(q.slice(0, so).every((x) => ['recognise', 'bank', 'missing', 'whistle', 'sentence'].includes(x.type)));
  assert.ok(!q.some((x) => x.wordId === 'school' && x.type === 'whistle'));
});

test('a long review waits for half-time when there are new words; a short one still opens the match', () => {
  const old = Array.from({ length: 21 }, (_, i) => ({ id: `w${i}`, en: `w${'abcdefghijklmnopqrstu'[i]}`, day: 1 }));
  const ws = old.concat([{ id: 'eat', en: 'eat', day: 2 }]);
  const cards = Object.fromEntries(ws.map((w) => [w.id, E.newCard()]));
  for (const w of old) Object.assign(cards[w.id], { seen: true, level: 3, l3Day: D1 });
  let q = E.buildSession({ words: ws, cards, today: D2, dayNum: 2, speech: true });
  const half = q.findIndex((x) => x.type === 'halftime');
  assert.equal(q[0].type, 'intro');
  assert.equal(q.filter((x) => x.phase === 'warmup').length, 21);
  assert.ok(q.every((x, i) => x.phase !== 'warmup' || (i > half && i < q.findIndex((y) => y.type === 'shootout'))));
  cards.w0.l3Day = D2; // 20 due: a normal warm-up
  q = E.buildSession({ words: ws, cards, today: D2, dayNum: 2, speech: true });
  assert.equal(q[0].phase, 'warmup');
});

test('words that are not letters only are never typed whole', () => {
  const ws = [{ id: 'icecream', en: 'ice cream', day: 1 }, { id: 'dontlike', en: "don't like", day: 1 }];
  const cards = Object.fromEntries(ws.map((w) => [w.id, E.newCard()]));
  let q = E.buildSession({ words: ws, cards, today: D1, dayNum: 1, speech: true });
  assert.ok(!q.some((x) => x.type === 'spell' || x.type === 'shootout'));
  for (const w of ws) Object.assign(cards[w.id], { seen: true, level: 3, l3Day: D1 });
  q = E.buildSession({ words: ws, cards, today: D2, dayNum: 1, speech: true });
  assert.equal(q.length, 2);
  assert.ok(!q.some((x) => x.type === 'spell' || x.type === 'shootout'));
});

test('phrases cannot be typed, so squad words take the kicks', () => {
  const ws = words.concat([{ id: 'p-yes', en: 'Yes, I do', phrase: true, day: 2 }]);
  const cards = Object.fromEntries(ws.map((w) => [w.id, E.newCard()]));
  for (const w of ws.filter((x) => x.day === 1)) Object.assign(cards[w.id], { seen: true, level: 3, l3Day: D1 });
  cards.sheep.seen = true;
  const q = E.buildSession({ words: ws, cards, today: D2, dayNum: 2, speech: true });
  const kicks = q.filter((x) => x.type === 'spell');
  assert.equal(kicks.length, 5);
  assert.ok(kicks.every((x) => x.wordId !== 'p-yes' && x.set));
  assert.deepEqual(q.filter((x) => x.wordId === 'p-yes').map((x) => x.type), ['intro', 'recognise', 'bank', 'bank']);
});

test('the Kit room: opens on its day, sets only, three shelves of two foods he has met', () => {
  const kit = {
    from: 2,
    colours: ['red', 'blue', 'green', 'yellow', 'orange', 'brown', 'black', 'white'].map((en) => ({ en })),
    sort: { red: ['chicken', 'chips'], yellow: ['chair', 'cheese'], brown: ['kitchen', 'school', 'sheep'], white: ['sheep', 'nope'] },
    preps: ['in', 'on', 'under', 'near'].map((en) => ({ en })),
  };
  const cards = cardsFor();
  assert.ok(!E.buildSession({ words, cards, today: D1, dayNum: 1, speech: true, kit, kitIntro: true }).some((x) => /colour|sort|where|kit/.test(x.type)));
  sit(cards, D1, 1, () => true);
  const q = E.buildSession({ words, cards, today: D2, dayNum: 2, speech: true, kit, kitIntro: true });
  const of = (t) => q.filter((x) => x.type === t);
  assert.deepEqual(['kitintro', 'colour', 'sort', 'whereintro', 'where'].map((t) => of(t).length), [1, 6, 1, 1, 4]);
  assert.ok(q.filter((x) => ['colour', 'sort', 'where'].includes(x.type)).every((x) => x.set));
  assert.ok(q.indexOf(of('kitintro')[0]) < q.indexOf(of('colour')[0]) && q.indexOf(of('whereintro')[0]) < q.indexOf(of('where')[0]));
  const s = of('sort')[0];
  assert.deepEqual(s.cols.slice().sort(), ['brown', 'red', 'yellow'], 'white has only one food he has met');
  assert.equal(s.foods.length, 6);
  assert.ok(s.foods.every((f) => kit.sort[f.col].includes(f.id) && cards[f.id].seen));
  assert.ok(q.indexOf(s) > q.findIndex((x) => x.type === 'halftime'));
  const again = E.buildSession({ words, cards, today: D2, dayNum: 2, speech: true, kit });
  assert.ok(!again.some((x) => x.type === 'kitintro' || x.type === 'whereintro'));
});

test('the Match report: one text a day in turn from its opening day, as a set', () => {
  const report = { from: 2, passages: [{}, {}, {}] };
  const cards = cardsFor();
  sit(cards, D1, 1, () => true);
  const at = (dayNum) => E.buildSession({ words, cards, today: D2, dayNum, speech: true, report }).filter((x) => x.type === 'report');
  assert.equal(at(1).length, 0);
  assert.deepEqual([2, 3, 4, 5].map((d) => at(d)[0].passage), [0, 1, 2, 0]);
  assert.ok(at(2)[0].set);
});

test('Kit numbers and Team dinner: the day\'s letter set, then mixed; three dishes with one fitting word', () => {
  const letters = { from: 2, sets: ['abc', 'def'], mixed: 4 };
  const dinner = { from: 3, dishes: ['p', 'q', 'r', 's'].map((dish) => ({ dish, need: ['n1', 'n2'], not: ['x1', 'x2', 'x3', 'x4'] })) };
  const cards = cardsFor();
  sit(cards, D1, 1, () => true);
  const at = (dayNum, t) => E.buildSession({ words, cards, today: D2, dayNum, speech: true, letters, dinner }).filter((x) => x.type === t);
  assert.equal(at(1, 'letter').length, 0);
  assert.deepEqual(at(2, 'letter').map((x) => x.letter).sort(), ['a', 'b', 'c']);
  assert.deepEqual(at(3, 'letter').map((x) => x.letter).sort(), ['d', 'e', 'f']);
  const mixed = at(4, 'letter');
  assert.equal(mixed.length, 4);
  assert.equal(new Set(mixed.map((x) => x.letter)).size, 4);
  assert.ok(mixed.every((x) => x.set && 'abcdef'.includes(x.letter)));
  assert.ok(at(2, 'letter').some((x) => x.rev) && at(2, 'letter').some((x) => !x.rev));
  assert.equal(at(2, 'dinner').length, 0);
  const ds = at(3, 'dinner');
  assert.equal(ds.length, 3);
  assert.equal(new Set(ds.map((x) => x.dish)).size, 3);
  assert.ok(ds.every((x) => x.set && ['n1', 'n2'].includes(x.a) && x.wrong.length === 3 && x.wrong.every((id) => id.startsWith('x'))));
});

// ---------- the mock match and the training ground, on the real content ----------
globalThis.window = globalThis.window || {};
require('../content.js');
const CC = globalThis.window.CONTENT;
const seenAll = (lv = 5) => Object.fromEntries(CC.words.map((w) => [w.id, Object.assign(E.newCard(), { seen: true, level: lv, l3Day: D1, l4Day: D2 })]));
const mockOf = (cards, speech = true, dayNum = 7) => E.buildMock({ words: CC.words, cards, dayNum, speech, kit: CC.kit, dinner: CC.dinner, letters: CC.letters, report: CC.report });

test('the mock: the name, then the eight exercises in the test\'s order, then extra time; sets only', () => {
  const q = mockOf(seenAll());
  const parts = q.filter((x) => x.type === 'mockpart').map((x) => x.part);
  assert.deepEqual(parts, E.MOCK_PARTS);
  assert.ok(q.filter((x) => x.type !== 'mockpart').every((x) => x.set && x.phase === 'mock' && E.MOCK_PARTS.includes(x.part)));
  const of = (p) => q.filter((x) => x.part === p && x.type !== 'mockpart');
  assert.equal(of('name')[0].type, 'name');
  const wh = of('whistle');
  assert.equal(wh.length, 6);
  assert.deepEqual(['ch', 'sh'].map((b) => wh.filter((x) => CC.words.find((w) => w.id === x.wordId).blend === b).length), [3, 3]);
  assert.ok(!wh.some((x) => x.wordId === 'school'), 'the silent ch is never whistled');
  assert.ok(of('missing').every((x) => !wh.some((y) => y.wordId === x.wordId)), 'other words for the missing letters');
  assert.equal(of('sort')[0].foods.length, 6);
  assert.equal(of('dinner').length, 3);
  assert.equal(of('letter').length, 8);
  assert.equal(of('sentence').length, 5);
  assert.equal(of('report').length, 1);
  assert.deepEqual(of('extra').map((x) => x.type).sort(), ['colour', 'colour', 'where', 'where']);
  assert.ok(of('bank').every((x) => !x.wordId.startsWith('p-')));
  // each day its own text
  assert.deepEqual([7, 8, 9].map((d) => mockOf(seenAll(), true, d).find((x) => x.type === 'report').passage), [2, 0, 1]);
});

test('the mock without a voice: the whistle part becomes missing letters', () => {
  const q = mockOf(seenAll(), false);
  assert.ok(!q.some((x) => x.type === 'whistle'));
  assert.equal(q.filter((x) => x.part === 'whistle' && x.type === 'missing').length, 6);
});

test('from the first mock day the match is the review and the kicks; the name joins the match before that', () => {
  const cards = seenAll(4);
  const opts = { words: CC.words, cards, today: '2026-11-22', speech: true, kit: CC.kit, report: CC.report, dinner: CC.dinner, letters: CC.letters, mock: CC.mock, name: true };
  const d6 = E.buildSession(Object.assign({}, opts, { dayNum: 6, today: '2026-11-21' }));
  assert.equal(d6.filter((x) => x.type === 'name').length, 1);
  assert.ok(d6.find((x) => x.type === 'name').set);
  const d7 = E.buildSession(Object.assign({}, opts, { dayNum: 7 }));
  assert.ok(d7.length > 0);
  assert.ok(!d7.some((x) => ['name', 'colour', 'sort', 'where', 'letter', 'dinner', 'report', 'sentence'].includes(x.type)));
  assert.ok(d7.some((x) => x.type === 'spell'));
});

test('summarise: right, total and what was missed, by drill or by part', () => {
  const log = [{ t: 'letter', p: 'letter', k: 'b', ok: false }, { t: 'letter', p: 'letter', k: 'd', ok: true },
    { t: 'letter', p: 'letter', k: 'b', ok: false }, { t: 'colour', p: 'extra', k: 'grey', ok: true }];
  assert.deepEqual(E.summarise(log), { letter: { right: 1, total: 3, missed: ['b'] }, colour: { right: 1, total: 1, missed: [] } });
  assert.deepEqual(Object.keys(E.summarise(log, 'p')), ['letter', 'extra']);
});

test('the training ground: the craftiest words first, missed sets come back, nothing moves a box', () => {
  const cards = seenAll();
  Object.assign(cards.spinach, { misses: 4, tricky: true });
  cards.cheese.misses = 2; cards.chair.misses = 1;
  const history = [{ letter: { right: 4, total: 6, missed: ['b', 'q'] }, where: { right: 3, total: 4, missed: ['near'] }, sentence: { right: 4, total: 5, missed: ['kitchen'] } }];
  const pool = E.trickyPool({ words: CC.words, cards, history });
  assert.equal(pool.words[0], 'spinach');
  assert.deepEqual(pool.words.slice(0, 4).sort(), ['chair', 'cheese', 'kitchen', 'spinach']);
  assert.deepEqual(pool.letters, ['b', 'q']);
  assert.deepEqual(pool.preps, ['near']);
  const q = E.buildTraining({ words: CC.words, cards, history, speech: true, kit: CC.kit, dinner: CC.dinner });
  const intros = q.filter((x) => x.type === 'intro').map((x) => x.wordId);
  assert.ok(intros.includes('spinach') && intros.includes('cheese') && intros.includes('kitchen'));
  assert.ok(q.filter((x) => x.type !== 'intro').every((x) => x.set && x.phase === 'train'));
  assert.deepEqual(q.filter((x) => x.type === 'letter').map((x) => x.letter).sort(), ['b', 'q']);
  assert.equal(q.filter((x) => x.type === 'where')[0].prep, 'near');
  for (const id of intros) {
    assert.ok(q.indexOf(q.find((x) => x.type === 'intro' && x.wordId === id)) < q.indexOf(q.find((x) => x.type !== 'intro' && x.wordId === id)), 'the cue comes before the turn');
  }
});

test('the training ground with no misses yet: the lowest climbers step in', () => {
  const cards = seenAll(5);
  cards.fruit.level = 3; cards.share.level = 4;
  const q = E.buildTraining({ words: CC.words, cards, history: [], speech: true, kit: CC.kit, dinner: CC.dinner });
  const intros = q.filter((x) => x.type === 'intro').map((x) => x.wordId);
  assert.ok(intros.length >= 3);
  assert.ok(intros.includes('fruit') && intros.includes('share'));
});
