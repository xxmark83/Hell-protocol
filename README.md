# Pekelný protokol

2D akčná hra do prehliadača v duchu Doomu. Vykresľuje ju PixiJS 8 na grafickej karte, na PC cez WebGPU a na mobile cez WebGL.

## Spustenie

Hra je statická stránka bez buildu. Stačí ju servírovať ako súbory:

```
python3 -m http.server 8000
```

a otvoriť `http://localhost:8000`.

## Nasadenie na Vercel

Importuj repo vo Vercel ako nový projekt, Framework Preset nechaj na „Other“, build príkaz prázdny a výstupný priečinok koreň repa.

## Súbory

- `index.html` – celá hra (level, postavy, efekty, boss, HUD, ovládanie)
- `pixi.min.js` – PixiJS 8.22
- `pixi-filters.js` – pixi-filters 6.1 (bloom)

## Ovládanie

- Pohyb: A a D alebo šípky
- Skok a dvojitý skok: W alebo medzerník
- Úskok: Shift
- Mierenie a streľba: myš, drž ľavé tlačidlo
- Zmena zbrane: 1, 2 alebo Q
- Na mobile: tlačidlá na obrazovke, mieri sa automaticky

© 2026 Marek Baláž
