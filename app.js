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
    return { v: 1, profile: null, cards: {}, session: null, days: {}, points: 0, voiceMissing: false, album: {}, settings: { coachPin: null, capMin: 15 },
      mock: null, mocks: {}, train: null };
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
    const tomorrow = '<p>המגרש נפתח שוב מחר. המילים כבר מתאמנות בלחץ.</p>';
    const mk = mockKind(t);
    const mockLive = state.mock && state.mock.day === t;
    let mockHtml = '';
    if (mk && mockLive) mockHtml = `<p>${mk === 'clasico' ? 'הקלאסיקו' : 'משחק ההכנה'} באמצע. היריבה מחכה במנהרה.</p><button class="btn btn-go glow" id="mock">חוזרים למשחק ההכנה</button>`;
    else if (mk && !state.mocks[t]) {
      mockHtml = mk === 'clasico'
        ? `<p>הערב: הקלאסיקו נגד ${en('Real Madrid')}. שמונה תרגילים, בדיוק כמו בדף המבחן.</p><button class="btn btn-go glow" id="mock">עולים לקלאסיקו</button>`
        : `<p>משחק הכנה נגד ${en(rivalOf(t))}: שמונה תרגילים, בדיוק כמו בדף המבחן.</p><button class="btn btn-go glow" id="mock">עולים למשחק ההכנה</button>`;
    } else if (mk) mockHtml = `<p>${mk === 'clasico' ? 'הקלאסיקו' : 'משחק ההכנה'} שוחק: ${state.mocks[t].right} שערים. המגרש נפתח שוב מחר.</p>`;

    let match;
    if (done) {
      match = `<h2>המשחק של היום שוחק</h2>${mockHtml || tomorrow}`;
    } else if (s) {
      match = `<h2>המשחק באמצע</h2><p>המילים מחכות על הדשא.</p><button class="btn btn-go glow" id="go">חוזרים למגרש</button>`;
    } else if (hidden || due) {
      match = `<h2>המשחק של היום</h2>
        <p>${hidden ? `${hidden} מילים חדשות מסתתרות ביציע. ` : ''}${due ? `${due} מילים מהסגל עולות לחימום.` : ''}</p>
        <button class="btn btn-go glow" id="go">עולים למגרש</button>`;
    } else {
      match = `<h2>יום מנוחה</h2>${mockHtml || '<p>אין היום יריבות חדשות. המגרש נפתח שוב מחר.</p>'}`;
    }
    const ts = trainState(t, !done && !!(s || hidden || due));
    const trainBtn = ts === 'closed' ? '' : `<button class="albumbtn trainbtn" id="train" ${ts === 'open' ? '' : 'disabled'}><b>מגרש האימונים</b><span>${
      ts === 'later' ? 'נפתח אחרי המשחק של היום' : ts === 'over' ? 'האימון של היום הסתיים. חוזרים מחר' : `${trainMinutes(t)} מתוך ${state.settings.capMin} דקות היום`}</span></button>`;

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
        <div class="side">
          <button class="albumbtn" id="album"><b>האלבום</b><span>${Object.keys(state.album).length} מתוך ${C.idols.length} קלפים</span></button>
          ${trainBtn}
        </div>
      </div>

      <div class="squad">
        <h2>לוח המילים <small>כל מילה מטפסת מימין לשמאל</small></h2>
        <div class="cols">${cols}</div>
      </div>
    </section>`, 'scr-career');

    on('#go', () => { Sfx.whistle(); Voice.say(' '); startSession(); });
    on('#album', () => { Sfx.tap(); album(); });
    on('#mock', () => { Sfx.whistle(); Voice.say(' '); startMock(); });
    on('#train', () => { Sfx.whistle(); Voice.say(' '); startTraining(); });
  }

  // ---------- the table: every answer of his is a minute of league football for the other clubs too ----------
  function answersGiven() {
    const all = Object.values(state.days).concat(Object.values(state.mocks)); // mocks bring points, so the clubs play on too
    return all.reduce((n, d) => n + (d.total || 0), 0) + (state.session ? state.session.total : 0) + (state.mock ? state.mock.total : 0);
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
        mode: 'match', day: t, log: [],
        queue: E.buildSession({
          words: C.words, foils: C.foils, cards: state.cards, today: t, dayNum: dayNum(t), speech: Voice.ok,
          kit: C.kit, kitIntro: !state.kitSeen, report: C.report, dinner: C.dinner, letters: C.letters, mock: C.mock, name: true,
        }),
        pos: 0, points: 0, combo: 0, bestCombo: 0, right: 0, total: 0,
        promoted: [], dropped: [], ms: 0,
      };
      save();
    }
    run = state.session;
    tick = Date.now();
    play();
  }

  /* ---------- the mock match (days 7 to 9): the test's eight exercises in order. Sets only: no box moves, no pack ---------- */
  function mockKind(t) {
    const d = dayNum(t), m = C.mock;
    return d < m.from || d > m.until ? null : d >= m.clasico ? 'clasico' : 'friendly';
  }
  const rivalOf = (t) => (mockKind(t) === 'clasico' ? 'Real Madrid' : C.mock.friendlies[(dayNum(t) - C.mock.from) % C.mock.friendlies.length]);
  const newRun = (mode, t, queue) => ({ mode, day: t, queue, pos: 0, points: 0, combo: 0, bestCombo: 0, right: 0, total: 0, ms: 0, log: [] });
  function startMock() {
    const t = today();
    if (!state.mock || state.mock.day !== t) {
      state.mock = Object.assign(newRun('mock', t, E.buildMock({
        words: C.words, cards: state.cards, dayNum: dayNum(t), speech: Voice.ok,
        kit: C.kit, dinner: C.dinner, letters: C.letters, report: C.report,
        shape: { pictures: C.pictures, picBlend: C.picBlend, matchGroups: C.matchGroups, stories: C.stories, storyFrom: C.mock.from },
      })), { kind: mockKind(t), rival: rivalOf(t) });
      save();
    }
    run = state.mock;
    tick = Date.now();
    play();
  }
  function mockpart(item) {
    const P = C.mock.parts[item.part];
    screen(`<section class="play">${hud()}
      <div class="stage break mockpart">
        <p class="kicker">${run.kind === 'clasico' ? `הקלאסיקו נגד ${en(run.rival)}` : `משחק הכנה נגד ${en(run.rival)}`}</p>
        <div class="partno">${P.no ? `<b>${P.no}</b><span>תרגיל ${P.no} מתוך 8</span>` : `<b>${item.part === 'name' ? '✍️' : '⏱️'}</b>`}</div>
        <h1 class="h-sm">${P.title}</h1>
        <p class="lead">${P.line}</p>
        <button class="btn btn-go" id="ok">${item.part === 'name' ? 'שריקת פתיחה' : 'קדימה'}</button>
      </div></section>`, 'scr-play');
    bindHud();
    on('#ok', () => { Sfx.tap(); next(); });
  }
  function mockEnd() {
    const s = run;
    clock();
    state.mocks[s.day] = {
      kind: s.kind, rival: s.rival, points: s.points, right: s.right, total: s.total, minutes: Math.round(s.ms / 60000),
      parts: E.summarise(s.log, 'p'), sets: E.summarise(s.log, 't'),
    };
    state.mock = null;
    run = null;
    save();
    Sfx.up();
    const cl = s.kind === 'clasico';
    screen(`<section class="play"><div class="stage break mockend">
      <p class="kicker">שריקת הסיום</p>
      <h1>${cl ? 'הקלאסיקו שלנו!' : 'ניצחון במשחק ההכנה!'}</h1>
      <div class="score"><div><b>${s.right}</b><span>שערים</span></div><div><b>${s.points}</b><span>נקודות</span></div><div><b>${s.bestCombo}</b><span>הרצף הכי ארוך</span></div></div>
      <p class="lead">${cl ? `${en('Real Madrid')} מבקשת לבדוק ב־VAR. אין מה לבדוק.` : `${en(s.rival)} ביקשו לשמור את הכדור למזכרת.`}</p>
      <p class="lead">${en(state.profile.idol)} כבר מחכה ליום המבחן. המגרש נפתח שוב מחר.</p>
      <button class="btn btn-go glow" id="ok">חזרה לקריירה</button>
    </div></section>`, 'scr-play');
    on('#ok', () => { Sfx.tap(); career(); });
  }

  /* ---------- the training ground: free play against the craftiest opponents. Capped by the coach.
     No box moves, no points, no pack, no streak: only training minutes. ---------- */
  function trainMinutes(t) { return state.train && state.train.day === t ? Math.floor(state.train.ms / 60000) : 0; }
  function trainState(t, matchWaiting) {
    if (!(state.settings.capMin > 0)) return 'closed';
    if (matchWaiting) return 'later';
    const tr = state.train && state.train.day === t ? state.train : null;
    return tr && tr.ms >= state.settings.capMin * 60000 ? 'over' : 'open';
  }
  const pastSets = () => Object.values(state.days).map((d) => d.sets).concat(Object.values(state.mocks).map((m) => m.sets)).filter(Boolean);
  function startTraining() {
    const t = today();
    if (!state.train || state.train.day !== t) state.train = Object.assign(newRun('train', t, []), { rounds: 0 });
    const tr = state.train;
    if (tr.pos >= tr.queue.length) {
      const queue = [{ type: 'trainstart' }].concat(E.buildTraining({
        words: C.words, cards: state.cards, history: pastSets(), speech: Voice.ok, kit: C.kit, dinner: C.dinner,
      }));
      Object.assign(tr, { queue, pos: 0, combo: 0, bestCombo: 0, right: 0, total: 0, log: [], rounds: tr.rounds + 1 });
    }
    save();
    run = tr;
    tick = Date.now();
    play();
  }
  function trainstart() {
    screen(`<section class="play">${hud()}
      <div class="stage break">
        <p class="kicker">מגרש האימונים</p>
        <h1 class="h-sm">היריבות הכי ערמומיות</h1>
        <p class="lead">הן מחכות כאן לעוד סיבוב. כאן לא סופרים נקודות ולא מזיזים אף מילה בלוח. רק אימון.</p>
        <button class="btn btn-go" id="ok">יוצאים לאימון</button>
      </div></section>`, 'scr-play');
    bindHud();
    on('#ok', () => { Sfx.tap(); next(); });
  }
  function trainEnd() {
    const s = run;
    clock();
    const over = s.ms >= state.settings.capMin * 60000;
    s.pos = s.queue.length; // the round is closed
    run = null;
    save();
    Sfx.up();
    screen(`<section class="play"><div class="stage break">
      <p class="kicker">מגרש האימונים</p>
      <h1>${over ? 'האימון הסתיים' : 'סוף הסבב'}</h1>
      <div class="score"><div><b>${Math.floor(s.ms / 60000)}</b><span>דקות אימון היום</span></div><div><b>${s.bestCombo}</b><span>הרצף הכי ארוך</span></div></div>
      <p class="lead">${over ? 'היריבות הערמומיות הלכו לנוח. הן צריכות את זה. חוזרים מחר.' : 'היריבות הערמומיות מתנשפות ליד הקו.'}</p>
      <p>${over ? '' : '<button class="btn btn-go glow" id="more">עוד סבב</button> '}<button class="btn" id="ok">חזרה לקריירה</button></p>
    </div></section>`, 'scr-play');
    on('#more', () => { Sfx.whistle(); startTraining(); });
    on('#ok', () => { Sfx.tap(); career(); });
  }

  let run = null; // the match, the mock or the training round on the pitch now
  let tick = 0;
  let locked = false;
  function clock() { // playing time, with long pauses not counted
    const now = Date.now();
    if (run) run.ms += Math.min(now - tick, 60000);
    tick = now;
  }
  const mult = (combo) => (combo >= 10 ? 4 : combo >= 6 ? 3 : combo >= 3 ? 2 : 1);

  function hud() {
    const s = run;
    const pct = Math.round((s.pos / s.queue.length) * 100);
    const m = mult(s.combo);
    return `<header class="hud">
      <button class="hud-home" id="home" aria-label="חזרה למסך הקריירה">⌂</button>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="combo ${m > 1 ? 'hot' : ''}">רצף <b>${s.combo}</b>${m > 1 ? `<em dir="ltr">×${m}</em>` : ''}</div>
      ${s.mode === 'train' ? `<div class="pts"><b id="pts">${Math.floor(s.ms / 60000)}</b> דק׳ אימון</div>` : `<div class="pts"><b id="pts">${s.points}</b> נק׳</div>`}
    </header>`;
  }
  function paintScore() {
    const el = document.getElementById('pts');
    if (el) el.textContent = run.mode === 'train' ? Math.floor(run.ms / 60000) : run.points;
    const c = $app.querySelector('.combo b');
    if (c) c.textContent = run.combo;
  }
  function bindHud() { on('#home', () => { clock(); save(); run = null; career(); }); }

  function play() {
    const s = run;
    locked = false;
    if (s.mode === 'train' && s.ms >= state.settings.capMin * 60000) return trainEnd();
    while (s.pos < s.queue.length) { // a shoot-out kick is only for a word that is in the squad
      const it = s.queue[s.pos];
      if (it.phase === 'shootout' && it.wordId && state.cards[it.wordId].level < 3) s.pos++;
      else break;
    }
    if (s.pos >= s.queue.length) return s.mode === 'mock' ? mockEnd() : s.mode === 'train' ? trainEnd() : fullTime();
    const item = s.queue[s.pos];
    ({ intro, recognise, whistle, missing, bank, sentence, spell, halftime, shootout, kitintro, colour, sort, whereintro, where, report, dinner, letter,
      name: nameDrill, mockpart, trainstart, bankboard, dinnerboard, abc, matchboard, story })[item.type](item);
  }
  function next() { clock(); run.pos++; save(); play(); }

  const isMatch = (s) => !s.mode || s.mode === 'match';
  // what an answer was about, for the coach's report and the training ground
  const keyOf = (item) => item.wordId || item.letter || item.colour || item.prep || item.dish || item.type;
  function tally(correct, key) { // points and the combo for one answer, and a line in the log for the test-shaped sets
    const s = run;
    const it = s.queue[s.pos];
    if (it && (it.set || !isMatch(s))) (s.log || (s.log = [])).push({ t: it.type, p: it.part, k: key, ok: correct });
    s.total++;
    if (!correct) { s.combo = 0; return 0; }
    s.right++;
    s.combo++;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    if (s.mode === 'train') return 0; // the training ground counts minutes only
    const gained = 10 * mult(s.combo);
    s.points += gained;
    state.points += gained;
    return gained;
  }

  function settle(item, correct, missHtml) {
    if (locked) return;
    locked = true;
    keyHandler = null;
    const s = run;
    let res = null;
    if (isMatch(s) && item.wordId && !item.set) { // a test-shaped set, the mock and the training ground never move a box
      const card = state.cards[item.wordId];
      res = E.answer(card, { drill: item.type, correct, today: s.day, retry: !!item.retry });
      E.followUps(s.queue, s.pos, item, card, res, { words: C.words, speech: Voice.ok });
      if (res.to > res.from) s.promoted.push(item.wordId);
      if (res.to < res.from) s.dropped.push(item.wordId);
    } else if (s.mode === 'train' && !correct && !item.again) {
      s.queue.push(Object.assign({}, item, { again: true })); // once more at the end of the round
    }
    const gained = tally(correct, keyOf(item));
    clock();
    save();

    const word = item.wordId ? WORD[item.wordId].en : item.type === 'name' ? C.playerName : item.foil || item.colour || item.prep || (item.type === 'dinner' ? WORD[item.a].en : item.letter);
    const spoken = Voice.say(item.type === 'sentence' ? WORD[item.wordId].sent[0].replace('___', word) : word);
    const moved = res && res.to !== res.from;
    const fb = document.createElement('div');
    fb.className = `fb ${correct ? 'fb-goal' : 'fb-slip'}`;
    if (correct) {
      (moved ? Sfx.up : Sfx.goal)(s.combo);
      const head = C.cheers.combo[s.combo] || pick(item.type, C.cheers.head[item.type]);
      const sub = pick('sub', C.cheers.sub).replace('{w}', en(word));
      fb.innerHTML = `<div class="fb-in"><strong>${head}</strong><span>${sub}${gained ? ` <b class="plus">+${gained}</b>` : ''}</span>
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
    paintScore();
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
        <p class="kicker">${item.phase === 'train' ? 'יריבה ערמומית. מסתכלים לה טוב בעיניים' : 'יריבה חדשה עולה למגרש'}</p>
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
    const d = dayNum(run.day);
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
    if (item.write) return whistleWrite(item);
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

  function typed(item, { kicker, goLabel, prefix, suffix, answer, full, cue, miss }) {
    const w = WORD[item.wordId];
    let buf = '';
    screen(`<section class="play">${hud()}
      <div class="stage">
        <p class="kicker">${kicker}</p>
        ${cue || `<div class="cue"><span class="emoji sm">${w.emoji}</span><span class="he">${esc(w.he)}</span></div>`}
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
        return settle(item, buf === answer, miss ? miss(buf) : markHtml(w.en, attempt));
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
      cue: item.picOnly ? `<div class="cue"><span class="emoji">${w.emoji}</span></div>` : '', // the paper has the picture only
    });
  }

  // Exercise 1 as on paper: the word is heard, and the blend is written
  function whistleWrite(item) {
    const w = WORD[item.wordId];
    typed(item, {
      kicker: 'שריקה! כותבים את הצמד שמתחבא במילה: ch או sh', goLabel: 'כותבים', prefix: '', suffix: '', answer: w.blend, full: false,
      cue: '<button class="say whistle-btn" id="say" aria-label="להשמיע שוב">🔊<span>להשמיע שוב</span></button>',
      miss: (buf) => `<span class="lbl">במילה ${en(w.en)} מתחבא ${en(w.blend)}, לא ${en(buf)}</span>`,
    });
    Voice.say(w.en);
    on('#say', () => Voice.say(w.en));
  }

  /* ---------- the test paper's boards: several gaps on one page, written one after another ----------
     A wrong word is crossed out and the right one written next to it, in place. One try per gap, as on paper. */
  function writeBoard(gaps, done) {
    let g = 0, buf = '';
    const el = (i) => document.getElementById(gaps[i].el);
    const paint = () => {
      gaps.forEach((x, i) => el(i).classList.toggle('active', i === g));
      if (g < gaps.length) el(g).innerHTML = `${esc(buf)}<i class="caret"></i>`;
      const up = g < gaps.length && gaps[g].upper;
      $app.querySelectorAll('.kb .key[data-k]').forEach((k) => { if (k.dataset.k.length === 1) k.textContent = up ? k.dataset.k.toUpperCase() : k.dataset.k; });
    };
    paint();
    bindKeys((k) => {
      if (g >= gaps.length) return;
      const x = gaps[g];
      if (k === 'DEL') buf = buf.slice(0, -1);
      else if (k === 'ENTER') {
        if (!buf) return;
        const ok = buf.toLowerCase() === x.a.toLowerCase();
        tally(ok, x.key); paintScore();
        (ok ? Sfx.goal : Sfx.slip)(run.combo);
        const box = el(g);
        box.classList.remove('active');
        box.classList.add(ok ? 'ok' : 'bad');
        box.innerHTML = ok ? esc(x.a) : `<s>${esc(buf)}</s> ${esc(x.a)}`;
        if (x.say) Voice.say(x.say);
        if (x.after) x.after(ok);
        buf = ''; g++;
        if (g >= gaps.length) { keyHandler = null; return done(); }
      } else if (/^[a-z]$/.test(k) && buf.length < 16) buf += x.upper ? k.toUpperCase() : k;
      paint();
    });
  }
  // the button under a finished board
  function boardDone(label = 'הדף מלא. ממשיכים') {
    const kb = $app.querySelector('.kb');
    if (kb) kb.outerHTML = `<button class="btn btn-go" id="ok">${label}</button>`;
    else $app.querySelector('.stage').insertAdjacentHTML('beforeend', `<button class="btn btn-go" id="ok">${label}</button>`);
    on('#ok', () => { Sfx.tap(); next(); });
  }
  const bankHtml = (ids) => `<div class="wbank" dir="ltr"><b>Word Bank:</b> ${ids.map((id) => `<span data-b="${id}">${esc(WORD[id].en)}</span>`).join('')}</div>`;
  const useBank = (id) => { const b = $app.querySelector(`.wbank [data-b="${id}"]`); if (b) b.classList.add('used'); };

  // Exercise 2: five pictures, a bank of five words, the word written under each picture
  function bankboard(item) {
    screen(`<section class="play">${hud()}
      <div class="stage board">
        <p class="kicker">מחסן המילים: כותבים מתחת לכל תמונה את המילה שלה</p>
        ${bankHtml(E.shuffle(item.ids, Math.random))}
        <div class="pics" dir="ltr">${item.ids.map((id, i) => `<div class="pic"><span class="emoji sm">${WORD[id].emoji}</span><b class="wgap" id="g${i}"></b></div>`).join('')}</div>
        ${keyboardHtml('כותבים')}
      </div></section>`, 'scr-play');
    bindHud();
    writeBoard(item.ids.map((id, i) => ({ el: `g${i}`, a: WORD[id].en, key: id, say: WORD[id].en, after: () => useBank(id) })), () => boardDone());
  }

  // Exercise 5: three dishes, a bank of three words
  function dinnerboard(item) {
    screen(`<section class="play">${hud()}
      <div class="stage board">
        <p class="kicker">ארוחת הקבוצה: הטבח רוצה להכין שלוש מנות. כותבים בכל משפט מה הוא צריך</p>
        <div class="emoji sm">🧑‍🍳</div>
        ${bankHtml(item.bank)}
        <ol class="lines" dir="ltr" lang="en">${item.rows.map((r, i) => `<li>I want to make ${esc(r.dish)}. I need <b class="wgap" id="g${i}"></b>.</li>`).join('')}</ol>
        ${keyboardHtml('כותבים')}
      </div></section>`, 'scr-play');
    bindHud();
    writeBoard(item.rows.map((r, i) => ({ el: `g${i}`, a: WORD[r.a].en, key: r.dish, say: `I need ${WORD[r.a].en}`, after: () => useBank(r.a) })), () => boardDone());
  }

  // Exercise 6: the alphabet table, capitals above and small letters below, the missing ones written in
  function abc(item) {
    const gap = (i, row) => item.blanks.find((b) => b.i === i && b.row === row);
    const cell = (l, i, row) => (gap(i, row)
      ? `<td><b class="wgap" id="c${row}${i}"></b></td>`
      : `<td>${row === 'cap' ? l.toUpperCase() : l}</td>`);
    screen(`<section class="play">${hud()}
      <div class="stage board">
        <p class="kicker">טבלת האותיות: משלימים את האותיות החסרות</p>
        <table class="abc" dir="ltr">
          <tr>${item.letters.map((l, i) => cell(l, i, 'cap')).join('')}</tr>
          <tr>${item.letters.map((l, i) => cell(l, i, 'small')).join('')}</tr>
        </table>
        ${keyboardHtml('כותבים')}
      </div></section>`, 'scr-play');
    bindHud();
    // column by column, as the eye reads the table
    const order = item.blanks.slice().sort((a, b) => a.i - b.i || (a.row === 'cap' ? -1 : 1));
    writeBoard(order.map((b) => {
      const l = item.letters[b.i];
      return { el: `c${b.row}${b.i}`, a: b.row === 'cap' ? l.toUpperCase() : l, upper: b.row === 'cap', key: l };
    }), () => boardDone());
  }

  // Exercise 7: four sentence starts and four words. Tap a word, then the sentence it ends (or the other way round)
  function matchboard(item) {
    const start = (id) => {
      const t = WORD[id].sent[0];
      return /___[.!?]?$/.test(t) ? `${esc(t.replace(/\s*___[.!?]?$/, ''))}…` : esc(t).replace('___', '<b class="gap">&nbsp;</b>');
    };
    screen(`<section class="play">${hud()}
      <div class="stage board">
        <p class="kicker">חצאי משפטים: נוגעים במילה ואז במשפט שלה</p>
        <div class="match2" dir="ltr" lang="en">
          <ol class="starts">${item.ids.map((id, i) => `<li><button class="mstart" data-id="${id}"><i>${i + 1}.</i> ${start(id)}</button></li>`).join('')}</ol>
          <ul class="ends">${item.words.map((id) => `<li><button class="mword" data-id="${id}"><b class="num"></b> ${esc(WORD[id].en)}</button></li>`).join('')}</ul>
        </div>
        <p class="note" id="mnote"></p>
      </div></section>`, 'scr-play');
    bindHud();
    let word = null, startId = null, left = item.ids.length;
    const tried = new Set();
    const pick = (sel, id) => $app.querySelector(`${sel}[data-id="${id}"]`);
    const tryPair = () => {
      if (!word || !startId) return;
      const ok = word === startId;
      if (!tried.has(word)) { tried.add(word); tally(ok, word); paintScore(); }
      const wEl = pick('.mword', word), sEl = pick('.mstart', startId);
      if (ok) {
        Sfx.goal(run.combo);
        wEl.querySelector('.num').textContent = item.ids.indexOf(word) + 1;
        wEl.classList.add('done'); sEl.classList.add('done'); wEl.disabled = true; sEl.disabled = true;
        wEl.classList.remove('sel'); sEl.classList.remove('sel');
        Voice.say(WORD[word].sent[0].replace('___', WORD[word].en));
        document.getElementById('mnote').textContent = '';
        if (--left === 0) boardDone();
      } else {
        Sfx.slip();
        [wEl, sEl].forEach((x) => { x.classList.remove('sel'); x.classList.add('shake'); setTimeout(() => x.classList.remove('shake'), 500); });
        document.getElementById('mnote').innerHTML = `${en(WORD[word].en)} לא נכנסת למשפט הזה. מנסים משפט אחר.`;
      }
      word = null; startId = null;
    };
    on('.mword', (e) => { word = e.currentTarget.dataset.id; $app.querySelectorAll('.mword').forEach((x) => x.classList.toggle('sel', x === e.currentTarget)); Voice.say(WORD[word].en); tryPair(); });
    on('.mstart', (e) => { startId = e.currentTarget.dataset.id; $app.querySelectorAll('.mstart').forEach((x) => x.classList.toggle('sel', x === e.currentTarget)); tryPair(); });
  }

  // Exercise 8: a story, three yes/no lines, and three lines completed with words written from the story
  function story(item) {
    const st = C.stories[item.story];
    const qs = [...st.yesno.map((x) => Object.assign({ yn: true }, x)), ...st.fill];
    let i = 0;
    screen(`<section class="play">${hud()}
      <div class="stage board storyst">
        <p class="kicker">סיפור קצר: קוראים ועונים. נגיעה במשפט משמיעה אותו</p>
        <div class="storygrid">
          <div class="paper" dir="ltr" lang="en"><h2>${esc(st.title)}</h2>
            <p>${st.text.map((t, k) => `<span class="sen" data-k="${k}">${esc(t)}</span>`).join(' ')}</p>
            <p class="gloss">${st.glossary.map(([e, h], k) => `${'*'.repeat(k + 1)}${esc(e)} = <bdi dir="rtl">${esc(h)}</bdi>`).join('&nbsp;&nbsp;&nbsp;')}</p>
          </div>
          <div class="qbox">
            <p class="qno" id="qno"></p>
            <p class="sentence sm" id="rq" dir="ltr" lang="en"></p>
            <div id="qin"></div>
            <p class="note" id="rnote"></p>
          </div>
        </div>
      </div></section>`, 'scr-play');
    bindHud();
    on('.sen', (e) => Voice.say(e.currentTarget.textContent.replace(/\*/g, '')));
    const light = (q, onOff) => [].concat(q.at).forEach((k) => $app.querySelector(`.sen[data-k="${k}"]`).classList.toggle('lit', onOff));
    const after = (q, ok) => {
      const go = () => { light(q, false); document.getElementById('rnote').textContent = ''; i++; show(); };
      if (ok) return setTimeout(go, 900);
      light(q, true);
      document.getElementById('rnote').innerHTML = 'התשובה מתחבאת במשפט המסומן. <button class="btn sm" id="rnext">ממשיכים</button>';
      document.getElementById('rnext').addEventListener('click', go, { once: true });
    };
    function show() {
      const qin = document.getElementById('qin');
      if (i >= qs.length) {
        document.getElementById('qno').textContent = ''; document.getElementById('rq').textContent = ''; qin.innerHTML = '';
        return boardDone('הסיפור נסגר. ממשיכים');
      }
      const q = qs[i];
      const key = `s${item.story}:${i}`;
      if (q.yn) {
        document.getElementById('qno').textContent = `Write Yes / No · שורה ${i + 1} מתוך ${qs.length}`;
        document.getElementById('rq').textContent = q.q;
        qin.innerHTML = '<div class="opts two" dir="ltr"><button class="opt word" data-v="yes">Yes</button><button class="opt word" data-v="no">No</button></div>';
        let done = false;
        qin.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', (e) => {
          if (done) return; done = true;
          const right = q.a ? 'yes' : 'no';
          const ok = e.currentTarget.dataset.v === right;
          tally(ok, key); paintScore(); (ok ? Sfx.goal : Sfx.slip)(run.combo);
          e.currentTarget.classList.add(ok ? 'is-right' : 'is-wrong');
          qin.querySelector(`[data-v="${right}"]`).classList.add('is-right');
          after(q, ok);
        }));
      } else {
        document.getElementById('qno').textContent = `מילה אחת מהסיפור בכל רווח · שורה ${i + 1} מתוך ${qs.length}`;
        let n = 0;
        document.getElementById('rq').innerHTML = esc(q.q).replace(/___/g, () => `<b class="wgap" id="q${i}g${n++}"></b>`);
        qin.innerHTML = keyboardHtml('כותבים');
        let all = true;
        writeBoard(q.a.map((a, j) => ({ el: `q${i}g${j}`, a, key: `${key}${q.a.length > 1 ? `.${j}` : ''}`, after: (ok) => { all = all && ok; } })), () => {
          qin.innerHTML = '';
          after(q, all);
        });
      }
    }
    show();
  }

  function spell(item) {
    typed(item, {
      kicker: item.phase === 'shootout' || item.retry ? 'פנדל! כותבים את המילה כולה' : 'כותבים את המילה כולה',
      goLabel: 'בועטים', prefix: '', suffix: '', answer: WORD[item.wordId].en, full: true,
    });
  }

  // His name, as on the top of the test paper: capital first letter, as the iPad does at the start of a name
  function nameDrill(item) {
    let buf = '';
    const target = C.playerName;
    screen(`<section class="play">${hud()}
      <div class="stage">
        <p class="kicker">${item.phase === 'mock' ? 'בראש הדף: השם באנגלית' : 'איש הציוד מדפיס חולצה חדשה. מה כתוב על הגב?'}</p>
        <div class="namebox" id="nb" dir="ltr"></div>
        ${keyboardHtml('מדפיסים')}
      </div></section>`, 'scr-play');
    bindHud();
    const paint = () => {
      document.getElementById('nb').innerHTML = `${buf ? `<b class="cap">${buf[0]}</b>${buf.slice(1)}` : ''}<i class="caret"></i>`;
      $app.querySelectorAll('.kb .key[data-k]').forEach((el) => {
        if (el.dataset.k.length === 1) el.textContent = buf ? el.dataset.k : el.dataset.k.toUpperCase();
      });
    };
    paint();
    bindKeys((k) => {
      if (locked) return;
      if (k === 'DEL') buf = buf.slice(0, -1);
      else if (k === 'ENTER') { if (buf) settle(item, buf === target, markHtml(target, buf)); return; }
      else if (/^[a-z]$/.test(k) && buf.length < 8) buf += buf ? k : k.toUpperCase();
      paint();
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

  // the colour sort as on paper: six words in a bank, picked in any order, two in each colour column
  function sort(item) {
    screen(`<section class="play">${hud()}
      <div class="stage kit-sort">
        <p class="kicker">המחסנאי התבלבל: נוגעים במילה ואז בעמודה של הצבע שלה. שתיים בכל עמודה</p>
        <div class="wbank sortbank" dir="ltr">${item.foods.map((f) => `<button class="food" data-id="${f.id}">${esc(WORD[f.id].en)}</button>`).join('')}</div>
        <div class="shelves" dir="ltr">${item.cols.map((c) => `<button class="shelf" data-c="${c}"><b lang="en">${c}</b><span class="on"></span></button>`).join('')}</div>
        <p class="note" id="sortnote"></p>
      </div></section>`, 'scr-play');
    bindHud();
    let sel = null, left = item.foods.length;
    on('.food', (e) => {
      if (e.currentTarget.disabled) return;
      sel = e.currentTarget.dataset.id;
      $app.querySelectorAll('.food').forEach((x) => x.classList.toggle('sel', x === e.currentTarget));
      Voice.say(WORD[sel].en);
    });
    on('.shelf', (e) => {
      if (!sel) { document.getElementById('sortnote').textContent = 'קודם בוחרים מילה מהמחסן.'; return; }
      const f = item.foods.find((x) => x.id === sel), w = WORD[f.id];
      const ok = e.currentTarget.dataset.c === f.col;
      tally(ok, f.id); clock(); save();
      (ok ? Sfx.goal : Sfx.slip)(run.combo);
      const shelf = e.currentTarget;
      if (!ok) { shelf.classList.add('is-wrong'); setTimeout(() => shelf.classList.remove('is-wrong'), 900); }
      const home = $app.querySelector(`.shelf[data-c="${f.col}"]`);
      home.querySelector('.on').insertAdjacentHTML('beforeend', `<span class="chip ${ok ? '' : 'moved'}">${w.emoji} ${en(w.en)}</span>`);
      document.getElementById('sortnote').innerHTML = ok ? '' : `${en(w.en)} חמקה לעמודה של ${en(f.col)}.`;
      const b = $app.querySelector(`.food[data-id="${f.id}"]`);
      b.disabled = true; b.classList.remove('sel'); b.classList.add('used');
      sel = null;
      paintScore();
      if (--left === 0) {
        $app.querySelectorAll('.shelf').forEach((x) => { x.style.setProperty('--c', COLOUR[x.dataset.c].hex); x.classList.add('lit'); });
        $app.querySelector('.stage').insertAdjacentHTML('beforeend', '<button class="btn btn-go" id="ok">המדפים מסודרים. ממשיכים</button>');
        on('#ok', () => { Sfx.tap(); next(); });
      }
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

  // Team dinner: the cook wants to make a dish, and one of four words is what it needs
  function dinner(item) {
    const w = WORD[item.a];
    const opts = E.shuffle([item.a, ...item.wrong], Math.random).map((id) => WORD[id]);
    const sent = (inner) => `I want to make ${esc(item.dish)}. I need <b class="gap">${inner}</b>.`;
    screen(`<section class="play">${hud()}
      <div class="stage kit-dinner">
        <p class="kicker">ארוחת הקבוצה: מה חסר לטבח?</p>
        <div class="emoji sm">🧑‍🍳</div>
        <p class="sentence" id="dsent" dir="ltr" lang="en" data-dish="${esc(item.dish)}">${sent('&nbsp;')}</p>
        <div class="opts four" dir="ltr">${opts.map((o) => `<button class="opt word" data-id="${o.id}">${esc(o.en)}</button>`).join('')}</div>
      </div></section>`, 'scr-play');
    bindHud();
    on('.opt', (e) => {
      const ok = e.currentTarget.dataset.id === w.id;
      e.currentTarget.classList.add(ok ? 'is-right' : 'is-wrong');
      $app.querySelector(`.opt[data-id="${w.id}"]`).classList.add('is-right');
      document.getElementById('dsent').innerHTML = sent(esc(w.en));
      settle(item, ok, `<span class="lbl">${w.emoji} ${en(w.en)} זה ${esc(w.he)}</span><span class="sentence sm" dir="ltr" lang="en">${sent(esc(w.en))}</span>`);
    });
  }

  // Kit numbers: a capital letter looks for its small one, or the other way round
  const LOOKALIKE = { b: 'dpq', d: 'bpq', p: 'qbd', q: 'pgd', g: 'qjy', j: 'giy', i: 'ljt', l: 'itj', t: 'fli', f: 'tlk', m: 'nwu', n: 'muh', h: 'nbk', u: 'nvw', v: 'uwy', w: 'vmu', y: 'vgj', a: 'eoc', e: 'aco', o: 'ace', c: 'oes', s: 'czx', z: 'sxk', x: 'kzs', k: 'xhf', r: 'nfc' };
  function letter(item) {
    const l = item.letter;
    const show = (x) => (item.rev ? x.toUpperCase() : x); // the options: small letters, or capitals when the cue is small
    const cue = item.rev ? l : l.toUpperCase();
    const opts = E.shuffle([l, ...LOOKALIKE[l]], Math.random);
    screen(`<section class="play">${hud()}
      <div class="stage kit-letter">
        <p class="kicker">מספרי החולצות: ${item.rev ? 'מי האות הגדולה של הקטנה הזאת?' : 'מי האות הקטנה של הגדולה הזאת?'}</p>
        <div class="pair" dir="ltr"><b id="lcue">${cue}</b><i id="lgap"></i></div>
        <div class="opts four" dir="ltr">${opts.map((o) => `<button class="opt blend" data-l="${o}">${show(o)}</button>`).join('')}</div>
      </div></section>`, 'scr-play');
    bindHud();
    on('.opt', (e) => {
      const ok = e.currentTarget.dataset.l === l;
      e.currentTarget.classList.add(ok ? 'is-right' : 'is-wrong');
      $app.querySelector(`.opt[data-l="${l}"]`).classList.add('is-right');
      document.getElementById('lgap').textContent = show(l);
      settle(item, ok, `<span class="lbl">הזוג:</span><span class="spellrow right" dir="ltr">${l.toUpperCase()} ${l}</span>`);
    });
  }

  // ---------- the Match report: a short text, three yes/no lines and three one-word completions. A set ----------
  function report(item) {
    const p = C.report.passages[item.passage];
    const qs = [...p.yesno.map((x) => Object.assign({ yn: true }, x)), ...p.fill];
    let i = 0;
    screen(`<section class="play">${hud()}
      <div class="stage report">
        <p class="kicker">דו״ח המשחק: קוראים את הכתבה ועונים. נגיעה במשפט משמיעה אותו</p>
        <div class="paper" dir="ltr" lang="en"><h2>${esc(p.title)}</h2><p>${p.text.map((t, k) => `<span class="sen" data-k="${k}">${esc(t)}</span>`).join(' ')}</p></div>
        <p class="qno" id="qno"></p>
        <p class="sentence sm" id="rq" dir="ltr" lang="en"></p>
        <div class="opts four" id="ropts" dir="ltr"></div>
        <p class="note" id="rnote"></p>
      </div></section>`, 'scr-play');
    bindHud();
    on('.sen', (e) => Voice.say(e.currentTarget.textContent));
    const gap = (q, inner) => { const parts = q.q.split('___'); return `${esc(parts[0])}<b class="gap">${inner}</b>${esc(parts[1])}`; };
    const show = () => {
      const q = qs[i];
      document.getElementById('qno').textContent = q.yn ? `שורה ${i + 1} מתוך ${qs.length}: נכון לפי הכתבה?` : `שורה ${i + 1} מתוך ${qs.length}: איזו מילה חסרה?`;
      document.getElementById('rq').innerHTML = q.yn ? esc(q.q) : gap(q, '&nbsp;');
      const opts = q.yn ? [['yes', 'Yes'], ['no', 'No']] : E.shuffle([q.a, ...q.wrong], Math.random).map((o) => [o, o]);
      const box = document.getElementById('ropts');
      box.className = `opts ${q.yn ? 'two' : 'four'}`;
      box.innerHTML = opts.map(([v, label]) => `<button class="opt word" data-v="${esc(v)}">${esc(label)}</button>`).join('');
      box.querySelectorAll('.opt').forEach((el) => el.addEventListener('click', pickOne));
    };
    function pickOne(e) {
      if (locked) return;
      locked = true;
      const q = qs[i];
      const right = q.yn ? (q.a ? 'yes' : 'no') : q.a;
      const ok = e.currentTarget.dataset.v === right;
      tally(ok, `${item.passage}:${i}`); clock(); save();
      (ok ? Sfx.goal : Sfx.slip)(run.combo);
      e.currentTarget.classList.add(ok ? 'is-right' : 'is-wrong');
      $app.querySelector(`#ropts .opt[data-v="${right}"]`).classList.add('is-right');
      if (!q.yn) document.getElementById('rq').innerHTML = gap(q, esc(q.a));
      const sen = $app.querySelector(`.sen[data-k="${q.at}"]`);
      if (!ok) { sen.classList.add('lit'); document.getElementById('rnote').textContent = 'התשובה מתחבאת במשפט המסומן.'; }
      paintScore();
      const go = () => {
        sen.classList.remove('lit'); document.getElementById('rnote').textContent = '';
        if (++i < qs.length) { locked = false; return show(); }
        document.getElementById('qno').textContent = '';
        document.getElementById('rq').textContent = '';
        document.getElementById('ropts').innerHTML = '<button class="btn btn-go" id="ok">הכתבה נסגרה. ממשיכים</button>';
        document.getElementById('ropts').className = 'opts one';
        on('#ok', () => { Sfx.tap(); next(); });
      };
      if (ok) setTimeout(go, 800);
      else {
        document.getElementById('rnote').insertAdjacentHTML('beforeend', ' <button class="btn sm" id="rnext">ממשיכים</button>');
        document.getElementById('rnext').addEventListener('click', go, { once: true });
      }
    }
    show();
  }

  function halftime() {
    const s = run;
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
    const s = run;
    clock();
    const before = stageIndex();
    const up = [...new Set(s.promoted)].filter((id) => state.cards[id].level >= 3 && !s.dropped.includes(id));
    state.days[s.day] = {
      done: true, points: s.points, minutes: Math.round(s.ms / 60000),
      promoted: [...new Set(s.promoted)], dropped: [...new Set(s.dropped)], right: s.right, total: s.total,
      sets: E.summarise(s.log),
    };
    state.session = null;
    run = null;
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
      <p class="lead">${en(state.profile.idol)} מרים את סרט הקפטן לכבודך. ${mockKind(s.day) && !state.mocks[s.day] ? 'ומשחק ההכנה כבר מחכה במנהרה.' : 'המגרש נפתח שוב מחר.'}</p>
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

  const SET_HE = {
    name: 'השם (Eitan)', whistle: '1. השריקה: ch או sh בשמיעה', bank: '2. מחסן המילים', sort: '3. מיון לפי צבע', missing: '4. צמד האותיות החסר',
    dinner: '5. I want to make… I need…', letter: '6. זוגות אותיות', sentence: '7. השלמת משפט', report: '8. קטע קריאה', extra: 'צבעים ומילות מיקום',
    bankboard: '2. מחסן המילים (תמונות)', dinnerboard: '5. I want to make… I need…', abc: '6. טבלת האותיות', matchboard: '7. חצאי משפטים', story: '8. סיפור קצר',
    colour: 'מילות צבע', where: 'in / on / under / near', spell: 'כתיבת מילה שלמה (פנדלים)', recognise: 'זיהוי מילה',
  };
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const keyName = (k) => (WORD[k] ? WORD[k].en : /^[a-z]$/.test(k) ? `${k.toUpperCase()}${k}` : k);
  // right / total per drill or per mock part, and what was missed (the reading lines are left out: they have no short name)
  function setsTable(sum, title, order) {
    if (!sum || !Object.keys(sum).length) return '';
    const keys = (order || Object.keys(SET_HE)).filter((k) => sum[k]);
    const rows = keys.map((k) => {
      const o = sum[k];
      const miss = o.missed.filter((x) => !/^s?\d+:\d+/.test(x)).map((x) => `<bdi dir="ltr">${esc(keyName(x))}</bdi>`).join(', ');
      return `<tr class="${o.right < o.total ? 'has-miss' : ''}"><td>${SET_HE[k] || k}</td><td dir="ltr">${o.right}/${o.total}</td><td>${miss}</td></tr>`;
    }).join('');
    return `${title ? `<p>${title}</p>` : ''}<table class="sets"><tr><th>תרגיל</th><th>נכונות</th><th>לחזור על</th></tr>${rows}</table>`;
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
         <p>עלו שלב: ${names(d.promoted)}</p><p>ירדו שלב: ${names(d.dropped)}</p>${setsTable(d.sets, 'בתרגילים בנוסח המבחן היום:')}`
      : s ? `<p>המשחק באמצע: ${Math.round(s.ms / 60000)} דקות, ${s.right} נכונות מתוך ${s.total}.</p>
         <p>עלו שלב: ${names(uniq(s.promoted))}</p><p>ירדו שלב: ${names(uniq(s.dropped))}</p>`
        : '<p>עוד לא שוחק היום.</p>';
    const byLevel = [1, 2, 3, 4, 5].map((lv) => `<td><b>${seen.filter((w) => state.cards[w.id].level === lv).length}</b><span>${C.levels[lv]}</span></td>`).join('');
    const hard = seen.filter((w) => state.cards[w.id].misses > 0).sort((a, b) => state.cards[b.id].misses - state.cards[a.id].misses);
    const history = Object.keys(state.days).sort().map((k) => `<tr><td dir="ltr">${k.slice(5)}</td><td>${state.days[k].minutes} דק׳</td><td>${state.days[k].right}/${state.days[k].total}</td></tr>`).join('');
    const mockDays = Object.keys(state.mocks).sort();
    const mocksHtml = mockDays.length ? mockDays.map((k) => {
      const m = state.mocks[k];
      return `<h3><span dir="ltr">${k.slice(5)}</span> · ${m.kind === 'clasico' ? 'הקלאסיקו' : 'משחק הכנה'}: ${m.right}/${m.total} (${pct(m.right, m.total)}%), ${m.minutes} דקות</h3>
        ${setsTable(m.parts, '', E.MOCK_PARTS)}`;
    }).join('') : `<p>${mockKind(t) || dayNum(t) < C.mock.from ? 'משחק ההכנה הראשון נפתח ביום ראשון 22.11, אחרי המשחק של היום.' : 'לא שוחקו משחקי הכנה.'}</p>`;
    const pool = E.trickyPool({ words: C.words, cards: state.cards, history: pastSets() });
    const poolText = [pool.words.slice(0, 8).map((id) => en(WORD[id].en)).join(', '),
      pool.letters.length ? `אותיות: ${pool.letters.map(keyName).join(' ')}` : '',
      pool.colours.length ? `צבעים: ${pool.colours.map(en).join(', ')}` : '',
      pool.preps.length ? `מילות מיקום: ${pool.preps.map(en).join(', ')}` : '',
      pool.dishes.length ? `ארוחות: ${pool.dishes.map(en).join(', ')}` : '',
      pool.foods.length ? `מיון צבעים: ${pool.foods.map(keyName).join(', ')}` : '',
      pool.name ? 'השם' : ''].filter(Boolean).join(' · ');
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
      <div class="panel"><h2>משחקי ההכנה (תרגילי המבחן לפי הסדר)</h2>${mocksHtml}</div>
      <div class="panel"><h2>מגרש האימונים</h2>
        <p>היום: ${trainMinutes(t)} דקות מתוך ${state.settings.capMin}. לא מזיז מילים בלוח ולא נותן נקודות או חבילות.</p>
        <p>מה מתאמנים שם עכשיו (לפי הטעויות במשחקים ובמשחקי ההכנה): ${poolText || 'עוד אין טעויות. מתאמנים על המילים החדשות ביותר.'}</p>
      </div>
      <div class="panel"><h2>הגדרות</h2>
        <p><label>מגרש האימונים, דקות ביום: <input type="number" id="cap" min="0" max="60" value="${state.settings.capMin}"></label>
          <button class="btn sm" id="saveCap">שמירה</button></p>
        <p><button class="btn sm" id="pin">שינוי קוד מאמן</button>
          <button class="btn sm" id="again">לפתוח שוב את המשחק של היום</button>
          ${state.mocks[t] ? '<button class="btn sm" id="againMock">לפתוח שוב את משחק ההכנה של היום</button>' : ''}</p>
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
    on('#againMock', () => {
      if (!confirm('לפתוח שוב את משחק ההכנה של היום? התוצאה שלו תימחק.')) return;
      delete state.mocks[t]; state.mock = null; save(); coach('משחק ההכנה של היום פתוח שוב.');
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
