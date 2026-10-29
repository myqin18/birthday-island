const root = document.querySelector('#crystalExperience');
if (root) {
  const host = document.querySelector('#crystalCanvas');
  const start = document.querySelector('#crystalStart');
  const status = document.querySelector('#crystalStatus');
  const tree = document.querySelector('#crystalModeTree');
  const scatter = document.querySelector('#crystalModeScatter');
  const hint = document.querySelector('#crystalMediaHint');
  const countdown = document.querySelector('#crystalCountdown');
  const photos = (window.BIRTHDAY_MEDIA?.photos || []);
  let THREE, scene, camera, renderer, group, cakePoints;
  const items = [];
  let drag = null;

  const say = t => { if (status) status.textContent = t; };

  // Island palette: cream crystal, warm gold candlelight, sage accents
  const PALETTE = [0xfff1d6, 0xe8c27a, 0xb9c79a, 0xd9a184, 0xfff8ec];

  function photo(item, index) {
    let d = document.querySelector('#crystalPhotoDialog');
    if (!d) {
      d = document.createElement('dialog');
      d.id = 'crystalPhotoDialog';
      d.className = 'crystal-photo-dialog';
      d.innerHTML = '<button class="crystal-photo-close" aria-label="关闭">×</button><img alt=""><div class="crystal-photo-meta"><span class="crystal-photo-title"></span><span class="crystal-photo-note"></span><span class="crystal-photo-count"></span></div>';
      document.body.append(d);
      d.querySelector('.crystal-photo-close').onclick = () => d.close();
    }
    const total = photos.length;
    d.querySelector('img').src = item.src || item.thumb;
    d.querySelector('img').alt = item.title || `照片 ${index + 1}`;
    d.querySelector('.crystal-photo-title').textContent = item.title || `回忆 ${String(index + 1).padStart(2, '0')}`;
    d.querySelector('.crystal-photo-note').textContent = item.caption || '';
    d.querySelector('.crystal-photo-count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    d.showModal();
    window.BirthdaySound?.play('tap');
  }

  function cake() {
    const a = [], colors = [];
    const palette = PALETTE.map(hex => new THREE.Color(hex));
    const add = (y, r, n) => {
      for (let i = 0; i < n; i++) {
        const q = Math.sqrt(Math.random()) * r, t = Math.random() * Math.PI * 2;
        a.push(Math.cos(t) * q, y + (Math.random() - .5) * .22, Math.sin(t) * q);
        const c = palette[Math.floor(Math.random() * palette.length)];
        colors.push(c.r, c.g, c.b);
      }
    };
    const ring = (y, r, n) => {
      for (let i = 0; i < n; i++) {
        const t = i / n * Math.PI * 2;
        a.push(Math.cos(t) * r, y, Math.sin(t) * r);
        const c = palette[i % palette.length];
        colors.push(c.r, c.g, c.b);
      }
    };
    add(.25, 2.45, 520); add(1.05, 2.05, 430); add(1.85, 1.65, 340);
    ring(.43, 2.5, 180); ring(1.23, 2.1, 150); ring(2.03, 1.7, 130);
    // candle
    for (let i = 0; i < 90; i++) {
      const t = i / 90 * Math.PI * 2, r = .12 + Math.random() * .12;
      a.push(Math.cos(t) * r, 2.35 + Math.random() * .72, Math.sin(t) * r);
      colors.push(1, .82, .35);
    }
    for (let i = 0; i < 90; i++) {
      const t = i / 90 * Math.PI * 2, r = .22 + Math.random() * .18;
      a.push(Math.cos(t) * r, 3.28 + Math.sin(t) * .12, Math.sin(t) * r);
      const c = palette[i % 3];
      colors.push(c.r, c.g, c.b);
    }
    // flame
    for (let i = 0; i < 70; i++) {
      const t = i / 70 * Math.PI * 2, r = .3 * (1 - i / 90);
      a.push(Math.cos(t) * r, 3.55 + i * .012, Math.sin(t) * r);
      colors.push(1, .55 + .4 * Math.random(), .18);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const scatterPositions = [];
    for (let i = 0; i < a.length; i += 3) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(4.5 + Math.random() * 5);
      v.y += 2;
      scatterPositions.push(v.x, v.y, v.z);
    }
    cakePoints = new THREE.Points(g, new THREE.PointsMaterial({ size: .115, vertexColors: true, transparent: true, opacity: 1, sizeAttenuation: true }));
    cakePoints.userData = { tree: a, scatter: scatterPositions, target: a.slice() };
    group.add(cakePoints);
  }

  function resize() {
    if (!renderer) return;
    const w = Math.max(1, root.clientWidth), h = Math.max(1, root.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function hideLoading(message) {
    const loading = document.querySelector('#crystalLoading');
    if (loading) {
      loading.classList.add('is-done');
      window.setTimeout(() => { loading.hidden = true; }, 320);
    }
    if (message) say(message);
  }

  async function init() {
    THREE = await import('./vendor/three/three.module.js');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(48, 1, .1, 100);
    camera.position.set(0, 2.6, 13.5);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    host.append(renderer.domElement);
    group = new THREE.Group();
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xd8c8a8, 1.05));
    const light = new THREE.PointLight(0xffc98a, 32, 30);
    light.position.set(3, 8, 6);
    scene.add(light);
    const fill = new THREE.PointLight(0xb9c79a, 12, 26);
    fill.position.set(-5, 3, -4);
    scene.add(fill);
    cake();
    resize();
    animate();
    hideLoading('水晶就绪 · 点击开启梦境');
    // thumbnails first: the 3D cards only need a preview texture
    photos.forEach((p, i) => new THREE.TextureLoader().load(p.thumb || p.src, t => {
      t.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 1.5), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
      const q = i / Math.max(1, photos.length) * Math.PI * 2;
      m.position.set(Math.cos(q) * 5, 1.5 + Math.sin(i) * 1.5, Math.sin(q) * 5);
      m.userData = { ...p, index: i };
      group.add(m);
      items.push(m);
    }));
  }

  function animate() {
    requestAnimationFrame(animate);
    if (group) group.rotation.y += .001;
    if (cakePoints) {
      const p = cakePoints.geometry.attributes.position.array, t = cakePoints.userData.target;
      for (let i = 0; i < p.length; i++) p[i] += (t[i] - p[i]) * .22;
      cakePoints.geometry.attributes.position.needsUpdate = true;
    }
    renderer.render(scene, camera);
  }

  function setMode(m) {
    if (!cakePoints) return;
    tree.setAttribute('aria-pressed', m === 'tree');
    scatter.setAttribute('aria-pressed', m === 'scatter');
    cakePoints.userData.target = (m === 'tree' ? cakePoints.userData.tree : cakePoints.userData.scatter).slice();
    say(m === 'tree' ? '生日蛋糕星光已聚拢' : '散成星云 · 照片仍然可以点开');
    window.BirthdaySound?.play('tap');
  }

  start.onclick = () => {
    start.hidden = true;
    window.BirthdaySound?.play('unwrap');
    if (countdown) {
      const steps = ['5', '4', '3', '2', '1', '19'];
      let i = 0;
      countdown.textContent = steps[0];
      say('正在折出一座生日蛋糕…');
      const tick = () => {
        i += 1;
        if (i < steps.length) {
          countdown.textContent = steps[i];
          window.setTimeout(tick, 480);
        } else {
          countdown.textContent = '';
          say('生日蛋糕星光已成形');
        }
      };
      window.setTimeout(tick, 480);
    } else {
      say('生日蛋糕星光已成形');
    }
  };
  tree.onclick = () => setMode('tree');
  scatter.onclick = () => setMode('scatter');

  const fullscreen = document.querySelector('#crystalFullscreen');
  if (fullscreen) fullscreen.onclick = () => {
    const target = root;
    if (!document.fullscreenElement) {
      target.requestFullscreen?.().then(() => { fullscreen.textContent = '退出全屏'; }).catch(() => say('这台设备不支持全屏'));
    } else {
      document.exitFullscreen?.();
      fullscreen.textContent = '全屏';
    }
  };

  const gesture = document.querySelector('#crystalCamera');
  if (gesture) gesture.onclick = () => say('手势识别还在路上 · 先用拖动和点击吧');

  const upload = document.querySelector('#crystalUpload');
  if (upload) upload.addEventListener('change', () => {
    const file = upload.files?.[0];
    if (!file || !THREE) return;
    const url = URL.createObjectURL(file);
    new THREE.TextureLoader().load(url, t => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 1.5), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
      m.position.set((Math.random() - .5) * 6, 1.5 + Math.random() * 2, (Math.random() - .5) * 6);
      m.userData = { src: url, title: '新加入的记忆', caption: '', index: items.length };
      group.add(m);
      items.push(m);
      say('新的记忆水晶已加入');
      window.BirthdaySound?.play('correct');
    });
    upload.value = '';
  });

  host.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY, ry: group?.rotation.y || 0 }; };
  host.onpointermove = e => { if (drag && group) group.rotation.y = drag.ry + (e.clientX - drag.x) * .004; };
  window.onpointerup = () => { drag = null; };
  host.onclick = e => {
    if (!camera || !renderer) return;
    const r = host.getBoundingClientRect();
    const v = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1));
    const ray = new THREE.Raycaster();
    ray.setFromCamera(v, camera);
    const hit = ray.intersectObjects(items)[0];
    if (hit) {
      const data = hit.object.userData;
      hint.textContent = '大图已打开';
      photo(data, data.index ?? 0);
    }
  };

  init().catch(() => hideLoading('3D 引擎没有加载成功 · 刷新页面再试'));
  window.addEventListener('resize', resize);
}
