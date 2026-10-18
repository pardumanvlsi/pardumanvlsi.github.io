document.querySelectorAll('[data-animation]').forEach((figure) => {
const image = figure.querySelector('img');
const link = figure.querySelector('.media-link');
const button = figure.querySelector('.animation-toggle');
const status = figure.querySelector('.media-status');
const poster = image.getAttribute('src');
const description = image.alt;

function showDiagram() {
image.src = poster;
image.alt = description;
link.href = poster;
button.setAttribute('aria-pressed', 'false');
button.textContent = 'Play animation';
}

button.hidden = false;
button.addEventListener('click', () => {
status.textContent = '';
if (button.getAttribute('aria-pressed') === 'true') {
showDiagram();
return;
}
image.src = figure.dataset.animation;
image.alt = figure.dataset.animationDescription || `${description}. Repository operation animation.`;
link.href = figure.dataset.animation;
button.setAttribute('aria-pressed', 'true');
button.textContent = 'Stop animation';
});

image.addEventListener('error', () => {
if (button.getAttribute('aria-pressed') === 'true') {
showDiagram();
status.textContent = 'Animation unavailable. The repository link is available below.';
}
});

document.addEventListener('visibilitychange', () => {
if (document.hidden && button.getAttribute('aria-pressed') === 'true') {
showDiagram();
}
});
document.addEventListener('projectsfiltered', () => {
if (figure.closest('.project').hidden) showDiagram();
});
});

const header = document.querySelector('.site-header');
const navigationLinks = [...document.querySelectorAll('nav a[href^="#"]')];
const navigationToggle = document.querySelector('.nav-toggle');
const mobileNavigation = matchMedia('(max-width: 1100px)');
const readingProgress = document.querySelector('.reading-progress');
let scrollScheduled = false;

function setNavigationOpen(open) {
header.classList.toggle('nav-open', open);
navigationToggle.setAttribute('aria-expanded', String(open));
navigationToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
navigationToggle.title = open ? 'Close navigation' : 'Open navigation';
navigationToggle.querySelector('img').src = open ? 'assets/icon-close.svg' : 'assets/icon-menu.svg';
}

navigationToggle.hidden = false;
header.classList.add('nav-ready');
navigationToggle.addEventListener('click', () => setNavigationOpen(navigationToggle.getAttribute('aria-expanded') !== 'true'));
navigationLinks.forEach((link) => link.addEventListener('click', () => {
if (!mobileNavigation.matches) return;
setNavigationOpen(false);
const target = document.querySelector(link.getAttribute('href'));
target.setAttribute('tabindex', '-1');
target.focus({ preventScroll: true });
}));
document.addEventListener('keydown', (event) => {
if (event.key === 'Escape' && header.classList.contains('nav-open')) {
setNavigationOpen(false);
navigationToggle.focus();
}
});
document.addEventListener('click', (event) => {
if (!header.contains(event.target)) setNavigationOpen(false);
});
mobileNavigation.addEventListener('change', () => {
const navigationHadFocus = document.querySelector('#main-navigation').contains(document.activeElement);
const toggleHadFocus = document.activeElement === navigationToggle;
setNavigationOpen(false);
if (mobileNavigation.matches && navigationHadFocus) navigationToggle.focus();
else if (!mobileNavigation.matches && toggleHadFocus) navigationLinks[0].focus();
});

function updateCurrentSection() {
scrollScheduled = false;
const offset = document.querySelector('.header-inner').getBoundingClientRect().height + 40;
const scrollRange = document.documentElement.scrollHeight - innerHeight;
readingProgress.style.transform = `scaleX(${scrollRange > 0 ? Math.min(1, Math.max(0, scrollY / scrollRange)) : 0})`;
const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
const current = atBottom ? navigationLinks.at(-1) : [...navigationLinks].reverse().find((link) => {
return document.querySelector(link.getAttribute('href')).getBoundingClientRect().top <= offset;
});
navigationLinks.forEach((link) => {
if (link === current) link.setAttribute('aria-current', 'location');
else link.removeAttribute('aria-current');
});
}

function scheduleNavigationUpdate() {
if (scrollScheduled) return;
scrollScheduled = true;
requestAnimationFrame(updateCurrentSection);
}

new ResizeObserver(() => {
document.documentElement.style.setProperty('--header-offset', `${header.getBoundingClientRect().height + 24}px`);
scheduleNavigationUpdate();
}).observe(header);
window.addEventListener('scroll', scheduleNavigationUpdate, { passive: true });
new ResizeObserver(scheduleNavigationUpdate).observe(document.body);

const projectFilters = [...document.querySelectorAll('input[name="project-filter"]')];
const projectItems = [...document.querySelectorAll('#project-list > .project[data-categories]')];

function filterProjects(category) {
projectItems.forEach((project) => {
project.hidden = category !== 'all' && !project.dataset.categories.split(' ').includes(category);
});
const visibleProjects = projectItems.filter((project) => !project.hidden);
const count = visibleProjects.length;
document.querySelector('.project-count').textContent = `${count} ${count === 1 ? 'project' : 'projects'}`;
document.dispatchEvent(new Event('projectsfiltered'));
scheduleNavigationUpdate();
}

projectFilters.forEach((input) => input.addEventListener('change', () => filterProjects(input.value)));
document.querySelector('.project-toolbar').hidden = false;
filterProjects(projectFilters.find((input) => input.checked).value);

function revealLinkedProject() {
let targetId = location.hash.slice(1);
try { targetId = decodeURIComponent(targetId); } catch {}
const target = document.getElementById(targetId);
const project = target?.closest('.project');
if (project?.hidden) {
projectFilters.find((input) => input.value === 'all').checked = true;
filterProjects('all');
requestAnimationFrame(() => target.scrollIntoView());
}
}
window.addEventListener('hashchange', revealLinkedProject);
revealLinkedProject();

const viewer = document.querySelector('.media-viewer');
const viewerImage = viewer.querySelector('.viewer-image');
const viewerStage = viewer.querySelector('.viewer-stage');
const viewerStatus = viewer.querySelector('.viewer-status');
const zoomIn = viewer.querySelector('[data-zoom="in"]');
const zoomOut = viewer.querySelector('[data-zoom="out"]');
let imageTrigger;
let zoom = 1;

function updateImageZoom() {
if (!viewer.open || !viewerImage.naturalWidth) return;
const fitWidth = Math.min(viewerImage.naturalWidth, viewerStage.clientWidth - 32, (viewerStage.clientHeight - 32) * viewerImage.naturalWidth / viewerImage.naturalHeight);
viewerImage.style.width = `${Math.max(1, fitWidth) * zoom}px`;
viewer.querySelector('.zoom-level').textContent = `${Math.round(zoom * 100)}%`;
zoomIn.disabled = zoom >= 3;
zoomOut.disabled = zoom <= 1;
}

document.querySelectorAll('.media-link, .study-media > a').forEach((link) => {
const image = link.querySelector('img');
if (!image || typeof viewer.showModal !== 'function') return;
link.setAttribute('aria-label', `Enlarge image: ${image.alt}`);
link.setAttribute('aria-haspopup', 'dialog');
link.addEventListener('click', (event) => {
if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0 || typeof viewer.showModal !== 'function') return;
event.preventDefault();
imageTrigger = link;
zoom = 1;
viewerImage.style.width = '0px';
viewerImage.alt = image.alt;
viewerImage.src = image.currentSrc || image.src;
viewer.querySelector('#viewer-title').textContent = link.closest('article')?.querySelector('h3')?.textContent || 'VCU2 project visual';
viewer.querySelector('#viewer-caption').textContent = link.closest('figure')?.querySelector('figcaption')?.textContent || image.alt;
viewer.querySelector('.viewer-original').href = link.href;
viewerStatus.textContent = 'Loading image...';
zoomIn.disabled = true;
zoomOut.disabled = true;
viewer.showModal();
document.body.classList.add('viewer-open');
viewerStage.scrollTo(0, 0);
if (viewerImage.complete && viewerImage.naturalWidth) {
viewerStatus.textContent = '';
updateImageZoom();
}
});
});

viewerImage.addEventListener('load', () => {
viewerStatus.textContent = '';
updateImageZoom();
});
viewerImage.addEventListener('error', () => {
if (viewer.open) viewerStatus.textContent = 'Image unavailable. Open the original file using the link below.';
});
zoomIn.addEventListener('click', () => { zoom = Math.min(3, zoom + 0.5); updateImageZoom(); });
zoomOut.addEventListener('click', () => { zoom = Math.max(1, zoom - 0.5); updateImageZoom(); });
viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', (event) => {
const bounds = viewer.getBoundingClientRect();
if (event.target === viewer && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) viewer.close();
});
viewer.addEventListener('close', () => {
document.body.classList.remove('viewer-open');
viewerImage.removeAttribute('src');
imageTrigger?.focus({ preventScroll: true });
});
new ResizeObserver(updateImageZoom).observe(viewerStage);

