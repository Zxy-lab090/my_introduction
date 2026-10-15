/* =========================================================
   章熊耀 · 个人介绍页 —— 交互脚本
   ---------------------------------------------------------
   本文件实现的交互（全部原生 JavaScript，无第三方依赖）：
     ① 顶部滚动进度条 + 导航栏高亮当前板块
     ② 移动端汉堡菜单（展开 / 收起，支持 Esc 与点击空白处关闭）
     ③ Tab 切换（竞赛荣誉 / 技能现状，支持左右方向键）
     ④ 折叠展开（奖项卡片、未来规划时间轴）
     ⑤ 回到顶部按钮（滚动超过一屏后出现）
     ⑥ 滚动出现动画（IntersectionObserver）
     ⑦ 终端风名片逐行浮现
     ⑧ 鼠标跟随光晕（仅桌面端指针设备）
   删掉本文件页面依然可以正常阅读，只是会失去以上交互。
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 0. 页脚年份 ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- 1. 移动端菜单 ---------- */
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

  /* ---------- 2. 进度条 + 导航高亮 + 回到顶部按钮 ---------- */
  /* 这里刻意不用 requestAnimationFrame 节流：浏览器在标签页不可见时会
     暂停 rAF，页面切到后台后进度条和导航高亮就会停在旧状态。
     scroll 事件本身已按帧合并，直接计算反而更可靠。 */
  var progress = document.getElementById('progress');
  var toTop = document.getElementById('toTop');

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

    // 滚到底部时，强制点亮最后一项
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
      current = sections[sections.length - 1];
    }

    navLinks.forEach(function (a) {
      var target = document.querySelector(a.getAttribute('href'));
      a.classList.toggle('active', target === current);
    });
  }

  function updateOnScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (progress) progress.style.width = (ratio * 100).toFixed(2) + '%';
    highlightNav();
    if (toTop) toTop.classList.toggle('is-visible', window.scrollY > 420);
  }

  window.addEventListener('scroll', updateOnScroll, { passive: true });
  window.addEventListener('resize', updateOnScroll);
  document.addEventListener('visibilitychange', updateOnScroll);
  updateOnScroll();

  /* ---------- 3. 回到顶部 ---------- */
  if (toTop) {
    toTop.addEventListener('click', function () {
      try {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      } catch (err) {
        window.scrollTo(0, 0);
      }
      // 键盘用户：把焦点还给导航，方便继续 tab
      var brand = document.querySelector('.brand');
      if (brand) brand.focus({ preventScroll: true });
    });
  }

  /* ---------- 4. 滚动出现动画 ---------- */
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

  /* ---------- 5. 终端风名片逐行浮现 ---------- */
  var termLines = document.querySelectorAll('.terminal-body > *');
  if (!reduceMotion && termLines.length) {
    Array.prototype.forEach.call(termLines, function (el, i) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      el.style.transition = 'opacity .5s ease, transform .5s ease';
      el.style.transitionDelay = (0.35 + i * 0.08).toFixed(2) + 's';
    });
    // 不用 rAF：页面若在后台标签里打开，rAF 不执行，内容会一直透明
    window.setTimeout(function () {
      Array.prototype.forEach.call(termLines, function (el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }, 120);
  }

  /* ---------- 6. Tab 切换（带键盘方向键支持） ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.tab-panel'));

  function activateTab(tab) {
    if (!tab) return;
    var name = tab.getAttribute('data-tab');

    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });

    panels.forEach(function (p) {
      var on = p.id === 'panel-' + name;
      p.classList.toggle('is-active', on);
      if (on) {
        p.removeAttribute('hidden');
      } else {
        p.setAttribute('hidden', '');
      }
    });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { activateTab(tab); });

    tab.addEventListener('keydown', function (e) {
      var dir = e.key === 'ArrowRight' ? 1 : (e.key === 'ArrowLeft' ? -1 : 0);
      if (!dir) return;
      e.preventDefault();
      var next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus();
      activateTab(next);
    });
  });

  /* ---------- 7. 折叠 / 展开（奖项卡片 + 时间轴） ---------- */
  Array.prototype.forEach.call(
    document.querySelectorAll('[data-accordion]'),
    function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.award, .tl-item');
        if (!item) return;
        var open = !item.classList.contains('is-open');
        item.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    }
  );

  /* ---------- 8. 鼠标跟随光晕（仅桌面端） ---------- */
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
})();
