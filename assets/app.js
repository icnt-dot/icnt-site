(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const params = new URLSearchParams(window.location.search);
  let savedLanguage;
  try { savedLanguage = localStorage.getItem('icnt-language'); } catch (_) { /* Preference storage is optional. */ }
  let language = params.get('lang') === 'hy' ? 'hy' : params.get('lang') === 'en' ? 'en' : savedLanguage === 'hy' ? 'hy' : 'en';
  const directory = $('[data-directory]');
  let filter = directory ? directory.dataset.directory : 'all';
  const validFilters = ['all', 'fabrication', 'characterization'];
  if (directory && validFilters.includes(params.get('group'))) filter = params.get('group');
  const searchInput = $('#equipment-search');
  if (searchInput && params.has('q')) searchInput.value = params.get('q');

  function localLinks() {
    $$('a[href]').forEach(anchor => {
      const value = anchor.getAttribute('href');
      if (!value || /^(mailto:|tel:|https?:|\/\/)/.test(value)) return;
      const url = new URL(value, window.location.href);
      if (url.origin !== window.location.origin) return;
      url.searchParams.set('lang', language);
      anchor.setAttribute('href', url.pathname.split('/').pop() + url.search + url.hash);
    });
  }

  function updateDirectory(writeURL = false) {
    if (!directory) return;
    const query = searchInput.value.trim().toLocaleLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);
    let count = 0;
    $$('[data-equipment]').forEach(card => {
      const matches = (filter === 'all' || card.dataset.group === filter) && tokens.every(token => card.dataset.search.toLocaleLowerCase().includes(token));
      card.hidden = !matches;
      if (matches) count++;
    });
    $$('[data-directory-group]').forEach(group => { group.hidden = !$$('[data-equipment]', group).some(card => !card.hidden); });
    $$('[data-filter]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.filter === filter)); });
    $('#results-count').textContent = language === 'hy' ? `Ցուցադրված է ${count} սարքավորում՝ 12-ից` : `Showing ${count} of 12 capabilities`;
    $('.no-results').hidden = count !== 0;
    $('#clear-search').hidden = searchInput.value.length === 0;
    if (writeURL) {
      const url = new URL(window.location.href);
      url.searchParams.set('group', filter);
      if (query) url.searchParams.set('q', searchInput.value.trim()); else url.searchParams.delete('q');
      try { history.replaceState(null, '', url); } catch (_) { /* The directory also works without history access. */ }
    }
  }

  function setLanguage(next, writeURL = true, announce = false) {
    language = next === 'hy' ? 'hy' : 'en';
    document.documentElement.lang = language;
    $$('[data-en][data-hy]').forEach(el => { el.textContent = el.dataset[language]; });
    [['aria', 'aria-label'], ['placeholder', 'placeholder'], ['content', 'content'], ['href', 'href'], ['alt', 'alt']].forEach(([key, attribute]) => {
      $$(`[data-en-${key}][data-hy-${key}]`).forEach(el => el.setAttribute(attribute, el.getAttribute(`data-${language}-${key}`)));
    });
    $$('[data-lang]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === language)));
    try { localStorage.setItem('icnt-language', language); } catch (_) { /* URL state preserves language without storage. */ }
    if (writeURL) {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', language);
      try { history.replaceState(null, '', url); } catch (_) { /* Read-only previews can still switch language. */ }
    }
    localLinks();
    updateDirectory();
    $$('iframe[data-icnt-video]').forEach(frame => { frame.title = language === 'hy' ? `ICNT — Տեսանյութ ${frame.dataset.icntVideo}` : `ICNT — Video ${frame.dataset.icntVideo}`; });
    if (announce) $('#language-status').textContent = language === 'hy' ? 'Կայքը հայերեն է։' : 'The site is now in English.';
  }
  $$('[data-lang]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang, true, true)));
  const menu = $('.menu-button');
  const nav = $('#main-nav');
  function closeMenu() { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach(anchor => anchor.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menu.focus(); } });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 880) closeMenu(); });
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; updateDirectory(true); }));
  if (searchInput) {
    searchInput.addEventListener('input', () => updateDirectory(true));
    $('#clear-search').addEventListener('click', () => { searchInput.value = ''; updateDirectory(true); searchInput.focus(); });
    $$('.reset-filters').forEach(button => button.addEventListener('click', () => { filter = 'all'; searchInput.value = ''; updateDirectory(true); }));
  }
  $$('[data-video-play]').forEach((button, index) => button.addEventListener('click', () => {
    const screen = button.closest('[data-video]');
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${button.dataset.videoPlay}?autoplay=1&rel=0`;
    frame.title = language === 'hy' ? `ICNT — Տեսանյութ ${index + 1}` : `ICNT — Video ${index + 1}`;
    frame.dataset.icntVideo = String(index + 1);
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    screen.replaceChildren(frame);
    frame.focus();
  }));
  const photoDialog = $('#equipment-photo-dialog');
  const expandedPhoto = $('#expanded-equipment-photo');
  const photoCaption = $('#expanded-photo-caption');
  let photoOpener;
  function releasePhotoFocus() {
    document.body.classList.remove('photo-open');
    if (photoOpener) photoOpener.focus();
  }
  function closePhoto() {
    if (!photoDialog || !photoDialog.hasAttribute('open')) return;
    if (typeof photoDialog.close === 'function') photoDialog.close();
    else photoDialog.removeAttribute('open');
    releasePhotoFocus();
  }
  $$('[data-photo-open]').forEach(button => button.addEventListener('click', () => {
    photoOpener = button;
    const thumbnail = $('img', button);
    expandedPhoto.src = button.dataset.photoOpen;
    expandedPhoto.alt = thumbnail.alt;
    expandedPhoto.dataset.enAlt = thumbnail.dataset.enAlt;
    expandedPhoto.dataset.hyAlt = thumbnail.dataset.hyAlt;
    photoCaption.dataset.en = thumbnail.dataset.enAlt;
    photoCaption.dataset.hy = thumbnail.dataset.hyAlt;
    photoCaption.textContent = thumbnail.alt;
    if (typeof photoDialog.showModal === 'function') photoDialog.showModal();
    else photoDialog.setAttribute('open', '');
    document.body.classList.add('photo-open');
    $('.photo-dialog-close', photoDialog).focus();
  }));
  if (photoDialog) {
    $('.photo-dialog-close', photoDialog).addEventListener('click', closePhoto);
    photoDialog.addEventListener('click', event => { if (event.target === photoDialog) closePhoto(); });
    photoDialog.addEventListener('close', releasePhotoFocus);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && photoDialog.hasAttribute('open')) {
        event.preventDefault();
        closePhoto();
      }
    });
  }
  window.addEventListener('popstate', () => {
    const state = new URLSearchParams(window.location.search);
    if (directory) { filter = validFilters.includes(state.get('group')) ? state.get('group') : directory.dataset.directory; searchInput.value = state.get('q') || ''; }
    setLanguage(state.get('lang') === 'hy' ? 'hy' : 'en', false);
  });
  setLanguage(language, false);
})();
