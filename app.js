/* Eitan's game: setup (jersey, number, idol), career screen, the daily match, the coach (parent) screen. */
(() => {
  'use strict';
  const C = window.CONTENT;
  const E = window.Engine;
  const KEY = 'eitan-english-26.save.v1';
  const $app = document.getElementById('app');
  const params = new URLSearchParams(location.search);
  const WORD = Object.fromEntries(C.words.map((w) => [w.id, w]));

  // ---------- time ----------
  function iso(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function today() {
    const p = params.get('day'); // ?day=2026-11-17 lets a parent or a test look at another day
    return p && /^\d{4}-\d\d-\d\d$/.test(p) ? p : iso(new Date());
  }
  function dayNum(t) {
    const ms = Date.parse(t + 'T12:00:00') - Date.parse(C.startDate + 'T12:00:00');
    return Math.max(1, Math.round(ms / 86400000) + 1);
  }

  // ---------- save ----------
  function fresh() {
    return { v: 1, profile: null, cards: {}, session: null, days: {}, points: 0, voiceMissing: false, album: {}, settings: { coachPin: null, capMin: 15 } };
  }
  const adopt = (raw) => Object.assign(fresh(), raw, { settings: Object.assign(fresh().settings, raw.settings) });
  let state = fresh();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && raw.v === 1) state = adopt(raw);
  } catch (e) { /* a broken save starts clean */ }
  function fillCards() { for (const w of C.words) if (!state.cards[w.id]) state.cards[w.id] = E.newCard(); }
  fillCards();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode: play on */ }
  }

  // ---------- speech and sound ----------
  const Voice = {
    ok: 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined',
    // Speaks, and resolves when the word has been said (or after 3.5 s: Safari does not always report the end).
    say(text) {
      if (!this.ok) return Promise.resolve();
      return new Promise((done) => {
        setTimeout(done, 3500);
        this.speak(text, done);
      });
    },
    speak(text, done) {
      try {
        // A lone short word gets its last sound clipped ("sheep" heard as "she"), most of all when it is
        // spoken right after a cancel. So: cancel only when something is playing, wait a beat, and end the
        // word with a full stop so the voice finishes it the way it finishes a sentence.
        const busy = speechSynthesis.speaking || speechSynthesis.pending;
        if (busy) speechSynthesis.cancel();
        clearTimeout(this.timer);
        const u = new SpeechSynthesisUtterance(/[a-z]$/i.test(text) ? `${text}.` : text);
        u.lang = 'en-US';
        u.rate = 0.9;
        const vs = speechSynthesis.getVoices();
        const v = vs.find((x) => /^en[-_]US/i.test(x.lang) && x.localService !== false)
          || vs.find((x) => /^en[-_]US/i.test(x.lang)) || vs.find((x) => /^en/i.test(x.lang));
        if (v) u.voice = v;
        u.onend = done;
        u.onerror = done;
        this.last = u; // Safari drops an utterance that is garbage-collected mid-word
        if (busy) this.timer = setTimeout(() => speechSynthesis.speak(u), 120);
        else speechSynthesis.speak(u);
      } catch (e) { done(); /* the word stays on screen */ }
    },
    check() { // for the parent screen (M2): is there an English voice on this iPad?
      if (!this.ok) { state.voiceMissing = true; return; }
      const vs = speechSynthesis.getVoices();
      if (vs.length) state.voiceMissing = !vs.some((x) => /^en/i.test(x.lang));
    },
  };
  Voice.check();
  if (Voice.ok && speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', () => Voice.check());

  let actx = null;
  function tone(freq, at, dur, type = 'triangle', vol = 0.16) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      actx = actx || new AC();
      if (actx.state === 'suspended') actx.resume();
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = type;
      o.frequency.value = freq;
      const t0 = actx.currentTime + at;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(actx.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch (e) { /* silent */ }
  }
  const Sfx = {
    tap() { tone(520, 0, 0.05, 'square', 0.05); },
    goal(combo) { const b = 440 + Math.min(combo, 8) * 30; tone(b, 0, 0.12); tone(b * 1.26, 0.09, 0.12); tone(b * 1.5, 0.18, 0.22); },
    slip() { tone(220, 0, 0.18, 'sine', 0.12); tone(180, 0.12, 0.22, 'sine', 0.1); },
    whistle() { tone(2100, 0, 0.16, 'square', 0.06); tone(2100, 0.22, 0.4, 'square', 0.06); },
    up() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.2)); },
  };

  // ---------- small helpers ----------
  const lastPick = {};
  function pick(key, list) { // a random line, never the one used last time
    let i = Math.floor(Math.random() * list.length);
    if (list.length > 1 && i === lastPick[key]) i = (i + 1) % list.length;
    lastPick[key] = i;
    return list[i];
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const en = (s) => `<bdi class="en" lang="en" dir="ltr">${esc(s)}</bdi>`;
  let keyHandler = null;
  document.addEventListener('keydown', (e) => {
    if (!keyHandler || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Enter') { e.preventDefault(); keyHandler('ENTER'); }
    else if (e.key === 'Backspace') { e.preventDefault(); keyHandler('DEL'); }
    else if (/^[a-zA-Z0-9]$/.test(e.key)) keyHandler(e.key.toLowerCase());
  });
  function screen(html, cls = '') {
    keyHandler = null;
    $app.className = cls;
    $app.innerHTML = html;
    window.scrollTo(0, 0);
  }
  function on(sel, fn) { $app.querySelectorAll(sel).forEach((el) => el.addEventListener('click', fn)); }

  const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  function keyboardHtml(goLabel) {
    return `<div class="kb" dir="ltr">
      ${ROWS.map((r, i) => `<div class="kb-row">${[...r].map((k) => `<button class="key" data-k="${k}">${k}</button>`).join('')}${i === 2 ? '<button class="key key-del" data-k="DEL" aria-label="מחיקה">⌫</button>' : ''}</div>`).join('')}
      <div class="kb-row"><button class="btn btn-go key-go" data-k="ENTER">${goLabel}</button></div>
    </div>`;
  }
  function bindKeys(handler) {
    keyHandler = handler;
    on('[data-k]', (e) => { Sfx.tap(); handler(e.currentTarget.dataset.k); });
  }
  function jerseyHtml(name, number, size = '') {
    const nm = name ? `<b class="cap">${esc(name[0])}</b>${esc(name.slice(1))}` : '&nbsp;';
    return `<div class="jersey ${size}"><div class="jersey-body"><span class="jersey-name" dir="ltr">${nm}</span><span class="jersey-num">${esc(number)}</span></div></div>`;
  }

  // ---------- first run: jersey, number, idol ----------
  function setupName(wrongShown) {
    let buf = '';
    const target = C.playerName;
    screen(`<section class="setup">
      <p class="kicker">חדר ההלבשה</p>
      <h1>החולצה מחכה לשם שלך</h1>
      <p class="lead">מקלידים את השם באנגלית, אות אחרי אות. שם מתחיל תמיד ב<b class="gold">אות גדולה</b>.</p>
      <div id="jz"></div>
      <div class="namebox" id="nb" dir="ltr"></div>
      <p class="note" id="note">${wrongShown ? `איש הציוד בדק: על החולצה הרשמית כתוב ${en(target.split('').join('-'))}` : ''}</p>
      ${keyboardHtml('מדפיסים על החולצה')}
    </section>`, 'scr-setup');
    const paint = () => {
      document.getElementById('jz').innerHTML = jerseyHtml(buf, '?');
      document.getElementById('nb').innerHTML = `${buf ? `<b class="cap">${buf[0]}</b>${buf.slice(1)}` : ''}<i class="caret"></i>`;
      // the keys show capitals for the first letter, as the iPad does at the start of a name
      $app.querySelectorAll('.kb .key[data-k]').forEach((el) => {
        if (el.dataset.k.length === 1) el.textContent = buf ? el.dataset.k : el.dataset.k.toUpperCase();
      });
      $app.querySelector('.kb').classList.toggle('caps', !buf);
    };
    paint();
    bindKeys((k) => {
      if (k === 'DEL') buf = buf.slice(0, -1);
      else if (k === 'ENTER') {
        if (!buf) return;
        if (buf === target) { Sfx.up(); Voice.say('Eitan'); return setupNumber(); }
        Sfx.slip();
        return setupName(true);
      } else if (/^[a-z]$/.test(k) && buf.length < 8) buf += buf ? k : k.toUpperCase();
      paint();
    });
  }

  function setupNumber() {
    let buf = '';
    screen(`<section class="setup">
      <p class="kicker">חדר ההלבשה</p>
      <h1>איזה מספר על הגב?</h1>
      <p class="lead">כל מספר מ-1 עד 99. הוא שלך.</p>
      <div id="jz"></div>
      <div class="numpad" dir="ltr">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="key" data-k="${n}">${n}</button>`).join('')}
        <button class="key key-del" data-k="DEL" aria-label="מחיקה">⌫</button><button class="key" data-k="0">0</button>
        <button class="btn btn-go" data-k="ENTER">זה המספר</button>
      </div>
    </section>`, 'scr-setup');
    const paint = () => { document.getElementById('jz').innerHTML = jerseyHtml(C.playerName, buf || '?', 'big'); };
    paint();
    bindKeys((k) => {
      if (k === 'DEL') buf = buf.slice(0, -1);
      else if (k === 'ENTER') { if (Number(buf) >= 1) { Sfx.up(); return setupIdol(Number(buf)); } return; }
      else if (/^\d$/.test(k) && buf.length < 2 && !(buf === '' && k === '0')) buf += k;
      paint();
    });
  }

  function setupIdol(number) {
    screen(`<section class="setup">
      <p class="kicker">חדר ההלבשה</p>
      <h1>מי הקפטן שלך?</h1>
      <p class="lead">בוחרים שחקן אחד מהסגל. הוא ילווה אותך בכל משחק.</p>
      <div class="idols" dir="ltr">
        ${C.idols.map((p, i) => `<button class="idol" data-i="${i}"><span class="idol-num">${p.number}</span><span class="idol-name">${esc(p.name)}</span></button>`).join('')}
      </div>
    </section>`, 'scr-setup');
    on('.idol', (e) => {
      const p = C.idols[Number(e.currentTarget.dataset.i)];
      state.profile = { name: C.playerName, number, idol: p.name, idolNumber: p.number };
      save();
      Sfx.up();
      career();
    });
  }

  // ---------- career screen ----------
  function matchesPlayed() { return Object.values(state.days).filter((d) => d.done).length; }
  function stageIndex() {
    const m = matchesPlayed();
    let i = 0;
    C.stages.forEach((s, k) => { if (m >= s.from) i = k; });
    return i;
  }

  function career() {
    const t = today();
    const p = state.profile;
    const s = state.session && state.session.day === t ? state.session : null;
    const done = !!(state.days[t] && state.days[t].done);
    const hidden = C.words.filter((w) => !state.cards[w.id].seen && w.day <= dayNum(t)).length;
    const due = E.dueWords(C.words, state.cards, t, () => 0).length; // rng 0: count every level-5 word too
    const st = stageIndex();

    let match;
    if (done) {
      match = `<h2>המשחק של היום שוחק</h2><p>המגרש נפתח שוב מחר. המילים כבר מתאמנות בלחץ.</p>`;
    } else if (s) {
      match = `<h2>המשחק באמצע</h2><p>המילים מחכות על הדשא.</p><button class="btn btn-go glow" id="go">חוזרים למגרש</button>`;
    } else if (hidden || due) {
      match = `<h2>המשחק של היום</h2>
        <p>${hidden ? `${hidden} מילים חדשות מסתתרות ביציע. ` : ''}${due ? `${due} מילים מהסגל עולות לחימום.` : ''}</p>
        <button class="btn btn-go glow" id="go">עולים למגרש</button>`;
    } else {
      match = `<h2>יום מנוחה</h2><p>אין היום יריבות חדשות. המגרש נפתח שוב מחר.</p>`;
    }

    const cols = [1, 2, 3, 4, 5].map((lv) => {
      const ws = C.words.filter((w) => state.cards[w.id].seen && state.cards[w.id].level === lv);
      return `<div class="col lv${lv}"><h3>${C.levels[lv]}<b>${ws.length}</b></h3><div class="chips">${ws.map((w) => `<span class="chip">${w.emoji} ${en(w.en)}</span>`).join('')}</div></div>`;
    }).join('');

    screen(`<section class="career">
      <header class="board">
        <div class="board-cell"><span>נקודות</span><b>${state.points}</b></div>
        <div class="board-title" id="coachTap"><b>הקריירה של ${en(C.playerName)}</b><span>${C.stages[st].name}</span></div>
        <div class="board-cell"><span>ימי משחק</span><b>${matchesPlayed()}</b></div>
      </header>

      <div class="hero">
        <div class="me">
          ${jerseyHtml(C.playerName, p.number)}
          <p class="captain"><span class="armband">C</span> הקפטן: ${en(p.idol)}</p>
        </div>
        <div class="match">${match}</div>
      </div>

      <ol class="path">
        ${C.stages.map((x, i) => `<li class="${i < st ? 'past' : i === st ? 'now' : ''}"><i>${i + 1}</i><span>${x.name}</span></li>`).join('')}
      </ol>

      <div class="league">
        <div class="tablebox"><h2>הטבלה</h2>${tableHtml()}</div>
        <button class="albumbtn" id="album"><b>האלבום</b><span>${Object.keys(state.album).length} מתוך ${C.idols.length} קלפים</span></button>
      </div>

      <div class="squad">
        <h2>לוח המילים <small>כל מילה מטפסת מימין לשמאל</small></h2>
        <div class="cols">${cols}</div>
      </div>
    </section>`, 'scr-career');

    on('#go', () => { Sfx.whistle(); Voice.say(' '); startSession(); });
    on('#album', () => { Sfx.tap(); album(); });
  }

  // ---------- the table: every answer of his is a minute of league football for the other clubs too ----------
  function answersGiven() {
    return Object.values(state.days).reduce((n, d) => n + (d.total || 0), 0) + (state.session ? state.session.total : 0);
  }
  function tableHtml() {
    const n = answersGiven();
    const rows = C.clubs.map((c) => ({ name: c.name, pts: c.rate * n }))
      .concat([{ name: C.myClub, pts: state.points, me: true }])
      .sort((a, b) => b.pts - a.pts || (a.me ? 1 : -1));
    return `<ol class="table" dir="ltr">${rows.map((r, i) => `<li class="${r.me ? 'mine' : ''}"><i>${i + 1}</i><span>${esc(r.name)}</span><b>${r.pts}</b></li>`).join('')}</ol>`;
  }

  // ---------- packs and the album ----------
  const TIERS = ['', 'common', 'silver', 'gold'];
  const TIER_HE = ['', 'כחול', 'כסף', 'זהב'];
  const DUP_POINTS = [0, 30, 60, 120];
  /* Three cards. The tier belongs to the card pulled, not to the player: any player can come in gold.
     A new player or a higher tier goes into the album; anything else turns into points. */
  function drawPack() {
    const pool = C.idols.concat(C.idols.filter((p) => p.name === state.profile.idol)); // the captain: twice as likely
    const cards = [];
    while (cards.length < 3) {
      const p = pool[Math.floor(Math.random() * pool.length)];
      if (cards.some((c) => c.name === p.name)) continue;
      const r = Math.random();
      const tier = r < 0.08 ? 3 : r < 0.35 ? 2 : 1;
      const had = state.album[p.name] || 0;
      const card = { name: p.name, number: p.number, tier, isNew: !had, up: had > 0 && tier > had, bonus: 0 };
      if (tier > had) state.album[p.name] = tier;
      else { card.bonus = DUP_POINTS[tier]; state.points += card.bonus; }
      cards.push(card);
    }
    save();
    return cards;
  }
  function cardHtml(c, extra = '') {
    return `<div class="pcard-face t-${TIERS[c.tier]}"><span class="pnum">${c.number}</span><span class="pname" dir="ltr">${esc(c.name)}</span>${extra}</div>`;
  }
  function packScreen(cards, kicker, then) {
    screen(`<section class="play"><div class="stage break pack">
      <p class="kicker">${kicker}</p>
      <h1>חבילת קלפים</h1>
      <div class="pcards">${cards.map((c, i) => `<button class="pcard" data-i="${i}"><div class="pcard-back"><span>?</span></div>${cardHtml(c, `<span class="ptag">${c.isNew ? 'חדש באלבום!' : c.up ? `שדרוג ל${TIER_HE[c.tier]}!` : `כבר באלבום: <b dir="ltr">+${c.bonus}</b> נק׳`}</span>`)}</button>`).join('')}</div>
      <p class="lead" id="packnote">נוגעים בקלף כדי להפוך אותו.</p>
      <button class="btn btn-go" id="packok" hidden>ממשיכים</button>
    </div></section>`, 'scr-play');
    on('.pcard', (e) => {
      const el = e.currentTarget;
      if (el.classList.contains('open')) return;
      el.classList.add('open');
      const c = cards[Number(el.dataset.i)];
      (c.tier === 3 ? Sfx.up : Sfx.goal)(c.tier * 3);
      if (!$app.querySelector('.pcard:not(.open)')) {
        document.getElementById('packnote').hidden = true;
        document.getElementById('packok').hidden = false;
      }
    });
    on('#packok', () => { Sfx.tap(); then(); });
  }
  function album() {
    const own = state.album;
    screen(`<section class="album">
      <header><h1>האלבום <small>${Object.keys(own).length} מתוך ${C.idols.length}</small></h1><button class="btn" id="back">חזרה</button></header>
      <p class="lead">חבילה אחת במחצית ואחת בשריקת הסיום. כל שחקן יכול להגיע בכחול, בכסף או בזהב.</p>
      <div class="agrid">${C.idols.map((p) => (own[p.name]
    ? cardHtml({ name: p.name, number: p.number, tier: own[p.name] })
    : `<div class="pcard-face empty"><span class="pnum">${p.number}</span><span class="pname">?</span></div>`)).join('')}</div>
    </section>`, 'scr-album');
    on('#back', career);
  }

  // ---------- the match ----------
  function startSession() {
    const t = today();
    if (!state.session || state.session.day !== t) {
      state.session = {
        day: t,
        queue: E.buildSession({
          words: C.words, foils: C.foils, cards: state.cards, today: t, dayNum: dayNum(t), speech: Voice.ok,
          kit: C.kit, kitIntro: !state.kitSeen,
        }),
        pos: 0, points: 0, combo: 0, bestCombo: 0, right: 0, total: 0,
        promoted: [], dropped: [], ms: 0,
      };
      save();
    }
    tick = Date.now();
    play();
  }

  let tick = 0;
  let locked = false;
  function clock() { // playing time, with long pauses not counted
    const now = Date.now();
    if (state.session) state.session.ms += Math.min(now - tick, 60000);
    tick = now;
  }
  const mult = (combo) => (combo >= 10 ? 4 : combo >= 6 ? 3 : combo >= 3 ? 2 : 1);

  function hud() {
    const s = state.session;
    const pct = Math.round((s.pos / s.queue.length) * 100);
    const m = mult(s.combo);
    return `<header class="hud">
      <button class="hud-home" id="home" aria-label="חזרה למסך הקריירה">⌂</button>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="combo ${m > 1 ? 'hot' : ''}">רצף <b>${s.combo}</b>${m > 1 ? `<em dir="ltr">×${m}</em>` : ''}</div>
      <div class="pts"><b id="pts">${s.points}</b> נק׳</div>
    </header>`;
  }
  function bindHud() { on('#home', () => { clock(); save(); career(); }); }

  function play() {
    const s = state.session;
    locked = false;
    while (s.pos < s.queue.length) { // a shoot-out kick is only for a word that is in the squad
      const it = s.queue[s.pos];
      if (it.phase === 'shootout' && it.wordId && state.cards[it.wordId].level < 3) s.pos++;
      else break;
    }
    if (s.pos >= s.queue.length) return fullTime();
    const item = s.queue[s.pos];
    ({ intro, recognise, whistle, missing, bank, sentence, spell, halftime, shootout, kitintro, colour, sort, whereintro, where })[item.type](item);
  }
  function next() { clock(); state.session.pos++; save(); play(); }

  function tally(correct) { // points and the combo for one answer
    const s = state.session;
    s.total++;
    if (!correct) { s.combo = 0; return 0; }
    s.right++;
    s.combo++;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    const gained = 10 * mult(s.combo);
    s.points += gained;
    state.points += gained;
    return gained;
  }

  function settle(item, correct, missHtml) {
    if (locked) return;
    locked = true;
    keyHandler = null;
    const s = state.session;
    let res = null;
    if (item.wordId && !item.set) { // a test-shaped set never moves a box
      const card = state.cards[item.wordId];
      res = E.answer(card, { drill: item.type, correct, today: s.day, retry: !!item.retry });
      E.followUps(s.queue, s.pos, item, card, res, { words: C.words, speech: Voice.ok });
      if (res.to > res.from) s.promoted.push(item.wordId);
      if (res.to < res.from) s.dropped.push(item.wordId);
    }
    const gained = tally(correct);
    clock();
    save();

    const word = item.wordId ? WORD[item.wordId].en : item.foil || item.colour || item.prep;
    const spoken = Voice.say(item.type === 'sentence' ? WORD[item.wordId].sent[0].replace('___', word) : word);
    const moved = res && res.to !== res.from;
    const fb = document.createElement('div');
    fb.className = `fb ${correct ? 'fb-goal' : 'fb-slip'}`;
    if (correct) {
      (moved ? Sfx.up : Sfx.goal)(s.combo);
      const head = C.cheers.combo[s.combo] || pick(item.type, C.cheers.head[item.type]);
      const sub = pick('sub', C.cheers.sub).replace('{w}', en(word));
      fb.innerHTML = `<div class="fb-in"><strong>${head}</strong><span>${sub} <b class="plus">+${gained}</b></span>
        ${moved ? `<span class="climb">${en(word)} מטפסת: ${C.levels[res.to]}</span>` : ''}</div>`;
      // stay until the word has been said and there was time to read the line; a tap skips
      const big = (moved && res.to >= 3) || !!C.cheers.combo[s.combo]; // joining the squad or a combo milestone
      const beat = new Promise((ok) => setTimeout(ok, big ? 3000 : 2000));
      Promise.all([spoken, beat]).then(() => { if (fb.isConnected) next(); });
      fb.addEventListener('click', next, { once: true });
    } else {
      Sfx.slip();
      fb.innerHTML = `<div class="fb-in"><strong>${pick('slip', C.cheers.slip).replace('{w}', en(word))}</strong>${missHtml}
        ${moved ? `<span class="climb">${en(word)} מחליקה שלב אחד אחורה.</span>` : ''}
        <button class="btn btn-go" id="fbnext">ממשיכים</button></div>`;
      fb.querySelector('#fbnext').addEventListener('click', next, { once: true });
    }
    $app.querySelector('.play').appendChild(fb);
    const pts = document.getElementById('pts');
    if (pts) pts.textContent = s.points;
  }

  // typed answers: mark each letter in place, so a miss teaches
  function markHtml(target, attempt) {
    // longest common subsequence: only the letters that really differ get marked
    const n = target.length, m = attempt.length;
    const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
      L[i][j] = target[i] === attempt[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    }
    const okT = new Set(), okA = new Set();
    for (let i = 0, j = 0; i < n && j < m;) {
      if (target[i] === attempt[j]) { okT.add(i++); okA.add(j++); }
      else if (L[i + 1][j] >= L[i][j + 1]) i++;
      else j++;
    }
    const row = (text, ok, cls) => `<span class="spellrow ${cls}" dir="ltr">${[...text].map((ch, i) => `<i class="${ok.has(i) ? '' : 'bad'}">${esc(ch)}</i>`).join('')}</span>`;
    return `<span class="lbl">ככה כותבים אותה:</span>${row(target, okT, 'right')}
      <span class="lbl">ומה שנכתב:</span>${row(attempt, okA, 'typed')}`;
  }
  const blendHtml = (w) => {
    const i = w.blend ? w.en.indexOf(w.blend) : -1;
    return i < 0 ? esc(w.en) : `${esc(w.en.slice(0, i))}<mark>${w.blend}</mark>${esc(w.en.slice(i + 2))}`;
  };

  function intro(item) {
    const w = WORD[item.wordId];
    screen(`<section class="play">${hud()}
      <div class="stage intro-card">
        <p class="kicker">יריבה חדשה עולה למגרש</p>
        <div class="emoji">${w.emoji}</div>
        <button class="say bigword ${w.phrase ? 'long' : ''}" id="say" dir="ltr" lang="en">${blendHtml(w)} <span>🔊</span></button>
        <p class="he">${esc(w.he)}</p>
        <p class="line">${w.phrase ? 'הקריאה' : 'המילה'} ${en(w.en)} ${esc(w.line)}</p>
        <button class="btn btn-go" id="ok">תופסים אותה</button>
      </div></section>`, 'scr-play');
    bindHud();
    Voice.say(w.en);
    on('#say', () => Voice.say(w.en));
    on('#ok', () => { Sfx.tap(); state.cards[w.id].seen = true; next(); });
  }

  function recognise(item) {
    const w = WORD[item.wordId];
    const opts = E.shuffle([w, ...others(w, 3)], Math.random);
    screen(`<section class="play">${hud()}
      <div class="stage">
        <p class="kicker">${w.phrase ? 'מה הקריאה הזאת אומרת?' : 'מה המילה הזאת מסתירה?'}</p>
        <button class="say bigword ${w.phrase ? 'long' : ''}" id="say" dir="ltr" lang="en">${esc(w.en)} <span>🔊</span></button>
        <div class="opts">${opts.map((o) => `<button class="opt" data-id="${o.id}"><span class="opt-e">${o.emoji}</span>${esc(o.he)}</button>`).join('')}</div>
      </div></section>`, 'scr-play');
    bindHud();
    Voice.say(w.en);
    on('#say', () => Voice.say(w.en));
    on('.opt', (e) => {
      const ok = e.currentTarget.dataset.id === w.id;
      e.currentTarget.classList.add(ok ? 'is-right' : 'is-wrong');
      $app.querySelector(`.opt[data-id="${w.id}"]`).classList.add('is-right');
      settle(item, ok, `<span class="lbl">${en(w.en)} זה ${w.emoji} ${esc(w.he)}</span>`);
    });
  }

  // other words already on the pitch (met, or due today), to stand next to the right one
  function others(w, n) {
    const d = dayNum(state.session.day);
    return E.shuffle(C.words.filter((x) => x.id !== w.id && x.day <= d && !x.phrase === !w.phrase), Math.random).slice(0, n);
  }

  // Word bank: the picture and the Hebrew, and the word is picked out of a bank of English words
  function bank(item) {
    const w = WORD[item.wordId];
    const opts = E.shuffle([w, ...others(w, 5)], Math.random);
    screen(`<section class="play">${hud()}
      <div class="stage">
        <p class="kicker">${w.phrase ? 'מחסן הקריאות: איזו מהן היא?' : 'מחסן המילים: איזו מהן היא?'}</p>
        <div class="cue"><span class="emoji sm">${w.emoji}</span><span class="he">${esc(w.he)}</span></div>
        <div class="opts bank" dir="ltr">${opts.map((o) => `<button class="opt word ${w.phrase ? 'long' : ''}" data-id="${o.id}">${esc(o.en)}</button>`).join('')}</div>
      </div></section>`, 'scr-play');
    bindHud();
    on('.opt', (e) => {
      const ok = e.currentTarget.dataset.id === w.id;
      e.currentTarget.classList.add(ok ? 'is-right' : 'is-wrong');
      $app.querySelector(`.opt[data-id="${w.id}"]`).classList.add('is-right');
      settle(item, ok, `<span class="lbl">${w.emoji} ${esc(w.he)} זה ${en(w.en)}</span>`);
    });
  }

  // Sentence fill: a sentence lost a word, and four words want the place
  function sentence(item) {
    const w = WORD[item.wordId];
    const [text, wrong] = w.sent;
    const opts = E.shuffle([w.en, ...wrong], Math.random);
    const parts = text.split('___');
    const gap = (inner) => `${esc(parts[0])}<b class="gap">${inner}</b>${esc(parts[1])}`;
    screen(`<section class="play">${hud()}
      <div class="stage">
        <p class="kicker">מילה ברחה מהמשפט. מי מהן חוזרת למקום?</p>
        <p class="sentence" id="sent" dir="ltr" lang="en">${gap('&nbsp;')}</p>
        <div class="opts" dir="ltr">${opts.map((o) => `<button class="opt word" data-w="${esc(o)}">${esc(o)}</button>`).join('')}</div>
      </div></section>`, 'scr-play');
    bindHud();
    on('.opt', (e) => {
      const ok = e.currentTarget.dataset.w === w.en;
      e.currentTarget.classList.add(ok ? 'is-right' : 'is-wrong');
      $app.querySelector(`.opt[data-w="${w.en}"]`).classList.add('is-right');
      document.getElementById('sent').innerHTML = gap(esc(w.en));
      settle(item, ok, `<span class="lbl">המשפט השלם:</span><span class="sentence sm" dir="ltr" lang="en">${gap(esc(w.en))}</span>`);
    });
  }

  function whistle(item) {
    const text = item.wordId ? WORD[item.wordId].en : item.foil;
    const blend = item.wordId ? WORD[item.wordId].blend : 'sh';
    screen(`<section class="play">${hud()}
      <div class="stage">
        <p class="kicker">שריקה! איזה צמד אותיות מתחבא במילה?</p>
        <button class="say whistle-btn" id="say" aria-label="להשמיע שוב">🔊<span>להשמיע שוב</span></button>
        <div class="opts two" dir="ltr">
          <button class="opt blend" data-b="ch">ch</button>
          <button class="opt blend" data-b="sh">sh</button>
        </div>
      </div></section>`, 'scr-play');
    bindHud();
    Voice.say(text);
    on('#say', () => Voice.say(text));
    on('.opt', (e) => {
      const ok = e.currentTarget.dataset.b === blend;
      e.currentTarget.classList.add(ok ? 'is-right' : 'is-wrong');
      $app.querySelector(`.opt[data-b="${blend}"]`).classList.add('is-right');
      settle(item, ok, `<span class="lbl">במילה ${en(text)} מתחבא ${en(blend)}</span>`);
    });
  }

  function typed(item, { kicker, goLabel, prefix, suffix, answer, full }) {
    const w = WORD[item.wordId];
    let buf = '';
    screen(`<section class="play">${hud()}
      <div class="stage">
        <p class="kicker">${kicker}</p>
        <div class="cue"><span class="emoji sm">${w.emoji}</span><span class="he">${esc(w.he)}</span></div>
        <div class="typed" id="typed" dir="ltr"></div>
        ${keyboardHtml(goLabel)}
      </div></section>`, 'scr-play');
    bindHud();
    const paint = () => {
      const slots = full
        ? `${[...buf].map((ch) => `<i>${ch}</i>`).join('')}<i class="caret"></i>`
        : [...answer].map((_, i) => `<i class="slot ${i === buf.length ? 'caret' : ''}">${buf[i] || ''}</i>`).join('');
      document.getElementById('typed').innerHTML = `<span>${esc(prefix)}</span>${slots}<span>${esc(suffix)}</span>`;
    };
    paint();
    bindKeys((k) => {
      if (locked) return;
      if (k === 'DEL') buf = buf.slice(0, -1);
      else if (k === 'ENTER') {
        if (!buf) return;
        const attempt = prefix + buf + suffix;
        return settle(item, buf === answer, markHtml(w.en, attempt));
      } else if (/^[a-z]$/.test(k) && buf.length < (full ? 16 : answer.length)) buf += k;
      paint();
    });
  }

  function missing(item) {
    const w = WORD[item.wordId];
    const i = w.en.indexOf(w.blend);
    typed(item, {
      kicker: 'שתי אותיות ברחו מהמילה. מחזירים אותן!', goLabel: 'מחזירים',
      prefix: w.en.slice(0, i), suffix: w.en.slice(i + 2), answer: w.blend, full: false,
    });
  }

  function spell(item) {
    typed(item, {
      kicker: item.phase === 'shootout' || item.retry ? 'פנדל! כותבים את המילה כולה' : 'כותבים את המילה כולה',
      goLabel: 'בועטים', prefix: '', suffix: '', answer: WORD[item.wordId].en, full: true,
    });
  }

  // ---------- the Kit room: colours, the colour sort, and where the ball is. Sets: they never move a box ----------
  const COLOUR = Object.fromEntries(C.kit.colours.map((c) => [c.en, c]));
  const PREP = Object.fromEntries(C.kit.preps.map((p) => [p.en, p]));
  const shirt = (c, cls = '') => `<i class="shirt ${cls}" style="--c:${COLOUR[c].hex}"></i>`;
  const scene = (p, cls = '') => `<span class="scene pos-${p} ${cls}"><i class="box"></i><i class="ball">⚽</i></span>`;

  function kitintro() {
    screen(`<section class="play">${hud()}
      <div class="stage">
        <p class="kicker">חדר ההלבשה</p>
        <h1 class="h-sm">עשר חולצות, עשרה צבעים</h1>
        <p class="line">כל חולצה יודעת את השם שלה באנגלית. נוגעים בחולצה ושומעים אותה.</p>
        <div class="rack">${C.kit.colours.map((c) => `<button class="hanger" data-c="${c.en}">${shirt(c.en)}<b dir="ltr" lang="en">${c.en}</b><span>${c.he}</span></button>`).join('')}</div>
        <button class="btn btn-go" id="ok">למדפים</button>
      </div></section>`, 'scr-play');
    bindHud();
    on('.hanger', (e) => Voice.say(e.currentTarget.dataset.c));
    on('#ok', () => { Sfx.tap(); state.kitSeen = true; next(); });
  }

  // a colour word and four shirts, or a shirt and four colour words
  function colour(item) {
    const c = COLOUR[item.colour];
    const opts = E.shuffle([c, ...E.shuffle(C.kit.colours.filter((x) => x.en !== c.en), Math.random).slice(0, 3)], Math.random);
    screen(`<section class="play">${hud()}
      <div class="stage kit-colour">
        <p class="kicker">${item.rev ? 'חדר ההלבשה: איך קוראים לחולצה הזאת?' : 'חדר ההלבשה: איזו חולצה היא?'}</p>
        ${item.rev ? `<div id="cue" data-c="${c.en}">${shirt(c.en, 'big')}</div>`
    : `<button class="say bigword" id="say" dir="ltr" lang="en">${c.en} <span>🔊</span></button>`}
        <div class="opts ${item.rev ? '' : 'four'}" dir="ltr">${opts.map((o) => (item.rev
    ? `<button class="opt word" data-c="${o.en}">${o.en}</button>`
    : `<button class="opt" data-c="${o.en}" aria-label="${o.he}">${shirt(o.en)}</button>`)).join('')}</div>
      </div></section>`, 'scr-play');
    bindHud();
    if (!item.rev) { Voice.say(c.en); on('#say', () => Voice.say(c.en)); }
    on('.opt', (e) => {
      const ok = e.currentTarget.dataset.c === c.en;
      e.currentTarget.classList.add(ok ? 'is-right' : 'is-wrong');
      $app.querySelector(`.opt[data-c="${c.en}"]`).classList.add('is-right');
      settle(item, ok, `<span class="lbl fbrow">${shirt(c.en, 'sm')} ${en(c.en)} זה ${c.he}</span>`);
    });
  }

  // the colour sort: six foods, three shelves, two on each
  function sort(item) {
    let i = 0;
    screen(`<section class="play">${hud()}
      <div class="stage kit-sort">
        <p class="kicker">המחסנאי התבלבל: כל מאכל למדף של הצבע שלו</p>
        <div class="bigword" id="food" dir="ltr" lang="en"></div>
        <div class="shelves" dir="ltr">${item.cols.map((c) => `<button class="shelf" data-c="${c}"><b lang="en">${c}</b><span class="on"></span></button>`).join('')}</div>
        <p class="note" id="sortnote"></p>
      </div></section>`, 'scr-play');
    bindHud();
    const show = () => { document.getElementById('food').textContent = WORD[item.foods[i].id].en; Voice.say(WORD[item.foods[i].id].en); };
    show();
    on('.shelf', (e) => {
      if (locked) return;
      locked = true;
      const f = item.foods[i], w = WORD[f.id];
      const ok = e.currentTarget.dataset.c === f.col;
      tally(ok); clock(); save();
      (ok ? Sfx.goal : Sfx.slip)(state.session.combo);
      if (!ok) e.currentTarget.classList.add('is-wrong');
      const home = $app.querySelector(`.shelf[data-c="${f.col}"]`);
      home.querySelector('.on').insertAdjacentHTML('beforeend', `<span class="chip ${ok ? '' : 'moved'}">${w.emoji} ${en(w.en)}</span>`);
      document.getElementById('sortnote').innerHTML = ok ? '' : `${en(w.en)} חמקה למדף של ${en(f.col)}.`;
      document.getElementById('pts').textContent = state.session.points;
      const comboEl = $app.querySelector('.combo b'); if (comboEl) comboEl.textContent = state.session.combo;
      setTimeout(() => {
        $app.querySelectorAll('.shelf.is-wrong').forEach((x) => x.classList.remove('is-wrong'));
        if (++i < item.foods.length) { locked = false; return show(); }
        document.getElementById('food').textContent = '';
        $app.querySelectorAll('.shelf').forEach((x) => { x.style.setProperty('--c', COLOUR[x.dataset.c].hex); x.classList.add('lit'); });
        $app.querySelector('.stage').insertAdjacentHTML('beforeend', '<button class="btn btn-go" id="ok">המדפים מסודרים. ממשיכים</button>');
        on('#ok', () => { Sfx.tap(); next(); });
      }, ok ? 700 : 1800);
    });
  }

  function whereintro() {
    screen(`<section class="play">${hud()}
      <div class="stage">
        <p class="kicker">חדר ההלבשה</p>
        <h1 class="h-sm">הכדור מתחבא ליד הארגז</h1>
        <p class="line">ארבע מילים קטנות יודעות איפה הוא. נוגעים ושומעים.</p>
        <div class="rack preps">${C.kit.preps.map((p) => `<button class="hanger" data-p="${p.en}">${scene(p.en)}<b dir="ltr" lang="en">${p.en}</b><span>${p.he}</span></button>`).join('')}</div>
        <button class="btn btn-go" id="ok">מחפשים את הכדור</button>
      </div></section>`, 'scr-play');
    bindHud();
    on('.hanger', (e) => Voice.say(e.currentTarget.dataset.p));
    on('#ok', () => { Sfx.tap(); next(); });
  }

  function where(item) {
    const p = PREP[item.prep];
    const sent = (inner) => `The ball is <b class="gap">${inner}</b> the box.`;
    screen(`<section class="play">${hud()}
      <div class="stage kit-where">
        <p class="kicker">איפה הכדור?</p>
        ${scene(p.en, 'big')}
        <p class="sentence" id="wsent" dir="ltr" lang="en">${sent('&nbsp;')}</p>
        <div class="opts four" dir="ltr">${E.shuffle(C.kit.preps, Math.random).map((o) => `<button class="opt word" data-p="${o.en}">${o.en}</button>`).join('')}</div>
      </div></section>`, 'scr-play');
    bindHud();
    on('.opt', (e) => {
      const ok = e.currentTarget.dataset.p === p.en;
      e.currentTarget.classList.add(ok ? 'is-right' : 'is-wrong');
      $app.querySelector(`.opt[data-p="${p.en}"]`).classList.add('is-right');
      document.getElementById('wsent').innerHTML = sent(p.en);
      settle(item, ok, `<span class="lbl">${en(p.en)} זה ${p.he}</span><span class="sentence sm" dir="ltr" lang="en">${sent(p.en)}</span>`);
    });
  }

  function halftime() {
    const s = state.session;
    Sfx.whistle();
    screen(`<section class="play"><div class="stage break">
      <p class="kicker">שריקת המחצית</p>
      <h1>מחצית</h1>
      <div class="score"><div><b>${s.points}</b><span>נקודות</span></div><div><b>${s.bestCombo}</b><span>הרצף הכי ארוך</span></div></div>
      <p class="lead">המילים שותות מים ומתלחשות. הן מתכננות משהו לחצי השני.</p>
      <button class="btn btn-go glow" id="ok">פותחים חבילה</button>
    </div></section>`, 'scr-play');
    on('#ok', () => {
      Sfx.tap();
      if (!s.pack) { s.pack = drawPack(); save(); } // drawn once, even if he leaves and comes back
      packScreen(s.pack, 'חבילת המחצית', next);
    });
  }

  function shootout() {
    Sfx.whistle();
    screen(`<section class="play"><div class="stage break">
      <p class="kicker">דקה 90</p>
      <h1>דו־קרב פנדלים</h1>
      <p class="lead">כל מילה עומדת בשער לבדה. כותבים אותה מההתחלה עד הסוף, והיא בפנים.</p>
      <button class="btn btn-go glow" id="ok">לנקודה הלבנה</button>
    </div></section>`, 'scr-play');
    on('#ok', () => { Sfx.tap(); next(); });
  }

  function fullTime() {
    const s = state.session;
    clock();
    const before = stageIndex();
    const up = [...new Set(s.promoted)].filter((id) => state.cards[id].level >= 3 && !s.dropped.includes(id));
    state.days[s.day] = {
      done: true, points: s.points, minutes: Math.round(s.ms / 60000),
      promoted: [...new Set(s.promoted)], dropped: [...new Set(s.dropped)], right: s.right, total: s.total,
    };
    state.session = null;
    save();
    const pack = drawPack();
    const st = stageIndex();
    Sfx.up();
    screen(`<section class="play"><div class="stage break">
      <p class="kicker">שריקת הסיום</p>
      <h1>ניצחון!</h1>
      <div class="score"><div><b>${s.points}</b><span>נקודות היום</span></div><div><b>${s.bestCombo}</b><span>הרצף הכי ארוך</span></div><div><b>${up.length}</b><span>מילים עלו שלב</span></div></div>
      ${up.length ? `<div class="chips center">${up.map((id) => `<span class="chip">${WORD[id].emoji} ${en(WORD[id].en)}</span>`).join('')}</div>` : ''}
      ${st > before ? `<p class="lead flag">🚩 שלב חדש בקריירה: ${C.stages[st].name}</p>` : ''}
      <p class="lead">${en(state.profile.idol)} מרים את סרט הקפטן לכבודך. המגרש נפתח שוב מחר.</p>
      <button class="btn btn-go glow" id="ok">פותחים חבילה</button>
    </div></section>`, 'scr-play');
    on('#ok', () => { Sfx.tap(); packScreen(pack, 'חבילת הסיום', career); });
  }

  // ---------- the coach (parent) screen: a 2-second press on the scoreboard title, then a 4-digit code ----------
  let pressTimer = null;
  let coachOpenedAt = 0;
  $app.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('#coachTap')) return;
    pressTimer = setTimeout(() => { pressTimer = null; openCoach(); }, 2000);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => $app.addEventListener(ev, () => { clearTimeout(pressTimer); pressTimer = null; }));
  $app.addEventListener('contextmenu', (e) => { if (e.target.closest('#coachTap')) e.preventDefault(); });
  // The finger that did the long press lifts after the code dialog closes, and the browser sends its click
  // to whatever is under it by then. Swallow clicks for a moment after the screen opens.
  $app.addEventListener('click', (e) => { if (Date.now() - coachOpenedAt < 600) { e.stopPropagation(); e.preventDefault(); } }, true);

  function openCoach() {
    if (!state.settings.coachPin) { // chosen on the first open
      const p = prompt('מסך המאמן: בחרו קוד בן 4 ספרות (ישמש מעכשיו)');
      if (p === null) return;
      if (!/^\d{4}$/.test(p.trim())) return alert('צריך 4 ספרות');
      state.settings.coachPin = p.trim();
      save();
    } else {
      const p = prompt('קוד מאמן');
      if (p === null) return;
      if (p.trim() !== state.settings.coachPin) return alert('לא הקוד');
    }
    coachOpenedAt = Date.now();
    coach();
  }

  function coach(msg = '') {
    const t = today();
    const d = state.days[t];
    const s = state.session && state.session.day === t ? state.session : null;
    const seen = C.words.filter((w) => state.cards[w.id].seen);
    const names = (ids) => (ids.length ? ids.map((id) => en(WORD[id].en)).join(', ') : 'אין');
    const uniq = (a) => [...new Set(a)];
    const todayHtml = d
      ? `<p>המשחק הושלם: ${d.minutes} דקות, ${d.right} תשובות נכונות מתוך ${d.total}.</p>
         <p>עלו שלב: ${names(d.promoted)}</p><p>ירדו שלב: ${names(d.dropped)}</p>`
      : s ? `<p>המשחק באמצע: ${Math.round(s.ms / 60000)} דקות, ${s.right} נכונות מתוך ${s.total}.</p>
         <p>עלו שלב: ${names(uniq(s.promoted))}</p><p>ירדו שלב: ${names(uniq(s.dropped))}</p>`
        : '<p>עוד לא שוחק היום.</p>';
    const byLevel = [1, 2, 3, 4, 5].map((lv) => `<td><b>${seen.filter((w) => state.cards[w.id].level === lv).length}</b><span>${C.levels[lv]}</span></td>`).join('');
    const hard = seen.filter((w) => state.cards[w.id].misses > 0).sort((a, b) => state.cards[b.id].misses - state.cards[a.id].misses);
    const history = Object.keys(state.days).sort().map((k) => `<tr><td dir="ltr">${k.slice(5)}</td><td>${state.days[k].minutes} דק׳</td><td>${state.days[k].right}/${state.days[k].total}</td></tr>`).join('');
    screen(`<section class="coach">
      <header><h1>מסך המאמן</h1><button class="btn" id="back">חזרה למשחק</button></header>
      <p class="note">${esc(msg)}</p>
      <div class="panel"><h2>היום</h2>${todayHtml}</div>
      <div class="panel"><h2>המילים: ${seen.length} מתוך ${C.words.length} הוצגו</h2>
        <table class="levels"><tr>${byLevel}</tr></table>
        <p>מילים שכדאי לחזור עליהן בעל פה (לפי מספר הטעויות): ${hard.length ? hard.map((w) => `${en(w.en)} (${state.cards[w.id].misses})`).join(', ') : 'אין כרגע'}</p>
        ${history ? `<table class="history"><tr><th>יום</th><th>זמן</th><th>נכונות</th></tr>${history}</table>` : ''}
        ${state.voiceMissing ? '<p class="warn">לא נמצא קול באנגלית באייפד הזה. המילים מוצגות בלי הקראה. אפשר להוסיף קול ב: הגדרות ← נגישות ← תוכן מוקרא ← קולות ← אנגלית.</p>' : ''}
      </div>
      <div class="panel"><h2>הגדרות</h2>
        <p><label>מגרש האימונים, דקות ביום: <input type="number" id="cap" min="0" max="60" value="${state.settings.capMin}"></label>
          <button class="btn sm" id="saveCap">שמירה</button></p>
        <p><button class="btn sm" id="pin">שינוי קוד מאמן</button>
          <button class="btn sm" id="again">לפתוח שוב את המשחק של היום</button></p>
      </div>
      <div class="panel"><h2>גיבוי</h2>
        <p>ההתקדמות נשמרת רק באייפד הזה ורק בכתובת הזאת. כדי להעביר אותה: מעתיקים את הטקסט, ומדביקים אותו כאן במכשיר או בכתובת החדשים.</p>
        <textarea id="box" dir="ltr" rows="4" spellcheck="false"></textarea>
        <p><button class="btn sm" id="exp">הצגת השמירה והעתקה</button> <button class="btn sm" id="imp">טעינה מהטקסט שהודבק</button></p>
      </div>
    </section>`, 'scr-coach');
    on('#back', career);
    on('#saveCap', () => {
      const v = parseInt(document.getElementById('cap').value, 10);
      if (!isNaN(v)) { state.settings.capMin = Math.min(60, Math.max(0, v)); save(); coach('נשמר.'); }
    });
    on('#pin', () => {
      const p = prompt('קוד חדש, 4 ספרות');
      if (p === null) return;
      if (!/^\d{4}$/.test(p.trim())) return coach('צריך 4 ספרות.');
      state.settings.coachPin = p.trim(); save(); coach('הקוד הוחלף.');
    });
    on('#again', () => {
      if (!confirm('לפתוח שוב את המשחק של היום? המילים נשארות בשלב שלהן.')) return;
      delete state.days[t]; state.session = null; save(); coach('המשחק של היום פתוח שוב.');
    });
    on('#exp', () => {
      const box = document.getElementById('box');
      box.value = JSON.stringify(state);
      box.select();
      try { navigator.clipboard.writeText(box.value).then(() => { $app.querySelector('.note').textContent = 'הועתק.'; }, () => {}); } catch (e) { /* the text is selected: copy by hand */ }
    });
    on('#imp', () => {
      let raw = null;
      try { raw = JSON.parse(document.getElementById('box').value); } catch (e) { /* below */ }
      if (!raw || raw.v !== 1 || !raw.cards || !raw.profile) return coach('הטקסט הזה אינו שמירה של המשחק.');
      if (!confirm('להחליף את ההתקדמות שבמכשיר הזה בשמירה שהודבקה?')) return;
      const pin = state.settings.coachPin;
      state = adopt(raw);
      if (!state.settings.coachPin) state.settings.coachPin = pin;
      fillCards(); save(); coach('השמירה נטענה.');
    });
  }

  // ---------- boot ----------
  if (params.has('reset')) { localStorage.removeItem(KEY); location.replace(location.pathname); return; }
  if (!state.profile) setupName(false);
  else career();
})();
