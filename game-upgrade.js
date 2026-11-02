(() => {
  const WEAPONS = [
    { name: 'Shield Saw', ammo: 30 },
    { name: 'Flail', ammo: 90 },
    { name: 'Skullcrusher', ammo: 12 },
    { name: 'Rail Spike', ammo: 40 }
  ];

  const state = {
    ready: false,
    ghosts: [],
    lastGhost: 0,
    bossPhase: 0,
    arenaLocked: false,
    lowHpPulse: 0,
    shakeTimer: null,
    hitFlashTimer: null,
    msgTimer: null
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
      msg.style.opacity = '0';
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

    const idx = ((index % WEAPONS.length) + WEAPONS.length) % WEAPONS.length;
    P.wep = idx;
    P.ammo = P.ammo || [30, 90, 12, 40];
    P.ammo[idx] = Math.max(0, P.ammo[idx] || 0);

    const weaponLabel = document.getElementById('wname');
    const ammoLabel = document.getElementById('ammo');
    if (weaponLabel) weaponLabel.textContent = WEAPONS[idx].name;
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
    if (weaponLabel) weaponLabel.textContent = WEAPONS[P.wep]?.name || 'Shield Saw';
    if (ammoLabel) {
      ammoLabel.textContent = String(P.ammo[P.wep] ?? 0);
      ammoLabel.className = 'num ' + ((P.wep === 1 || P.wep === 3) ? 'cyan' : 'amber');
    }

    const hpn = document.getElementById('hpn');
    const hpb = document.getElementById('hpb');
    if (hpn) hpn.textContent = String(Math.ceil(P.hp));
    if (hpb) hpb.style.width = String(Math.max(0, P.hp)) + '%';
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

    if (P.c.parent) {
      P.c.parent.addChild(ghost);
    }

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
        flashScreen();
        screenShake();
        showMsg('Perfect Parry');
      }
    }
  };

  const applyStagger = (enemy) => {
    if (!enemy || enemy.dead) return;

    enemy.maxHp = enemy.maxHp || enemy.hp || 60;
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

    const dx = Math.abs(P.x - enemy.x);
    const dy = Math.abs(P.y - enemy.y);
    if (dx < 80 && dy < 80) {
      enemy.dead = true;
      if (enemy.c) {
        enemy.c.visible = false;
        if (enemy.c.destroy) enemy.c.destroy({ children: true });
      }

      const scoreNode = document.getElementById('score');
      const score = Number((scoreNode?.textContent || '0').replace(/[^\d]/g, '')) || 0;
      if (scoreNode) scoreNode.textContent = (score + 400).toLocaleString('sk');

      if (P.hp < 100) P.hp = Math.min(100, P.hp + 25);

      updateHud();
      showMsg('Glory kill');
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
        phase === 1 ? 'Pán výhne' :
        phase === 2 ? 'Pán výhne zúri' :
        'Pán výhne je rozzuřený',
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

    if (P.dashT > 0) {
      addAfterimage();
    }

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

    const title = document.querySelector('#start h1');
    const intro = document.querySelector('#start p');
    if (title) title.textContent = 'Pekelný protokol: Brutal Upgrade';
    if (intro) intro.textContent = 'Vyraž si cestu cez bránu pevnosti, krv a oheň, pričom každý dash, stagger a glory kill ti dáva novú šancu prežiť.';
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
