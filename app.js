const screens = [...document.querySelectorAll('.screen')];
const nodes = [...document.querySelectorAll('[data-node]')];
const order = ['pass', 'travel', 'training', 'video', 'final'];
const routes = { home: 'home', map: 'map', pass: 'home', travel: 'travel', training: 'training', video: 'video', final: 'final' };
const storageKey = 'birthday-island-visited-v2';
let saved = [];
try { const value = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (Array.isArray(value)) saved = value.filter(key => order.includes(key)); } catch {}
const visited = new Set(['pass', ...saved]);
let toastTimer;
function toast(text) {
  document.querySelector('.toast')?.remove();
  clearTimeout(toastTimer);
  const message = document.createElement('div');
  message.className = 'toast'; message.setAttribute('role', 'status'); message.textContent = text;
  document.body.append(message);
  toastTimer = setTimeout(() => message.remove(), 4200);
}
function updateMap() {
  nodes.forEach(node => {
    const seen = visited.has(node.dataset.node);
    node.classList.toggle('unlocked', seen);
    node.classList.toggle('locked', !seen);
    node.querySelector('small').textContent = seen ? '已留下脚印' : '点击去看看';
  });
  document.querySelector('#progressText').textContent = `${visited.size} / 5`;
  document.querySelector('#navCount').textContent = `${visited.size}/5`;
  document.querySelector('#progressBar').style.width = `${visited.size * 20}%`;
  try { localStorage.setItem(storageKey, JSON.stringify([...visited])); } catch {}
}
function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelector('.celebration')?.remove();
  const layer = document.createElement('div'); layer.className = 'celebration'; layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 24; i++) {
    const piece = document.createElement('i'); piece.textContent = ['✦', '♡', '●', '✿'][i % 4];
    piece.style.left = `${Math.random() * 100}%`; piece.style.animationDelay = `${Math.random() * .7}s`;
    piece.style.color = ['#dfa1a4', '#daba73', '#9eb79a', '#a3bdcc'][i % 4]; layer.append(piece);
  }
  document.body.append(layer); setTimeout(() => layer.remove(), 3800);
}
function show(name, updateUrl = true) {
  const target = Object.hasOwn(routes, name) ? routes[name] : 'home';
  const firstVisit = target === 'final' && !visited.has('final');
  if (order.includes(target)) visited.add(target);
  screens.forEach(screen => { const active = screen.dataset.screen === target; screen.classList.toggle('active', active); screen.setAttribute('aria-hidden', String(!active)); });
  document.querySelectorAll('.bottom-nav [data-go]').forEach(button => {
    const active = button.dataset.go === target || (button.dataset.go === 'map' && ['travel', 'training', 'video'].includes(target));
    button.classList.toggle('active', active); if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });
  if (updateUrl) { const url = new URL(location.href); url.searchParams.delete('entry'); url.hash = target; history.pushState(null, '', url); }
  updateMap(); window.scrollTo({ top: 0, behavior: 'instant' });
  window.dispatchEvent(new CustomEvent('island:screenchange', { detail: { screen: target } }));
  if (firstVisit) celebrate();
}
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); show(button.dataset.go); }));
document.querySelectorAll('[data-go][role="button"]').forEach(button => button.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(button.dataset.go); } }));
document.querySelector('#startJourney').addEventListener('click', () => {
  const quiz = document.querySelector('[data-guess="home"]');
  const heading = quiz?.querySelector('h3');
  heading?.focus({ preventScroll: true });
  document.querySelector('#welcome-quiz').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
});
nodes.forEach(node => node.addEventListener('click', () => show(node.dataset.node)));
document.querySelectorAll('[data-unlock]').forEach(button => button.addEventListener('click', () => show(button.dataset.unlock)));
document.querySelector('#resetButton').addEventListener('click', () => { show('map'); toast('欢迎再逛一次，刚才留下的小脚印都还在。'); });
function readRoute() { return location.hash.slice(1) || new URLSearchParams(location.search).get('entry') || 'home'; }
// 生日倒计时：目标写在 #countdownStrip 的 data-target，生日当天与之后换成不同文案。
function tickCountdown() {
  const strip = document.querySelector('#countdownStrip');
  if (!strip) return;
  const target = new Date(strip.dataset.target);
  const days = strip.querySelector('#countdownDays');
  const clock = strip.querySelector('#countdownClock');
  const label = strip.querySelector('.countdown-label');
  const unit = strip.querySelector('.countdown-unit');
  const now = new Date();
  const sameDay = value => value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth() && value.getDate() === now.getDate();
  if (sameDay(target)) { label.textContent = '今天就是'; days.textContent = '生日'; unit.textContent = ''; clock.textContent = ''; strip.classList.add('is-today'); return; }
  if (now > target) { label.textContent = '生日已经'; days.textContent = '过完啦'; unit.textContent = ''; clock.textContent = ''; strip.classList.add('is-past'); return; }
  const left = target - now;
  const totalDays = Math.floor(left / 86400000);
  const totalHours = Math.floor(left / 3600000);
  const minutes = String(Math.floor(left / 60000) % 60).padStart(2, '0');
  if (totalDays === 0) {
    // 不到一天：把小时提上来，避免显示成「0 天」
    days.textContent = String(totalHours);
    unit.textContent = '小时';
    clock.textContent = `${minutes}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
  } else {
    days.textContent = String(totalDays);
    unit.textContent = '天';
    clock.textContent = `${String(totalHours % 24).padStart(2, '0')}:${minutes}`;
  }
}
tickCountdown();
window.setInterval(tickCountdown, 1000);
window.addEventListener('popstate', () => show(readRoute(), false));
show(readRoute(), false);
