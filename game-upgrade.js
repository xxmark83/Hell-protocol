(() => {
  const vfxState = {
    bloodBursts: [],
    decalPool: [],
    goreTimer: 0
  };

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
