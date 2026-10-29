(() => {
  const stages = window.BIRTHDAY_STAGES;
  const key = 'birthday-gifts-v1';
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch {}
  const progress = {};
  for (const stage of stages) {
    const stored = raw[stage.id] || {};
    const count = Number.isInteger(stored.count) ? Math.max(0, Math.min(stored.count, stage.questions.length)) : 0;
    progress[stage.id] = { count, opened: count === stage.questions.length && stored.opened === true, claimed: count === stage.questions.length && stored.opened === true && stored.claimed === true };
  }
  const dialog = document.querySelector('#giftDialog');
  let currentStage;
  let returnFocus;
  function save() {
    try { localStorage.setItem(key, JSON.stringify(progress)); } catch {}
    const claimed = Object.values(progress).filter(item => item.claimed).length;
    document.querySelector('#giftCount').textContent = `${claimed} / ${stages.length}`;
    document.querySelectorAll('[data-node]').forEach(node => {
      const id = node.dataset.node === 'pass' ? 'home' : node.dataset.node;
      node.classList.toggle('gift-claimed', progress[id]?.claimed === true);
    });
  }
  const status = document.createElement('p'); status.className = 'gift-map-status';
  status.innerHTML = '已领取彩蛋 <strong id="giftCount"></strong> · 每站都有一份小惊喜';
  document.querySelector('.progress-pill').after(status);
  function button(text, className, handler) {
    const element = document.createElement('button'); element.type = 'button'; element.textContent = text; element.className = className; element.addEventListener('click', handler); return element;
  }
  function render(stage, focus = false) {
    const host = document.querySelector(`[data-guess="${stage.id}"]`);
    const state = progress[stage.id]; host.replaceChildren();
    const kicker = document.createElement('p'); kicker.className = 'mini-kicker'; kicker.textContent = 'GUESS GUESS CLUB · 猜猜猜俱乐部'; host.append(kicker);
    const heading = document.createElement('h3'); heading.tabIndex = -1; host.append(heading);
    if (state.count === stage.questions.length) {
      heading.textContent = state.claimed ? '这站的小惊喜，已经交到你手里啦' : '脑洞验证通过！有一份彩蛋等你';
      host.append(button(state.claimed ? '再看看这站的彩蛋 ♡' : '领取本环节彩蛋 🎁', 'primary-button gift-trigger', () => openGift(stage)));
      if (focus) heading.focus(); return;
    }
    const question = stage.questions[state.count];
    const counter = document.createElement('p'); counter.className = 'guess-counter'; counter.textContent = `第 ${state.count + 1} / ${stage.questions.length} 题 · 答案由本岛胡说研究所提供`; host.append(counter);
    heading.textContent = question.title;
    const answers = document.createElement('div'); answers.className = 'guess-options'; host.append(answers);
    const feedback = document.createElement('p'); feedback.className = 'guess-feedback'; feedback.setAttribute('role', 'status'); host.append(feedback);
    const next = button(state.count === stage.questions.length - 1 ? '答完啦，去拆彩蛋 →' : '下一道离谱题 →', 'primary-button guess-next', () => advance()); next.hidden = true; host.append(next);
    let resolved = false;
    question.options.forEach((text, index) => {
      const option = button(`${['A', 'B', 'C'][index]}  ${text}`, 'guess-option', () => {
        if (resolved) return;
        const correct = question.acceptAll || index === question.correct;
        if (!correct) {
          option.classList.add('wrong'); option.setAttribute('aria-pressed', 'true');
          feedback.textContent = `${question.wrong} 再猜一次，或者点击“寿星特权”。`;
          window.BirthdaySound?.play('wrong');
          return;
        }
        resolved = true; feedback.textContent = question.right; option.classList.add('correct');
        answers.querySelectorAll('button').forEach(item => { item.disabled = true; }); next.hidden = false; skip.hidden = true;
        window.BirthdaySound?.play('correct');
      }); answers.append(option);
    });
    function advance() {
      state.count += 1; save(); render(stage, true);
      if (state.count === stage.questions.length) openGift(stage);
    }
    const skip = button('寿星特权：这题我先过', 'guess-skip', () => {
      if (resolved) return;
      resolved = true; feedback.textContent = `特权生效！本岛答案：${question.options[question.correct]}。${question.right}`;
      answers.querySelectorAll('button').forEach(item => { item.disabled = true; }); next.hidden = false; skip.hidden = true;
      window.BirthdaySound?.play('skip');
    }); host.append(skip);
    if (focus) heading.focus();
  }
  function renderGift() {
    const stage = currentStage; const state = progress[stage.id];
    document.querySelector('.gift-envelope').textContent = state.opened ? stage.gift.icon : '🎁';
    document.querySelector('#giftTitle').textContent = stage.gift.title;
    document.querySelector('#giftHint').textContent = stage.gift.hint;
    document.querySelector('#unwrapGift').hidden = state.opened;
    const reveal = document.querySelector('#giftReveal'); reveal.hidden = !state.opened;
    reveal.querySelector('h3').textContent = stage.gift.reveal;
    reveal.querySelector('p').textContent = stage.gift.handoff;
    document.querySelector('#claimGift').textContent = state.claimed ? '已经收好啦，继续逛岛 →' : '礼物收到啦，继续逛岛 →';
    dialog.classList.toggle('unwrapped', state.opened);
  }
  function openGift(stage) {
    if (progress[stage.id].count !== stage.questions.length) return;
    currentStage = stage; returnFocus = document.activeElement; renderGift(); dialog.showModal(); document.body.classList.add('gift-open');
  }
  function celebrate() {
    window.BirthdaySound?.play('unwrap');
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const burst = document.createElement('div');
    burst.className = 'gift-confetti';
    burst.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 16; i++) {
      const bit = document.createElement('i');
      const angle = (i / 16) * Math.PI * 2;
      bit.style.setProperty('--dx', `${Math.cos(angle) * (40 + Math.random() * 70)}px`);
      bit.style.setProperty('--dy', `${Math.sin(angle) * (40 + Math.random() * 70) - 30}px`);
      bit.style.setProperty('--rot', `${Math.random() * 200 - 100}deg`);
      bit.style.setProperty('--delay', `${Math.random() * 120}ms`);
      burst.append(bit);
    }
    (document.querySelector('.gift-envelope') || document.body).append(burst);
    window.setTimeout(() => burst.remove(), 900);
  }
  document.querySelector('#unwrapGift').addEventListener('click', () => {
    if (!currentStage) return;
    const state = progress[currentStage.id]; if (state.opened) return;
    state.opened = true; save(); renderGift(); celebrate(); document.querySelector('#claimGift').focus();
  });
  document.querySelector('#claimGift').addEventListener('click', () => {
    if (!currentStage || !progress[currentStage.id].opened) return;
    progress[currentStage.id].claimed = true; save(); render(currentStage); dialog.close();
    const allDone = stages.every(stage => progress[stage.id]?.claimed === true);
    if (allDone) {
      window.setTimeout(() => openSouvenir(), 420);
    } else {
      show(currentStage.next);
    }
  });
  document.querySelector('.gift-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.classList.remove('gift-open'); if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true }); });
  // ---- 礼物小屋：当面清点清单，勾选记在这台设备 ----
  const checkKey = 'birthday-checklist-v1';
  const checklist = document.querySelector('#giftChecklist');
  if (checklist) {
    const boxes = [...checklist.querySelectorAll('input[type=checkbox]')];
    const count = checklist.querySelector('#checklistCount');
    const draw = () => { count.textContent = `${boxes.filter(box => box.checked).length} / ${boxes.length}`; };
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(checkKey) || '{}') || {}; } catch {}
    boxes.forEach(box => {
      box.checked = saved[box.dataset.check] === true;
      box.addEventListener('change', () => {
        saved[box.dataset.check] = box.checked;
        try { localStorage.setItem(checkKey, JSON.stringify(saved)); } catch {}
        draw();
      });
    });
    draw();
  }

  // ---- souvenir card (long-press to save) ----
  const CARD_W = 1080, CARD_H = 1440;
  const CN = `'PingFang SC','Microsoft YaHei','Source Han Sans SC','Noto Sans SC',sans-serif`;
  const EN = `Georgia,'Times New Roman',serif`;

  function track(ctx, text, x, y, spacing, align = 'center') {
    const chars = [...text];
    const widths = chars.map(ch => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
    let cursor = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    chars.forEach((ch, i) => {
      ctx.fillText(ch, cursor, y);
      cursor += widths[i] + spacing;
    });
  }

  function drawSouvenir() {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_W; canvas.height = CARD_H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f6f3eb';
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // paper grain
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = i % 3 ? '#839078' : '#bd7f71';
      ctx.fillRect(Math.random() * CARD_W, Math.random() * CARD_H, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;

    // frames
    ctx.strokeStyle = '#ddd9cc'; ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, CARD_W - 72, CARD_H - 72);
    ctx.strokeStyle = '#e6d7bd'; ctx.lineWidth = 1;
    ctx.strokeRect(54, 54, CARD_W - 108, CARD_H - 108);

    // corner marks
    ctx.strokeStyle = '#839078'; ctx.lineWidth = 3;
    const mark = (x, y, sx, sy) => {
      ctx.beginPath();
      ctx.moveTo(x + sx * 26, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * 26);
      ctx.stroke();
    };
    mark(78, 78, 1, 1); mark(CARD_W - 78, 78, -1, 1);
    mark(78, CARD_H - 78, 1, -1); mark(CARD_W - 78, CARD_H - 78, -1, -1);

    // top line
    ctx.fillStyle = '#839078';
    ctx.font = `500 22px ${EN}`;
    track(ctx, 'POTATO ISLAND · SOUVENIR', CARD_W / 2, 176, 8);
    ctx.font = `400 22px ${CN}`;
    track(ctx, '土 豆 的 生 日 小 岛', CARD_W / 2, 214, 6);

    // star
    ctx.fillStyle = '#bd7f71';
    ctx.font = `400 30px ${EN}`;
    ctx.textAlign = 'center';
    ctx.fillText('✳', CARD_W / 2, 280);

    // main title
    ctx.fillStyle = '#3d3f39';
    ctx.font = `600 84px ${CN}`;
    ctx.textAlign = 'center';
    ctx.fillText('杨宇的十九岁', CARD_W / 2, 412);
    ctx.fillStyle = '#85887c';
    ctx.font = `400 30px ${CN}`;
    ctx.fillText('一座生日小岛 · 全部走完了', CARD_W / 2, 472);

    // big 19
    ctx.fillStyle = '#3d3f39';
    ctx.font = `400 240px ${EN}`;
    ctx.fillText('19', CARD_W / 2, 720);
    ctx.fillStyle = '#bd7f71';
    ctx.font = `400 34px ${EN}`;
    ctx.fillText('th', CARD_W / 2 + 178, 620);
    ctx.fillStyle = '#839078';
    ctx.font = `400 26px ${EN}`;
    track(ctx, '· 2026 ·', CARD_W / 2, 782, 8);

    // divider
    ctx.strokeStyle = '#ddd9cc'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(240, 848); ctx.lineTo(CARD_W - 240, 848); ctx.stroke();

    // stats
    const stats = [
      '五个地点，全部留下脚印',
      '十五道离谱题，全部解锁',
      '五份惊喜，全部交到手上'
    ];
    ctx.fillStyle = '#555b4a';
    ctx.font = `400 32px ${CN}`;
    stats.forEach((line, i) => ctx.fillText(line, CARD_W / 2, 936 + i * 58));

    // quote
    ctx.fillStyle = '#839078';
    ctx.fillRect(240, 1136, 4, 108);
    ctx.fillStyle = '#73795f';
    ctx.font = `400 34px ${CN}`;
    ctx.textAlign = 'left';
    ctx.fillText('不赶路，不考试。', 280, 1182);
    ctx.fillText('想先去哪里，就去哪里。', 280, 1236);

    // footer
    ctx.fillStyle = '#bd7f71';
    ctx.font = `500 24px ${EN}`;
    track(ctx, 'HAPPY BIRTHDAY, YANG YU', CARD_W / 2, 1312, 6);
    ctx.fillStyle = '#a3927a';
    ctx.font = `400 18px ${EN}`;
    track(ctx, 'YANG YU · ONLY ONE · 2026', CARD_W / 2, 1352, 5);

    return canvas;
  }

  function openSouvenir() {
    const dialog = document.querySelector('#souvenirDialog');
    const image = dialog?.querySelector('.souvenir-image');
    if (!dialog || !image) return;
    if (!image.src) {
      const canvas = drawSouvenir();
      image.src = canvas.toDataURL('image/png');
    }
    if (!dialog.open) dialog.showModal();
    window.BirthdaySound?.play('complete');
    window.BirthdayHeart?.ensure?.();
    document.querySelector('#souvenirClose')?.focus();
  }

  const souvenirDialog = document.querySelector('#souvenirDialog');
  if (souvenirDialog) {
    souvenirDialog.querySelector('.souvenir-close')?.addEventListener('click', () => souvenirDialog.close());
    document.querySelector('#souvenirClose')?.addEventListener('click', () => {
      souvenirDialog.close();
      show('map');
    });
    document.querySelector('#souvenirDownload')?.addEventListener('click', () => {
      const image = souvenirDialog.querySelector('.souvenir-image');
      const link = document.createElement('a');
      link.href = image.src;
      link.download = '杨宇的十九岁-通关纪念卡.png';
      link.click();
    });
    document.querySelector('#openSouvenir')?.addEventListener('click', openSouvenir);
    souvenirDialog.addEventListener('close', () => {
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    });
  }

  for (const stage of stages) {
    const screen = document.querySelector(`[data-screen="${stage.id}"]`);
    const host = document.createElement('section'); host.className = 'guess-card'; host.dataset.guess = stage.id; host.setAttribute('aria-label', `${stage.name}猜题和彩蛋`);
    const oldButton = screen.querySelector('[data-unlock]');
    if (oldButton) oldButton.replaceWith(host); else if (stage.id === 'home') screen.querySelector('[data-quiz-anchor="home"]').replaceWith(host); else screen.querySelector('#resetButton').before(host);
    render(stage);
  }
  save();
})();
