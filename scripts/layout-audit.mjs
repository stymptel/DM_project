/** Layout regression audit for the game screen. */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(projectRoot, 'scripts', 'out');
mkdirSync(outDir, { recursive: true });
const port = 4176;
const server = spawn('npm', ['run', 'preview', '--', '--port', String(port)], { cwd: projectRoot, stdio: 'ignore' });
const browser = await chromium.launch();
const viewports = [
  { name: '1917x927', width: 1917, height: 927 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1100x800', width: 1100, height: 800 },
  { name: '800x900', width: 800, height: 900 },
  { name: '390x844', width: 390, height: 844 },
];

function overlap(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

async function startGame(page, difficulty = 'Beginner') {
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });
      break;
    } catch (error) {
      if (attempt === 19) throw error;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  await page.getByRole('button', { name: /Play/ }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: new RegExp(difficulty) }).click();
  await page.waitForSelector('.game-screen');
  await page.waitForTimeout(400);
}

async function readLayout(page) {
  return page.evaluate(() => {
    const selectors = ['.game-screen', '.game-hud', '.game-main', '.game-play-area', '.tool-palette', '.board', '.game-feedback', '.game-side-panel--guide', '.game-side-panel--clues'];
    const get = selector => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      return box && { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
    };
    return {
      rects: Object.fromEntries(selectors.map(selector => [selector, get(selector)])),
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      transform: getComputedStyle(document.querySelector('.game-screen')).transform,
      mascotPosition: getComputedStyle(document.querySelector('.mascot-avatar')).position,
    };
  });
}

let failed = false;
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    await context.addInitScript(() => {
      localStorage.setItem('lm_tutorialDone', 'true');
      localStorage.setItem('lm_unlocked', JSON.stringify(['beginner', 'intermediate', 'advanced', 'expert']));
    });
    const page = await context.newPage();
    await startGame(page);
    const layout = await readLayout(page);
    const r = layout.rects;
    const items = ['.tool-palette', '.board', '.game-feedback', '.game-side-panel--guide', '.game-side-panel--clues'];

    if (Math.abs(r['.game-screen'].left) > 2 || Math.abs(r['.game-screen'].top) > 2 || Math.abs(r['.game-screen'].width - viewport.width) > 2 || Math.abs(r['.game-screen'].height - viewport.height) > 2) {
      console.error(`[${viewport.name}] game root does not fill viewport`, r['.game-screen']); failed = true;
    }
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      if (overlap(r[items[i]], r[items[j]])) { console.error(`[${viewport.name}] overlap: ${items[i]} / ${items[j]}`); failed = true; }
    }
    if (r['.board'].left < r['.game-play-area'].left - 1 || r['.board'].right > r['.game-play-area'].right + 1 || r['.board'].top < r['.game-play-area'].top - 1 || r['.board'].bottom > r['.game-play-area'].bottom + 1) {
      console.error(`[${viewport.name}] board outside play area`); failed = true;
    }
    if (layout.scrollWidth > viewport.width + 1 || (viewport.width >= 1366 && layout.scrollHeight > viewport.height + 1)) {
      console.error(`[${viewport.name}] unexpected page scroll`, layout.scrollWidth, layout.scrollHeight); failed = true;
    }
    if (layout.transform !== 'none' || layout.mascotPosition === 'fixed') {
      console.error(`[${viewport.name}] transition or mascot positioning not settled`); failed = true;
    }
    if (viewport.width >= 1100) {
      if (Math.abs(r['.game-side-panel--clues'].right - (viewport.width - 24)) > 2 || Math.abs(r['.game-side-panel--guide'].right - (r['.game-side-panel--clues'].left - 16)) > 2 || r['.board'].right > r['.game-side-panel--guide'].left - 12 || r['.board'].width < 320) {
        console.error(`[${viewport.name}] right-pinned panels or board sizing failed`); failed = true;
      }
    }
    await page.screenshot({ path: resolve(outDir, `layout-${viewport.name}.png`), fullPage: true });
    await context.close();
  }

  const largeContext = await browser.newContext({ viewport: { width: 1917, height: 927 } });
  await largeContext.addInitScript(() => {
    localStorage.setItem('lm_tutorialDone', 'true');
    localStorage.setItem('lm_unlocked', JSON.stringify(['beginner', 'intermediate', 'advanced', 'expert']));
  });
  for (const difficulty of ['Intermediate', 'Advanced']) {
    const page = await largeContext.newPage();
    await startGame(page, difficulty);
    const layout = await readLayout(page);
    if (layout.rects['.board'].right > layout.rects['.game-play-area'].right + 1) {
      console.error(`[${difficulty}] board outside play area`); failed = true;
    }
    await page.close();
  }
  await largeContext.close();
} finally {
  await browser.close();
  server.kill();
}

if (failed) {
  console.error('Layout audit failed');
  process.exit(1);
}
console.log('Layout audit passed');
