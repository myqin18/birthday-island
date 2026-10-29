(() => {
  'use strict';

  // ---------- particle heart ----------
  const PALETTE = ['#bd7f71', '#d4b06a', '#839078', '#e6d7bd', '#c98b7a'];
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function heartPoints(count, cx, cy, scale) {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      pts.push({ x: cx + x * scale, y: cy - y * scale });
    }
    return pts;
  }

  function mountHeart(canvas, { count = 850, scale = 9 } = {}) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};
    let raf = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function size() {
      const w = canvas.clientWidth || 320;
      const h = canvas.clientHeight || 240;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    }

    let { w, h } = size();
    const targets = heartPoints(count, w / 2, h / 2 + h * 0.06, scale * (Math.min(w, h) / 240));
    const particles = targets.map((t, i) => ({
      x: Math.random() * w,
      y: h + 40 + Math.random() * 160,
      vx: 0,
      vy: 0,
      tx: t.x,
      ty: t.y,
      size: 1.4 + Math.random() * 2.4,
      color: PALETTE[i % PALETTE.length],
      alpha: 0.55 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
      arrived: false
    }));

    let breath = 0;

    function frame() {
      if (!running) return;
      w = canvas.clientWidth || w;
      h = canvas.clientHeight || h;
      breath += 0.016;
      const breathe = 1 + 0.045 * Math.sin(breath * 1.15);

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#f7f2e6';
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        const tx = w / 2 + (p.tx - w / 2) * breathe;
        const ty = h / 2 + h * 0.06 + (p.ty - (h / 2 + h * 0.06)) * breathe;

        if (!p.arrived) {
          const dx = tx - p.x, dy = ty - p.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 2.4) {
            p.arrived = true;
            p.x = tx; p.y = ty;
          } else {
            p.vx += (dx / dist) * 0.42;
            p.vy += (dy / dist) * 0.42;
            const sp = Math.hypot(p.vx, p.vy);
            const max = 3.4;
            if (sp > max) { p.vx = (p.vx / sp) * max; p.vy = (p.vy / sp) * max; }
            p.x += p.vx; p.y += p.vy;
          }
        } else {
          const wobble = Math.sin(breath * 2 + p.phase) * 1.15;
          p.x = tx + wobble;
          p.y = ty + wobble * 0.7;
        }

        if (p.arrived) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4.5);
          g.addColorStop(0, p.color + '55');
          g.addColorStop(1, p.color + '00');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 4.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(frame);
    }

    const onResize = () => {
      const s = size();
      w = s.w; h = s.h;
      const next = heartPoints(count, w / 2, h / 2 + h * 0.06, scale * (Math.min(w, h) / 240));
      particles.forEach((p, i) => { p.tx = next[i].x; p.ty = next[i].y; });
    };
    window.addEventListener('resize', onResize);

    if (reduced()) {
      // static heart, no motion
      ctx.fillStyle = '#f7f2e6';
      ctx.fillRect(0, 0, w, h);
      particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.tx, p.ty, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }

  // ---------- cake video ----------
  function wireCake() {
    const video = document.querySelector('#cakeVideo');
    const button = document.querySelector('#cakePlay');
    const note = document.querySelector('#cakeNote');
    const frame = video?.closest('.cake-frame');
    if (!video || !button) return;

    const setLabel = text => {
      const span = button.querySelector('span');
      if (span) span.textContent = text;
    };
    const showButton = show => {
      if (frame) frame.classList.toggle('is-playing', !show);
      button.hidden = !show;
    };

    button.addEventListener('click', () => {
      video.muted = false;
      const pending = video.play();
      showButton(false);
      if (note) note.textContent = '蜡烛点上了 · 看完再往下走也不迟';
      window.BirthdaySound?.play('tap');
      if (pending?.catch) {
        pending.catch(() => {
          showButton(true);
          setLabel('再试一次');
          if (note) note.textContent = '这台设备没能播放，点一下再试。';
        });
      }
    });

    video.addEventListener('ended', () => {
      showButton(true);
      setLabel('再看一遍蜡烛');
      if (note) note.textContent = '十九岁的蜡烛，吹不吹都可以。';
    });

    const stop = () => {
      if (!video.paused) {
        video.pause();
        showButton(true);
        setLabel('继续点蜡烛');
      }
    };
    window.addEventListener('island:screenchange', e => {
      if (e.detail?.screen !== 'travel') stop();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  }

  // ---------- souvenir heart mount ----------
  function wireSouvenirHeart() {
    const dialog = document.querySelector('#souvenirDialog');
    const canvas = dialog?.querySelector('.souvenir-heart');
    if (!dialog || !canvas) return;
    let dispose = null;
    const ensure = () => {
      if (dialog.open && !dispose) dispose = mountHeart(canvas);
    };
    dialog.addEventListener('close', () => {
      dispose?.();
      dispose = null;
    });
    const observer = new MutationObserver(ensure);
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    return ensure;
  }

  const heartEnsure = { fn: null };
  window.BirthdayHeart = {
    mount: mountHeart,
    ensure: () => heartEnsure.fn?.()
  };

  const boot = () => {
    wireCake();
    heartEnsure.fn = wireSouvenirHeart();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
