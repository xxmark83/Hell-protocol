const upgradeConfig = {
  weapons: [
    { key: '1', name: 'Shield Saw', ammo: 30 },
    { key: '2', name: 'Flail', ammo: 90 },
    { key: '3', name: 'Skullcrusher', ammo: 12 },
    { key: '4', name: 'Rail Spike', ammo: 40 },
  ],
  enemyBaseHp: {
    crawler: 60,
    warden: 45,
    brute: 260,
  },
};

(function () {
  const state = {
    ready: false,
    ghosts: [],
    lastGhost: 0,
    bossPhase: 0,
    arenaLocked: false,
    lowHpPulse: 0,
    shakeTimer: null,
    hitFlashTimer: null,
    msgTimer: null,
  };

  const getGame = () => window.__game || null;
  const getPlayer = () => {
    const game = getGame();
    return game && game.P ? game.P : null;
  };

  const showMsg = (text, seconds = 1.2) => {
    const msg = document.getElementById('msg');
    if (!msg) return;
    msg.textContent = text;
    msg.style.opacity = '1';
    clearTimeout(state.msgTimer);
    state.msgTimer = setTimeout(() => {
      if (msg) msg.style.opacity = '0';
    }, seconds * 1000);
  };

  const flashScreen = () => {
    const layer = document.getElementById('brutal-vfx') || (() => {
      const el = document.createElement('div');
      el.id = 'brutal-vfx';
      el.style.position = 'fixed';
      el.style.inset = '0';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '40';
      el.style.opacity = '0';
      el.style.transition = 'opacity 120ms ease';
      el.style.background = 'radial-gradient(circle at center, rgba(255,120,30,0.28), rgba(255,56,0,0.12) 28%, rgba(0,0,0,0) 60%)';
      document.body.appendChild(el);
      return el;
    })();

    layer.style.opacity = '1';
    clearTimeout(state.hitFlashTimer);
    state.hitFlashTimer = setTimeout(() => {
      layer.style.opacity = '0';
    }, 120);
  };

  const screenShake = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    canvas.style.transform = 'translate3d(' + ((Math.random() - 0.5) * 12) + 'px,' + ((Math.random() - 0.5) * 12) + 'px,0)';
    clearTimeout(state.shakeTimer);
    state.shakeTimer = setTimeout(() => {
      canvas.style.transform = '';
    }, 120);
  };

  const setWeapon = (index) => {
    const P = getPlayer();
    if (!P) return;

    const idx = ((index % upgradeConfig.weapons.length) + upgradeConfig.weapons.length) % upgradeConfig.weapons.length;
    P.wep = idx;
    P.ammo = P.ammo || [30, 90, 12, 40];
    P.ammo[idx] = Math.max(0, P.ammo[idx] || 0);

    const weaponLabel = document.getElementById('wname');
    const ammoLabel = document.getElementById('ammo');
    if (weaponLabel) weaponLabel.textContent = upgradeConfig.weapons[idx].name;
    if (ammoLabel) {
      ammoLabel.textContent = String(P.ammo[idx] || 0);
      ammoLabel.className = 'num ' + ((idx === 1 || idx === 3) ? 'cyan' : 'amber');
    }

    if (P.gun0) P.gun0.visible = idx === 0;
    if (P.gun1) P.gun1.visible = idx === 1 || idx === 3;
  };

  const updateHud = () => {
    const P = getPlayer();
    if (!P) return;

    const weaponLabel = document.getElementById('wname');
    const ammoLabel = document.getElementById('ammo');
    if (weaponLabel) weaponLabel.textContent = upgradeConfig.weapons[P.wep]?.name || 'Shield Saw';
    if (ammoLabel) {
      ammoLabel.textContent = String(P.ammo[P.wep] ?? 0);
      ammoLabel.className = 'num ' + ((P.wep === 1 || P.wep === 3) ? 'cyan' : 'amber');
    }

    const hpLabel = document.getElementById('hpn');
    const hpBar = document.getElementById('hpb');
    if (hpLabel) hpLabel.textContent = String(Math.ceil(P.hp));
    if (hpBar) hpBar.style.width = String(Math.max(0, P.hp)) + '%';
  };

  const triggerDash = () => {
    const P = getPlayer();
    if (!P || P.dashCd > 0) return;

    P.dashT = 0.16;
    P.dashCd = 0.6;
    P.inv = Math.max(P.inv, 0.2);
    P.vx = P.face * 720;
    P.vy = 0;
    if (P.c) P.c.alpha = 0.8;

    if (window.__audio && typeof window.__audio.dash === 'function') {
      window.__audio.dash();
    }

    flashScreen();
    screenShake();
  };

  const addAfterimage = () => {
    const P = getPlayer();
    if (!P || !P.c || P.dashT <= 0) return;

    const now = performance.now();
    if (now - state.lastGhost < 36) return;
    state.lastGhost = now;

    const ghost = P.c.clone({ children: true });
    ghost.alpha = 0.18;
    ghost.scale.x = P.face * (0.9 + P.dashT * 2);
    ghost.scale.y = 0.9 + P.dashT * 2;

    if (P.c.parent) P.c.parent.addChild(ghost);
    state.ghosts.push({ sprite: ghost, life: 0.22 });
  };

  const updateGhosts = () => {
    for (let i = state.ghosts.length - 1; i >= 0; i--) {
      const item = state.ghosts[i];
      item.life -= 0.016;
      item.sprite.alpha *= 0.82;
      if (item.life <= 0) {
        if (item.sprite.parent) item.sprite.parent.removeChild(item.sprite);
        state.ghosts.splice(i, 1);
      }
    }
  };

  const doParry = () => {
    const P = getPlayer();
    if (!P) return;

    const game = getGame();
    const enemies = Array.isArray(game?.enemies) ? game.enemies : [];

    for (const enemy of enemies) {
      if (!enemy || enemy.dead) continue;
      const dx = Math.abs(P.x - enemy.x);
      const dy = Math.abs(P.y - enemy.y);
      if (dx < 80 && dy < 80) {
        enemy.stagger = 3;
        enemy.flash = 1;
        enemy.hp = Math.max(0, enemy.hp - 20);
        if (enemy.hp <= 0) {
          enemy.dead = true;
          if (enemy.c && enemy.c.destroy) enemy.c.destroy({ children: true });
        }
        if (window.__audio && typeof window.__audio.hit === 'function') {
          window.__audio.hit();
        }
        flashScreen();
        screenShake();
        showMsg('Perfect Parry');
      }
    }
  };

  const spawnEnemyDeathVfx = (enemy) => {
    const layer = document.getElementById('enemy-vfx-layer') || (() => {
      const el = document.createElement('div');
      el.id = 'enemy-vfx-layer';
      el.style.position = 'fixed';
      el.style.inset = '0';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '29';
      el.style.overflow = 'hidden';
      document.body.appendChild(el);
      return el;
    })();

    const colorA = '#ff7a18';
    const colorB = '#650b0b';
    const count = 14;
    for (let i = 0; i < count; i++) {
      const shard = document.createElement('span');
      const x = enemy.x + (Math.random() - 0.5) * 35;
      const y = enemy.y + (Math.random() - 0.5) * 35;
      const size = Math.random() * 8 + 4;
      shard.style.position = 'absolute';
      shard.style.left = `${x}px`;
      shard.style.top = `${y}px`;
      shard.style.width = `${size}px`;
      shard.style.height = `${size * 1.7}px`;
      shard.style.background = `linear-gradient(180deg, ${colorA}, ${colorB})`;
      shard.style.borderRadius = '50%';
      shard.style.transform = `rotate(${Math.random() * 180}deg)`;
      shard.style.opacity = '0.85';
      shard.style.filter = 'blur(0.2px)';
      layer.appendChild(shard);

      setTimeout(() => {
        shard.style.transition = 'transform 420ms ease-out, opacity 420ms ease-out';
        shard.style.transform = `translate(${(Math.random() - 0.5) * 90}px, ${(Math.random() - 0.5) * 90}px) rotate(${Math.random() * 360}deg)`;
        shard.style.opacity = '0';
        setTimeout(() => shard.remove(), 440);
      }, 20);
    }
  };

  const applyStagger = (enemy) => {
    if (!enemy || enemy.dead) return;

    enemy.maxHp = enemy.maxHp || enemy.hp || upgradeConfig.enemyBaseHp[enemy.type] || 60;
    enemy.stagger = enemy.stagger || 0;

    if (enemy.hp <= enemy.maxHp * 0.12 && enemy.stagger <= 0) {
      enemy.stagger = 3;
      enemy.flash = 1;
    }

    if (enemy.stagger > 0) {
      enemy.stagger = Math.max(0, enemy.stagger - 0.016);
      if (enemy.c) {
        enemy.c.tint = 0xfff3b0;
        enemy.c.alpha = 0.6 + Math.sin(performance.now() * 0.045) * 0.45;
      }
    } else if (enemy.c) {
      enemy.c.tint = 0xffffff;
      enemy.c.alpha = 1;
    }

    const P = getPlayer();
    if (!P || !P.dashT || enemy.stagger <= 0) return;

    const distanceX = Math.abs(P.x - enemy.x);
    const distanceY = Math.abs(P.y - enemy.y);
    if (distanceX < 80 && distanceY < 80) {
      enemy.dead = true;
      spawnEnemyDeathVfx(enemy);
      if (enemy.c) {
        enemy.c.visible = false;
        if (enemy.c.destroy) enemy.c.destroy({ children: true });
      }

      const scoreNode = document.getElementById('score');
      const currentScore = Number((scoreNode?.textContent || '0').replace(/[^\d]/g, '')) || 0;
      if (scoreNode) scoreNode.textContent = (currentScore + 400).toLocaleString('sk');
      if (P.hp < 100) P.hp = Math.min(100, P.hp + 25);

      updateHud();
      showMsg('Glory kill');
      if (window.__audio && typeof window.__audio.hit === 'function') {
        window.__audio.hit();
      }
      flashScreen();
      screenShake();
    }
  };

  const updateBossPhase = () => {
    const boss = getGame()?.boss;
    if (!boss || !boss.hp || !boss.max) return;

    let phase = 1;
    if (boss.hp < boss.max * 0.66) phase = 2;
    if (boss.hp < boss.max * 0.33) phase = 3;

    if (state.bossPhase !== phase) {
      state.bossPhase = phase;
      showMsg(
        phase === 1 ? 'Pán výhne' : phase === 2 ? 'Pán výhne zúri' : 'Pán výhne je rozzuřený',
        1.5
      );
      flashScreen();
      screenShake();
    }
  };

  const updateArenaLock = () => {
    const P = getPlayer();
    if (!P) return;
    if (P.x > 3850 && !state.arenaLocked) {
      state.arenaLocked = true;
      showMsg('Arena seal', 1.5);
      flashScreen();
      screenShake();
    }
  };

  const updateLowHealthVignette = () => {
    const P = getPlayer();
    if (!P) return;

    const vfx = document.getElementById('brutal-vfx');
    if (!vfx) return;

    if (P.hp < 25) {
      state.lowHpPulse += 0.08;
      const pulse = 0.38 + Math.sin(state.lowHpPulse) * 0.24;
      vfx.style.background = 'radial-gradient(circle at center, rgba(255,40,40,0.2), rgba(255,0,0,0.12) 28%, rgba(0,0,0,0) 58%)';
      vfx.style.opacity = String(Math.min(1, 0.28 + pulse));
    } else {
      vfx.style.opacity = '0';
    }
  };

  const tickUpgrade = () => {
    const game = getGame();
    const P = getPlayer();
    if (!P || !game) return;

    if (P.dashT > 0) addAfterimage();
    updateGhosts();
    updateHud();
    updateBossPhase();
    updateArenaLock();
    updateLowHealthVignette();

    const enemies = Array.isArray(game.enemies) ? game.enemies : [];
    enemies.forEach(applyStagger);

    if (P.wep == null) P.wep = 0;
  };

  const bindControls = () => {
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Digit1') setWeapon(0);
      if (event.code === 'Digit2') setWeapon(1);
      if (event.code === 'Digit3') setWeapon(2);
      if (event.code === 'Digit4') setWeapon(3);
      if (event.code === 'KeyQ') setWeapon((getPlayer()?.wep ?? 0) + 1);
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') triggerDash();
      if (event.code === 'KeyE') doParry();
    });

    const startTitle = document.querySelector('#start h1');
    const startText = document.querySelector('#start p');
    if (startTitle) startTitle.textContent = 'Pekelný protokol: Brutal Upgrade';
    if (startText) startText.textContent = 'Vyraž si cestu cez bránu pevnosti, krv a oheň, pričom každý dash, stagger a glory kill ti dáva novú šancu prežiť.';
  };

  const loop = () => {
    const game = getGame();
    const P = getPlayer();

    if (!game || !P) {
      requestAnimationFrame(loop);
      return;
    }

    if (!state.ready) {
      state.ready = true;
      P.ammo = P.ammo || [30, 90, 12, 40];
      bindControls();
      setWeapon(0);
      updateHud();
    }

    tickUpgrade();
    requestAnimationFrame(loop);
  };

  loop();
})();

(() => {
  const bossState = {
    telegraph: null,
    lastPhase: 0,
  };

  const ensureBossOverlay = () => {
    let el = document.getElementById('boss-warning');
    if (el) return el;

    el = document.createElement('div');
    el.id = 'boss-warning';
    el.style.position = 'fixed';
    el.style.inset = '0';
    el.style.pointerEvents = 'none';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.zIndex = '42';
    el.style.opacity = '0';
    el.style.transition = 'opacity 180ms ease';
    el.style.fontSize = 'clamp(20px, 4vw, 42px)';
    el.style.fontWeight = '700';
    el.style.color = '#fef3c7';
    el.style.textShadow = '0 0 18px rgba(255,140,0,0.52), 0 0 36px rgba(255,60,0,0.24)';
    el.style.letterSpacing = '0.08em';
    el.style.textTransform = 'uppercase';
    document.body.appendChild(el);
    return el;
  };

  const showBossWarning = (text) => {
    const el = ensureBossOverlay();
    el.textContent = text;
    el.style.opacity = '1';
    setTimeout(() => {
      el.style.opacity = '0';
    }, 900);
  };

  const updateBossTelegraph = () => {
    const game = window.__game;
    const boss = game && game.boss ? game.boss : null;
    if (!boss || !boss.hp || !boss.max) return;

    const phase = boss.hp < boss.max * 0.66 ? 2 : 1;
    const phase2 = boss.hp < boss.max * 0.33 ? 3 : phase;

    if (phase2 !== bossState.lastPhase) {
      bossState.lastPhase = phase2;
      if (phase2 === 1) showBossWarning('Rage phase');
      if (phase2 === 2) showBossWarning('Overdrive');
      if (phase2 === 3) showBossWarning('Final form');
    }

    if (!boss.telegraph || boss.telegraph <= 0) {
      const roll = Math.random();
      if (roll < 0.015) {
        boss.telegraph = 1.4;
        showBossWarning('Charge!');
      }
    } else {
      boss.telegraph -= 0.016;
    }
  };

  const bossLoop = () => {
    updateBossTelegraph();
    requestAnimationFrame(bossLoop);
  };

  bossLoop();
})();

(() => {
  const audioState = {
    enabled: true,
    ambient: null,
    music: null,
    started: false,
    ctx: null,
  };

  const ensureAudioContext = () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioState.ctx) audioState.ctx = new AudioCtx();
    if (audioState.ctx.state === 'suspended') audioState.ctx.resume();
    return audioState.ctx;
  };

  const createNoise = (ctx, gainValue = 0.012) => {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.55;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1800;

    const gain = ctx.createGain();
    gain.gain.value = gainValue;

    source.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    return { source, gain, lowpass };
  };

  const createTone = (ctx, freq = 52, gainValue = 0.018, type = 'sawtooth') => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1200;

    const gain = ctx.createGain();
    gain.gain.value = gainValue;

    osc.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    return { osc, gain, lowpass };
  };

  const initAudio = () => {
    if (audioState.started) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;

    audioState.ambient = createNoise(ctx, 0.006);
    audioState.music = createTone(ctx, 48, 0.012, 'sawtooth');
    audioState.started = true;
  };

  const playShot = (gainLevel = 0.08, pitch = 1) => {
    if (!audioState.enabled) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 90 * pitch;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2200;

    const gain = ctx.createGain();
    gain.gain.value = 0.12;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.stop(ctx.currentTime + 0.12);
  };

  const playHit = () => {
    if (!audioState.enabled) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 42;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1800;

    const gain = ctx.createGain();
    gain.gain.value = 0.18;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.stop(ctx.currentTime + 0.08);
  };

  const playDash = () => {
    if (!audioState.enabled) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 140;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 250;

    const gain = ctx.createGain();
    gain.gain.value = 0.06;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.1);
  };

  window.__audio = {
    init: initAudio,
    shot: playShot,
    hit: playHit,
    dash: playDash,
    enable: () => { audioState.enabled = true; },
    disable: () => { audioState.enabled = false; },
  };

  document.addEventListener('pointerdown', initAudio, { once: true });
  document.addEventListener('keydown', initAudio, { once: true });
})();

(() => {
  const ensureBloodLayer = () => {
    let layer = document.getElementById('blood-layer');
    if (layer) return layer;

    layer = document.createElement('div');
    layer.id = 'blood-layer';
    layer.style.position = 'fixed';
    layer.style.inset = '0';
    layer.style.pointerEvents = 'none';
    layer.style.zIndex = '30';
    layer.style.overflow = 'hidden';
    layer.style.mixBlendMode = 'multiply';
    document.body.appendChild(layer);
    return layer;
  };

  const spawnBloodBurst = (x, y, amount = 12) => {
    const layer = ensureBloodLayer();
    for (let i = 0; i < amount; i++) {
      const p = document.createElement('div');
      p.style.position = 'absolute';
      p.style.left = `${x + (Math.random() * 30 - 15)}px`;
      p.style.top = `${y + (Math.random() * 20 - 10)}px`;
      p.style.width = `${Math.random() * 10 + 6}px`;
      p.style.height = `${Math.random() * 10 + 6}px`;
      p.style.borderRadius = '50%';
      p.style.background = 'radial-gradient(circle, rgba(120,0,0,0.84), rgba(40,0,0,0.9) 55%, rgba(12,0,0,0.96))';
      p.style.opacity = '0.9';
      p.style.transform = `translate(${(Math.random() - 0.5) * 30}px, ${(Math.random() - 0.5) * 30}px)`;
      p.style.filter = 'blur(0.5px)';
      layer.appendChild(p);

      setTimeout(() => {
        p.style.transition = 'transform 500ms ease, opacity 500ms ease';
        p.style.transform = `translate(${(Math.random() - 0.5) * 80}px, ${(Math.random() - 0.5) * 80}px)`;
        p.style.opacity = '0';
        setTimeout(() => p.remove(), 520);
      }, 10);
    }
  };

  const spawnGoreDecal = (x, y) => {
    const layer = ensureBloodLayer();
    const d = document.createElement('div');
    d.style.position = 'absolute';
    d.style.left = `${x}px`;
    d.style.top = `${y}px`;
    d.style.width = `${Math.random() * 80 + 40}px`;
    d.style.height = `${Math.random() * 50 + 26}px`;
    d.style.borderRadius = '46% 54% 62% 38% / 44% 60% 40% 56%';
    d.style.background = 'radial-gradient(circle at 25% 30%, rgba(150,0,0,0.9), rgba(30,0,0,0.95) 64%, rgba(12,0,0,1))';
    d.style.filter = 'blur(0.5px)';
    d.style.opacity = '0.7';
    d.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(d);
    setTimeout(() => d.remove(), 6000);
  };

  const triggerFinalPolish = () => {
    const player = window.__game?.P;
    if (!player) return;

    const rng = Math.random();
    if (rng > 0.2) {
      spawnBloodBurst(window.innerWidth * 0.5, window.innerHeight * 0.52, 12);
    }

    const boss = window.__game?.boss;
    if (boss && boss.hp < boss.max * 0.5) {
      spawnGoreDecal(window.innerWidth * 0.5 + (Math.random() - 0.5) * 140, window.innerHeight * 0.54 + (Math.random() - 0.5) * 70);
    }
  };

  document.addEventListener('pointerdown', triggerFinalPolish);
  document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyV') triggerFinalPolish();
  });

  setInterval(() => {
    if (Math.random() > 0.8) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      spawnBloodBurst(x, y, 8);
    }
  }, 1600);
})();

(() => {
  const ensureAmbientDust = () => {
    let layer = document.getElementById('arena-dust');
    if (layer) return layer;

    layer = document.createElement('div');
    layer.id = 'arena-dust';
    layer.style.position = 'fixed';
    layer.style.inset = '0';
    layer.style.pointerEvents = 'none';
    layer.style.zIndex = '15';
    layer.style.opacity = '0.25';
    layer.style.background = 'radial-gradient(circle, rgba(255,170,110,0.12), transparent 50%)';
    layer.style.filter = 'blur(18px)';
    document.body.appendChild(layer);
    return layer;
  };

  const spawnDustParticle = () => {
    const layer = ensureAmbientDust();
    const dot = document.createElement('span');
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    dot.style.position = 'absolute';
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.style.width = `${Math.random() * 4 + 2}px`;
    dot.style.height = dot.style.width;
    dot.style.borderRadius = '50%';
    dot.style.background = 'rgba(255,180,120,0.22)';
    dot.style.filter = 'blur(1px)';
    layer.appendChild(dot);

    setTimeout(() => {
      dot.style.transition = 'transform 2800ms ease-out, opacity 2800ms ease-out';
      dot.style.transform = `translate(${(Math.random() - 0.5) * 180}px, ${(Math.random() - 0.5) * 120}px)`;
      dot.style.opacity = '0';
      setTimeout(() => dot.remove(), 2900);
    }, 10);
  };

  setInterval(() => {
    if (Math.random() > 0.18) spawnDustParticle();
  }, 250);
})();

(() => {
  const bossFXState = { pulse: 0, lastBurst: 0 };

  const ensureBossAura = () => {
    let aura = document.getElementById('boss-aura');
    if (aura) return aura;

    aura = document.createElement('div');
    aura.id = 'boss-aura';
    aura.style.position = 'fixed';
    aura.style.inset = '0';
    aura.style.pointerEvents = 'none';
    aura.style.zIndex = '18';
    aura.style.opacity = '0';
    aura.style.background = 'radial-gradient(circle at center, rgba(255,90,50,0.18), rgba(120,20,0,0.12) 28%, transparent 62%)';
    aura.style.mixBlendMode = 'screen';
    document.body.appendChild(aura);
    return aura;
  };

  const spawnBossImpact = (x, y) => {
    const layer = ensureBossAura();
    const ring = document.createElement('div');
    ring.style.position = 'absolute';
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    ring.style.width = '60px';
    ring.style.height = '60px';
    ring.style.border = '2px solid rgba(255,150,80,0.55)';
    ring.style.borderRadius = '50%';
    ring.style.transform = 'translate(-50%, -50%)';
    ring.style.opacity = '0.8';
    layer.appendChild(ring);

    setTimeout(() => {
      ring.style.transition = 'transform 420ms ease-out, opacity 420ms ease-out';
      ring.style.transform = 'translate(-50%, -50%) scale(3.5)';
      ring.style.opacity = '0';
      setTimeout(() => ring.remove(), 420);
    }, 10);
  };

  const updateBossChoreography = () => {
    const boss = window.__game?.boss;
    if (!boss || !boss.c) return;

    const phase = boss.hp / Math.max(1, boss.max);
    const aura = ensureBossAura();
    const pulse = 0.14 + (1 - phase) * 0.6 + Math.sin(performance.now() * 0.005) * 0.08;
    aura.style.opacity = String(Math.min(1, pulse));
    aura.style.background = `radial-gradient(circle at center, rgba(255,90,50,${0.14 + (1 - phase) * 0.4}), rgba(120,20,0,0.12) 28%, transparent 62%)`;

    boss.c.rotation = Math.sin(performance.now() * 0.006) * (phase < 0.35 ? 0.2 : 0.1);
    boss.c.alpha = 0.75 + Math.sin(performance.now() * 0.04) * 0.25;

    if (boss.hp < boss.max * 0.7 && performance.now() - bossFXState.lastBurst > 1200) {
      bossFXState.lastBurst = performance.now();
      const x = window.innerWidth * 0.5 + (Math.random() - 0.5) * 260;
      const y = window.innerHeight * 0.45 + (Math.random() - 0.5) * 160;
      spawnBossImpact(x, y);
    }
  };

  requestAnimationFrame(function frame() {
    updateBossChoreography();
    requestAnimationFrame(frame);
  });
})();
