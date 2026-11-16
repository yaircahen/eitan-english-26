/* Eitan's game, M1: setup (jersey, number, idol), career screen, the daily match. */
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
    return { v: 1, profile: null, cards: {}, session: null, days: {}, points: 0, voiceMissing: false };
  }
  let state = fresh();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && raw.v === 1) state = Object.assign(fresh(), raw);
  } catch (e) { /* a broken save starts clean */ }
  for (const w of C.words) if (!state.cards[w.id]) state.cards[w.id] = E.newCard();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode: play on */ }
  }

  // ---------- speech and sound ----------
  const Voice = {
    ok: 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined',
    say(text) {
      if (!this.ok) return;
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
        this.last = u; // Safari drops an utterance that is garbage-collected mid-word
        if (busy) this.timer = setTimeout(() => speechSynthesis.speak(u), 120);
        else speechSynthesis.speak(u);
      } catch (e) { /* the word stays on screen */ }
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
        <div class="board-title"><b>הקריירה של ${en(C.playerName)}</b><span>${C.stages[st].name}</span></div>
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

      <div class="squad">
        <h2>לוח המילים <small>כל מילה מטפסת מימין לשמאל</small></h2>
        <div class="cols">${cols}</div>
      </div>
    </section>`, 'scr-career');

    on('#go', () => { Sfx.whistle(); Voice.say(' '); startSession(); });
  }

  // ---------- the match ----------
  function startSession() {
    const t = today();
    if (!state.session || state.session.day !== t) {
      state.session = {
        day: t,
        queue: E.buildSession({ words: C.words, foils: C.foils, cards: state.cards, today: t, dayNum: dayNum(t), speech: Voice.ok }),
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
    ({ intro, recognise, whistle, missing, spell, halftime, shootout })[item.type](item);
  }
  function next() { clock(); state.session.pos++; save(); play(); }

  function settle(item, correct, missHtml) {
    if (locked) return;
    locked = true;
    keyHandler = null;
    const s = state.session;
    let res = null;
    if (item.wordId) {
      const card = state.cards[item.wordId];
      res = E.answer(card, { drill: item.type, correct, today: s.day, retry: !!item.retry });
      E.followUps(s.queue, s.pos, item, card, res, { words: C.words, speech: Voice.ok });
      if (res.to > res.from) s.promoted.push(item.wordId);
      if (res.to < res.from) s.dropped.push(item.wordId);
    }
    s.total++;
    let gained = 0;
    if (correct) {
      s.right++;
      s.combo++;
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      gained = 10 * mult(s.combo);
      s.points += gained;
      state.points += gained;
    } else s.combo = 0;
    clock();
    save();

    const word = item.wordId ? WORD[item.wordId].en : item.foil;
    Voice.say(word);
    const moved = res && res.to !== res.from;
    const fb = document.createElement('div');
    fb.className = `fb ${correct ? 'fb-goal' : 'fb-slip'}`;
    if (correct) {
      (moved ? Sfx.up : Sfx.goal)(s.combo);
      const head = C.cheers.combo[s.combo] || pick(item.type, C.cheers.head[item.type]);
      const sub = pick('sub', C.cheers.sub).replace('{w}', en(word));
      fb.innerHTML = `<div class="fb-in"><strong>${head}</strong><span>${sub} <b class="plus">+${gained}</b></span>
        ${moved ? `<span class="climb">${en(word)} מטפסת: ${C.levels[res.to]}</span>` : ''}</div>`;
      setTimeout(() => { if (fb.isConnected) next(); }, moved ? 1500 : 1000);
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
        <button class="say bigword" id="say" dir="ltr" lang="en">${blendHtml(w)} <span>🔊</span></button>
        <p class="he">${esc(w.he)}</p>
        <p class="line">המילה ${en(w.en)} ${esc(w.line)}</p>
        <button class="btn btn-go" id="ok">תופסים אותה</button>
      </div></section>`, 'scr-play');
    bindHud();
    Voice.say(w.en);
    on('#say', () => Voice.say(w.en));
    on('#ok', () => { Sfx.tap(); state.cards[w.id].seen = true; next(); });
  }

  function recognise(item) {
    const w = WORD[item.wordId];
    const opts = E.shuffle([w, ...E.shuffle(C.words.filter((x) => x.id !== w.id), Math.random).slice(0, 3)], Math.random);
    screen(`<section class="play">${hud()}
      <div class="stage">
        <p class="kicker">מה המילה הזאת מסתירה?</p>
        <button class="say bigword" id="say" dir="ltr" lang="en">${esc(w.en)} <span>🔊</span></button>
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

  function halftime() {
    const s = state.session;
    Sfx.whistle();
    screen(`<section class="play"><div class="stage break">
      <p class="kicker">שריקת המחצית</p>
      <h1>מחצית</h1>
      <div class="score"><div><b>${s.points}</b><span>נקודות</span></div><div><b>${s.bestCombo}</b><span>הרצף הכי ארוך</span></div></div>
      <p class="lead">המילים שותות מים ומתלחשות. בחצי השני הן מאבדות אותיות.</p>
      <button class="btn btn-go glow" id="ok">חצי שני</button>
    </div></section>`, 'scr-play');
    on('#ok', () => { Sfx.tap(); next(); });
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
    const st = stageIndex();
    Sfx.up();
    screen(`<section class="play"><div class="stage break">
      <p class="kicker">שריקת הסיום</p>
      <h1>ניצחון!</h1>
      <div class="score"><div><b>${s.points}</b><span>נקודות היום</span></div><div><b>${s.bestCombo}</b><span>הרצף הכי ארוך</span></div><div><b>${up.length}</b><span>מילים עלו שלב</span></div></div>
      ${up.length ? `<div class="chips center">${up.map((id) => `<span class="chip">${WORD[id].emoji} ${en(WORD[id].en)}</span>`).join('')}</div>` : ''}
      ${st > before ? `<p class="lead flag">🚩 שלב חדש בקריירה: ${C.stages[st].name}</p>` : ''}
      <p class="lead">${en(state.profile.idol)} מרים את סרט הקפטן לכבודך. המגרש נפתח שוב מחר.</p>
      <button class="btn btn-go" id="ok">למסך הקריירה</button>
    </div></section>`, 'scr-play');
    on('#ok', career);
  }

  // ---------- boot ----------
  if (params.has('reset')) { localStorage.removeItem(KEY); location.replace(location.pathname); return; }
  if (!state.profile) setupName(false);
  else career();
})();
