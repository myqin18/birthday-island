(() => {
  'use strict';

  const manifest = window.BIRTHDAY_MEDIA || {};
  const photos = Array.isArray(manifest.photos) ? manifest.photos : [];
  const videos = Array.isArray(manifest.videos) ? manifest.videos : [];
  const photoHost = document.querySelector('#photoGallery');
  const photoTotal = document.querySelector('#photoTotal');
  const videoHost = document.querySelector('#videoLibrary');
  const videoTotal = document.querySelector('#videoTotal');
  const text = (value, fallback = '') => typeof value === 'string' ? value : fallback;
  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const setCount = (element, count, label) => { if (element) element.textContent = `${count}${label ? ` ${label}` : ''}`; };
  setCount(photoTotal, photos.length);
  setCount(videoTotal, videos.length);

  let photoDialog;
  let photoImage;
  let photoStatus;
  let photoCaption;
  let photoCounter;
  let photoIndex = 0;
  let photoReturnFocus;
  let photoToken = 0;
  let slideshowTimer = 0;
  let slideshowOn = false;
  let slideshowToggle;
  let photoCards = [];

  const makeButton = (label, className, handler) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = className; button.setAttribute('aria-label', label);
    button.addEventListener('click', handler); return button;
  };
  const photoNumber = index => String(index + 1).padStart(2, '0');
  const photoLabel = index => `照片 ${photoNumber(index)}`;
  const photoRatio = item => {
    const width = Number(item?.width), height = Number(item?.height);
    return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 ? `${width} / ${height}` : '4 / 3';
  };

  function stopSlideshow() {
    if (slideshowTimer) window.clearTimeout(slideshowTimer);
    slideshowTimer = 0; slideshowOn = false;
    if (slideshowToggle) { slideshowToggle.setAttribute('aria-pressed', 'false'); slideshowToggle.textContent = '自动播放'; }
  }
  function scheduleSlideshow() {
    if (!slideshowOn || reducedMotion() || document.hidden || !photoDialog?.open || photoImage?.classList.contains('is-pending') || !photoImage?.classList.contains('is-loaded')) return;
    if (slideshowTimer) window.clearTimeout(slideshowTimer);
    slideshowTimer = window.setTimeout(() => { slideshowTimer = 0; showPhoto(photoIndex + 1, true); }, 5500);
  }
  function setPhotoCaption(index) {
    if (photoCaption) photoCaption.textContent = `${photoNumber(index)} / ${photos.length}`;
    if (photoCounter) photoCounter.textContent = `${photoNumber(index)} / ${photos.length}`;
  }
  function showPhoto(index, fromSlideshow = false) {
    if (!photos.length || !photoImage) return;
    if (!fromSlideshow) stopSlideshow();
    const direction = index < photoIndex ? -1 : 1;
    photoIndex = (index + photos.length) % photos.length;
    const item = photos[photoIndex] || {};
    const source = text(item.src);
    const token = ++photoToken;
    photoDialog.querySelector('.media-photo-retry').hidden = true;
    photoImage.classList.remove('is-error');
    photoImage.classList.toggle('is-pending', Boolean(source));
    if (!photoImage.hasAttribute('src')) setPhotoCaption(photoIndex);
    if (photoStatus) { photoStatus.textContent = `正在打开第 ${photoNumber(photoIndex)} 张…`; photoStatus.hidden = false; }
    const fail = message => {
      stopSlideshow();
      photoDialog.querySelectorAll('.media-outgoing-photo').forEach(image => image.remove());
      photoImage.getAnimations?.().forEach(animation => animation.cancel());
      photoImage.removeAttribute('src'); photoImage.classList.remove('is-pending', 'is-loaded'); photoImage.classList.add('is-error');
      setPhotoCaption(photoIndex); photoStatus.textContent = message; photoStatus.hidden = false;
      photoDialog.querySelector('.media-photo-retry').hidden = false;
    };
    if (!source) { fail('这张照片暂时没有地址。'); return; }
    // Full-size sources are assigned only after the visitor opens the viewer.
    const preload = new Image(); preload.decoding = 'async';
    preload.onload = async () => {
      if (preload.decode) { try { await preload.decode(); } catch { /* onload already confirmed image data */ } }
      if (token !== photoToken || !photoDialog?.open) return;
      photoDialog.querySelectorAll('.media-outgoing-photo').forEach(image => image.remove());
      photoImage.getAnimations?.().forEach(animation => animation.cancel());
      let outgoing;
      if (photoImage.hasAttribute('src') && photoImage.classList.contains('is-loaded') && !reducedMotion()) {
        outgoing = photoImage.cloneNode(false); outgoing.className = 'media-outgoing-photo'; outgoing.alt = ''; outgoing.setAttribute('aria-hidden', 'true'); photoImage.before(outgoing);
      }
      photoImage.src = source; photoImage.alt = photoLabel(photoIndex); setPhotoCaption(photoIndex);
      photoImage.classList.remove('is-pending', 'is-error'); photoImage.classList.add('is-loaded');
      photoStatus.hidden = true;
      if (outgoing && photoImage.animate && !reducedMotion()) {
        const options = { duration: 320, easing: 'cubic-bezier(.22,.61,.36,1)' };
        photoImage.animate([{ opacity: 0, transform: `translateX(${direction * 16}px) scale(1.015)` }, { opacity: 1, transform: 'translateX(0) scale(1)' }], options);
        const fade = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'ease-out' });
        fade.onfinish = () => outgoing.remove();
      } else {
        outgoing?.remove();
        if (photoImage.animate && !reducedMotion()) photoImage.animate([{ opacity: 0, transform: 'scale(1.02)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(.22,.61,.36,1)' });
      }
      scheduleSlideshow();
    };
    preload.onerror = () => { if (token === photoToken && photoDialog?.open) fail('照片暂时无法打开，请重试。'); };
    preload.src = source;
  }
  function closePhoto() { stopSlideshow(); if (photoDialog?.open) photoDialog.close(); }

  function presentViewer() {
    photoDialog.showModal();
    document.body.classList.add('media-photo-open');
    photoDialog.classList.add('is-opening');
    window.setTimeout(() => photoDialog.classList.remove('is-opening'), 420);
    photoDialog.querySelector('.media-close').focus({ preventScroll: true });
  }

  function buildPhotoDialog() {
    if (!photos.length || !photoHost || typeof HTMLDialogElement === 'undefined') return;
    photoDialog = document.createElement('dialog'); photoDialog.className = 'media-photo-dialog'; photoDialog.setAttribute('aria-labelledby', 'mediaPhotoCaption');
    photoDialog.innerHTML = `<div class="media-photo-frame" role="document">
      <div class="media-photo-toolbar"><p id="mediaPhotoStatus" class="media-status" role="status" aria-live="polite">正在打开照片…</p><button type="button" class="media-close" aria-label="关闭照片">×</button></div>
      <figure class="media-photo-view"><img class="media-full-photo" alt="" decoding="async"><figcaption id="mediaPhotoCaption"></figcaption></figure>
      <button type="button" class="media-photo-retry" hidden>重试打开</button>
      <div class="media-photo-controls"><button type="button" class="media-prev" aria-label="上一张照片">←</button><span class="media-photo-counter" aria-hidden="true"></span><button type="button" class="media-next" aria-label="下一张照片">→</button></div>
      <div class="media-viewer-options"><button type="button" class="media-slideshow" aria-pressed="false">自动播放</button><span>每张停留约 5 秒</span></div>
    </div>`;
    document.body.append(photoDialog);
    photoImage = photoDialog.querySelector('.media-full-photo'); photoStatus = photoDialog.querySelector('.media-status'); photoCaption = photoDialog.querySelector('#mediaPhotoCaption'); photoCounter = photoDialog.querySelector('.media-photo-counter'); slideshowToggle = photoDialog.querySelector('.media-slideshow');
    const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => {
      stopSlideshow(); slideshowToggle.disabled = motionPreference.matches;
      photoDialog.querySelector('.media-viewer-options span').textContent = motionPreference.matches ? '已跟随系统关闭自动放映' : '每张停留约 5 秒';
    };
    syncMotion(); motionPreference.addEventListener('change', syncMotion);
    photoDialog.querySelector('.media-close').addEventListener('click', closePhoto);
    photoDialog.querySelector('.media-photo-retry').addEventListener('click', () => showPhoto(photoIndex));
    const manualMove = offset => showPhoto(photoIndex + offset);
    photoDialog.querySelector('.media-prev').addEventListener('click', () => manualMove(-1));
    photoDialog.querySelector('.media-next').addEventListener('click', () => manualMove(1));
    slideshowToggle.addEventListener('click', () => {
      if (reducedMotion()) { slideshowToggle.disabled = true; slideshowToggle.title = '已尊重系统减少动态效果设置'; return; }
      slideshowToggle.disabled = false; slideshowToggle.removeAttribute('title');
      slideshowOn = !slideshowOn; slideshowToggle.setAttribute('aria-pressed', String(slideshowOn)); slideshowToggle.textContent = slideshowOn ? '暂停自动播放' : '自动播放';
      if (slideshowOn) scheduleSlideshow(); else if (slideshowTimer) { window.clearTimeout(slideshowTimer); slideshowTimer = 0; }
    });
    photoDialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); manualMove(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); manualMove(1); }
    });
    let gesture = null; const touchPointers = new Set();
    const view = photoDialog.querySelector('.media-photo-view');
    const resetGestureVisual = () => {
      photoImage.style.transform = ''; photoImage.style.transition = '';
      view.style.transform = ''; view.style.transition = '';
      photoDialog.classList.remove('is-dismissing');
    };
    photoDialog.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') return;
      touchPointers.add(event.pointerId);
      if (touchPointers.size > 1) { gesture = null; return; }
      if (event.target !== photoImage || (window.visualViewport?.scale || 1) > 1.01) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), mode: reducedMotion() ? 'threshold' : 'undecided' };
    });
    photoDialog.addEventListener('pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      if (gesture.mode === 'undecided') {
        if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
        gesture.mode = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'swipe' : (dy > 0 ? 'dismiss' : 'threshold');
        if (gesture.mode === 'swipe') photoImage.style.transition = 'none';
        if (gesture.mode === 'dismiss') { view.style.transition = 'none'; photoDialog.classList.add('is-dismissing'); }
      }
      if (gesture.mode === 'swipe') {
        const follow = Math.max(-110, Math.min(110, dx * 0.5));
        photoImage.style.transform = `translateX(${follow}px)`;
      } else if (gesture.mode === 'dismiss') {
        const follow = Math.max(0, Math.min(180, dy * 0.55));
        view.style.transform = `translateY(${follow}px) scale(${1 - follow / 900})`;
      }
    });
    photoDialog.addEventListener('pointerup', event => {
      touchPointers.delete(event.pointerId);
      if (!gesture || gesture.id !== event.pointerId) return;
      const started = gesture; gesture = null;
      const dx = event.clientX - started.x, dy = event.clientY - started.y;
      const elapsed = performance.now() - started.time;
      if (started.mode === 'swipe') {
        if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.4) { resetGestureVisual(); manualMove(dx < 0 ? 1 : -1); }
        else { photoImage.style.transition = 'transform 240ms ease'; photoImage.style.transform = ''; }
      } else if (started.mode === 'dismiss') {
        if (dy >= 110 || (dy > 40 && elapsed < 260)) closePhoto();
        else { view.style.transition = 'transform 260ms cubic-bezier(.22,.61,.36,1)'; view.style.transform = ''; photoDialog.classList.remove('is-dismissing'); }
      } else if (started.mode === 'threshold') {
        if (elapsed <= 1000 && Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.6) manualMove(dx < 0 ? 1 : -1);
      }
    });
    photoDialog.addEventListener('pointercancel', event => { touchPointers.delete(event.pointerId); if (gesture?.id === event.pointerId) gesture = null; resetGestureVisual(); });
    photoDialog.addEventListener('click', event => { if (event.target === photoDialog) closePhoto(); });
    photoDialog.addEventListener('close', () => { stopSlideshow(); ++photoToken; photoImage.getAnimations?.().forEach(a => a.cancel()); photoDialog.querySelectorAll('.media-outgoing-photo').forEach(img => img.remove()); gesture = null; resetGestureVisual(); touchPointers.clear(); document.body.classList.remove('media-photo-open'); photoImage.removeAttribute('src'); photoImage.classList.remove('is-loaded', 'is-pending'); if (photoReturnFocus?.isConnected) photoReturnFocus.focus({ preventScroll: true }); });
  }

  function renderPhotos() {
    if (!photoHost) return;
    photoHost.replaceChildren();
    if (!photos.length) { const empty = document.createElement('p'); empty.className = 'media-empty'; empty.textContent = '照片正在路上，位置已经留好。'; photoHost.append(empty); return; }
    const toolbar = document.createElement('div'); toolbar.className = 'media-gallery-toolbar';
    const start = makeButton('从第一张照片开始查看', 'media-start-viewer', () => { if (!photoDialog) return; photoReturnFocus = start; if (!photoDialog.open) presentViewer(); showPhoto(0); }); start.textContent = '从第一张看起';
    const hint = document.createElement('span'); hint.textContent = '按顺序浏览 · 共 ' + photos.length + ' 张'; toolbar.append(start, hint); photoHost.append(toolbar);
    const grid = document.createElement('div'); grid.className = 'photo-grid';
    photoCards = [];
    photos.forEach((item, index) => {
      const button = makeButton(`打开${photoLabel(index)}`, 'photo-card', () => { if (!photoDialog) { window.open(text(item.src), '_blank', 'noopener'); return; } photoReturnFocus = button; if (!photoDialog.open) presentViewer(); showPhoto(index); });
      button.dataset.index = String(index); button.style.setProperty('--photo-ratio', photoRatio(item));
      button.style.setProperty('--reveal-delay', `${(index % 3) * 70}ms`);
      const image = document.createElement('img'); image.loading = 'lazy'; image.decoding = 'async'; image.width = Number(item.width) || 4; image.height = Number(item.height) || 3; image.alt = photoLabel(index); image.src = text(item.thumb, text(item.src)); image.onerror = () => image.classList.add('is-error');
      const number = document.createElement('small'); number.className = 'photo-card-index'; number.textContent = photoNumber(index); button.append(image, number); grid.append(button); photoCards.push(button);
    });
    photoHost.append(grid);
    if (!('IntersectionObserver' in window) || reducedMotion()) { photoCards.forEach(card => card.classList.add('is-revealed')); return; }
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); revealObserver.unobserve(entry.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    photoCards.forEach(card => revealObserver.observe(card));
  }

  let player, videoStatus, retryButton, sourceLink, playerTitle, heroButton;
  let selectedVideo = -1, playRequest = 0;
  const duration = value => {
    const seconds = Number(value);
    return Number.isFinite(seconds) && seconds >= 0 ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '';
  };
  function videoFailure(message) {
    videoStatus.hidden = false; videoStatus.textContent = message;
    retryButton.hidden = false; sourceLink.hidden = !sourceLink.hasAttribute('href');
  }
  function selectVideo(index, restart = false) {
    if (!player || !videos.length) return;
    index = (index + videos.length) % videos.length;
    const item = videos[index];
    const request = ++playRequest;
    videoStatus.hidden = false; videoStatus.textContent = '正在打开视频…';
    retryButton.hidden = true; sourceLink.hidden = true;
    if (restart || selectedVideo !== index || !player.getAttribute('src') || player.error) {
      player.pause(); player.removeAttribute('src'); player.load();
      selectedVideo = index; player.poster = text(item.poster);
      const width = Number(item.width), height = Number(item.height);
      player.style.aspectRatio = Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 ? `${width} / ${height}` : '16 / 9';
      const source = text(item.src);
      if (!source) { videoFailure('这段视频暂时没有地址。'); return; }
      sourceLink.href = source; player.src = source; player.load();
    }
    heroButton.hidden = true; player.hidden = false;
    const clipTitle = text(item.title, `片段 ${photoNumber(index)}`);
    const clipNote = text(item.caption);
    playerTitle.textContent = clipNote ? `${clipTitle} · ${duration(item.duration)}　${clipNote}` : `${clipTitle} · ${duration(item.duration)}`;
    videoHost.querySelectorAll('.video-card').forEach((card, i) => card.setAttribute('aria-pressed', String(i === index)));
    const pending = player.play();
    if (pending?.catch) pending.catch(error => {
      if (request !== playRequest || error.name === 'AbortError') return;
      videoFailure('播放没有开始，请重试，或直接打开这段视频。');
    });
  }
  function revealPlayer() {
    const bounds = player.getBoundingClientRect();
    if (bounds.top < 16 || bounds.bottom > innerHeight - 24) {
      player.scrollIntoView({behavior: reducedMotion() ? 'instant' : 'smooth', block:'start'});
    }
  }
  function renderVideos() {
    if (!videoHost) return;
    videoHost.replaceChildren();
    if (!videos.length) {
      const empty = document.createElement('p'); empty.className='media-empty'; empty.textContent='影片正在路上。'; videoHost.append(empty); return;
    }
    const wrap = document.createElement('div'); wrap.className='media-player-wrap';
    const stage = document.createElement('div'); stage.className='media-screen';
    heroButton = makeButton('播放第一段视频','media-video-hero',()=>selectVideo(selectedVideo < 0 ? 0 : selectedVideo));
    const poster = document.createElement('img'); poster.src=text(videos[0].poster); poster.alt=''; poster.loading='lazy'; poster.decoding='async';
    const glyph = document.createElement('span'); glyph.className='media-play-glyph'; glyph.textContent='▶'; glyph.setAttribute('aria-hidden','true');
    const heroLabel=document.createElement('span'); heroLabel.className='media-hero-label'; heroLabel.textContent='播放第一段';
    heroButton.append(poster,glyph,heroLabel);
    player=document.createElement('video'); player.className='media-player'; player.controls=true; player.playsInline=true; player.preload='none'; player.hidden=true; player.setAttribute('aria-label','生日视频播放器');
    stage.append(heroButton,player);
    playerTitle=document.createElement('p'); playerTitle.className='media-player-title'; playerTitle.setAttribute('aria-live','polite');
    playerTitle.textContent=text(videos[0].title, '片段 01') + ` · ${duration(videos[0].duration)}`;
    const navigation=document.createElement('div'); navigation.className='media-video-controls';
    const previous=makeButton('播放上一段视频','media-video-prev',()=>selectVideo((selectedVideo < 0 ? 0 : selectedVideo)-1)); previous.textContent='← 上一段';
    const next=makeButton('播放下一段视频','media-video-next',()=>selectVideo((selectedVideo < 0 ? 0 : selectedVideo)+1)); next.textContent='下一段 →';
    navigation.append(previous,next);
    videoStatus=document.createElement('p'); videoStatus.className='media-video-status'; videoStatus.setAttribute('role','status'); videoStatus.hidden=true;
    retryButton=makeButton('重试播放','media-retry',()=>{if(selectedVideo>=0)selectVideo(selectedVideo,true);}); retryButton.textContent='重试播放'; retryButton.hidden=true;
    sourceLink=document.createElement('a'); sourceLink.className='media-source-link'; sourceLink.textContent='直接打开这段视频 ↗'; sourceLink.target='_blank'; sourceLink.rel='noopener'; sourceLink.hidden=true;
    wrap.append(stage,playerTitle,navigation,videoStatus,retryButton,sourceLink);
    const playlist=document.createElement('div'); playlist.className='media-playlist';
    const listHeading=document.createElement('p'); listHeading.className='media-playlist-heading'; listHeading.textContent='选一段看看';
    const list=document.createElement('div'); list.className='video-card-list'; list.setAttribute('aria-label','选择影片');
    videos.forEach((item,index)=>{
      const card=makeButton(`播放第 ${index+1} 段视频，${duration(item.duration)}`,'video-card',()=>{selectVideo(index);revealPlayer();});
      card.dataset.index=String(index); card.setAttribute('aria-pressed','false');
      const thumb=document.createElement('img'); thumb.loading='lazy'; thumb.decoding='async'; thumb.alt=''; thumb.src=text(item.poster); thumb.width=Number(item.width)||16; thumb.height=Number(item.height)||9;
      thumb.onerror=()=>thumb.classList.add('is-error');
      const number=document.createElement('small'); number.className='video-card-number'; number.textContent=photoNumber(index);
      const time=document.createElement('small'); time.className='video-card-duration'; time.textContent=duration(item.duration);
      const label=document.createElement('span'); label.className='video-card-title'; label.textContent=text(item.title, `片段 ${photoNumber(index)}`);
      card.append(thumb,number,time,label); list.append(card);
    });
    playlist.append(listHeading,list); videoHost.append(wrap,playlist);
    player.addEventListener('error',()=>{if(player.error&&selectedVideo>=0)videoFailure('视频暂时无法播放，请重试，或直接打开这段视频。');});
    player.addEventListener('playing',()=>{videoStatus.hidden=true;retryButton.hidden=true;sourceLink.hidden=true;});
    player.addEventListener('waiting',()=>{videoStatus.hidden=false;videoStatus.textContent='正在缓冲，稍等一下…';});
    player.addEventListener('canplay',()=>{if(!player.error)videoStatus.hidden=true;});
  }
  function pauseVideo() { if (player) { ++playRequest; player.pause(); } }
  window.addEventListener('island:screenchange', event => {
    if (event.detail?.screen !== 'video') pauseVideo();
    if (event.detail?.screen !== 'travel') closePhoto();
    if (event.detail?.screen === 'travel') {
      photoCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        if (!card.classList.contains('is-revealed') && rect.top < innerHeight && rect.bottom > 0) card.classList.add('is-revealed');
      });
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseVideo(); stopSlideshow(); } });
  buildPhotoDialog(); renderPhotos(); renderVideos();
})();
