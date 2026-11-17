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
    if (!item.wordId) continue;
    if (item.phase === 'shootout' && cards[item.wordId].level < 3) continue;
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

test('three clean days take a word to the top; a spell miss in the squad is retried once', () => {
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
    if (!item.wordId || (item.phase === 'shootout' && cards[item.wordId].level < 3)) continue;
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
