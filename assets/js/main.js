/* =========================================================
   LK SQUARE — main.js
   모션 엔진: 인트로 / 리빌 / 패럴랙스 / 카운트업 / 카운트다운
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------
     1. 인트로 로더 → body.ready → 히어로 시퀀스 시작
     --------------------------------------------------------- */
  var loader     = $('#loader');
  var loaderFill = $('#loaderFill');
  var hero       = $('#top');

  function startHero() {
    document.body.classList.add('ready');
    if (hero) hero.classList.add('in');
  }

  function hideLoader() {
    if (!loader || loader.classList.contains('done')) return;
    if (loaderFill) loaderFill.style.width = '100%';
    setTimeout(function () {
      loader.classList.add('done');
      startHero();
    }, reduceMotion ? 0 : 260);
  }

  if (loader && !reduceMotion) {
    var pct = 0;
    var fake = setInterval(function () {
      pct = Math.min(pct + Math.random() * 18, 92);
      if (loaderFill) loaderFill.style.width = pct + '%';
    }, 160);
    window.addEventListener('load', function () { clearInterval(fake); hideLoader(); });
    // 이미지 로딩이 오래 걸려도 최대 2.4초 뒤에는 진입
    setTimeout(function () { clearInterval(fake); hideLoader(); }, 2400);
  } else {
    if (loader) loader.classList.add('done');
    startHero();
  }

  /* ---------------------------------------------------------
     2. 스크롤 리빌 (IntersectionObserver)
     --------------------------------------------------------- */
  // [data-stagger] 부모의 자식들에게 순차 지연 자동 부여
  $$('[data-stagger]').forEach(function (parent) {
    var step = parseFloat(parent.getAttribute('data-stagger')) || 0.09;
    $$('.reveal, .mask', parent).forEach(function (el, i) {
      el.style.setProperty('--d', (i * step).toFixed(3) + 's');
    });
  });

  var revealEls = $$('.reveal:not(.in), .mask:not(.in)');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------------------------------------------------------
     3. 듀얼 에너지 커브 드로잉 + 라이더
     --------------------------------------------------------- */
  var curveBox = $('#curveBox');
  if (curveBox && 'IntersectionObserver' in window) {
    var curveIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        $$('animateMotion', e.target).forEach(function (am) {
          if (typeof am.beginElement === 'function') { try { am.beginElement(); } catch (err) {} }
        });
        curveIo.unobserve(e.target);
      });
    }, { threshold: 0.3 });
    curveIo.observe(curveBox);
  } else if (curveBox) {
    curveBox.classList.add('in');
  }

  /* ---------------------------------------------------------
     4. 숫자 카운트업
     --------------------------------------------------------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var dur = 1500;
    if (reduceMotion) { el.textContent = target.toLocaleString('ko-KR'); return; }
    var t0 = null;
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('ko-KR');
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(countUp);
  }

  /* ---------------------------------------------------------
     5. 내비게이션 (스크롤 상태 / 모바일 메뉴)
     --------------------------------------------------------- */
  var nav             = $('#siteNav');
  var navToggle       = $('#navToggle');
  var mobileMenu      = $('#mobileMenu');
  var menuOverlay     = $('#menuOverlay');
  var mobileMenuClose = $('#mobileMenuClose');

  function openMenu() {
    mobileMenu.classList.add('open');
    menuOverlay.classList.add('open');
    navToggle.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var first = mobileMenu.querySelector('a');
    if (first) first.focus({ preventScroll: true });
  }
  function closeMenu() {
    mobileMenu.classList.remove('open');
    menuOverlay.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  if (navToggle && mobileMenu && menuOverlay) {
    navToggle.addEventListener('click', function () {
      mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
    });
    if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu);
    $$('a', mobileMenu).forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) { closeMenu(); navToggle.focus(); }
    });
  }

  /* ---------------------------------------------------------
     6. 스크롤 루프 (rAF 스로틀) — 진행바 / 헤더 / 패럴랙스
     --------------------------------------------------------- */
  var progressBar  = $('#scrollProgress');
  var parallaxEls  = $$('[data-parallax]');
  var productImg   = $('#productImg');
  var lastY        = window.scrollY;
  var ticking      = false;

  function onScrollFrame() {
    var y  = window.scrollY;
    var vh = window.innerHeight;

    // 진행바
    if (progressBar) {
      var max = document.documentElement.scrollHeight - vh;
      var p = max > 0 ? y / max : 0;
      progressBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }

    // 헤더: 배경 전환 + 아래로 스크롤 시 숨김
    if (nav) {
      nav.classList.toggle('solid', y > 60);
      var menuOpen = mobileMenu && mobileMenu.classList.contains('open');
      nav.classList.toggle('hide', y > 420 && y > lastY + 4 && !menuOpen);
    }
    lastY = y;

    if (!reduceMotion) {
      // 일반 패럴랙스
      parallaxEls.forEach(function (el) {
        var f = parseFloat(el.getAttribute('data-parallax')) || 0.1;
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var off = (r.top + r.height / 2) - vh / 2;
        el.style.setProperty('--py', (-off * f).toFixed(1) + 'px');
      });

      // 제품 이미지: 스크롤에 따라 살짝 떠오르고 회전
      if (productImg) {
        var pr = productImg.getBoundingClientRect();
        if (pr.bottom > -200 && pr.top < vh + 200) {
          var o = (pr.top + pr.height / 2) - vh / 2;
          productImg.style.setProperty('--py', (-o * 0.09).toFixed(1) + 'px');
          productImg.style.setProperty('--pr', (-o * 0.012).toFixed(2) + 'deg');
        }
      }
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScrollFrame); }
  }, { passive: true });
  onScrollFrame();

  /* ---------------------------------------------------------
     7. 히어로 제품 마우스 패럴랙스
     --------------------------------------------------------- */
  var heroPar = $('#heroPar');
  if (heroPar && hero && !reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    hero.addEventListener('mousemove', function (e) {
      var cx = (e.clientX / window.innerWidth  - 0.5) * 2;
      var cy = (e.clientY / window.innerHeight - 0.5) * 2;
      heroPar.style.setProperty('--px', (cx * -26).toFixed(1) + 'px');
      heroPar.style.setProperty('--py', (cy * -20).toFixed(1) + 'px');
    });
    hero.addEventListener('mouseleave', function () {
      heroPar.style.setProperty('--px', '0px');
      heroPar.style.setProperty('--py', '0px');
    });
  }

  /* ---------------------------------------------------------
     8. 스포츠 카드 3D 틸트
     --------------------------------------------------------- */
  if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    $$('.sport-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width  - 0.5;
        var y = (e.clientY - r.top)  / r.height - 0.5;
        card.style.setProperty('--ry', (x *  10).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (y * -10).toFixed(2) + 'deg');
        card.style.setProperty('--ty', '-6px');
      });
      card.addEventListener('mouseleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--ty', '0px');
      });
    });
  }

  /* ---------------------------------------------------------
     9. 카운트다운
     런칭일 변경은 아래 LAUNCH_DATE 한 줄만 수정하면 됩니다.
     출시일이 지나면 카운트다운 대신 "판매중" 상태로 자동 전환됩니다.
     --------------------------------------------------------- */
  var LAUNCH_DATE = new Date('2026-08-14T00:00:00+09:00');

  var cd     = $('#countdown');
  var live   = $('#launchLive');
  var fields = { d: $('#cd-d'), h: $('#cd-h'), m: $('#cd-m'), s: $('#cd-s') };
  var cdTimer = null;

  function setField(el, val) {
    if (!el) return;
    var next = String(val).padStart(2, '0');
    if (el.textContent === next) return;
    el.textContent = next;
    if (reduceMotion) return;
    el.classList.remove('tick');
    void el.offsetWidth;          // 리플로우 강제 → 애니메이션 재시작
    el.classList.add('tick');
  }

  function showLive() {
    if (cd) cd.classList.add('done');
    if (live) live.classList.add('show');
    if (cdTimer) clearInterval(cdTimer);
  }

  function tickCountdown() {
    var diff = LAUNCH_DATE - new Date();
    if (diff <= 0) { showLive(); return; }
    setField(fields.d, Math.floor(diff / 86400000));
    setField(fields.h, Math.floor((diff % 86400000) / 3600000));
    setField(fields.m, Math.floor((diff % 3600000) / 60000));
    setField(fields.s, Math.floor((diff % 60000) / 1000));
  }

  if (cd) {
    tickCountdown();
    cdTimer = setInterval(tickCountdown, 1000);
  }

  /* ---------------------------------------------------------
     10. ENERGY SURGE 배경 영상
     화면에 들어올 때만 재생하고 벗어나면 정지합니다(배터리·데이터 절약).
     자동재생은 브라우저 정책상 muted 상태에서만 허용되므로,
     소리는 사용자가 버튼을 눌렀을 때만 켜집니다.
     --------------------------------------------------------- */
  var surgeVideo = $('#surgeVideo');
  var surgeSound = $('#surgeSound');
  var surgeLabel = $('#surgeSoundLabel');

  if (surgeVideo) {
    var tryPlay = function () {
      var p = surgeVideo.play();
      if (p && typeof p.catch === 'function') { p.catch(function () {}); }
    };

    if (!reduceMotion && 'IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { tryPlay(); }
          else if (!surgeVideo.paused) { surgeVideo.pause(); }
        });
      }, { threshold: 0.25 });
      vio.observe(surgeVideo);
    }

    // 탭이 백그라운드로 가면 정지
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && !surgeVideo.paused) surgeVideo.pause();
    });

    if (surgeSound) {
      surgeSound.addEventListener('click', function () {
        var on = surgeVideo.muted;               // 켜려는 방향
        surgeVideo.muted = !on;
        surgeSound.setAttribute('aria-pressed', on ? 'true' : 'false');
        surgeSound.setAttribute('aria-label', on ? '배경 영상 소리 끄기' : '배경 영상 소리 켜기');
        if (surgeLabel) surgeLabel.textContent = on ? '소리 끄기' : '소리 켜기';
        if (on) tryPlay();                       // 소리를 켤 때는 재생도 보장
      });
    }
  }

  /* ---------------------------------------------------------
     11. 현재 섹션 내비 하이라이트
     --------------------------------------------------------- */
  var navAnchors = $$('.nav-links a[href^="#"]');
  if (navAnchors.length && 'IntersectionObserver' in window) {
    var map = {};
    navAnchors.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var secIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = map[e.target.id];
        if (a) a.style.color = e.isIntersecting ? '#fff' : '';
      });
    }, { threshold: 0.4 });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) secIo.observe(sec);
    });
  }
})();
