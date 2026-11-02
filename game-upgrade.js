(function () {
  const weaponNames = ['Shield Saw', 'Flail', 'Skullcrusher', 'Rail Spike'];

  function waitForGame() {
    const game = window.__game;
    if (!game || !game.P || !game.enemies || !game.keys) {
      setTimeout(waitForGame, 150);
      return;
    }

    const P = game.P;
    const keys = game.keys;
    const menuTitle = document.querySelector('#start h1');
    const menuText = document.querySelector('#start p');

    if (menuTitle) menuTitle.textContent = 'Pekelný protokol: Brutal Upgrade';
    if (menuText) {
      menuText.textContent = 'Vyraž si cestu cez bránu pevnosti, útoky v bezhlavom tempe a prichádzajúcim chaosom. Prvé vyrazenie je brutálne a agresívne – iba ten, kto sa neustále pohybuje, môže prežiť v krvi a ohni.';
    }

    P.ammo = [30, 90, 12, 40];
    P.wep = 0;

    function setWeapon(index) {
      const safeIndex = ((index % weaponNames.length) + weaponNames.length) % weaponNames.length;
      P.wep = safeIndex;

      const weaponLabel = document.getElementById('wname');
      const ammoLabel = document.getElementById('ammo');
      if (weaponLabel) weaponLabel.textContent = weaponNames[safeIndex];
      if (ammoLabel) {
        ammoLabel.textContent = String(P.ammo[safeIndex] ?? 0);
        ammoLabel.className = 'num ' + ((safeIndex === 1 || safeIndex === 3) ? 'cyan' : 'amber');
      }

      if (P.gun0) P.gun0.visible = safeIndex === 0;
      if (P.gun1) P.gun1.visible = safeIndex === 1 || safeIndex === 3;
    }

    document.addEventListener('keydown', function (event) {
      if (event.code === 'Digit1') setWeapon(0);
      if (event.code === 'Digit2') setWeapon(1);
      if (event.code === 'Digit3') setWeapon(2);
      if (event.code === 'Digit4') setWeapon(3);
      if (event.code === 'KeyQ') setWeapon(P.wep + 1);
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        keys[event.code] = true;
      }
    });

    function refreshHud() {
      const weaponLabel = document.getElementById('wname');
      const ammoLabel = document.getElementById('ammo');
      if (weaponLabel) weaponLabel.textContent = weaponNames[P.wep];
      if (ammoLabel) {
        ammoLabel.textContent = String(P.ammo[P.wep] ?? 0);
        ammoLabel.className = 'num ' + ((P.wep === 1 || P.wep === 3) ? 'cyan' : 'amber');
      }

      if (P.hp < 25) {
        const hpn = document.getElementById('hpn');
        if (hpn) hpn.style.color = '#fca5a5';
      }
    }

    function gloryKillEnemy(enemy) {
      if (!enemy || enemy.dead || !enemy.stagger || enemy.stagger <= 0) return;
      if (!P || P.state === 'dead') return;

      const dmg = Math.abs(P.x - enemy.x);
      const hgt = Math.abs(P.y - enemy.y);
      if (dmg > 54 || hgt > 60) return;

      enemy.dead = true;
      enemy.c.visible = false;
      if (enemy.c && enemy.c.destroy) enemy.c.destroy({ children: true });

      const scoreEl = document.getElementById('score');
      const currentScore = Number((scoreEl?.textContent || '0').replace(/[^\d]/g, '')) || 0;
      scoreEl.textContent = (currentScore + 400).toLocaleString('sk');
      P.hp = Math.min(100, P.hp + 25);
      const healthBar = document.getElementById('hpb');
      if (healthBar) healthBar.style.width = String(Math.max(0, P.hp)) + '%';
      const hpNumber = document.getElementById('hpn');
      if (hpNumber) hpNumber.textContent = String(Math.ceil(P.hp));

      const msg = document.getElementById('msg');
      if (msg) {
        msg.textContent = 'Glory kill';
        msg.style.opacity = '1';
      }
    }

    function staggerEnemies() {
      const list = game.enemies || [];
      if (!Array.isArray(list)) return;

      for (const enemy of list) {
        if (!enemy || enemy.dead) continue;
        enemy.maxHp ??= enemy.hp;
        enemy.stagger ??= 0;

        if (enemy.hp <= enemy.maxHp * 0.12 && enemy.stagger <= 0) {
          enemy.stagger = 3;
          enemy.flash = 1;
        }

        if (enemy.stagger > 0) {
          enemy.stagger = Math.max(0, enemy.stagger - 0.016);
          if (enemy.c) {
            enemy.c.tint = 0xfff0a6;
            enemy.c.alpha = 0.55 + Math.sin(performance.now() * 0.035) * 0.45;
          }
        } else if (enemy.c) {
          enemy.c.tint = 0xffffff;
          enemy.c.alpha = 1;
        }

        if (P.dashT > 0 && enemy.stagger > 0) {
          gloryKillEnemy(enemy);
        }
      }
    }

    function upgradeLoop() {
      refreshHud();
      staggerEnemies();
      requestAnimationFrame(upgradeLoop);
    }

    setWeapon(0);
    requestAnimationFrame(upgradeLoop);
  }

  waitForGame();
})();
