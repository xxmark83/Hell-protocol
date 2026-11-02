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
  let ready = false;
  let animationFrameId = null;

  function getGame() {
    return window.__game || null;
  }

  function setWeapon(index) {
    const game = getGame();
    if (!game || !game.P) return;

    const weaponIndex = ((index % upgradeConfig.weapons.length) + upgradeConfig.weapons.length) % upgradeConfig.weapons.length;
    const P = game.P;
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
    const game = getGame();
    if (!game || !game.P) return;
    const P = game.P;

    const weaponLabel = document.getElementById('wname');
    const ammoLabel = document.getElementById('ammo');
    if (weaponLabel) weaponLabel.textContent = upgradeConfig.weapons[P.wep]?.name || 'Shield Saw';
    if (ammoLabel) {
      ammoLabel.textContent = String(P.ammo[P.wep] ?? 0);
      ammoLabel.className = 'num ' + ((P.wep === 1 || P.wep === 3) ? 'cyan' : 'amber');
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

    const game = getGame();
    const P = game?.P;
    if (!P || !P.dashT || enemy.stagger <= 0) return;

    const distanceX = Math.abs(P.x - enemy.x);
    const distanceY = Math.abs(P.y - enemy.y);
    if (distanceX < 80 && distanceY < 80) {
      enemy.dead = true;
      enemy.c.visible = false;
      if (enemy.c && enemy.c.destroy) enemy.c.destroy({ children: true });
      const scoreNode = document.getElementById('score');
      const currentScore = Number((scoreNode?.textContent || '0').replace(/[^\d]/g, '')) || 0;
      if (scoreNode) scoreNode.textContent = (currentScore + 400).toLocaleString('sk');
      if (P.hp < 100) P.hp = Math.min(100, P.hp + 25);
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

  function tickUpgrade() {
    const game = getGame();
    if (!game) return;

    updateHud();

    const enemies = Array.isArray(game.enemies) ? game.enemies : [];
    enemies.forEach(applyStagger);

    const P = game.P;
    if (P && P.wep == null) {
      P.wep = 0;
    }
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
    });

    const startTitle = document.querySelector('#start h1');
    const startText = document.querySelector('#start p');
    if (startTitle) startTitle.textContent = 'Pekelný protokol: Brutal Upgrade';
    if (startText) startText.textContent = 'Vyraž si cestu cez bránu pevnosti, krv a oheň, pričom každý dash, stagger a glory kill ti dáva novú šancu prežiť.';
  }

  function startUpgradeLoop() {
    const game = getGame();
    if (!game || !game.P) {
      animationFrameId = requestAnimationFrame(startUpgradeLoop);
      return;
    }

    if (!ready) {
      ready = true;
      const P = game.P;
      P.ammo = P.ammo || [30, 90, 12, 40];
      bindControls();
      setWeapon(0);
      updateHud();
    }

    tickUpgrade();
    animationFrameId = requestAnimationFrame(startUpgradeLoop);
  }

  if (window.__game) {
    startUpgradeLoop();
  } else {
    const poll = () => {
      if (window.__game) {
        startUpgradeLoop();
      } else {
        requestAnimationFrame(poll);
      }
    };
    poll();
  }
})();
