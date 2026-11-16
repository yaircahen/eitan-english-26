// Plays day 1 end to end in Chromium with speech stubbed, then checks day 2.
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

  // play: answer everything right except the first spelling of "chocolate"
  let missed = false; const seen = new Set();
  for (let i = 0; i < 400; i++) {
    await page.waitForSelector('.stage');
    if (await page.$('.fb')) { await page.click('.fb'); continue; }
    const kicker = (await page.textContent('.kicker')).trim();
    if (await page.$('#ok')) {
      if (/יריבה חדשה/.test(kicker) && !seen.has('intro')) { seen.add('intro'); await shot('05-intro'); }
      if (/מחצית/.test(kicker)) await shot('08-halftime');
      if (/שריקת הסיום/.test(kicker)) { await shot('11-fulltime'); break; }
      await page.click('#ok'); continue;
    }
    if (await page.$('.opt.blend')) {
      if (!seen.has('wh')) { seen.add('wh'); await shot('07-whistle'); }
      const said = (await page.evaluate(() => window.__said[window.__said.length - 1])).replace(/\.$/, '');
      await page.click(`.opt[data-b="${words.some((w) => w.en === said) ? 'ch' : 'sh'}"]`);
    } else if (await page.$('.opt')) {
      if (!seen.has('rec')) { seen.add('rec'); await shot('06-recognise'); }
      const en = (await page.textContent('#say')).replace('🔊', '').trim();
      await page.click(`.opt[data-id="${en}"]`);
    } else {
      const he = (await page.textContent('.cue .he')).trim();
      const w = byHe[he];
      const pre = (await page.textContent('#typed span:first-child'));
      const full = !(await page.$('.typed .slot'));
      if (!full && !seen.has('mis')) { seen.add('mis'); await shot('09-missing'); }
      if (full && w.en === 'chocolate' && !missed) {
        missed = true; await type('choklate'); await page.click('[data-k="ENTER"]');
        await page.waitForSelector('.fb-slip'); await page.waitForTimeout(350); await shot('10-spell-miss');
        await page.click('#fbnext'); continue;
      }
      await type(full ? w.en : 'ch'); assert.equal(pre, full ? '' : w.en.slice(0, w.en.indexOf('ch')));
      await page.click('[data-k="ENTER"]');
    }
    await page.waitForSelector('.fb');
    await page.click('.fb');
  }
  await page.click('#ok');
  await shot('12-career-after');
  let st = await page.evaluate(() => JSON.parse(localStorage.getItem('eitan-english-26.save.v1')));
  assert.ok(Object.values(st.cards).every((c) => c.level === 3), 'all 11 in the squad after day 1');
  assert.equal(st.cards.chocolate.misses, 1);
  assert.ok(st.days['2026-11-16'].done);
  assert.match(await page.textContent('.match'), /שוחק/);
  assert.equal(await page.$('#go'), null, 'one match a day');

  // day 2: the 11 words come back for the lock, typed
  await page.goto(BASE + '?day=2026-11-17');
  assert.match(await page.textContent('.match'), /11 מילים מהסגל/);
  await page.click('#go');
  for (let i = 0; i < 11; i++) {
    const he = (await page.textContent('.cue .he')).trim();
    await type(byHe[he].en); await page.click('[data-k="ENTER"]');
    await page.waitForSelector('.fb'); await page.click('.fb');
  }
  await page.waitForSelector('#ok'); await page.click('#ok');
  st = await page.evaluate(() => JSON.parse(localStorage.getItem('eitan-english-26.save.v1')));
  assert.ok(Object.values(st.cards).every((c) => c.level === 4), 'all at level 4 after day 2');
  await shot('13-career-day2');

  // portrait iPad
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(BASE + '?day=2026-11-18'); await shot('14-portrait-career');
  await page.click('#go'); await shot('15-portrait-spell');

  assert.deepEqual(errors, []);
  await browser.close();
  console.log('e2e ok');
})().catch((e) => { console.error(e); process.exit(1); });
