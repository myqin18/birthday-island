(() => {
  'use strict';
  let ctx = null;
  let muted = false;
  const listeners = [];
  const AC = window.AudioContext || window.webkitAudioContext;

  function ensure() {
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone({ freq, start = 0, duration = 0.12, type = 'sine', gain = 0.045, glide }) {
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + Math.max(0, start);
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glide), t0 + duration);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + Math.min(0.018, duration * 0.2));
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(amp).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.04);
  }

  const api = {
    play(name) {
      if (muted || !ensure()) return;
      if (name === 'correct') {
        tone({ freq: 523.25, duration: 0.13, type: 'triangle' });
        tone({ freq: 659.25, start: 0.085, duration: 0.15, type: 'triangle' });
        tone({ freq: 783.99, start: 0.17, duration: 0.22, type: 'triangle', gain: 0.04 });
      } else if (name === 'wrong') {
        tone({ freq: 196, duration: 0.17, type: 'sine', gain: 0.05, glide: 146.83 });
      } else if (name === 'skip') {
        tone({ freq: 392, duration: 0.07, type: 'sine', gain: 0.028 });
        tone({ freq: 523.25, start: 0.065, duration: 0.1, type: 'sine', gain: 0.028 });
      } else if (name === 'unwrap') {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ freq: f, start: i * 0.07, duration: 0.17, type: 'triangle' }));
      } else if (name === 'complete') {
        [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => tone({ freq: f, start: i * 0.1, duration: 0.32, type: 'triangle', gain: 0.042 }));
        tone({ freq: 261.63, start: 0.08, duration: 0.7, type: 'sine', gain: 0.028 });
      } else if (name === 'tap') {
        tone({ freq: 659.25, duration: 0.05, type: 'sine', gain: 0.022 });
      }
    },
    get muted() { return muted; },
    set muted(value) {
      muted = Boolean(value);
      listeners.forEach(fn => fn(muted));
    },
    toggle() {
      api.muted = !muted;
      return muted;
    },
    onMutedChange(fn) {
      listeners.push(fn);
    }
  };
  window.BirthdaySound = api;

  const toggle = document.querySelector('#soundToggle');
  if (toggle) {
    const sync = () => {
      toggle.setAttribute('aria-pressed', String(!muted));
      toggle.textContent = muted ? '♩' : '♪';
      toggle.title = muted ? '音效已关闭' : '音效已开启';
    };
    toggle.addEventListener('click', () => { api.toggle(); sync(); api.play('tap'); });
    listeners.push(sync);
    sync();
  }
})();
