/* Buxoro invest — taqdimot sayti. Vanilla JS, build bosqichisiz. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const IMG = 'assets/img/';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** 1 234,5 — probel minglik, vergul kasr. */
  function fmt(n, d = 0) {
    const s = Math.abs(n).toFixed(d);
    let [i, f] = s.split('.');
    i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (n < 0 ? '−' : '') + i + (f ? ',' + f : '');
  }

  /* ------------------------------------------------------------------ tooltip */
  const tip = $('#tip');
  function tipShow(x, y, value, label) {
    tip.replaceChildren();
    const s = el('strong', '', value);
    tip.append(s);
    if (label) tip.append(el('span', '', label));
    tip.classList.add('on');
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, x + 14)) + 'px';
    tip.style.top = Math.max(8, Math.min(innerHeight - h - 8, y - h - 12)) + 'px';
  }
  const tipHide = () => tip.classList.remove('on');
  function tipBind(node, value, label) {
    node.addEventListener('pointermove', (e) => tipShow(e.clientX, e.clientY, value, label));
    node.addEventListener('pointerleave', tipHide);
    node.addEventListener('focus', () => {
      const r = node.getBoundingClientRect();
      tipShow(r.left + r.width / 2, r.top, value, label);
    });
    node.addEventListener('blur', tipHide);
  }

  /* ------------------------------------------------------------------ reveal + counters */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          io.unobserve(e.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    : null;
  $$('.reveal').forEach((n) => (io ? io.observe(n) : n.classList.add('in')));

  function animateCount(node) {
    const target = parseFloat(node.dataset.count);
    const dec = parseInt(node.dataset.dec || '0', 10);
    if (reduceMotion) return;
    const t0 = performance.now(), dur = 1600;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const v = target * (1 - Math.pow(1 - p, 3));
      node.textContent = fmt(v, dec);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  if (io) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        animateCount(e.target);
        cio.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach((n) => { if (!reduceMotion) n.textContent = '0'; cio.observe(n); });
  }

  /* ------------------------------------------------------------------ nav */
  const nav = $('#nav'), progress = $('#progress');
  const sections = $$('main > section[id]');
  const navLinks = $$('#links a, #dots a');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      nav.classList.toggle('scrolled', y > 10);
      progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      let current = sections[0].id;
      const probe = y + innerHeight * 0.38;
      for (const s of sections) if (s.offsetTop <= probe) current = s.id;
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  const burger = $('#burger');
  const setMenu = (open) => {
    document.body.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', String(open));
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('nav-open')));
  $('#links').addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('click', (e) => {
    if (document.body.classList.contains('nav-open') && !e.target.closest('#nav')) setMenu(false);
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { setMenu(false); burger.focus(); }
  });

  /* Taqdimot rejimi: ← → boʻlimlar oʻrtasida (galereya kabi oʻz strelkalari bor elementlar ustunlik qiladi) */
  addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if ($('#lb').classList.contains('on')) return;
    if (e.target.closest('input, select, textarea, [role="tablist"], [contenteditable]')) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const probe = scrollY + innerHeight * 0.38;
    let idx = 0;
    sections.forEach((s, i) => { if (s.offsetTop <= probe) idx = i; });
    const next = Math.max(0, Math.min(sections.length - 1, idx + (e.key === 'ArrowRight' ? 1 : -1)));
    if (next !== idx) { e.preventDefault(); sections[next].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }
  });

  /* ------------------------------------------------------------------ hero slideshow */
  // 2–4-slaydlar birinchi rasm bilan raqobatlashmasligi uchun sahifa yuklangandan keyin olinadi.
  const heroImgs = $$('#heroBg img');
  let heroI = 0;
  if (heroImgs.length > 1 && !reduceMotion) {
    const loadRest = () => heroImgs.forEach((im) => { if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); } });
    document.readyState === 'complete' ? loadRest() : addEventListener('load', loadRest, { once: true });
    setInterval(() => {
      if (document.hidden) return;
      const next = (heroI + 1) % heroImgs.length;
      const im = heroImgs[next];
      if (!im.complete || !im.naturalWidth) return; // hali yuklanmagan slaydga oʻtilmaydi
      heroImgs[heroI].classList.remove('on');
      im.classList.add('on');
      heroI = next;
    }, 7000);
  }

  /* ------------------------------------------------------------------ directions */
  const DIRS = [
    ['qurilish', 'Yashil hudud va kompleks qurilish', 'Hududlarda yashil bogʻ, ekopark va alleyalar tashkil etish hamda kompleks qurilish loyihalarini amalga oshirish.'],
    ['mulk', 'Munitsipal mulk va DXSH', 'Boshqaruvga berilgan munitsipal mulklarni boshqarish; davlat sherigi sifatida DXSH loyihalarini amalga oshirish, ijaraga berish, monitoring va samaradorlikni baholash.'],
    ['moliya', 'Tadbirkorlik loyihalarini moliyalashtirish', 'Tadbirkorlarning viloyat infratuzilmasini rivojlantirish bilan bogʻliq istiqbolli loyihalarini moliyaviy jozibadorligi va samaradorligidan kelib chiqib moliyalashtirishda ishtirok etish.'],
    ['yer', 'Boʻsh yerlar — ustav kapitaliga', 'Boʻsh yer uchastkalarini investitsiya kompaniyalari ustav kapitaliga kiritish va loyihani amalga oshirish huquqini onlayn elektron auksionga qoʻyish.'],
    ['mulk', 'Investitsion jozibadorlikni oshirish', 'Boshqaruvga berilgan munitsipal mulklarning investitsion jozibadorligini oshirish, ular negizida investorlar bilan hamkorlikda loyihalar amalga oshirish.'],
    ['qurilish', 'Renovatsiya', 'Avariya holatidagi yoki yaroqsiz turar va noturar joylarni zamonaviy talablar asosida qayta qurish, kapital taʼmirlash va rekonstruksiya qilish.'],
    ['qurilish', 'Bozor va savdo komplekslari', 'Bozor va savdo komplekslarini zamonaviylashtirish, yaroqsizlarini buzib oʻrnida yangi bino qurish, belgilangan tartibda sotish yoki ijaraga berish.'],
    ['moliya', '1 mln $ gacha DXSH loyihalari', 'Munitsipal mulk va ustav fondiga kiritilgan yerlar negizida qiymati 1 mln AQSH dollarigacha boʻlgan davlat-xususiy sheriklik loyihalarini amalga oshirish.'],
    ['yer', 'Qurilishga tayyor yer', 'Arxitektura-shaharsozlik kengashi kelishuvidan oʻtgan, qurilishga ruxsatnoma va birinchi darajali loyiha hujjatlariga ega yerlarni lotlarga ajratib, ochiq onlayn auksionga chiqarish.'],
    ['qurilish', 'Uy-joy dasturi', 'Uy-joy dasturi koʻrsatkichlariga erishish; manzilli roʻyxatdagi koʻp kvartirali uylarni oʻz vaqtida foydalanishga topshirish.'],
    ['infra', 'Qurilish va tarmoqlarni muvofiqlashtirish', 'Viloyatdagi qurilish va rekonstruksiya ishlarini hamda infratuzilma tarmoqlariga ulanish jarayonlarini muvofiqlashtirish.'],
    ['mulk', 'Mulk holatini tahlil qilish', 'Munitsipal mulk holatini tahlil qilish, mavjud resurs va imkoniyatlarni aniqlash, ulardan samarali foydalanish boʻyicha takliflar ishlab chiqish.'],
    ['yer', 'AShK bilan kelishuv', 'Tanlangan yer uchastkalarida manzilli roʻyxatdagi istiqbolli loyihalarni yer toifalari kesimida hududiy arxitektura-shaharsozlik kengashlariga kelishuv uchun kiritish.'],
    ['yer', '«Yer banki»', 'Arxitektura-shaharsozlik kengashlari bilan kelishilgan yer uchastkalarini istiqbolli uy-joy qurilishi manzilli roʻyxati — «Yer banki»ga kiritib borish.'],
  ];
  const CAT = { qurilish: 'Renovatsiya va qurilish', yer: 'Yer va auksion', mulk: 'Mulk va DXSH', moliya: 'Moliyalashtirish', infra: 'Infratuzilma' };
  const dirsBox = $('#dirs');
  DIRS.forEach(([cat, title, text], i) => {
    const a = el('article', 'dir reveal');
    a.dataset.cat = cat;
    a.style.setProperty('--d', (i % 3) * 0.06 + 's');
    a.append(el('span', 'dir__num', String(i + 1).padStart(2, '0')), el('span', 'dir__tag', CAT[cat]), el('h3', '', title), el('p', '', text));
    dirsBox.append(a);
    io ? io.observe(a) : a.classList.add('in');
  });
  $('#dirChips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    $$('#dirChips .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
    $$('.dir', dirsBox).forEach((d) => { d.hidden = b.dataset.cat !== 'all' && d.dataset.cat !== b.dataset.cat; });
  });

  /* ------------------------------------------------------------------ lightbox */
  const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbView = $('#lbView');
  let lbItems = [], lbIdx = 0, lbReturn = null;
  function lbRender() {
    const it = lbItems[lbIdx];
    lbImg.src = IMG + it.n + '-lg.webp';
    lbImg.alt = it.c || '';
    lbCap.replaceChildren(document.createTextNode(it.c || ''));
    if (lbItems.length > 1) lbCap.append(el('small', '', `${lbIdx + 1} / ${lbItems.length}`));
    lbView.classList.remove('zoom');
    lbView.scrollTo(0, 0);
    $('#lbPrev').style.display = $('#lbNext').style.display = lbItems.length > 1 ? '' : 'none';
  }
  function lbOpen(items, i) {
    lbItems = items; lbIdx = i; lbReturn = document.activeElement;
    lb.classList.add('on'); document.body.style.overflow = 'hidden';
    lbRender(); $('#lbClose').focus();
  }
  function lbClose() {
    lb.classList.remove('on'); document.body.style.overflow = '';
    if (lbReturn && lbReturn.focus) lbReturn.focus();
  }
  const lbStep = (d) => { lbIdx = (lbIdx + d + lbItems.length) % lbItems.length; lbRender(); };
  $('#lbClose').addEventListener('click', lbClose);
  $('#lbPrev').addEventListener('click', () => lbStep(-1));
  $('#lbNext').addEventListener('click', () => lbStep(1));
  const lbZoom = () => lbView.classList.toggle('zoom');
  $('#lbZoom').addEventListener('click', lbZoom);
  lbImg.addEventListener('click', lbZoom);
  lbView.addEventListener('click', (e) => { if (e.target === lbView && !lbView.classList.contains('zoom')) lbClose(); });
  addEventListener('keydown', (e) => {
    if (!lb.classList.contains('on')) return;
    if (e.key === 'Escape') lbClose();
    else if (e.key === 'ArrowLeft' && lbItems.length > 1) lbStep(-1);
    else if (e.key === 'ArrowRight' && lbItems.length > 1) lbStep(1);
    else if (e.key === 'Tab') {
      // fokus dialog ichida aylanadi (aria-modal)
      const f = $$('.lb__btn', lb).filter((b) => b.offsetParent !== null);
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  // yagona rasm: data-lb atributli elementlar
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-lb]');
    if (!t) return;
    lbOpen([{ n: t.dataset.lb, c: t.dataset.cap || '' }], 0);
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('figure[data-lb]')) { e.preventDefault(); e.target.click(); }
  });

  /* ------------------------------------------------------------------ galleries */
  // n — fayl nomi (assets/img/<n>-lg.webp), c — izoh, f — true boʻlsa rasm toʻliq sigʻadi (chizma/plan)
  const G = {
    koksaroy: [
      { n: 'koksaroy-aerial', c: 'Koʻksaroy MFY — yangi turar-joy majmuasi, aerovizualizatsiya' },
      { n: 'koksaroy-render-1', c: '9 qavatli turar-joy binosi, birinchi qavatda savdo shoxobchalari' },
      { n: 'koksaroy-render-2', c: 'Yangi turar-joy majmuasi — kechki yoritilish' },
      { n: 'taklif-render-1', c: 'Loyiha taklifi — umumiy koʻrinish' },
      { n: 'taklif-render-2', c: 'Loyiha taklifi — hudud rejasi (yuqoridan koʻrinish)' },
      { n: 'taklif-render-3', c: 'Loyiha taklifi — fasad' },
      { n: 'taklif-render-4', c: 'Loyiha taklifi — turar-joy binolari' },
      { n: 'koksaroy-masterplan', c: 'Koʻksaroy MFY — master-reja', f: true },
    ],
    ncb: [
      { n: 'ncb-view-1', c: 'New Central Bukhara — umumiy koʻrinish' },
      { n: 'ncb-view-2', c: 'Turar-joy minoralari va yashil hudud' },
      { n: 'ncb-view-3', c: 'Markaziy hovuz va favvoralar' },
      { n: 'ncb-view-4', c: 'Kechki yoritilishdagi turar-joy majmuasi' },
      { n: 'ncb-view-5', c: 'Landshaft va suv havzalari' },
      { n: 'ncb-view-6', c: 'Kechki shahar panoramasi' },
    ],
    nbc: [
      { n: 'nbc-aerial', c: 'New Bukhara City — umumiy koʻrinish' },
      { n: 'nbc-mall', c: 'Savdo markazi' },
      { n: 'nbc-coffee-street', c: 'Qahva koʻchasi' },
      { n: 'nbc-atrium', c: 'Savdo markazi — atrium' },
      { n: 'nbc-restaurant', c: 'Restoran' },
      { n: 'nbc-kids', c: 'Bolalar oʻyin maydonchasi' },
      { n: 'nbc-bookstore', c: 'Kitob doʻkoni' },
      { n: 'nbc-park', c: 'Markaziy bogʻ' },
      { n: 'nbc-lake', c: 'Klub-uy va piyodalar koʻchasi' },
      { n: 'nbc-lake-walk', c: 'Piyodalar koʻchasi' },
      { n: 'nbc-rowhouses', c: 'Qator uylar' },
      { n: 'nbc-villa', c: 'Villa' },
      { n: 'nbc-apartments-1', c: 'Xonadonlar' },
      { n: 'nbc-apartments-2', c: 'Xonadonlar — koʻl boʻyi' },
      { n: 'nbc-school-aerial', c: 'Maktab va bolalar bogʻchasi — joylashuv' },
      { n: 'nbc-school', c: 'Maktab' },
      { n: 'nbc-kindergarten', c: 'Bolalar bogʻchasi' },
      { n: 'nbc-sports', c: 'Sport maydonchalari' },
      { n: 'nbc-smart-home', c: 'Aqlli uy' },
      { n: 'nbc-solar-light', c: 'Quyosh energiyasi bilan yoritish' },
      { n: 'nbc-smart-city', c: 'Aqlli shahar (Smart City)', f: true },
      { n: 'nbc-solar-roof', c: 'Quyosh panellari' },
    ],
    etno: [
      { n: 'etno-gate', c: 'Etno qishloq — bosh kirish va kabulxona' },
      { n: 'etno-aerial', c: 'Etno qishloq — aerovizualizatsiya' },
      { n: 'etno-street', c: 'Hunarmandlar mahallasi va suv havzasi' },
      { n: 'etno-bazaar', c: 'Hunarmandlar maydoni' },
    ],
  };
  const M = {
    'koksaroy-doc': [
      { n: 'taklif-location', c: 'Shahar xaritasida joylashuvi', f: true },
      { n: 'taklif-satellite', c: 'Qurilish rejalashtirilayotgan hudud (qizil kontur)', f: true },
      { n: 'taklif-holat', c: 'Mavjud 2 qavatli uylar — joylashuv va kadastr raqamlari', f: true },
      { n: 'koksaroy-site', c: 'Hudud chegarasi' },
      { n: 'lot-holat', c: 'Holat rejasi', f: true },
      { n: 'lot-1', c: '1-lot — loyiha taklifi va TEP', f: true },
      { n: 'lot-2', c: '2-lot — loyiha taklifi va TEP', f: true },
      { n: 'lot-3', c: '3-lot — loyiha taklifi va TEP', f: true },
      { n: 'lot-4', c: '4-lot — loyiha taklifi va TEP', f: true },
      { n: 'lot-5', c: '5-lot — loyiha taklifi va TEP', f: true },
      { n: 'koksaroy-planshet', c: 'Planshet — 1-lot (dastlabki variant)', f: true },
      { n: 'koksaroy-existing-1', c: 'Mavjud 2 qavatli uy' },
      { n: 'koksaroy-existing-2', c: 'Mavjud 2 qavatli uy' },
      { n: 'taklif-existing-1', c: 'Mavjud uylarning hozirgi holati' },
      { n: 'taklif-existing-2', c: 'Mavjud uylarning hozirgi holati' },
      { n: 'taklif-existing-3', c: 'Mavjud uylarning hozirgi holati' },
      { n: 'taklif-existing-4', c: 'Mavjud uylarning hozirgi holati' },
    ],
    'nbc-doc': [
      { n: 'nbc-location', c: 'New Bukhara City — joylashuv xaritasi', f: true },
    ],
    'ncb-doc': [
      { n: 'ncb-site', c: 'Loyiha maydoni — 25 ga (sunʼiy yoʻldosh tasviri)' },
      { n: 'ncb-landuse', c: 'Yerdan foydalanish sxemasi' },
      { n: 'ncb-massing-1', c: 'Massing — zonalar' },
      { n: 'ncb-massing-2', c: 'Massing — hajmiy yechim' },
      { n: 'rox-ncb-park', c: 'Gulchorbogʻ — turar-joy majmuasi va park (ROX taqdimoti)' },
      { n: 'rox-ncb-towers', c: 'Gulchorbogʻ — turar-joy minoralari (ROX taqdimoti)' },
    ],
  };

  function buildGallery(root) {
    const items = G[root.dataset.gallery];
    // Stage — guruh (ichida tugmalar bor), shuning uchun role="button" emas; kattalashtirish alohida tugma.
    const stage = el('div', 'stage stage--zoomable');
    stage.setAttribute('role', 'group'); stage.tabIndex = 0;
    stage.setAttribute('aria-roledescription', 'galereya');
    const img = el('img'); img.alt = '';
    const cap = el('div', 'stage__cap');
    const zoom = el('button', 'stage__zoom'); zoom.type = 'button'; zoom.innerHTML = '<svg width="14" height="14" aria-hidden="true"><use href="#i-expand"/></svg>Kattalashtirish';
    const prev = el('button', 'stage__nav stage__nav--prev'); prev.setAttribute('aria-label', 'Oldingi rasm'); prev.innerHTML = '<svg><use href="#i-prev"/></svg>';
    const next = el('button', 'stage__nav stage__nav--next'); next.setAttribute('aria-label', 'Keyingi rasm'); next.innerHTML = '<svg><use href="#i-next"/></svg>';
    stage.append(img, cap, zoom, prev, next);
    const thumbs = el('div', 'thumbs');
    let cur = 0;
    const btns = items.map((it, i) => {
      const b = el('button', 'thumb'); b.type = 'button'; b.setAttribute('aria-label', it.c);
      const t = el('img'); t.src = IMG + it.n + '-sm.webp'; t.alt = ''; t.loading = 'lazy'; t.decoding = 'async';
      b.append(t); b.addEventListener('click', () => show(i));
      thumbs.append(b); return b;
    });
    function show(i) {
      cur = (i + items.length) % items.length;
      const it = items[cur];
      img.style.opacity = '0';
      const src = IMG + it.n + '-lg.webp';
      const done = () => { img.style.opacity = '1'; };
      img.onload = done; img.src = src; if (img.complete) done();
      img.alt = it.c; cap.textContent = it.c;
      stage.setAttribute('aria-label', `${it.c} — ${cur + 1} / ${items.length}`);
      stage.classList.toggle('stage--contain', !!it.f);
      btns.forEach((b, k) => { b.setAttribute('aria-current', String(k === cur)); });
      const bt = btns[cur];
      if (thumbs.scrollWidth > thumbs.clientWidth) thumbs.scrollTo({ left: bt.offsetLeft - thumbs.clientWidth / 2 + bt.offsetWidth / 2, behavior: 'smooth' });
    }
    prev.addEventListener('click', (e) => { e.stopPropagation(); show(cur - 1); });
    next.addEventListener('click', (e) => { e.stopPropagation(); show(cur + 1); });
    const open = () => lbOpen(items, cur);
    stage.addEventListener('click', open);
    zoom.addEventListener('click', (e) => { e.stopPropagation(); open(); });
    stage.addEventListener('keydown', (e) => {
      if (e.target !== stage) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
    });
    root.append(stage, thumbs);
    show(0);
  }
  function buildMosaic(root) {
    const items = M[root.dataset.mosaic];
    root.classList.add('mosaic');
    items.forEach((it, i) => {
      const b = el('button'); b.type = 'button'; if (it.f) b.className = 'contain';
      const im = el('img'); im.src = IMG + it.n + '-sm.webp'; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; // nomi — span izohidan
      b.append(im, el('span', '', it.c));
      b.addEventListener('click', () => lbOpen(items, i));
      root.append(b);
    });
  }

  /* ------------------------------------------------------------------ tabs */
  const tabs = $$('.tab');
  const built = new Set();
  function initPanel(panel) {
    if (built.has(panel.id)) return;
    built.add(panel.id);
    $$('[data-gallery]', panel).forEach(buildGallery);
    $$('[data-mosaic]', panel).forEach(buildMosaic);
    $$('.reveal', panel).forEach((n) => io && io.observe(n));
    if (panel.id === 'p-koksaroy') renderCmp();
    if (panel.id === 'p-ncb') renderLand();
    if (panel.id === 'p-etno') renderEtno();
  }
  function selectTab(tab, focus) {
    tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    $$('.panel').forEach((p) => p.classList.toggle('on', p.id === tab.getAttribute('aria-controls')));
    initPanel($('#' + tab.getAttribute('aria-controls')));
    if (focus) tab.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', (e) => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); selectTab(tabs[(i + k + tabs.length) % tabs.length], true); }
      else if (e.key === 'Home') { e.preventDefault(); selectTab(tabs[0], true); }
      else if (e.key === 'End') { e.preventDefault(); selectTab(tabs[tabs.length - 1], true); }
    });
  });

  /* ------------------------------------------------------------------ Koʻksaroy comparison */
  function renderCmp() {
    const rows = [['Aholi soni', 402, 3482], ['Maktab yoshidagi bolalar', 18, 221], ['Maktabgacha yoshdagi bolalar', 26, 198]];
    const box = $('#cmp');
    rows.forEach(([name, a, b]) => {
      const row = el('div', 'cmp__row');
      const lab = el('b', '', name);
      lab.append(el('span', 'mult', '×' + fmt(b / a, 1)));
      const bars = el('div', 'cmp__bars');
      [['a', a, 'Mavjud holat'], ['b', b, 'Taklif loyiha']].forEach(([k, v, label]) => {
        const bar = el('div', 'bar bar--' + k);
        const i = el('i'); i.style.setProperty('--w', Math.max(1.5, v / b * 100).toFixed(1));
        bar.append(i, el('em', '', fmt(v)));
        bar.tabIndex = 0; bar.setAttribute('role', 'img'); bar.setAttribute('aria-label', `${name}: ${label} — ${fmt(v)}`);
        tipBind(bar, fmt(v), `${name} · ${label}`);
        bars.append(bar);
      });
      row.append(lab, bars); box.append(row);
    });
  }

  /* ------------------------------------------------------------------ New Central Bukhara land use */
  function renderLand() {
    const data = [
      ['Turar-joy (kvartiralar, birinchi qavatda savdo)', 8, 32, 'var(--series-1)', false],
      ['Jamoat obyektlari (maktab, sogʻliqni saqlash, sport)', 2, 8, 'var(--series-2)', true],
      ['Yashil hududlar (bogʻ, xiyobon, suv obyektlari)', 9, 36, 'var(--series-3)', true],
      ['Tijorat va xizmat koʻrsatish', 2, 8, 'var(--series-4)', true],
      ['Transport va ichki harakat tizimi', 4, 16, 'var(--series-5)', true],
    ];
    const stack = $('#landStack'), keys = $('#landKeys');
    data.forEach(([name, ga, pct, color, dark]) => {
      const s = el('div', 'stack__seg' + (dark ? ' dark' : ''), pct + '%');
      s.style.setProperty('--v', pct); s.style.background = color; s.tabIndex = 0; s.setAttribute('role', 'img');
      s.setAttribute('aria-label', `${name}: ${fmt(ga, 1)} ga, ${pct}%`);
      tipBind(s, `${fmt(ga, 1)} ga · ${pct}%`, name);
      stack.append(s);
      const li = el('li'); const sw = el('i'); sw.style.background = color;
      li.append(sw, el('span', '', name.split(' (')[0]), el('b', '', `${fmt(ga, 1)} ga`));
      keys.append(li);
    });
  }

  /* ------------------------------------------------------------------ Etno qishloq plan */
  function renderEtno() {
    const L = [
      ['Bosh kirish va kabulxona', 50.9, 76.7], ['Maydon (hunarmandlar bozori)', 50.9, 64.9], ['Masjid', 61.0, 64.5],
      ['Madrasa (koʻrgazma/maʼrifiy markaz)', 38.8, 69.3], ['Karvonsaroy (mehmonxona)', 38.7, 55.7],
      ['Hunarmandlar mahallasi (ustaxonalar)', 34.4, 36.6], ['Choyxona', 59.7, 40.8], ['Milliy taomlar hududi', 64.2, 50.7],
      ['Turar-joy (anʼanaviy uylar)', 41.6, 17.1], ['Mehmon uylari (etno-hotel)', 60.4, 21.3], ['Muzey va koʻrgazma zali', 27.6, 55.0],
      ['Kichik amfiteatr (madaniy tadbirlar)', 66.8, 34.9], ['Suv havzasi va bogʻ', 50.7, 45.0], ['Xizmat koʻrsatish va maʼmuriyat', 74.1, 74.0],
      ['Xodimlar va texnik hudud', 25.0, 71.7],
    ];
    const plan = $('#etnoPlan'), list = $('#etnoLegend');
    const hots = [], lis = [];
    L.forEach(([name, x, y], i) => {
      const h = el('span', 'hot'); h.style.left = x + '%'; h.style.top = y + '%'; plan.append(h); hots.push(h);
      const li = el('li'); li.tabIndex = 0; li.append(el('b', '', String(i + 1)), document.createTextNode(name)); list.append(li); lis.push(li);
      const on = () => { hots.forEach((k, j) => k.classList.toggle('on', j === i)); };
      const off = () => hots[i].classList.remove('on');
      li.addEventListener('mouseenter', on); li.addEventListener('focus', on);
      li.addEventListener('mouseleave', off); li.addEventListener('blur', off);
    });
    plan.addEventListener('pointermove', (e) => {
      const r = plan.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width * 100, py = (e.clientY - r.top) / r.height * 100;
      let best = -1, bd = 4.2;
      L.forEach(([, x, y], i) => { const d = Math.hypot((x - px), (y - py) * r.height / r.width); if (d < bd) { bd = d; best = i; } });
      hots.forEach((k, j) => k.classList.toggle('on', j === best));
      lis.forEach((k, j) => k.classList.toggle('hl', j === best));
      if (best >= 0) tipShow(e.clientX, e.clientY, `${best + 1}. ${L[best][0]}`); else tipHide();
    });
    $$('#etnoBase button').forEach((b) => b.addEventListener('click', () => {
      $$('#etnoBase button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const im = $('img', plan);
      im.src = IMG + b.dataset.base + '-lg.webp'; im.dataset.lb = b.dataset.base;
      im.dataset.cap = b.dataset.base === 'etno-plan' ? 'Etno qishloq — master-plan' : 'Etno qishloq — master-plan (sunʼiy yoʻldosh asosida)';
    }));
    plan.addEventListener('pointerleave', () => { hots.forEach((k) => k.classList.remove('on')); lis.forEach((k) => k.classList.remove('hl')); tipHide(); });
  }

  /* ------------------------------------------------------------------ lots (tayyor paket) */
  const LOTS = window.LOTS || [];
  const lotState = { district: null, right: '', q: '', sort: { key: 'district', dir: 1 }, metric: 'count' };
  const COLS = [
    ['district', 'Hudud'], ['mfy', 'MFY'], ['area', 'Maydon, ga', 'num'], ['purpose', 'Maqsad'],
    ['use', 'Ruxsat etilgan faoliyat'], ['right', 'Huquq'], ['price', 'Boshlangʻich narx, mln soʻm', 'num'],
  ];
  function lotKpis() {
    const area = LOTS.reduce((s, l) => s + l.area, 0);
    const priced = LOTS.filter((l) => l.price);
    const sum = priced.reduce((s, l) => s + l.price, 0);
    const dists = new Set(LOTS.map((l) => l.district)).size;
    const ij = LOTS.filter((l) => l.right === 'Ijara').length;
    const data = [
      [fmt(LOTS.length), 'ta', 'Yer uchastkasi — «tayyor paket» roʻyxati'],
      [fmt(area, 2), 'ga', 'Umumiy maydon'],
      [String(dists), 'hudud', 'Tuman va shaharlar'],
      [`${ij} / ${LOTS.length - ij}`, '', 'Ijara huquqi / mulk huquqi'],
      [fmt(sum / 1e9, 2), 'mlrd soʻm', `${priced.length} ta uchastka uchun belgilangan boshlangʻich narx`],
    ];
    const box = $('#kpis');
    data.forEach(([v, u, label], i) => {
      const k = el('div', 'kpi reveal'); k.style.setProperty('--d', i * 0.05 + 's');
      const s = el('strong', '', v); if (u) s.append(el('small', '', u));
      k.append(s, el('span', '', label)); box.append(k); io && io.observe(k);
    });
  }
  function filteredLots() {
    const q = lotState.q.trim().toLowerCase();
    let rows = LOTS.filter((l) =>
      (!lotState.district || l.district === lotState.district) &&
      (!lotState.right || l.right === lotState.right) &&
      (!q || [l.district, l.mfy, l.purpose, l.use, l.id].join(' ').toLowerCase().includes(q)));
    const { key, dir } = lotState.sort;
    rows = rows.slice().sort((a, b) => {
      const x = a[key], y = b[key];
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'uz')) * dir;
    });
    return rows;
  }
  function renderLotTable() {
    const head = $('#lotTable thead'), body = $('#lotTable tbody');
    if (!head.firstChild) {
      const tr = el('tr');
      COLS.forEach(([key, label, cls]) => {
        const th = el('th', cls || ''); th.setAttribute('aria-sort', 'none');
        const b = el('button', '', label); b.type = 'button';
        b.addEventListener('click', () => {
          lotState.sort = { key, dir: lotState.sort.key === key ? -lotState.sort.dir : 1 };
          renderLotTable();
        });
        th.append(b); th.dataset.key = key; tr.append(th);
      });
      head.append(tr);
    }
    $$('#lotTable th').forEach((th) => th.setAttribute('aria-sort', th.dataset.key === lotState.sort.key ? (lotState.sort.dir > 0 ? 'ascending' : 'descending') : 'none'));
    const rows = filteredLots();
    body.replaceChildren();
    rows.forEach((l) => {
      const tr = el('tr');
      const d = el('td', '', l.district); d.append(el('small', '', l.id));
      const r = el('td'); r.append(el('span', 'pill pill--' + l.right.toLowerCase(), l.right === 'Ijara' ? 'Ijara' : 'Mulk'));
      tr.append(d, el('td', '', l.mfy), el('td', 'num', fmt(l.area, 4)), el('td', '', l.purpose), el('td', '', l.use), r,
        el('td', 'num', l.price ? fmt(l.price / 1e6, 1) : '—'));
      body.append(tr);
    });
    if (!rows.length) { const tr = el('tr'); const td = el('td', 'empty', 'Hech narsa topilmadi'); td.colSpan = COLS.length; tr.append(td); body.append(tr); }
    const a = rows.reduce((s, l) => s + l.area, 0);
    $('#lotCount').textContent = `${rows.length} ta uchastka · ${fmt(a, 2)} ga`;
  }
  function renderLotBars() {
    const box = $('#hbars');
    const m = lotState.metric;
    const by = {};
    LOTS.forEach((l) => { by[l.district] = by[l.district] || { n: 0, a: 0 }; by[l.district].n++; by[l.district].a += l.area; });
    const rows = Object.entries(by).sort((x, y) => (m === 'count' ? y[1].n - x[1].n : y[1].a - x[1].a));
    const max = Math.max(...rows.map(([, v]) => (m === 'count' ? v.n : v.a)));
    box.replaceChildren();
    rows.forEach(([name, v]) => {
      const val = m === 'count' ? v.n : v.a;
      const b = el('button', 'hb' + (lotState.district && lotState.district !== name ? ' dim' : '')); b.type = 'button';
      b.setAttribute('aria-pressed', String(lotState.district === name));
      const bar = el('div', 'bar'); const i = el('i'); i.style.setProperty('--w', (val / max * 100).toFixed(1));
      bar.append(i, el('em', '', m === 'count' ? String(val) : fmt(val, 2)));
      b.append(el('span', '', name), bar);
      tipBind(b, `${v.n} ta · ${fmt(v.a, 2)} ga`, name);
      b.addEventListener('click', () => { lotState.district = lotState.district === name ? null : name; renderLotBars(); renderLotTable(); });
      box.append(b);
    });
  }
  function initLots() {
    if (!LOTS.length) return;
    lotKpis(); renderLotBars(); renderLotTable();
    $$('#lotMetric button').forEach((b) => b.addEventListener('click', () => {
      lotState.metric = b.dataset.m;
      $$('#lotMetric button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      renderLotBars();
    }));
    $('#lotSearch').addEventListener('input', (e) => { lotState.q = e.target.value; renderLotTable(); });
    $('#lotRight').addEventListener('change', (e) => { lotState.right = e.target.value; renderLotTable(); });
  }

  /* ------------------------------------------------------------------ init */
  initLots();
  initPanel($('#p-koksaroy'));
})();
