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
  if (firstVisit) celebrate();
}
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); show(button.dataset.go); }));
document.querySelector('.quiet-link').addEventListener('click', event => { event.preventDefault(); document.querySelector('#welcome-quiz').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); });
nodes.forEach(node => node.addEventListener('click', () => show(node.dataset.node)));
document.querySelectorAll('[data-unlock]').forEach(button => button.addEventListener('click', () => show(button.dataset.unlock)));
const flowerMessages = ['出发日：人已出门，方向随缘。这里以后放你们的出游照片。', '好天气：阳光负责灿烂，你们负责笑场。这里以后放合照。', '小小绕路：导航重新规划，快乐不受影响。这里以后放路上的照片。'];
document.querySelectorAll('.flower-button').forEach((button, index) => button.addEventListener('click', () => {
  document.querySelector('.photo-note b').textContent = button.querySelector('span:last-child').textContent;
  document.querySelector('.photo-note p').textContent = flowerMessages[index]; button.setAttribute('aria-pressed', 'true');
}));
document.querySelector('#playMock').addEventListener('click', () => toast('小电影还在等素材。放入真实视频后，就能在这里播放啦。'));
document.querySelector('#audioMock').addEventListener('click', () => toast('这个漂流瓶还没装入录音，先替你保管好。'));
document.querySelector('#soundToggle').addEventListener('click', () => toast('背景音乐还没选好，当前是安静逛岛模式。'));
document.querySelector('#resetButton').addEventListener('click', () => { show('map'); toast('欢迎再逛一次，刚才留下的小脚印都还在。'); });
function readRoute() { return location.hash.slice(1) || new URLSearchParams(location.search).get('entry') || 'home'; }
window.addEventListener('popstate', () => show(readRoute(), false));
show(readRoute(), false);
