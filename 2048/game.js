'use strict';

// ============================================================
//  Mode + content definitions
// ============================================================

const FRUITS = [
  '🍒', // 1  cherry
  '🍓', // 2  strawberry
  '🍇', // 3  grape
  '🍊', // 4  orange (dekopon-ish)
  '🥭', // 5  mango
  '🍎', // 6  apple
  '🍐', // 7  pear
  '🍑', // 8  peach
  '🍍', // 9  pineapple
  '🍈', // 10 melon
  '🍉', // 11 watermelon  (4×4 win)
  '🥝', // 12 kiwi
  '🥥', // 13 coconut
  '🥑', // 14 avocado
  '🍋', // 15 lemon
  '🫐', // 16 blueberry   (5×5 win)
];

const RAMPS = {
  sunset:  { name: 'Sunset',    stops: [[48,95,72],[28,98,58],[3,90,46],[330,70,32],[285,55,25]] },
  ocean:   { name: 'Ocean',     stops: [[180,75,76],[195,82,58],[218,88,42],[238,82,26],[255,70,18]] },
  forest:  { name: 'Forest',    stops: [[70,72,55],[100,68,42],[135,72,30],[155,80,20],[170,85,10]] },
  mono:    { name: 'Mono',      stops: [[0,0,93],[0,0,70],[0,0,46],[0,0,24],[0,0,8]] },
  candy:   { name: 'Candy',     stops: [[330,92,82],[310,82,68],[280,75,56],[245,72,46],[210,80,38]] },
  ember:   { name: 'Ember',     stops: [[44,95,60],[28,100,50],[12,100,42],[355,92,32],[330,80,20]] },
  meadow:  { name: 'Meadow',    stops: [[85,72,55],[55,80,46],[35,82,38],[15,82,30],[0,78,20]] },
};

const MODES = {
  // Traditional 2048: numeric tiles, win at 2048, merges continue past it.
  number: {
    name: 'Number',
    winLevel: (size) => size === 4 ? 11 : 13,   // 2048 or 8192
    maxLevel: (size) => size === 4 ? 17 : 25,   // theoretical-ish caps
    render:   (level) => formatNumber(level),
    style:    (level) => numberStyle(level),
    cls:      'number',
  },
  alphabet: {
    name: 'Alphabet',
    // 4×4: L (12 levels, 11 merges — matches 2048 = 2^11)
    // 5×5: S (19 levels, 18 merges — further penetrates the alphabet)
    winLevel: (size) => size === 4 ? 12 : 19,
    maxLevel: (size) => 26,                      // can keep going to Z
    render:   (level) => String.fromCharCode(64 + Math.min(level, 26)),
    style:    (level, max) => alphaStyle(level, max),
    cls:      'alphabet',
  },
  fruit: {
    name: 'Fruit',
    winLevel: (size) => size === 4 ? 11 : 16,
    maxLevel: (size) => size === 4 ? 11 : 16,    // hard cap = available emojis
    render:   (level) => FRUITS[level - 1] || '?',
    style:    () => ({ background: '#fff', color: '#1a1d24' }),
    cls:      'fruit',
  },
  chroma: {
    name: 'Chroma',
    winLevel: (size) => size === 4 ? 16 : 22,
    maxLevel: (size) => size === 4 ? 16 : 22,
    render:   () => '',
    style:    (level, max, ramp) => ({ background: rampColor(level, max, ramp), color: 'transparent' }),
    cls:      'chroma',
  },
};

function formatNumber(level) {
  const n = Math.pow(2, level);
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
  return String(n);
}

const NUMBER_PALETTE = [
  ['#eee4da', '#776e65'],  // 1: 2
  ['#ede0c8', '#776e65'],  // 2: 4
  ['#f2b179', '#f9f6f2'],  // 3: 8
  ['#f59563', '#f9f6f2'],  // 4: 16
  ['#f67c5f', '#f9f6f2'],  // 5: 32
  ['#f65e3b', '#f9f6f2'],  // 6: 64
  ['#edcf72', '#f9f6f2'],  // 7: 128
  ['#edcc61', '#f9f6f2'],  // 8: 256
  ['#edc850', '#f9f6f2'],  // 9: 512
  ['#edc53f', '#f9f6f2'],  // 10: 1024
  ['#edc22e', '#f9f6f2'],  // 11: 2048 (4×4 win)
  ['#3c3a32', '#f9f6f2'],  // 12: 4096
  ['#2d3a52', '#f9f6f2'],  // 13: 8192 (5×5 win)
  ['#1f4f6e', '#f9f6f2'],  // 14: 16384
  ['#0e6e88', '#f9f6f2'],  // 15: 32768
  ['#0a8a9c', '#f9f6f2'],  // 16: 65536
  ['#08a3a8', '#f9f6f2'],  // 17+
];
function numberStyle(level) {
  const idx = Math.min(level, NUMBER_PALETTE.length) - 1;
  const [bg, color] = NUMBER_PALETTE[idx];
  return { background: bg, color: color };
}

function alphaStyle(level, max) {
  const t = (level - 1) / Math.max(1, max - 1);
  const h = 32 + t * 285;          // warm orange → violet
  const s = 55 + t * 25;
  const l = 80 - t * 52;
  const textL = l < 50 ? 95 : 22;
  return {
    background: `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`,
    color:      `hsl(${h.toFixed(1)}, 25%, ${textL}%)`,
  };
}

function lerpHue(a, b, t) {
  let d = b - a;
  if (d > 180) d -= 360;
  else if (d < -180) d += 360;
  return (a + d * t + 360) % 360;
}

function rampColor(level, max, rampKey) {
  const stops = (RAMPS[rampKey] || RAMPS.sunset).stops;
  const t = (level - 1) / Math.max(1, max - 1);
  const segs = stops.length - 1;
  const seg = Math.min(Math.floor(t * segs), segs - 1);
  const localT = (t * segs) - seg;
  const a = stops[seg], b = stops[seg + 1];
  const h = lerpHue(a[0], b[0], localT);
  const s = a[1] + (b[1] - a[1]) * localT;
  const l = a[2] + (b[2] - a[2]) * localT;
  return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`;
}

function rampGradientCSS(rampKey) {
  const stops = (RAMPS[rampKey] || RAMPS.sunset).stops;
  const parts = stops.map((s, i) => {
    const pct = (i / (stops.length - 1)) * 100;
    return `hsl(${s[0]}, ${s[1]}%, ${s[2]}%) ${pct}%`;
  });
  return `linear-gradient(90deg, ${parts.join(', ')})`;
}

// ============================================================
//  Persistence
// ============================================================

const STORAGE_KEY = '2048_mm_v1';

function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveStore(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

const store = Object.assign({
  bests:        {}, // key = `${mode}_${size}` → number
  unlocked5x5:  false,
  lastMode:     'number',
  lastSize:     4,
  lastRamp:     'sunset',
}, loadStore());

function persist() { saveStore(store); }

// ============================================================
//  Game
// ============================================================

class Game {
  constructor() {
    this.boardEl   = document.getElementById('board');
    this.cellsEl   = document.getElementById('cells');
    this.tilesEl   = document.getElementById('tiles');
    this.scoreEl   = document.getElementById('score');
    this.bestEl    = document.getElementById('best');
    this.overlay   = document.getElementById('overlay');
    this.overlayTitle = document.getElementById('overlayTitle');
    this.overlaySub   = document.getElementById('overlaySub');

    this.mode = store.lastMode;
    this.size = store.lastSize === 5 && store.unlocked5x5 ? 5 : 4;
    this.ramp = store.lastRamp;

    this.score = 0;
    this.tiles = [];
    this.grid  = [];
    this.nextId = 1;
    this.moving = false;
    this.won = false;
    this.over = false;
  }

  // --- setup ---------------------------------------------------

  reset() {
    this.score = 0;
    this.tiles = [];
    this.won = false;
    this.over = false;
    this.moving = false;
    this.boardEl.dataset.size = this.size;
    this.boardEl.style.setProperty('--grid-size', this.size);
    this.cellsEl.innerHTML = '';
    this.tilesEl.innerHTML = '';
    for (let i = 0; i < this.size * this.size; i++) {
      const c = document.createElement('div');
      c.className = 'cell';
      this.cellsEl.appendChild(c);
    }
    this.grid = Array.from({length: this.size}, () => Array(this.size).fill(null));

    // measure cell size + gap once per reset (in px)
    const cs = getComputedStyle(this.boardEl);
    this.cellSize = parseFloat(cs.getPropertyValue('--cell-size'));
    this.gap      = parseFloat(cs.getPropertyValue('--gap'));

    this.spawn();
    this.spawn();
    this.hideOverlay();
    this.updateScore();
  }

  setMode(mode) {
    this.mode = mode;
    store.lastMode = mode;
    persist();
    this.reset();
  }

  setSize(size) {
    if (size === 5 && !store.unlocked5x5) return;
    this.size = size;
    store.lastSize = size;
    persist();
    this.reset();
  }

  setRamp(ramp) {
    this.ramp = ramp;
    store.lastRamp = ramp;
    persist();
    if (this.mode === 'chroma') {
      // restyle every existing tile in place
      for (const t of this.tiles) this.applyTileStyle(t);
    }
  }

  // --- tiles ---------------------------------------------------

  spawn() {
    const empties = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.grid[r][c]) empties.push([r, c]);
      }
    }
    if (!empties.length) return null;
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    const level = Math.random() < 0.9 ? 1 : 2;
    const tile = { id: this.nextId++, level, row: r, col: c, el: null, inner: null };
    this.grid[r][c] = tile;
    this.tiles.push(tile);
    this.createTileEl(tile, /* isSpawn */ true);
    return tile;
  }

  createTileEl(tile, isSpawn) {
    const el = document.createElement('div');
    el.className = 'tile';
    el.dataset.id = tile.id;
    el.style.transform = this.translateFor(tile.row, tile.col);

    const inner = document.createElement('div');
    inner.className = 'tile-inner ' + MODES[this.mode].cls;
    el.appendChild(inner);

    tile.el = el;
    tile.inner = inner;
    this.applyTileStyle(tile);
    this.tilesEl.appendChild(el);

    if (isSpawn) {
      inner.classList.add('spawn');
      inner.addEventListener('animationend', () => inner.classList.remove('spawn'), { once: true });
    }
  }

  applyTileStyle(tile) {
    const max = MODES[this.mode].maxLevel(this.size);
    const style = MODES[this.mode].style(tile.level, max, this.ramp);
    tile.inner.style.background = style.background;
    tile.inner.style.color      = style.color;
    const text = MODES[this.mode].render(tile.level);
    tile.inner.textContent = text;
    if (this.mode === 'number') {
      tile.inner.dataset.len = String(text.length);
    } else if (tile.inner.dataset.len) {
      delete tile.inner.dataset.len;
    }
  }

  translateFor(row, col) {
    const x = col * (this.cellSize + this.gap);
    const y = row * (this.cellSize + this.gap);
    return `translate(${x}px, ${y}px)`;
  }

  // --- movement ------------------------------------------------

  move(direction) {
    if (this.moving || this.over) return;
    const N = this.size;
    const max = MODES[this.mode].maxLevel(this.size);  // hard merge cap

    // Build traversal: lines, ordered front→back (front = where tiles slide TO)
    const lines = [];
    if (direction === 'left' || direction === 'right') {
      for (let r = 0; r < N; r++) {
        const cells = [];
        for (let c = 0; c < N; c++) cells.push([r, c]);
        if (direction === 'right') cells.reverse();
        lines.push(cells);
      }
    } else {
      for (let c = 0; c < N; c++) {
        const cells = [];
        for (let r = 0; r < N; r++) cells.push([r, c]);
        if (direction === 'down') cells.reverse();
        lines.push(cells);
      }
    }

    const newGrid = Array.from({length: N}, () => Array(N).fill(null));
    const merges = [];      // {from, into}
    const moves = [];       // {tile, oldR, oldC, newR, newC}
    let scoreGain = 0;
    let anyMoved = false;

    for (const line of lines) {
      let writeIdx = 0;
      let lastTile = null;
      let lastWasMerge = false;

      for (const [r, c] of line) {
        const tile = this.grid[r][c];
        if (!tile) continue;

        if (lastTile && !lastWasMerge && lastTile.level === tile.level && lastTile.level < max) {
          // merge `tile` into `lastTile`
          const [tr, tc] = line[writeIdx - 1];
          merges.push({ from: tile, into: lastTile });
          moves.push({ tile, oldR: r, oldC: c, newR: tr, newC: tc });
          if (r !== tr || c !== tc) anyMoved = true;
          scoreGain += scoreFor(lastTile.level + 1);
          lastWasMerge = true;
        } else {
          const [tr, tc] = line[writeIdx];
          newGrid[tr][tc] = tile;
          moves.push({ tile, oldR: r, oldC: c, newR: tr, newC: tc });
          if (r !== tr || c !== tc) anyMoved = true;
          lastTile = tile;
          lastWasMerge = false;
          writeIdx++;
        }
      }
    }

    if (!anyMoved) return;

    this.grid = newGrid;
    this.score += scoreGain;
    this.updateScore();
    this.moving = true;

    // Apply slide animations
    let maxDur = 0;
    for (const m of moves) {
      const dist = Math.abs(m.newR - m.oldR) + Math.abs(m.newC - m.oldC);
      // gravity feel: time scales with sqrt(distance), all start at once
      const dur = dist === 0 ? 0 : 110 + Math.sqrt(dist) * 90;
      if (dur > maxDur) maxDur = dur;
      m.tile.row = m.newR;
      m.tile.col = m.newC;
      m.tile.el.style.setProperty('--move-ms', `${dur}ms`);
      m.tile.el.style.transform = this.translateFor(m.newR, m.newC);
    }

    setTimeout(() => this.finishMove(merges, max), maxDur + 12);
  }

  finishMove(merges, max) {
    // Process merges
    for (const merge of merges) {
      // remove from-tile DOM
      if (merge.from.el && merge.from.el.parentNode) merge.from.el.parentNode.removeChild(merge.from.el);
      this.tiles = this.tiles.filter(t => t !== merge.from);
      // level up into-tile and pop
      merge.into.level += 1;
      this.applyTileStyle(merge.into);
      // restart merge animation
      merge.into.inner.classList.remove('merge');
      void merge.into.inner.offsetWidth;
      merge.into.inner.classList.add('merge');
      merge.into.inner.addEventListener('animationend',
        () => merge.into.inner.classList.remove('merge'), { once: true });
    }

    this.spawn();

    // best score
    const k = `${this.mode}_${this.size}`;
    if (!store.bests[k] || this.score > store.bests[k]) {
      store.bests[k] = this.score;
      persist();
      this.updateScore();
    }

    // win check (uses winLevel — tiles can keep merging past it up to maxLevel)
    const winLv = MODES[this.mode].winLevel(this.size);
    if (!this.won && this.tiles.some(t => t.level >= winLv)) {
      this.won = true;
      const wasLocked = !store.unlocked5x5;
      if (this.size === 4 && !store.unlocked5x5) {
        store.unlocked5x5 = true;
        persist();
        ui.refreshUnlock();
      }
      this.showWin(wasLocked);
    } else if (this.isGameOver()) {
      this.over = true;
      this.showLose();
    }

    this.moving = false;
  }

  isGameOver() {
    const N = this.size;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!this.grid[r][c]) return false;
        const lv = this.grid[r][c].level;
        if (c + 1 < N && this.grid[r][c+1] && this.grid[r][c+1].level === lv) return false;
        if (r + 1 < N && this.grid[r+1][c] && this.grid[r+1][c].level === lv) return false;
      }
    }
    return true;
  }

  // --- ui hooks ------------------------------------------------

  updateScore() {
    this.scoreEl.textContent = this.score;
    const best = store.bests[`${this.mode}_${this.size}`] || 0;
    this.bestEl.textContent = Math.max(best, this.score);
  }

  showWin(unlocked) {
    const winLv = MODES[this.mode].winLevel(this.size);
    const unlockMsg = unlocked ? ' 5 × 5 grid unlocked.' : '';
    const keepGoingMsg = ' Keep playing for more.';
    let title, sub;
    if (this.mode === 'number') {
      title = `${MODES.number.render(winLv)}!`;
      sub = `${unlocked ? '5 × 5 grid unlocked.' : 'You hit the milestone.'}${keepGoingMsg}`;
    } else if (this.mode === 'alphabet') {
      title = `${MODES.alphabet.render(winLv)}!`;
      sub = `Highest letter reached.${unlockMsg}${keepGoingMsg}`;
    } else if (this.mode === 'fruit') {
      title = `${FRUITS[winLv - 1]} You win!`;
      sub = `Highest fruit reached.${unlockMsg}`;
    } else {
      title = 'You win!';
      sub = `Reached the deepest color.${unlockMsg}`;
    }
    this.openOverlay(title, sub);
  }

  showLose() {
    this.openOverlay('No more moves', `Final score: ${this.score}`);
  }

  openOverlay(title, sub) {
    this.overlayTitle.textContent = title;
    this.overlaySub.textContent = sub;
    this.overlay.hidden = false;
  }
  hideOverlay() { this.overlay.hidden = true; }
}

function scoreFor(level) {
  // classic scoring: merged tile awards its value (2^level)
  return Math.pow(2, level);
}

// ============================================================
//  Input
// ============================================================

function bindInput(game) {
  const keyMap = {
    ArrowLeft: 'left',  ArrowRight: 'right', ArrowUp: 'up',   ArrowDown: 'down',
    a: 'left', d: 'right', w: 'up', s: 'down',
    h: 'left', l: 'right', k: 'up', j: 'down',
  };
  window.addEventListener('keydown', e => {
    const dir = keyMap[e.key];
    if (!dir) return;
    e.preventDefault();
    game.move(dir);
  });

  // touch swipe
  let sx = 0, sy = 0, active = false;
  const board = document.getElementById('board');
  board.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; active = true;
  }, { passive: true });
  board.addEventListener('touchend', e => {
    if (!active) return;
    active = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (Math.max(ax, ay) < 24) return;
    if (ax > ay) game.move(dx > 0 ? 'right' : 'left');
    else         game.move(dy > 0 ? 'down' : 'up');
  }, { passive: true });
}

// ============================================================
//  UI wiring
// ============================================================

const ui = {
  game: null,

  init(game) {
    this.game = game;

    // mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        game.setMode(mode);
        document.getElementById('chromaPanel').hidden = (mode !== 'chroma');
      });
      if (btn.dataset.mode === game.mode) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    document.getElementById('chromaPanel').hidden = (game.mode !== 'chroma');

    // size buttons
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const size = parseInt(btn.dataset.size);
        if (size === 5 && !store.unlocked5x5) return;
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        game.setSize(size);
      });
    });
    document.querySelectorAll('.size-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.size) === game.size);
    });

    // ramp picker
    const rampList = document.getElementById('rampList');
    rampList.innerHTML = '';
    for (const [key, def] of Object.entries(RAMPS)) {
      const b = document.createElement('button');
      b.className = 'ramp-btn' + (key === game.ramp ? ' active' : '');
      b.dataset.ramp = key;
      const sw = document.createElement('span');
      sw.className = 'ramp-preview';
      sw.style.background = rampGradientCSS(key);
      const lbl = document.createElement('span');
      lbl.textContent = def.name;
      b.appendChild(sw); b.appendChild(lbl);
      b.addEventListener('click', () => {
        rampList.querySelectorAll('.ramp-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        game.setRamp(key);
      });
      rampList.appendChild(b);
    }

    // new game
    document.getElementById('newGame').addEventListener('click', () => game.reset());

    // overlay buttons
    document.getElementById('overlayContinue').addEventListener('click', () => game.hideOverlay());
    document.getElementById('overlayRestart').addEventListener('click', () => game.reset());

    this.refreshUnlock();
  },

  refreshUnlock() {
    const btn = document.getElementById('size5Btn');
    const hint = document.getElementById('unlockHint');
    if (store.unlocked5x5) {
      btn.classList.remove('locked');
      const lock = btn.querySelector('.lock');
      if (lock) lock.remove();
      hint.textContent = '5 × 5 unlocked. Reach the highest tile to master it.';
    } else {
      hint.textContent = 'Win once on 4 × 4 to unlock 5 × 5.';
    }
  },
};

// ============================================================
//  Bootstrap
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  ui.init(game);
  game.reset();
  bindInput(game);
});
