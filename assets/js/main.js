/* =========================================================
   某某某 · 个人介绍页 —— 交互脚本
   只做三件事：滚动动画、导航状态、装饰光晕。
   没有依赖，删掉这个文件页面也能正常看。
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 页脚年份 ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- 2. 移动端菜单 ---------- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');

  function closeMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '打开菜单');
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
    });

    // 点任意导航项后收起
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });

    // 点空白处 / 按 Esc 收起
    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('open')) return;
      if (e.target.closest('.nav')) return;
      closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ---------- 3. 顶部滚动进度条 ---------- */
  /* 注意：这里刻意不用 requestAnimationFrame 节流。
     浏览器在标签页不可见时会暂停 rAF，页面被切到后台后
     进度条和导航高亮就会停在旧状态；scroll 事件本身已经是
     按帧合并的，直接算反而更可靠。 */
  var progress = document.getElementById('progress');

  function updateProgress() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (progress) progress.style.width = (ratio * 100).toFixed(2) + '%';
    highlightNav();
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  document.addEventListener('visibilitychange', updateProgress);

  /* ---------- 4. 导航高亮当前区块 ---------- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav-menu a[href^="#"]')
  );
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  function highlightNav() {
    if (!sections.length) return;
    var line = window.scrollY + window.innerHeight * 0.32;
    var current = null;

    sections.forEach(function (sec) {
      if (sec.offsetTop <= line) current = sec;
    });

    // 滚到底部时，强制点亮最后一项（联系我）
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
      current = sections[sections.length - 1];
    }

    navLinks.forEach(function (a) {
      var target = document.querySelector(a.getAttribute('href'));
      a.classList.toggle('active', target === current);
    });
  }

  /* ---------- 5. 滚动出现动画 ---------- */
  var revealEls = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealEls, function (el) {
      el.classList.add('is-visible');
    });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

    Array.prototype.forEach.call(revealEls, function (el) { io.observe(el); });
  }

  /* ---------- 6. 终端卡逐行浮现 ---------- */
  var termLines = document.querySelectorAll('.terminal-body > *');
  if (!reduceMotion && termLines.length) {
    Array.prototype.forEach.call(termLines, function (el, i) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      el.style.transition = 'opacity .5s ease, transform .5s ease';
      el.style.transitionDelay = (0.4 + i * 0.1).toFixed(2) + 's';
    });
    // 同样避开 requestAnimationFrame：如果页面在后台标签里打开，
    // rAF 不会执行，终端内容就会一直停在透明状态。
    window.setTimeout(function () {
      Array.prototype.forEach.call(termLines, function (el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }, 120);
  }

  /* ---------- 7. 跟随鼠标的光晕（仅桌面端） ---------- */
  var spotlight = document.getElementById('spotlight');
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  if (spotlight && finePointer && !reduceMotion) {
    var sx = window.innerWidth / 2, sy = window.innerHeight / 3;
    var cx = sx, cy = sy, raf = null;

    function loop() {
      cx += (sx - cx) * 0.12;
      cy += (sy - cy) * 0.12;
      spotlight.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      if (Math.abs(sx - cx) > 0.5 || Math.abs(sy - cy) > 0.5) {
        raf = window.requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }

    document.addEventListener('mousemove', function (e) {
      sx = e.clientX;
      sy = e.clientY;
      document.body.classList.add('has-pointer');
      if (raf === null) raf = window.requestAnimationFrame(loop);
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      document.body.classList.remove('has-pointer');
    });
  }

  /* ---------- 8. 首屏先跑一次 ---------- */
  updateProgress();
})();
