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
  const state = { ready: false, ghosts: [], lastGhost: 0, arenaLocked: false, lastBossPhase: null, lastVibe: 0, shakeTimer: 0, hitFlash: 0, lowHpPulse: 0 };

  function getGame() {
    return window.__game || null;
  }

  function getPlayer() {
    const game = getGame();
    return game && game.P ? game.P : null;
  }

  function setWeapon(index) {
    const P = getPlayer();
    if (!P) return;

    const weaponIndex = ((index % upgradeConfig.weapons.length) + upgradeConfig.weapons.length) % upgradeConfig.weapons.length;
    P.wep = weaponIndex;
    P.ammo = P.ammo || [30, 90, 12, 40];
    P.ammo[weaponIndex] = Math.max(0, P.ammo[weaponIndex] || 0);

    const weaponLabel = document.getElementById('wname');
    const ammoLabel = document.getElementById('ammo');
    if (weaponLabel) weaponLabel.textContent = upgradeConfig.weapons[weaponIndex].name;
    if (ammoLabel) {
      ammoLabel.textContent = String(P.ammo[weaponIndex] || 0);
      ammoLabel.className = 'num ' + ((weaponIndex === 1 || weaponIndex === 3) ? 'cyan' : 'amber');
    }

    if (P.gun0) P.gun0.visible = weaponIndex === 0;
    if (P.gun1) P.gun1.visible = weaponIndex === 1 || weaponIndex === 3;
  }

  function updateHud() {
    const P = getPlayer();
    if (!P) return;

    const weaponLabel = document.getElementById('wname');
    const ammoLabel = document.getElementById('ammo');
    if (weaponLabel) weaponLabel.textContent = upgradeConfig.weapons[P.wep]?.name || 'Shield Saw';
    if (ammoLabel) {
      ammoLabel.textContent = String(P.ammo[P.wep] ?? 0);
      ammoLabel.className = 'num ' + ((P.wep === 1 || P.wep === 3) ? 'cyan' : 'amber');
    }
  }

  function addShockwavePulse() {
    const pulse = document.createElement('div');
    pulse.style.position = 'fixed';
    pulse.style.inset = '0';
    pulse.style.pointerEvents = 'none';
    pulse.style.background = 'radial-gradient(circle, rgba(255,190,80,0.22) 0%, rgba(255,102,0,0.12) 30%, rgba(0,0,0,0) 60%)';
    pulse.style.opacity = '1';
    pulse.style.transition = 'opacity 260ms ease';
    pulse.style.zIndex = '25';
    pulse.style.mixBlendMode = 'screen';
    document.body.appendChild(pulse);

    requestAnimationFrame(() => {
      pulse.style.opacity = '0';
      setTimeout(() => pulse.remove(), 320);
    });
  }

  function triggerDash() {
    const P = getPlayer();
    if (!P || P.dashCd > 0) return;

    P.dashT = 0.16;
    P.dashCd = 0.6;
    P.inv = Math.max(P.inv, 0.2);
    P.vx = P.face * 720;
    P.vy = 0;
    if (P.c) P.c.alpha = 0.8;
    addShockwavePulse();
  }

  function addAfterimage() {
    const P = getPlayer();
    if (!P || !P.c || P.dashT <= 0) return;

    const now = performance.now();
    if (now - state.lastGhost < 36) return;
    state.lastGhost = now;

    const ghost = P.c.clone({ children: true });
    ghost.alpha = 0.18;
    ghost.scale.x = P.face * (0.9 + (P.dashT * 2));
    ghost.scale.y = 0.9 + (P.dashT * 2);

    if (P.c.parent) {
      P.c.parent.addChild(ghost);
    }

    state.ghosts.push({ sprite: ghost, life: 0.22 });
  }

  function updateGhosts() {
    for (let i = state.ghosts.length - 1; i >= 0; i--) {
      const item = state.ghosts[i];
      item.life -= 0.016;
      item.sprite.alpha *= 0.82;
      if (item.life <= 0) {
        if (item.sprite.parent) item.sprite.parent.removeChild(item.sprite);
        state.ghosts.splice(i, 1);
      }
    }
  }

  function doParry() {
    const P = getPlayer();
    if (!P) return;

    const game = getGame();
    const enemies = Array.isArray(game?.enemies) ? game.enemies : [];
    for (const enemy of enemies) {
      if (!enemy || enemy.dead) continue;
      const dx = Math.abs(P.x - enemy.x);
      const dy = Math.abs(P.y - enemy.y);
      if (dx < 70 && dy < 70) {
        enemy.stagger = 3;
        enemy.flash = 1;
        enemy.hp = Math.max(0, enemy.hp - 20);
        if (enemy.hp <= 0) {
          enemy.dead = true;
          if (enemy.c && enemy.c.destroy) enemy.c.destroy({ children: true });
        }
        addShockwavePulse();
      }
    }
  }

  function applyStagger(enemy) {
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
      if (enemy.c) {
        enemy.c.visible = false;
        if (enemy.c.destroy) enemy.c.destroy({ children: true });
      }

      const scoreNode = document.getElementById('score');
      const currentScore = Number((scoreNode?.textContent || '0').replace(/[^\d]/g, '')) || 0;
      if (scoreNode) scoreNode.textContent = (currentScore + 400).toLocaleString('sk');

      if (P.hp < 100) {
        P.hp = Math.min(100, P.hp + 25);
      }

      const hpLabel = document.getElementById('hpn');
      const hpBar = document.getElementById('hpb');
      if (hpLabel) hpLabel.textContent = String(Math.ceil(P.hp));
      if (hpBar) hpBar.style.width = String(Math.max(0, P.hp)) + '%';

      const msg = document.getElementById('msg');
      if (msg) {
        msg.textContent = 'Glory kill';
        msg.style.opacity = '1';
        setTimeout(() => {
          if (msg) msg.style.opacity = '0';
        }, 600);
      }
    }
  }

  function ensureVFXLayer() {
    let layer = document.getElementById('brutal-vfx');
    if (layer) return layer;

    layer = document.createElement('div');
    layer.id = 'brutal-vfx';
    layer.style.position = 'fixed';
    layer.style.inset = '0';
    layer.style.pointerEvents = 'none';
    layer.style.zIndex = '30';
    layer.style.opacity = '0';
    layer.style.transition = 'opacity 160ms ease';
    layer.style.background = 'radial-gradient(circle at center, rgba(255,128,32,0.18), rgba(0,0,0,0) 55%)';
    document.body.appendChild(layer);
    return layer;
  }

  function triggerHitFlash() {
    const layer = ensureVFXLayer();
    layer.style.opacity = '1';
    setTimeout(() => { layer.style.opacity = '0'; }, 120);
  }

  function triggerScreenShake() {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    canvas.style.transform = 'translate3d(' + ((Math.random() - 0.5) * 12) + 'px,' + ((Math.random() - 0.5) * 12) + 'px,0)';
    clearTimeout(state.shakeTimer);
    state.shakeTimer = setTimeout(() => {
      canvas.style.transform = '';
    }, 120);
  }

  function updateBossPhase() {
    const boss = getGame()?.boss;
    if (!boss || !boss.hp) return;

    let phase = 1;
    if (boss.hp < boss.max * 0.66) phase = 2;
    if (boss.hp < boss.max * 0.33) phase = 3;

    if (state.lastBossPhase !== phase) {
      state.lastBossPhase = phase;
      const msg = document.getElementById('msg');
      if (msg) {
        msg.textContent = phase === 1 ? 'Pán výhne' : phase === 2 ? 'Pán výhne zúri' : 'Pán výhne je rozzuřený';
        msg.style.opacity = '1';
        setTimeout(() => { if (msg) msg.style.opacity = '0'; }, 1200);
      }
      triggerScreenShake();
      triggerHitFlash();
      addShockwavePulse();
    }
  }

  function updateArenaLock() {
    const game = getGame();
    if (!game || !game.P) return;
    const P = game.P;
    if (P.x > 3850 && !state.arenaLocked) {
      state.arenaLocked = true;
      const msg = document.getElementById('msg');
      if (msg) {
        msg.textContent = 'Arena seal';
        msg.style.opacity = '1';
        setTimeout(() => { if (msg) msg.style.opacity = '0'; }, 1200);
      }
    }
  }

  function updateLowHpVignette() {
    const P = getPlayer();
    if (!P) return;

    const layer = ensureVFXLayer();
    if (P.hp < 25) {
      state.lowHpPulse += 0.06;
      const pulse = 0.4 + Math.sin(state.lowHpPulse) * 0.24;
      layer.style.background = 'radial-gradient(circle at center, rgba(255,40,40,0.18), rgba(255,0,0,0.10) 28%, rgba(0,0,0,0) 58%)';
      layer.style.opacity = String(Math.min(1, 0.28 + pulse));
    } else {
      layer.style.opacity = '0';
      layer.style.background = 'radial-gradient(circle at center, rgba(255,128,32,0.18), rgba(0,0,0,0) 55%)';
    }
  }

  function tickUpgrade() {
    const game = getGame();
    const P = getPlayer();
    if (!P || !game) return;

    if (P.dashT > 0) {
      addAfterimage();
    }

    updateGhosts();
    updateHud();
    updateLowHpVignette();
    updateArenaLock();
    updateBossPhase();

    const enemies = Array.isArray(game.enemies) ? game.enemies : [];
    enemies.forEach(applyStagger);

    if (P.wep == null) P.wep = 0;
  }

  function bindControls() {
    const game = getGame();
    if (!game || !game.keys) return;

    document.addEventListener('keydown', function (event) {
      if (event.code === 'Digit1') setWeapon(0);
      if (event.code === 'Digit2') setWeapon(1);
      if (event.code === 'Digit3') setWeapon(2);
      if (event.code === 'Digit4') setWeapon(3);
      if (event.code === 'KeyQ') setWeapon((game.P?.wep ?? 0) + 1);
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') triggerDash();
      if (event.code === 'KeyE') doParry();
    });

    const startTitle = document.querySelector('#start h1');
    const startText = document.querySelector('#start p');
    if (startTitle) startTitle.textContent = 'Pekelný protokol: Brutal Upgrade';
    if (startText) startText.textContent = 'Vyraž si cestu cez bránu pevnosti, krv a oheň, pričom každý dash, stagger a glory kill ti dáva novú šancu prežiť.';
  }

  function startLoop() {
    const game = getGame();
    const P = getPlayer();

    if (!game || !P) {
      requestAnimationFrame(startLoop);
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
    requestAnimationFrame(startLoop);
  }

  startLoop();
})();
