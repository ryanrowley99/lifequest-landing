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

  // ---- Year wheel: the ring fills as the section scrolls past ----
  (function () {
    var wheel = $(document, '[data-wheel]');
    if (!wheel || calm || !('IntersectionObserver' in window)) return; // still: the full year
    var marks = $$(wheel, '[data-at]').map(function (g) { return { el: g, at: parseFloat(g.getAttribute('data-at')) }; });
    var END = marks[marks.length - 1].at, queued = false, seen = false;
    function draw() {
      queued = false;
      var r = wheel.getBoundingClientRect(), vh = window.innerHeight;
      var from = vh * 0.9, to = Math.max(40, vh * 0.45 - r.height / 2);
      var p = Math.max(0, Math.min(1, (from - r.top) / (from - to))) * END;
      wheel.style.setProperty('--p', p.toFixed(4));
      marks.forEach(function (m) { m.el.classList.toggle('on', p >= m.at - 0.002); });
    }
    function ask() { if (seen && !queued) { queued = true; requestAnimationFrame(draw); } }
    new IntersectionObserver(function (en) { seen = en[0].isIntersecting; ask(); }, { rootMargin: '120px' }).observe(wheel);
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
