// Plays days 1 to 5 end to end in Chromium with speech stubbed, then opens the coach screen.
// Run: python3 -m http.server 8765 --bind 127.0.0.1 &   then   node tests/e2e.js [screenshot-dir]
const { chromium } = require('playwright');
const assert = require('node:assert');
const BASE = 'http://127.0.0.1:8765/';
const shots = process.argv[2];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true });
  await ctx.addInitScript(() => {
    window.__said = [];
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    Object.defineProperty(window, 'speechSynthesis', {
      value: { speak: (u) => window.__said.push(u.text), cancel() {}, getVoices: () => [{ lang: 'en-US' }], addEventListener() {} },
    });
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 4).join(' / ')));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };
  const type = async (s) => { for (const ch of s) await page.click(`.key[data-k="${ch}"]`); };
  const words = await (async () => { await page.goto(BASE + '?day=2026-11-16'); return page.evaluate(() => window.CONTENT.words); })();
  const kit = await page.evaluate(() => window.CONTENT.kit);
  const passages = await page.evaluate(() => window.CONTENT.report.passages);
  let reportMiss = false;
  const dinners = await page.evaluate(() => window.CONTENT.dinner.dishes);
  for (const d of dinners) for (const id of [...d.need, ...d.not]) assert.ok(words.some((w) => w.id === id), `dinner word ${id}`);
  for (const d of dinners) assert.ok(!d.need.some((id) => d.not.includes(id)));
  const load = () => page.evaluate(() => JSON.parse(localStorage.getItem('eitan-english-26.save.v1')));
  let sortMiss = false;
  let letterMiss = false, missedLetter = null, abcMiss = false;
  const stories = await page.evaluate(() => window.CONTENT.stories);
  const cur = async () => { const sv = await load(); const r = sv.session || sv.mock || sv.train; return r.queue[r.pos]; };
  const byHe = Object.fromEntries(words.map((w) => [w.he, w]));

  // setup: a wrong name first, then the right one
  await type('eitam'); await page.click('[data-k="ENTER"]');
  assert.match(await page.textContent('#note'), /E-i-t-a-n/);
  await type('eitan'); await shot('01-name'); await page.click('[data-k="ENTER"]');
  await type('10'); await shot('02-number'); await page.click('[data-k="ENTER"]');
  await shot('03-idol');
  await page.click('.idol >> text=Lamine Yamal');
  await shot('04-career');
  assert.match(await page.textContent('.match'), /11 מילים חדשות/);
  await page.click('#go');

  const bySent = Object.fromEntries(words.filter((w) => w.sent).map((w) => [w.sent[0].replace('___', '').replace(/\s+/g, ' ').trim(), w]));
  const lastSaid = async () => (await page.evaluate(() => window.__said[window.__said.length - 1])).replace(/\.$/, '');
  const seen = new Set();
  const once = async (key, name) => { if (!seen.has(key)) { seen.add(key); await shot(name); } };

  // Plays a match to the final whistle. miss = a word whose first full spelling is typed wrong.
  async function playMatch(miss) {
    let missed = false; const faces = new Set();
    for (let i = 0; i < 900; i++) {
      await page.waitForSelector('.stage, .career');
      if (await page.$('.career')) return faces;
      if (await page.$('.pack')) {
        for (const el of await page.$$('.pcard')) await el.click();
        await once('pack', '19-pack');
        await page.click('#packok'); continue;
      }
      if (await page.$('.fb')) { await page.click('.fb').catch(() => {}); continue; }
      const kicker = (await page.textContent('.kicker')).trim();
      if (await page.$('#ok')) {
        if (await page.$('.rack')) { await once((await page.$('.rack.preps')) ? 'wintro' : 'kintro', (await page.$('.rack.preps')) ? '30-where-intro' : '27-kit-intro'); await page.click('.hanger'); }
        if (await page.$('.kit-sort')) await once('sorted', '32-sort-done');
        if (await page.$('.stage.report')) await once('rdone', '38-report-done');
        if (/יריבה חדשה/.test(kicker)) await once('intro', '05-intro');
        if (/הקריאה/.test(await page.textContent('.stage'))) await once('pintro', '23-phrase-intro');
        if (/יריבה חדשה/.test(kicker) && /ice cream/.test(await page.textContent('#say'))) await shot('21-intro-two-words');
        if (/מחצית/.test(kicker)) await once('half', '08-halftime');
        if (/שריקת הסיום/.test(kicker)) await once('full', '11-fulltime');
        await page.click('#ok'); continue;
      }
      if (await page.$('.stage.report')) {
        faces.add('report');
        const sv = await load();
        const r = sv.session || sv.mock || sv.train;
        const p = passages[r.queue[r.pos].passage];
        const qno = await page.textContent('#qno');
        const text = (await page.textContent('#rq')).replace(/\s+/g, ' ').trim();
        const yn = p.yesno.find((x) => x.q === text);
        const fill = p.fill.find((x) => x.q.replace('___', '').replace(/\s+/g, ' ').trim() === text);
        assert.ok(yn || fill, `report line not found: ${text}`);
        await once(yn ? 'ryn' : 'rfill', yn ? '35-report-yesno' : '36-report-fill');
        let v = yn ? (yn.a ? 'yes' : 'no') : fill.a;
        const miss = !reportMiss && !!fill; if (miss) { reportMiss = true; v = fill.wrong[0]; }
        await page.click(`#ropts .opt[data-v="${v}"]`);
        if (miss) { await page.waitForSelector('#rnext'); await shot('37-report-miss'); assert.ok(await page.$('.sen.lit')); await page.click('#rnext'); }
        await page.waitForFunction((t) => document.getElementById('qno').textContent !== t, qno);
        continue;
      }
      if (await page.$('.kit-sort')) {
        faces.add('sort'); await once('sort', '31-sort');
        const it = await cur();
        const first = !sortMiss; sortMiss = true; // the first food of the first sort goes to a wrong column
        for (const f of it.foods) {
          await page.click(`.food[data-id="${f.id}"]`);
          const wrong = first && f === it.foods[0];
          await page.click(`.shelf[data-c="${wrong ? it.cols.find((c) => c !== f.col) : f.col}"]`);
          if (wrong) { await page.waitForTimeout(300); await shot('33-sort-miss'); }
        }
        await page.waitForSelector('#ok'); await once('sorted', '32-sort-done');
        continue;
      }
      // the test paper's boards (the mock)
      if (await page.$('.pics')) {
        faces.add('bankboard'); await once('bb', '50-mock-bankboard');
        for (const id of (await cur()).ids) { await type(words.find((w) => w.id === id).en); await page.click('[data-k="ENTER"]'); }
        await shot('51-mock-bankboard-done');
        continue;
      }
      if (await page.$('.lines')) {
        faces.add('dinnerboard'); await once('db', '52-mock-dinnerboard');
        for (const r of (await cur()).rows) { await type(r.a); await page.click('[data-k="ENTER"]'); }
        continue;
      }
      if (await page.$('table.abc')) {
        faces.add('abc'); await once('abc', '53-mock-abc');
        const it = await cur();
        const order = it.blanks.slice().sort((a, b) => a.i - b.i || (a.row === 'cap' ? -1 : 1));
        for (const b of order) {
          const l = it.letters[b.i];
          if (abcMiss) { abcMiss = false; missedLetter = l; await type(l === 'z' ? 'y' : 'z'); }
          else await type(l);
          await page.click('[data-k="ENTER"]');
        }
        await once('abcdone', '54-mock-abc-done');
        continue;
      }
      if (await page.$('.match2')) {
        faces.add('matchboard'); await once('mb', '55-mock-matchboard');
        const it = await cur();
        // one wrong pair first: the words stay until they find their sentence
        await page.click(`.mword[data-id="${it.ids[0]}"]`); await page.click(`.mstart[data-id="${it.ids[1]}"]`);
        await page.waitForTimeout(100); await shot('56-mock-match-miss');
        for (const id of it.ids) { await page.click(`.mword[data-id="${id}"]`); await page.click(`.mstart[data-id="${id}"]`); }
        await once('mbdone', '57-mock-match-done');
        continue;
      }
      if (await page.$('.storygrid')) {
        faces.add('story');
        const it = await cur();
        const stc = stories[it.story];
        for (const q of stc.yesno) {
          await page.waitForFunction((t) => document.getElementById('rq').textContent === t, q.q);
          await once('syn', '58-mock-story-yesno');
          await page.click(`#qin .opt[data-v="${q.a ? 'yes' : 'no'}"]`);
        }
        for (const [k, q] of stc.fill.entries()) {
          await page.waitForSelector('#qin .kb');
          if (k === 0) {
            await shot('59-mock-story-fill');
            await type('zzz'); await page.click('[data-k="ENTER"]'); // a miss: the sentence lights up
            await page.waitForSelector('#rnext'); assert.ok(await page.$('.sen.lit')); await shot('60-mock-story-miss');
            await page.click('#rnext'); continue;
          }
          for (const a of q.a) { await type(a.toLowerCase()); await page.click('[data-k="ENTER"]'); }
          if (q.a.length > 1) await once('s2', '61-mock-story-two-gaps');
        }
        await page.waitForSelector('#ok');
        continue;
      }
      if (await page.$('.whistle-btn') && await page.$('.typed')) {
        faces.add('whistlewrite'); await once('ww', '62-mock-whistle-write');
        { const id = (await cur()).wordId; await type(words.find((w) => w.id === id).blend); } await page.click('[data-k="ENTER"]');
        await page.waitForSelector('.fb'); await page.click('.fb'); continue;
      }
      if (await page.$('.typed .slot') && !(await page.$('.cue .he'))) {
        faces.add('picmissing'); await once('pm', '63-mock-missing-picture-only');
        { const id = (await cur()).wordId; await type(words.find((w) => w.id === id).blend); } await page.click('[data-k="ENTER"]');
        await page.waitForSelector('.fb'); await page.click('.fb'); continue;
      }
      if (await page.$('.namebox')) {
        faces.add('name'); await once('name', '43-name');
        await type('eitan'); assert.equal((await page.textContent('#nb')).trim(), 'Eitan');
        await page.click('[data-k="ENTER"]');
      } else if (await page.$('.kit-dinner')) {
        faces.add('dinner'); await once('dinner', '39-dinner');
        const dish = await page.getAttribute('#dsent', 'data-dish');
        const d = dinners.find((x) => x.dish === dish);
        const ids = await page.$$eval('.opt', (els) => els.map((x) => x.dataset.id));
        const right = ids.filter((id) => d.need.includes(id));
        assert.equal(right.length, 1, 'one word fits the dish');
        assert.ok(ids.every((id) => d.need.includes(id) || d.not.includes(id)));
        await page.click(`.opt[data-id="${right[0]}"]`);
      } else if (await page.$('.kit-letter')) {
        faces.add('letter');
        const cue = (await page.textContent('#lcue')).trim();
        await once(cue === cue.toUpperCase() ? 'lcap' : 'lsmall', cue === cue.toUpperCase() ? '40-letter-capital' : '41-letter-small');
        if (letterMiss) { // one wrong pair, to see it come back on the training ground
          letterMiss = false; missedLetter = cue.toLowerCase();
          await page.click(`.opt[data-l]:not([data-l="${missedLetter}"])`);
          await page.waitForSelector('.fb-slip'); await page.click('#fbnext'); continue;
        }
        await page.click(`.opt[data-l="${cue.toLowerCase()}"]`);
      } else if (await page.$('.kit-colour')) {
        faces.add('colour');
        const rev = await page.$('#cue');
        await once(rev ? 'crev' : 'col', rev ? '29-colour-word' : '28-colour-shirt');
        const c = rev ? await rev.getAttribute('data-c') : (await page.textContent('#say')).replace('🔊', '').trim();
        await page.click(`.opt[data-c="${c}"]`);
      } else if (await page.$('.kit-where')) {
        faces.add('where'); await once('where', '34-where');
        const p = (await page.getAttribute('.scene.big', 'class')).match(/pos-(\w+)/)[1];
        await page.click(`.opt[data-p="${p}"]`);
      } else if (await page.$('.opt.blend')) {
        faces.add('whistle'); await once('wh', '07-whistle');
        const said = await lastSaid();
        const w = words.find((x) => x.en === said);
        await page.click(`.opt[data-b="${w ? w.blend : 'sh'}"]`);
      } else if (await page.$('#sent')) {
        faces.add('sentence'); await once('sent', '16-sentence');
        const text = (await page.textContent('#sent')).replace(/\s+/g, ' ').trim();
        assert.ok(bySent[text], `sentence not found: ${text}`);
        await page.click(`.opt[data-w="${bySent[text].en}"]`);
      } else if (await page.$('.opt.word')) {
        faces.add('bank'); await once('bank', '17-bank');
        if (await page.$('.opt.word.long')) await once('pbank', '25-phrase-bank');
        await page.click(`.opt[data-id="${byHe[(await page.textContent('.cue .he')).trim()].id}"]`);
      } else if (await page.$('.opt')) {
        faces.add('recognise'); await once('rec', '06-recognise');
        if (await page.$('.bigword.long')) await once('prec', '24-phrase-recognise');
        const en = (await page.textContent('#say')).replace('🔊', '').trim();
        await page.click(`.opt[data-id="${words.find((x) => x.en === en).id}"]`);
      } else {
        const w = byHe[(await page.textContent('.cue .he')).trim()];
        const pre = (await page.textContent('#typed span:first-child'));
        const full = !(await page.$('.typed .slot'));
        faces.add(full ? 'spell' : 'missing');
        if (!full) await once('mis', '09-missing');
        if (full && w.en === miss && !missed) {
          missed = true; await type('choklate'); await page.click('[data-k="ENTER"]');
          await page.waitForSelector('.fb-slip'); await page.waitForTimeout(350); await shot('10-spell-miss');
          await page.click('#fbnext'); continue;
        }
        await type(full ? w.en : w.blend); assert.equal(pre, full ? '' : w.en.slice(0, w.en.indexOf(w.blend)));
        await page.click('[data-k="ENTER"]');
      }
      await page.waitForSelector('.fb');
      await page.click('.fb');
    }
    throw new Error('the match did not end');
  }

  // day 1: everything right except the first spelling of "chocolate" (a shoot-out kick: points only)
  await playMatch('chocolate');
  await shot('12-career-after');
  // every report answer can be read off its marked sentence, and no wrong word fits
  for (const p of passages) {
    assert.equal(p.yesno.length, 3); assert.equal(p.fill.length, 3);
    for (const f of p.fill) { assert.ok(p.text[f.at].includes(f.a), f.q); assert.ok(!f.wrong.includes(f.a)); assert.equal(new Set(f.wrong).size, 3); }
  }
  const day1 = words.filter((w) => w.day === 1), day2 = words.filter((w) => w.day === 2);
  let st = await load();
  assert.ok(day1.every((w) => st.cards[w.id].level === 3), 'all 11 in the squad after day 1');
  assert.ok(day2.every((w) => !st.cards[w.id].seen), 'day-2 words stay in the stands on day 1');
  assert.equal(st.cards.chocolate.misses, 0, 'a shoot-out kick never touches the card');
  const owned = Object.keys(st.album).length;
  assert.ok(owned >= 3 && owned <= 6, 'two packs of three cards on day 1');
  assert.match(await page.textContent('.table li.mine'), /Barcelona/);
  await page.click('#album'); await shot('20-album');
  assert.equal((await page.$$('.agrid .pcard-face:not(.empty)')).length, owned);
  await page.click('#back');
  assert.ok(st.days['2026-11-16'].done);
  assert.match(await page.textContent('.match'), /שוחק/);
  assert.equal(await page.$('#go'), null, 'one match a day');

  // day 2: the 11 words come back for the lock, then the sh and food words, the word bank and the sentences
  await page.goto(BASE + '?day=2026-11-17');
  assert.match(await page.textContent('.match'), /20 מילים חדשות.*11 מילים מהסגל/s);
  await page.click('#go');
  const faces = await playMatch();
  for (const f of ['whistle', 'sentence', 'bank', 'recognise', 'missing', 'spell']) assert.ok(faces.has(f), `day 2 has ${f}`);
  st = await load();
  assert.ok(day1.every((w) => st.cards[w.id].level === 4), 'day-1 words at level 4 after day 2');
  assert.ok(day2.every((w) => st.cards[w.id].level === 3), 'day-2 words in the squad after day 2');
  await shot('13-career-day2');

  // the coach screen: a long press, a code chosen on the first open, export, and today's match opened again
  const dialogs = [];
  page.on('dialog', (d) => { dialogs.push(d.message()); d.accept(d.type() === 'prompt' ? '4321' : undefined); });
  const longPress = async () => {
    await page.dispatchEvent('#coachTap', 'pointerdown');
    await page.waitForSelector('.coach', { timeout: 4000 }); await page.waitForTimeout(700);
  };
  await longPress();
  assert.match(dialogs[0], /בחרו קוד/);
  assert.match(await page.textContent('.coach'), /המשחק הושלם/);
  await shot('18-coach');
  await page.click('#exp');
  assert.equal(JSON.parse(await page.inputValue('#box')).settings.coachPin, '4321');
  await page.click('#again');
  assert.equal((await load()).days['2026-11-17'], undefined);
  await page.click('#back');
  assert.match(await page.textContent('.match'), /יום מנוחה/, 'reopened, but every word already had its turn today');
  await longPress();
  assert.match(dialogs[dialogs.length - 1], /קוד מאמן/);
  await page.click('#back');

  // portrait iPad
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(BASE + '?day=2026-11-18'); await shot('14-portrait-career');
  await page.click('#go'); await shot('15-portrait-spell');

  // days 3 and 4 to the final whistle. Day 4: 18 new words, a long review that waits for half-time, two-word entries never typed whole
  await page.setViewportSize({ width: 1024, height: 768 });
  const day3 = words.filter((w) => w.day === 3), day4 = words.filter((w) => w.day === 4);
  await playMatch();
  st = await load();
  assert.ok(day3.every((w) => st.cards[w.id].level === 3), 'day-3 words in the squad after day 3');
  await page.goto(BASE + '?day=2026-11-19');
  assert.equal(day4.length, 18);
  assert.match(await page.textContent('.match'), /18 מילים חדשות/);
  await page.click('#go');
  const q4 = (await load()).session.queue;
  assert.equal(q4[0].type, 'intro', 'a long review does not open day 4');
  const half = q4.findIndex((x) => x.type === 'halftime');
  assert.ok(q4.every((x, i) => x.phase !== 'warmup' || i > half), 'the review follows half-time');
  assert.ok(q4.filter((x) => x.phase === 'warmup').length > 20);
  assert.ok(!q4.some((x) => x.type === 'spell' && ['icecream', 'dontlike', 'shoppinglist'].includes(x.wordId)));
  await playMatch();
  st = await load();
  assert.ok(day4.every((w) => st.cards[w.id].level === 3), 'day-4 words in the squad after day 4');
  assert.ok(day3.every((w) => st.cards[w.id].level === 4), 'day-3 words at level 4 after day 4');
  await shot('22-career-day4');
  assert.ok(words.filter((w) => w.phrase).every((w) => !st.cards[w.id].seen), 'the phrases stay closed on day 4');

  // day 5: the ten phrases open, picked among themselves, and squad words take the kicks
  const phrases = words.filter((w) => w.phrase);
  assert.equal(phrases.length, 10);
  assert.equal(new Set(words.map((w) => w.he)).size, words.length);
  await page.goto(BASE + '?day=2026-11-20');
  assert.match(await page.textContent('.match'), /10 מילים חדשות/);
  await page.click('#go');
  const q5 = (await load()).session.queue;
  assert.equal(q5.filter((x) => x.type === 'spell').length, 5);
  assert.ok(!q4.some((x) => ['colour', 'sort', 'where'].includes(x.type)), 'the Kit room is closed on day 4');
  assert.deepEqual(['kitintro', 'colour', 'sort', 'whereintro', 'where'].map((t) => q5.filter((x) => x.type === t).length), [1, 6, 1, 1, 4]);
  assert.ok(q5.every((x) => x.type !== 'spell' || !x.wordId.startsWith('p-')));
  const f5 = await playMatch();
  for (const f of ['spell', 'colour', 'sort', 'where', 'report', 'letter']) assert.ok(f5.has(f), `day 5 has ${f}`);
  assert.deepEqual(q5.filter((x) => x.type === 'letter').map((x) => x.letter).sort(), [...'abcdef']);
  assert.ok(!q5.some((x) => x.type === 'dinner') && !q4.some((x) => x.type === 'letter'));
  assert.equal(q5.find((x) => x.type === 'report').passage, 0);
  assert.ok(!q4.some((x) => x.type === 'report'));
  st = await load();
  assert.ok(phrases.every((w) => st.cards[w.id].level === 3), 'the phrases in the squad after day 5');
  await shot('26-career-day5');

  // day 6: the Kit room is introduced only once
  assert.equal(st.kitSeen, true);
  await page.goto(BASE + '?day=2026-11-21');
  await page.click('#go');
  const q6 = (await load()).session.queue;
  assert.ok(!q6.some((x) => x.type === 'kitintro' || x.type === 'whereintro'));
  assert.equal(q6.filter((x) => x.type === 'colour').length, 6);
  assert.equal(q6.find((x) => x.type === 'report').passage, 1, 'another text on the next day');
  assert.deepEqual(q6.filter((x) => x.type === 'letter').map((x) => x.letter).sort(), [...'ghijkl']);
  assert.equal(q6.filter((x) => x.type === 'dinner').length, 3);
  const f6 = await playMatch();
  assert.ok(f6.has('dinner') && f6.has('letter'));
  await shot('42-career-day6');

  assert.ok(f6.has('name'), 'his name is typed in the match');

  // day 6 is a mega Saturday: after the match, a bonus friendly in the test's shape and a longer training ground
  assert.match(await page.textContent('.match'), /שבת של מגה/);
  assert.match(await page.textContent('#train'), /מתוך 45 דקות/);
  await shot('64-career-mega');
  const cards6 = JSON.stringify((await load()).cards);
  await page.click('#mock');
  assert.match(await page.textContent('.kicker'), /Hapoel Chicken/);
  await playMatch();
  st = await load();
  assert.equal(JSON.stringify(st.cards), cards6, 'the bonus friendly moves no box');
  assert.ok(st.mocks['2026-11-21'].total > 40);
  assert.equal(await page.$('#mock'), null, 'one bonus friendly');
  await page.goto(BASE + '?day=2026-11-20');
  assert.ok(!(await page.textContent('.match')).includes('מגה'), 'a normal day has no mega');

  // day 7: the match is the review and the kicks; then the first mock, the test's exercises in order
  await page.goto(BASE + '?day=2026-11-22');
  assert.equal(await page.$('#mock'), null, 'the mock waits for the match');
  assert.ok(await page.$('#train[disabled]'), 'the training ground waits for the match');
  await page.click('#go');
  const q7 = (await load()).session.queue;
  assert.ok(!q7.some((x) => ['colour', 'sort', 'where', 'letter', 'dinner', 'report', 'sentence', 'name'].includes(x.type)), 'the sets live in the mock now');
  await playMatch();
  assert.match(await page.textContent('.match'), /משחק הכנה נגד/);
  await shot('44-career-mock');
  st = await load();
  const cards7 = JSON.stringify(st.cards), points7 = st.points;
  await page.click('#mock');
  await page.waitForSelector('.mockpart'); await shot('45-mock-part');
  const qm = (await load()).mock.queue;
  assert.deepEqual(qm.filter((x) => x.type === 'mockpart').map((x) => x.part), ['name', 'whistle', 'bank', 'sort', 'missing', 'dinner', 'letter', 'sentence', 'report', 'extra']);
  abcMiss = true;
  const fm = await playMatch();
  for (const f of ['name', 'whistlewrite', 'bankboard', 'sort', 'picmissing', 'dinnerboard', 'abc', 'matchboard', 'story', 'colour', 'where']) assert.ok(fm.has(f), `the mock has ${f}`);
  st = await load();
  assert.equal(JSON.stringify(st.cards), cards7, 'a mock never moves a box');
  assert.ok(st.points > points7, 'a mock brings points');
  const m7 = st.mocks['2026-11-22'];
  assert.ok(m7 && m7.total > 40, `mock total ${m7 && m7.total}`);
  assert.equal(m7.total - m7.right, 3, 'one letter, one match pair and one story line missed');
  assert.deepEqual(m7.parts.letter.missed, [missedLetter]);
  assert.equal(m7.parts.sentence.missed.length, 1);
  assert.equal(m7.parts.report.missed.length, 1);
  assert.equal(st.mock, null);
  assert.match(await page.textContent('.match'), /שוחק: \d+ שערים/);
  assert.equal(Object.keys(st.album).length >= 3, true);

  // the training ground: the missed pair comes back; no box, no points, no pack
  const album7 = JSON.stringify(st.album), points7b = st.points;
  await page.click('#train');
  await page.waitForSelector('.stage'); await shot('46-train-start');
  const qt = (await load()).train.queue;
  assert.ok(qt.some((x) => x.type === 'letter' && x.letter === missedLetter), 'the missed pair is trained');
  assert.ok(qt.filter((x) => x.type !== 'trainstart' && x.type !== 'intro').every((x) => x.set));
  await playMatch();
  st = await load();
  assert.equal(JSON.stringify(st.cards), cards7, 'the training ground never moves a box');
  assert.equal(st.points, points7b, 'no points on the training ground');
  assert.equal(JSON.stringify(st.album), album7, 'no pack on the training ground');
  assert.ok(st.train.rounds === 1 && st.train.total > 0);
  // the cap: training minutes at the cap close it for the day
  await page.evaluate(() => { const k = 'eitan-english-26.save.v1'; const v = JSON.parse(localStorage.getItem(k)); v.train.ms = v.settings.capMin * 60000; localStorage.setItem(k, JSON.stringify(v)); });
  await page.goto(BASE + '?day=2026-11-22');
  assert.ok(await page.$('#train[disabled]'));
  assert.match(await page.textContent('#train'), /הסתיים/);
  await shot('47-career-after-mock');

  // the coach sees the mock, exercise by exercise, and what the training ground works on
  await longPress();
  const coachText = await page.textContent('.coach');
  assert.match(coachText, /משחק הכנה: \d+\/\d+/);
  assert.match(coachText, /6\. אותיות גדולות וקטנות/);
  assert.match(coachText, /(מעל היעד|מתחת ליעד) \(90%\)/);
  assert.match(coachText, /הכי כדאי לחזור עליו/);
  assert.match(coachText, new RegExp(`${missedLetter.toUpperCase()}${missedLetter}`));
  await shot('48-coach-mock');
  await page.click('#back');

  // day 9: the Clásico; day 10: the test, no mock
  await page.goto(BASE + '?day=2026-11-24');
  await page.click('#go'); await playMatch();
  assert.match(await page.textContent('.match'), /הקלאסיקו/);
  await page.click('#mock');
  assert.match(await page.textContent('.kicker'), /Real Madrid/);
  await shot('49-clasico');
  await playMatch();
  assert.equal((await load()).mocks['2026-11-24'].kind, 'clasico');
  await page.goto(BASE + '?day=2026-11-25');
  assert.equal(await page.$('#mock'), null);
  // test morning: an eight-word warm-up, no sets, no kicks, no pack
  assert.match(await page.textContent('.match'), /חימום/);
  const album10 = JSON.stringify((await load()).album);
  await page.click('#go');
  const q10 = (await load()).session.queue;
  assert.equal(q10.filter((x) => x.type !== 'intro').length, 8);
  assert.ok(q10.every((x) => x.phase === 'warmup'));
  await playMatch();
  assert.equal(JSON.stringify((await load()).album), album10, 'no pack on the test morning');
  assert.match(await page.textContent('.match'), /בהצלחה/);
  await shot('65-test-morning');

  assert.deepEqual(errors, []);
  await browser.close();
  console.log('e2e ok');
})().catch((e) => { console.error(e); process.exit(1); });
