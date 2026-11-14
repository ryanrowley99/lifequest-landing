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

  // ---- Quest menu in the year section: tap to log (a tick and the app's
  // +10 XP), tap again to undo. Works with or without the dial. ----
  $$(document, '[data-panel]').forEach(function (panel) {
    var hint = $(panel, '[data-hint]');
    $$(panel, '[data-q]').forEach(function (q) {
      q.addEventListener('click', function () {
        var on = q.getAttribute('aria-pressed') !== 'true';
        q.setAttribute('aria-pressed', on ? 'true' : 'false');
        hint.textContent = on ? 'Logged. +10 XP.' : hint.getAttribute('data-idle');
      });
    });
    var cont = $(panel, '[data-continue]');
    if (cont) cont.addEventListener('click', function () { hint.textContent = 'Right where you left off.'; });
  });

  // ---- A year in Questree: the dial. Twelve months, three checkpoint stops
  // and the target date. Desktop: turns with the page scroll (pinned). Mobile:
  // swipe the dial or use the stop buttons. ----
  (function () {
    var sec = $(document, '[data-year]');
    if (!sec || calm) return; // still: the ring and the four panels, listed
    var dial = $(sec, '[data-dial]'), ring = $(sec, '[data-ring]');
    var panels = $$(sec, '[data-panel]'), shots = $$(sec, '[data-shot]');
    var stops = $$(sec, '[data-stop]'), sticks = $$(sec, '[data-stick]');
    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var AT = [3, 7, 10, 11];                  // the stops: Apr, Aug, Nov, Dec
    var REST = [0.26, 0.56, 0.81, 0.97];      // where each stop rests on the scroll track
    var KP = [0, 0.2, 0.32, 0.5, 0.62, 0.76, 0.86, 0.93, 1], KV = [0, 3, 3, 7, 7, 10, 10, 11, 11];
    var STAR = '<svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M12 0 14.3 9.7 24 12 14.3 14.3 12 24 9.7 14.3 0 12 9.7 9.7Z"/></svg>';
    var pinned = window.matchMedia('(min-width: 860px) and (min-height: 620px)');
    var pos = 3, stage = -1, queued = false, tween = 0;

    var html = '';
    MONTHS.forEach(function (m, i) {
      var k = AT.indexOf(i);
      html += '<span class="dial-m' + (k >= 0 ? ' cp' : '') + '" style="--i:' + i + '" data-m="' + i + '">' + (k >= 0 ? '<i>' + (k < 3 ? k + 1 : STAR) + '</i>' : '') + m + '</span>';
      if (i < 11) for (var t = 1; t <= 3; t++) html += '<span class="dial-t" style="--i:' + (i + t / 4) + '"></span>';
    });
    ring.innerHTML = html;

    function nearest(m) {
      var best = 0;
      AT.forEach(function (a, k) { if (Math.abs(a - m) < Math.abs(AT[best] - m)) best = k; });
      return best;
    }
    function render(p) {
      pos = Math.max(0, Math.min(11, p));
      sec.style.setProperty('--pos', pos.toFixed(3));
      var k = pos < 5 ? 0 : pos < 8.5 ? 1 : pos < 10.5 ? 2 : 3;
      if (k === stage) return;
      stage = k;
      panels.forEach(function (el, i) { el.classList.toggle('on', i === k); });
      shots.forEach(function (el, i) { el.classList.toggle('on', i === k); el.setAttribute('aria-hidden', i === k ? 'false' : 'true'); });
      stops.forEach(function (el, i) { el.setAttribute('aria-pressed', i === k ? 'true' : 'false'); });
      sticks.forEach(function (el) { el.classList.toggle('on', +el.getAttribute('data-stick') === k); });
    }
    function track() { var r = sec.getBoundingClientRect(); return { top: r.top + window.scrollY, span: r.height - window.innerHeight }; }
    function fromScroll() {
      queued = false;
      if (!pinned.matches) return;
      var t = track(), p = t.span > 0 ? Math.max(0, Math.min(1, (window.scrollY - t.top) / t.span)) : 0;
      for (var i = 1; i < KP.length; i++) {
        if (p <= KP[i]) {
          var u = (p - KP[i - 1]) / (KP[i] - KP[i - 1]);
          u = u * u * (3 - 2 * u);
          return render(KV[i - 1] + (KV[i] - KV[i - 1]) * u);
        }
      }
      render(11);
    }
    function glide(to) {
      cancelAnimationFrame(tween);
      var from = pos, t0 = performance.now();
      (function step(now) {
        var u = Math.min(1, (now - t0) / 420);
        render(from + (to - from) * (1 - Math.pow(1 - u, 3)));
        if (u < 1) tween = requestAnimationFrame(step);
      })(t0);
    }
    function go(k) {
      k = Math.max(0, Math.min(3, k));
      if (pinned.matches) { var t = track(); window.scrollTo({ top: t.top + REST[k] * t.span, behavior: 'smooth' }); }
      else glide(AT[k]);
    }

    stops.forEach(function (b, k) {
      b.addEventListener('click', function () { go(k); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = Math.max(0, Math.min(3, k + d));
        stops[n].focus({ preventScroll: true });
        go(n);
      });
    });

    // Drag or swipe the dial; a plain click on a month goes to its nearest stop.
    var drag = null;
    dial.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY, pos: pos, scroll: window.scrollY, moved: false, id: e.pointerId, m: e.target.closest ? e.target.closest('[data-m]') : null };
    });
    dial.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y, wide = pinned.matches;
      if (!drag.moved && Math.abs(wide ? dy : dx) > 6) {
        drag.moved = true;
        cancelAnimationFrame(tween);
        if (dial.setPointerCapture) dial.setPointerCapture(drag.id);
      }
      if (!drag.moved) return;
      if (wide) window.scrollTo(0, drag.scroll - dy * 3);
      else render(drag.pos - dx / 80);
    });
    function release() {
      if (!drag) return;
      var d = drag;
      drag = null;
      if (d.moved) { if (!pinned.matches) go(nearest(pos)); }
      else if (d.m) go(nearest(+d.m.getAttribute('data-m')));
    }
    dial.addEventListener('pointerup', release);
    dial.addEventListener('pointercancel', release);

    function ask() { if (!queued) { queued = true; requestAnimationFrame(fromScroll); } }
    function mode() { if (pinned.matches) fromScroll(); else render(AT[nearest(pos)]); }
    window.addEventListener('scroll', ask, { passive: true });
    window.addEventListener('resize', ask);
    if (pinned.addEventListener) pinned.addEventListener('change', mode);
    render(3);
    mode();
  })();

  // ---- Watch it grow: skills light from the trunk up, a row at a time,
  // as the section scrolls past. Still (all forty lit) under Reduce Motion. ----
  (function () {
    var tree = $(document, '[data-tree]');
    if (!tree || calm) return;
    var count = $(document, '[data-tree-count]');
    var nodes = [];
    $$(tree, '.tladder').forEach(function (lad, a) {
      $$(lad, '[data-lv]').forEach(function (li) { nodes.push({ el: li, order: (+li.getAttribute('data-lv') - 1) * 4 + a }); });
    });
    var shown = -1, queued = false;
    function draw() {
      queued = false;
      var r = tree.getBoundingClientRect(), vh = window.innerHeight;
      var t = Math.max(0, Math.min(1, (vh * 0.96 - r.bottom) / (vh * 0.5))); // starts as the trunk comes into view
      var n = Math.round(t * nodes.length);
      if (n === shown) return;
      shown = n;
      nodes.forEach(function (nd) { nd.el.classList.toggle('lit', nd.order < n); });
      count.textContent = n;
    }
    function ask() { if (!queued) { queued = true; requestAnimationFrame(draw); } }
    window.addEventListener('scroll', ask, { passive: true });
    window.addEventListener('resize', ask);
    draw();
  })();

  // ---- Scroll intro: the Q draws, the name appears, the hero settles ----
  (function () {
    var stage = $(document, '[data-intro]');
    if (!stage || calm) return;
    var hero = stage.parentNode, mark = $(stage, '.wordmark');
    var ring = $(mark, 'circle.qd'), star = $(mark, '.q-star');
    var strokes = $$(mark, 'path.qd'), tail = strokes[0], letters = strokes.slice(1);
    var skip = $(stage, '[data-skip]'), hint = $(stage, '[data-hint]');
    var cl = function (v) { return Math.max(0, Math.min(1, v)); };
    var dy = 0, dx = 0, big = 1.3, queued = false;
    skip.hidden = false; hint.hidden = false;
    function measure() {
      mark.style.transform = 'none';
      var m = mark.getBoundingClientRect(), s = stage.getBoundingClientRect();
      dy = s.top + s.height / 2 - (m.top + m.height / 2);
      mark.style.transform = '';
      big = window.innerWidth < 700 ? 1.12 : 1.4;
      dx = m.width * 0.4125; // the Q's centre to the wordmark's centre
      draw();
    }
    function end() { return hero.offsetTop + hero.offsetHeight - window.innerHeight; }
    function draw() {
      queued = false;
      var span = hero.offsetHeight - window.innerHeight;
      var pi = span > 0 ? cl((window.scrollY - hero.offsetTop) / span) : 1;
      var len = 0.3 + 0.7 * cl(pi / 0.34);
      var reveal = cl((pi - 0.43) / 0.19), move = cl((pi - 0.62) / 0.16), fin = cl((pi - 0.76) / 0.18);
      var scale = 1 + (1 - move) * (big - 1);
      ring.style.strokeDasharray = len.toFixed(3) + ' 1';
      star.style.transform = 'rotate(' + (len * 360).toFixed(1) + 'deg)';
      star.style.opacity = (1 - cl((pi - 0.32) / 0.08)).toFixed(2);
      tail.style.opacity = 1;
      tail.style.strokeDashoffset = (1 - cl((pi - 0.34) / 0.1)).toFixed(3);
      letters.forEach(function (l, k) { l.style.opacity = cl(reveal * 1.7 - k * 0.1).toFixed(2); });
      stage.style.setProperty('--fin', fin.toFixed(3));
      stage.style.setProperty('--wx', ((1 - cl((pi - 0.33) / 0.1)) * dx * scale).toFixed(1) + 'px');
      stage.style.setProperty('--wy', ((1 - move) * dy).toFixed(1) + 'px');
      stage.style.setProperty('--ws', scale.toFixed(3));
      hint.style.opacity = (1 - cl(pi / 0.08)).toFixed(2);
      skip.hidden = fin > 0.5;
      stage.classList.toggle('settled', fin > 0.5);
    }
    function ask() { if (!queued) { queued = true; requestAnimationFrame(draw); } }
    function jump() { window.scrollTo(0, end()); }
    skip.addEventListener('click', function () { jump(); var f = $(stage, 'input'); if (f) f.focus({ preventScroll: true }); });
    // Tabbing into the form before it has appeared finishes the intro.
    stage.addEventListener('focusin', function (e) { if (e.target !== skip && !stage.classList.contains('settled')) jump(); });
    window.addEventListener('scroll', ask, { passive: true });
    window.addEventListener('resize', measure);
    measure();
  })();

})();
