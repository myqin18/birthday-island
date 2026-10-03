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
        if (!correct) { option.classList.add('wrong'); option.setAttribute('aria-pressed', 'true'); feedback.textContent = `${question.wrong} 再猜一次，或者点击“寿星特权”。`; return; }
        resolved = true; feedback.textContent = question.right; option.classList.add('correct');
        answers.querySelectorAll('button').forEach(item => { item.disabled = true; }); next.hidden = false; skip.hidden = true;
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
  document.querySelector('#unwrapGift').addEventListener('click', () => {
    if (!currentStage) return;
    const state = progress[currentStage.id]; if (state.opened) return;
    state.opened = true; save(); renderGift(); celebrate(); document.querySelector('#claimGift').focus();
  });
  document.querySelector('#claimGift').addEventListener('click', () => {
    if (!currentStage || !progress[currentStage.id].opened) return;
    progress[currentStage.id].claimed = true; save(); render(currentStage); dialog.close(); show(currentStage.next);
  });
  document.querySelector('.gift-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.classList.remove('gift-open'); if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true }); });
  for (const stage of stages) {
    const screen = document.querySelector(`[data-screen="${stage.id}"]`);
    const host = document.createElement('section'); host.className = 'guess-card'; host.dataset.guess = stage.id; host.setAttribute('aria-label', `${stage.name}猜题和彩蛋`);
    const oldButton = screen.querySelector('[data-unlock]');
    if (oldButton) oldButton.replaceWith(host); else if (stage.id === 'home') screen.querySelector('[data-quiz-anchor="home"]').replaceWith(host); else screen.querySelector('#resetButton').before(host);
    render(stage);
  }
  save();
})();
