// Questree landing: waitlist form + the four working copies of app screens.
(function () {
  'use strict';
  var SUPABASE_URL = 'https://rfltqamrgldxckcdgbhl.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_0Uu9MVVwXE4-T8YQimQ-aA_SR5G589O';
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (root, sel) { return root.querySelector(sel); };
  var $$ = function (root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); };
  var fmt = function (n) { return n.toLocaleString('en-GB'); };

  // ---- Waitlist ----
  $$(document, '[data-join]').forEach(function (form) {
    var err = form.nextElementSibling;
    var btn = $(form, 'button');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (form.email.value || '').trim();
      err.hidden = true;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.hidden = false; form.email.focus(); return; }
      btn.disabled = true;
      btn.textContent = 'Joining…';
      fetch(SUPABASE_URL + '/rest/v1/signups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Prefer: 'return=minimal' },
        body: JSON.stringify({ email: email })
      }).then(function (res) {
        if (res.status !== 201 && res.status !== 409) throw new Error('signup ' + res.status);
        var done = document.createElement('p');
        done.className = 'join-done';
        done.setAttribute('role', 'status');
        done.textContent = "You're on the list. See you in December.";
        form.replaceWith(done);
      }).catch(function () {
        err.hidden = false;
        btn.disabled = false;
        btn.textContent = 'Join the waitlist';
      });
    });
  });

  // ---- Replicas animate only while on screen ----
  var phones = $$(document, '[data-phone]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('live', en.isIntersecting); });
    }, { rootMargin: '80px' });
    phones.forEach(function (p) { io.observe(p); });
  } else {
    phones.forEach(function (p) { p.classList.add('live'); });
  }

  // A counter that counts up to its new value, as the app's does.
  function countTo(el, to) {
    var from = parseInt(el.textContent.replace(/\D/g, ''), 10) || 0;
    if (calm || from === to) { el.textContent = fmt(to); return; }
    var start = performance.now();
    (function step(now) {
      var t = Math.min(1, (now - start) / 450);
      el.textContent = fmt(Math.round(from + (to - from) * t));
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }

  // A few bolts fly from a logged card's icon to the XP counter.
  function bolts(phone, fromEl, toEl) {
    if (calm || !fromEl.animate) return;
    var box = phone.getBoundingClientRect();
    var a = fromEl.getBoundingClientRect();
    var b = toEl.getBoundingClientRect();
    for (var i = 0; i < 6; i++) {
      var s = document.createElement('span');
      s.className = 'fly';
      s.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12"><path fill="#f2b94a" d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>';
      phone.appendChild(s);
      var x0 = a.left - box.left + a.width / 2 - 6, y0 = a.top - box.top + a.height / 2 - 6;
      var x1 = b.left - box.left - 12, y1 = b.top - box.top + 2;
      var bend = (i - 2.5) * 16;
      s.animate([
        { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(.6)', opacity: 0 },
        { transform: 'translate(' + ((x0 + x1) / 2 + bend) + 'px,' + ((y0 + y1) / 2 - 20) + 'px) scale(1.1)', opacity: 1, offset: 0.5 },
        { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(.7)', opacity: 0.2 }
      ], { duration: 520, delay: i * 45, easing: 'ease-in-out', fill: 'backwards' }).onfinish = (function (n) { return function () { n.remove(); }; })(s);
    }
  }

  // ---- Home: tap a card to log it; tap a logged card (or Undo) to undo ----
  (function () {
    var phone = $(document, '[data-phone="home"]');
    if (!phone) return;
    var open = $(phone, '[data-open]'), done = $(phone, '[data-done]');
    var openLab = $(phone, '[data-open-lab]'), doneLab = $(phone, '[data-done-lab]');
    var prog = $(phone, '[data-prog]'), bar = $(phone, '.prog-bar i'), progBox = $(phone, '.prog');
    var xpEl = $(phone, '[data-xp]'), undo = $(phone, '[data-undo]'), say = $(phone, '[data-say]');
    var reset = phone.parentNode.querySelector('[data-replay]');
    var cards = $$(phone, '[data-quest]');
    var xp = 1240, last = null, undoTimer = 0;

    function paint() {
      var n = done.children.length, total = cards.length;
      prog.textContent = n + '/' + total;
      bar.style.width = (n / total * 100) + '%';
      progBox.classList.toggle('all', n === total);
      openLab.hidden = n === total;
      doneLab.hidden = n === 0;
      doneLab.textContent = n + ' done today';
      reset.hidden = n === 0;
    }
    function move(card, to, first) {
      var had = document.activeElement === card;
      if (first && to.firstChild) to.insertBefore(card, to.firstChild); else to.appendChild(card);
      if (had) card.focus({ preventScroll: true });
    }
    function setLogged(card, on) {
      var title = $(card, '.q-t').textContent;
      card.classList.toggle('done', on);
      card.setAttribute('aria-pressed', on ? 'true' : 'false');
      xp += on ? 10 : -10;
      countTo(xpEl, xp);
      move(card, on ? done : open, !on && cards.indexOf(card) === 0);
      paint();
      say.textContent = on ? title + ' logged. Plus 10 XP. ' + done.children.length + ' of ' + cards.length + ' done today.' : title + ' unlogged.';
    }
    function hideUndo() { clearTimeout(undoTimer); undo.hidden = true; last = null; }
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        var on = !card.classList.contains('done');
        if (on) bolts(phone, $(card, '.q-ic'), xpEl);
        setLogged(card, on);
        hideUndo();
        if (on) {
          last = card;
          undo.hidden = false;
          undoTimer = setTimeout(hideUndo, 2500);
        }
      });
    });
    undo.addEventListener('click', function () {
      var card = last;
      hideUndo();
      if (card) { setLogged(card, false); card.focus({ preventScroll: true }); }
    });
    reset.addEventListener('click', function () {
      hideUndo();
      cards.forEach(function (c) { if (c.classList.contains('done')) setLogged(c, false); });
      cards.forEach(function (c) { open.appendChild(c); });
      say.textContent = '';
    });
  })();

  // ---- Skills: one point to spend on the next node of any tree ----
  (function () {
    var phone = $(document, '[data-phone="skills"]');
    if (!phone) return;
    var pill = $(phone, '[data-pill]'), count = $(phone, '[data-count]'), say = $(phone, '[data-say]');
    var replay = phone.parentNode.querySelector('[data-replay]');
    var ladders = $(phone, '.ladders');
    var start = ladders.innerHTML;

    function bind() {
      $$(ladders, '[data-node]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var li = btn.parentNode, ladder = li.closest('.ladder');
          var own = Number(ladder.dataset.own) + 1;
          ladder.dataset.own = own;
          $$(ladders, 'li.ready').forEach(function (r) { r.classList.remove('ready'); });
          $$(ladders, '[data-node]').forEach(function (b) { b.disabled = true; b.setAttribute('aria-label', b.getAttribute('aria-label').replace('ready to unlock', 'next')); });
          li.className = 'own bloom';
          btn.setAttribute('aria-label', ladder.dataset.area + ', level ' + own + ', unlocked');
          var up = li.previousElementSibling;
          if (up) up.className = 'next';
          $(ladder, '.nodes').setAttribute('aria-label', ladder.dataset.area + ' skill tree, ' + own + ' of 10 unlocked');
          pill.hidden = true;
          count.hidden = false;
          replay.hidden = false;
          say.textContent = ladder.dataset.area + ' level ' + own + ' unlocked. 0 skill points available.';
        });
      });
    }
    bind();
    replay.addEventListener('click', function () {
      ladders.innerHTML = start;
      bind();
      pill.hidden = false;
      count.hidden = true;
      replay.hidden = true;
      say.textContent = '1 skill point available.';
      var first = $(ladders, '[data-node]');
      if (first) first.focus({ preventScroll: true });
    });
  })();

  // ---- Daily quests: hold the side quest to log it; the first log of the
  // day then shows "days showed up" with today's tile filling. ----
  (function () {
    var phone = $(document, '[data-phone="daily"]');
    if (!phone) return;
    var HOLD_MS = 750; // the app's hold.ms
    var side = $(phone, '[data-side]'), hint = $(phone, '[data-side-hint]');
    var xpEl = $(phone, '[data-xp]'), say = $(phone, '[data-say]');
    var days = $(phone, '[data-days]'), daysN = $(phone, '[data-days-n]');
    var replay = phone.parentNode.querySelector('[data-replay]');
    var xp = 1240, timer = 0, daysTimer = 0, closeTimer = 0, logged = false, counted = false, paid = {};

    function touch() { replay.hidden = false; }
    function closeDays() {
      clearTimeout(closeTimer);
      days.classList.remove('on');
      days.tabIndex = -1;
      days.setAttribute('aria-hidden', 'true');
    }
    function showDays() {
      days.classList.add('on');
      days.tabIndex = 0;
      days.removeAttribute('aria-hidden');
      days.setAttribute('aria-label', '23 days showed up. Continue');
      daysN.textContent = '22';
      setTimeout(function () { countTo(daysN, 23); }, calm ? 0 : 600);
      say.textContent = '23 days showed up.';
      closeTimer = setTimeout(closeDays, 4200);
    }
    function firstLogOfDay() {
      if (counted) return;
      counted = true;
      daysTimer = setTimeout(showDays, 1300);
    }
    function begin() {
      if (logged || timer) return;
      side.classList.add('holding', 'press');
      timer = setTimeout(function () {
        timer = 0;
        logged = true;
        side.classList.remove('holding', 'press');
        side.classList.add('logged');
        hint.textContent = 'Logged';
        bolts(phone, $(side, '.q-ic'), xpEl);
        xp += 10;
        countTo(xpEl, xp);
        say.textContent = 'Side quest logged. Plus 10 XP.';
        touch();
        firstLogOfDay();
      }, HOLD_MS);
    }
    function cancel() {
      if (!timer) return;
      clearTimeout(timer);
      timer = 0;
      side.classList.remove('holding', 'press');
    }
    side.addEventListener('pointerdown', function (e) { if (e.button === 0 || e.pointerType !== 'mouse') begin(); });
    ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach(function (ev) { side.addEventListener(ev, cancel); });
    side.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    side.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); begin(); } });
    side.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') cancel(); });
    days.addEventListener('click', closeDays);

    // Mood and Energy: tap an option; +5 XP each, once a day.
    $$(phone, '[data-gem]').forEach(function (gem) {
      gem.addEventListener('click', function () {
        var kind = gem.dataset.gem;
        $$(phone, '[data-gem="' + kind + '"]').forEach(function (g) { g.setAttribute('aria-pressed', g === gem ? 'true' : 'false'); });
        if (!paid[kind]) {
          paid[kind] = true;
          bolts(phone, gem, xpEl);
          xp += 5;
          countTo(xpEl, xp);
          say.textContent = kind + ' saved. Plus 5 XP.';
        }
        touch();
        firstLogOfDay();
      });
    });

    replay.addEventListener('click', function () {
      cancel();
      clearTimeout(daysTimer);
      closeDays();
      logged = false; counted = false; paid = {}; xp = 1240;
      xpEl.textContent = fmt(xp);
      side.classList.remove('logged');
      hint.textContent = 'Hold to log';
      $$(phone, '[data-gem]').forEach(function (g) { g.setAttribute('aria-pressed', 'false'); });
      replay.hidden = true;
      say.textContent = '';
    });
  })();
})();
