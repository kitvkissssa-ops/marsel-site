const nav = document.querySelector('.site-nav');

if (nav) {
  const links = [...nav.querySelectorAll('a')];
  const sections = links.map(link => ({ link, section: document.getElementById(link.hash.slice(1)) }))
    .filter(({ section }) => section);
  let current = nav.querySelector('[aria-current]');
  let hovered = null;
  let frame = 0;

  function positionIndicator() {
    const link = hovered || current;
    nav.style.setProperty('--slide-x', `${link?.offsetLeft ?? 0}px`);
    nav.style.setProperty('--slide-width', `${link?.offsetWidth ?? 0}px`);
  }

  function updateCurrentSection() {
    if (!sections.length) return;
    const readingLine = Math.min(200, innerHeight * .27);
    let next = links[0];
    let closestTop = -Infinity;
    for (const { link, section } of sections) {
      const top = section.getBoundingClientRect().top;
      if (top <= readingLine && top > closestTop) {
        closestTop = top;
        next = link;
      }
    }
    if (current === next) return;
    current?.removeAttribute('aria-current');
    current = next;
    current.setAttribute('aria-current', 'location');
    positionIndicator();
  }

  if (sections.length) {
    updateCurrentSection();
    window.addEventListener('scroll', () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        updateCurrentSection();
      });
    }, { passive: true });
    window.addEventListener('pageshow', updateCurrentSection);
  }

  positionIndicator();
  nav.dataset.sliding = '';
  nav.addEventListener('pointerover', (event) => {
    const link = event.target.closest('a');
    if (event.pointerType !== 'mouse' || !link || hovered === link) return;
    hovered = link;
    positionIndicator();
  });
  nav.addEventListener('pointerleave', () => {
    hovered = null;
    positionIndicator();
  });
  window.addEventListener('resize', () => {
    updateCurrentSection();
    positionIndicator();
  });
  if ('ResizeObserver' in window) {
    const resize = new ResizeObserver(positionIndicator);
    for (const link of links) resize.observe(link);
  }
}

const motion = matchMedia('(prefers-reduced-motion: no-preference)');
const hero = document.querySelector('.hero');
if (hero) {
  hero.addEventListener('focusin', () => hero.classList.add('hero-entered'), { once: true });
  document.addEventListener('focusin', () => {
    document.documentElement.classList.add('intro-skipped');
    hero.classList.add('hero-entered');
  }, { once: true });
}

const stage = hero?.querySelector('.cinematic-stage');
if (stage && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    stage.classList.toggle('orbit-offscreen', !entry.isIntersecting);
  }).observe(stage);
}
if (motion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: .08 });
  for (const element of document.querySelectorAll('[data-reveal]')) observer.observe(element);
  document.documentElement.classList.add('js-reveal');
}

const showcase = document.querySelector('.project-showcase');
const showcaseStage = showcase?.querySelector('.project-showcase-stage');
const showcaseCards = showcaseStage ? [...showcaseStage.children] : [];
if (showcaseCards.map(card => card.id).join(' ') === 'noir-detailing club-barber altair') {
  function showProject(card) {
    if (getComputedStyle(showcaseStage).position !== 'sticky') return;
    const stop = parseFloat(getComputedStyle(card).getPropertyValue('--showcase-stop'));
    if (!Number.isFinite(stop)) return;
    const top = scrollY + showcase.getBoundingClientRect().top;
    const distance = showcase.clientHeight - showcaseStage.offsetHeight;
    scrollTo({ top: top + distance * stop, behavior: 'instant' });
  }

  function showLinkedProject() {
    const card = showcaseCards.find(project => `#${project.id}` === location.hash);
    if (card) showProject(card);
  }

  showcase.addEventListener('focusin', event => {
    const link = event.target.closest('.work-frame a:focus-visible');
    if (link) showProject(link.closest('.work-card'));
  });
  window.addEventListener('hashchange', showLinkedProject);
  window.addEventListener('pageshow', showLinkedProject);
  showcase.dataset.ready = '';
  showLinkedProject();
}

function projectSlug(url) {
  if (!url) return '';
  return new URL(url).pathname.match(/\/projects\/([a-z0-9-]+)\/?$/)?.[1] ?? '';
}

function shareProjectScreen(transition, otherUrl) {
  if (!transition) return;
  // The browser may skip this animation while still completing navigation.
  transition.ready.catch(() => {});
  if (!motion.matches) return;
  const current = projectSlug(location.href);
  const other = projectSlug(otherUrl);
  if (Boolean(current) === Boolean(other)) return;
  const screen = document.querySelector(`[data-project-screen="${current || other}"]`);
  if (!screen) return;
  const { top, bottom } = screen.getBoundingClientRect();
  if (bottom <= 0 || top >= innerHeight) return;
  screen.style.viewTransitionName = 'project-screen';
  const restore = () => { screen.style.viewTransitionName = ''; };
  transition.finished.then(restore, restore);
}

window.addEventListener('pageswap', (event) => {
  shareProjectScreen(event.viewTransition, event.activation?.entry?.url);
});
window.addEventListener('pagereveal', (event) => {
  shareProjectScreen(event.viewTransition, window.navigation?.activation?.from?.url);
});

const lightbox = document.querySelector('.case-lightbox');
if (lightbox?.showModal) {
  const viewport = lightbox.querySelector('.case-lightbox-scroll');
  const image = viewport.querySelector('img');
  const scale = lightbox.querySelector('.case-lightbox-scale');
  let opener;

  for (const link of document.querySelectorAll('.case-zoom')) {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || lightbox.open) return;
      event.preventDefault();
      opener = link;
      const preview = link.querySelector('img');
      image.alt = preview.alt;
      image.src = link.href;
      lightbox.style.setProperty('--case-image-width', preview.getAttribute('width') + 'px');
      scale.setAttribute('aria-pressed', 'false');
      lightbox.showModal();
      viewport.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }

  scale.addEventListener('click', () => {
    const isOriginal = scale.getAttribute('aria-pressed') === 'true';
    scale.setAttribute('aria-pressed', String(!isOriginal));
  });

  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('close', () => {
    if (!lightbox.open) opener?.focus({ preventScroll: true });
  });
}

const live = document.querySelector('.live-details');
if (live) {
  const container = live.querySelector('.live-frame');
  let cleanup;
  live.addEventListener('toggle', () => {
    clearTimeout(cleanup);
    if (!live.open) {
      cleanup = setTimeout(() => container.replaceChildren(), motion.matches ? 410 : 0);
      return;
    }
    if (container.firstChild) return;
    const frame = document.createElement('iframe');
    frame.title = `Интерактивный просмотр — ${live.dataset.siteName}`;
    frame.referrerPolicy = 'no-referrer';
    const source = new URL(live.dataset.src, location.href);
    frame.setAttribute('sandbox', source.origin === location.origin ? 'allow-scripts' : 'allow-scripts allow-same-origin');
    frame.src = source.href;
    container.append(frame);
  });
}
