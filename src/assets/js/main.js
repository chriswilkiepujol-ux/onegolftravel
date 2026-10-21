// ============================================================
// ONE GOLF TRAVEL, shared site behaviour. Loaded on every page.
// ============================================================
const LANG = (document.documentElement.lang || 'en').slice(0, 2);
const MSG = ({
  en: { sending: 'Sending…', thanks: "Thanks, we'll be in touch within 24 hours.", error: 'Something went wrong. Please email us at info@onegolftravel.com.' },
  es: { sending: 'Enviando…', thanks: 'Gracias, te respondemos en menos de 24 horas.', error: 'Algo ha fallado. Escríbenos a info@onegolftravel.com.' },
  de: { sending: 'Wird gesendet…', thanks: 'Danke! Wir melden uns innerhalb von 24 Stunden.', error: 'Da ist etwas schiefgelaufen. Bitte schreiben Sie uns an info@onegolftravel.com.' },
})[LANG] || { sending: 'Sending…', thanks: 'Thanks.', error: 'Error.' };

document.addEventListener('DOMContentLoaded', () => {
  // Scroll reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // Menu panel
  const menuBtn = document.querySelector('.nav-menu-btn');
  const menu = document.getElementById('site-menu');
  if (menuBtn && menu) {
    const setOpen = (open) => {
      menu.hidden = !open;
      menuBtn.classList.toggle('active', open);
      menuBtn.setAttribute('aria-expanded', open);
      document.body.classList.toggle('menu-open', open);
    };
    menuBtn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(menu.hidden); });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setOpen(false); menuBtn.focus(); } });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach((q) => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', open);
    });
  });

  // Enquiry forms (Formspree, AJAX)
  document.querySelectorAll('.enquiry-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = form.querySelector('.form-status');
      const btn = form.querySelector('button[type="submit"]');
      const original = btn ? btn.textContent : '';
      if (btn) { btn.textContent = MSG.sending; btn.disabled = true; }
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (res.ok) {
          if (status) { status.textContent = MSG.thanks; status.className = 'form-status show ok'; }
          form.reset();
        } else if (status) { status.textContent = MSG.error; status.className = 'form-status show err'; }
      } catch (err) {
        if (status) { status.textContent = MSG.error; status.className = 'form-status show err'; }
      } finally {
        if (btn) { btn.textContent = original; btn.disabled = false; }
      }
    });
  });

  // Pre-fill the custom package form from the URL (?destination=spain&region=sotogrande&course=…)
  document.querySelectorAll('form[data-prefill]').forEach((form) => {
    const params = new URLSearchParams(location.search);
    form.querySelectorAll('[data-prefill-field]').forEach((field) => {
      const v = params.get(field.dataset.prefillField);
      if (!v) return;
      if (field.tagName === 'SELECT') {
        const opt = [...field.options].find((o) => o.value === v);
        if (opt) field.value = v;
      } else field.value = v;
    });
    const course = params.get('course'); const hotel = params.get('hotel');
    const notes = form.querySelector('textarea[name="changes"]');
    const courses = form.querySelector('input[name="courses"]');
    if (course && courses && !courses.value) courses.value = course.replace(/-/g, ' ');
    if (hotel && notes && !notes.value) notes.value = (LANG === 'es' ? 'Hotel: ' : LANG === 'de' ? 'Hotel: ' : 'Hotel: ') + hotel.replace(/-/g, ' ');
  });

  // Image galleries
  document.querySelectorAll('[data-gallery]').forEach((gallery) => {
    const slides = gallery.querySelectorAll('.gallery-slide');
    const dots = gallery.querySelectorAll('.gallery-dot');
    let current = 0;
    const show = (i) => {
      current = (i + slides.length) % slides.length;
      slides.forEach((s, idx) => s.classList.toggle('active', idx === current));
      dots.forEach((d, idx) => d.classList.toggle('active', idx === current));
    };
    gallery.querySelector('.gallery-prev')?.addEventListener('click', () => show(current - 1));
    gallery.querySelector('.gallery-next')?.addEventListener('click', () => show(current + 1));
    dots.forEach((d, idx) => d.addEventListener('click', () => show(idx)));
    let x0 = 0;
    gallery.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    gallery.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(dx > 0 ? current - 1 : current + 1); }, { passive: true });
  });

  // Package list filter by country
  document.querySelectorAll('[data-pkg-filter]').forEach((box) => {
    const list = box.parentElement.querySelector('[data-pkg-list]');
    const empty = box.parentElement.querySelector('[data-pkg-empty]');
    if (!list) return;
    box.querySelectorAll('button[data-country]').forEach((btn) => btn.addEventListener('click', () => {
      const c = btn.dataset.country;
      box.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
      let shown = 0;
      list.querySelectorAll('.trip-item').forEach((it) => { const on = c === 'all' || it.dataset.country === c; it.hidden = !on; if (on) shown++; });
      if (empty) empty.hidden = shown > 0;
    }));
  });
});
