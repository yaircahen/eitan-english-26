// Plays days 1 and 2 end to end in Chromium with speech stubbed, then opens the coach screen.
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
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };
  const type = async (s) => { for (const ch of s) await page.click(`.key[data-k="${ch}"]`); };
  const words = await (async () => { await page.goto(BASE + '?day=2026-11-16'); return page.evaluate(() => window.CONTENT.words); })();
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

  const bySent = Object.fromEntries(words.map((w) => [w.sent[0].replace('___', '').replace(/\s+/g, ' ').trim(), w]));
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
        if (/יריבה חדשה/.test(kicker)) await once('intro', '05-intro');
        if (/מחצית/.test(kicker)) await once('half', '08-halftime');
        if (/שריקת הסיום/.test(kicker)) await once('full', '11-fulltime');
        await page.click('#ok'); continue;
      }
      if (await page.$('.opt.blend')) {
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
        await page.click(`.opt[data-id="${byHe[(await page.textContent('.cue .he')).trim()].id}"]`);
      } else if (await page.$('.opt')) {
        faces.add('recognise'); await once('rec', '06-recognise');
        const en = (await page.textContent('#say')).replace('🔊', '').trim();
        await page.click(`.opt[data-id="${en}"]`);
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
  const load = () => page.evaluate(() => JSON.parse(localStorage.getItem('eitan-english-26.save.v1')));
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

  assert.deepEqual(errors, []);
  await browser.close();
  console.log('e2e ok');
})().catch((e) => { console.error(e); process.exit(1); });
