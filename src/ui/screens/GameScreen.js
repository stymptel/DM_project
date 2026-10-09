/** @file GameScreen.js — the main game screen, wires everything together */

import { h } from '../../utils/dom.js';
import { BoardView } from '../components/BoardView.js';
import { ClueList } from '../components/ClueList.js';
import { HeartsBar } from '../components/HeartsBar.js';
import { Timer } from '../components/Timer.js';
import { ToolPalette } from '../components/ToolPalette.js';
import { HintPanel } from '../components/HintPanel.js';
import { Mascot } from '../components/Mascot.js';
import { GameController } from '../../core/GameController.js';
import { ClueEngine } from '../../core/ClueEngine.js';
import { Sound } from '../../audio/Sound.js';
import { announce } from '../../utils/a11y.js';
import { shake } from '../effects/Shake.js';
import { DIFFICULTIES } from '../../config/difficulties.js';
import { SymbolGuide } from '../components/SymbolGuide.js';

/**
 * @param {{ board, clues, difficultyId, mode, onWin, onLose, onBack }} opts
 * @returns {HTMLElement}
 */
export function GameScreen({ board, clues, difficultyId, mode, onWin, onLose, onBack }) {
  const diffConfig = DIFFICULTIES[difficultyId];
  const controller = new GameController({
    board, clues,
    difficulty: diffConfig,
    mode,
    onEvent: handleEvent,
  });

  const engine = new ClueEngine(clues);

  // Components
  const heartBar = HeartsBar(diffConfig.hearts, diffConfig.hearts);
  const timer = Timer();
  const mascot = Mascot();
  const hintPanel = HintPanel();
  const palette = ToolPalette();

  const boardView = BoardView(board, (cell) => {
      if (cell.locked) return;
      const tool = palette.activeTool();
      if (tool === 'clear') { controller.clear(cell.id); return; }
      controller.declare(cell.id, tool === 'mine' ? 0 : 1);
  });

  const clueList = ClueList(clues, (cellIds) => {
    boardView.highlight(cellIds);
  });
  const symbolGuide = SymbolGuide(clues);

  const hintBtn = h('button', {
    class: 'btn btn-secondary',
    style: 'font-size:0.85rem;',
    onClick: () => {
      Sound.hint();
      const { used, hint, reason } = controller.requestHint();
      if (!used) {
        hintPanel.showHint(reason);
        mascot.react('thinking');
      } else {
        hintPanel.showHint(hint.explanation);
        boardView.highlight([hint.cellId]);
      }
    },
  }, `💡 Hint (${diffConfig.hintLimit - controller.hintsUsed} left)`);

  // Progress bar
  const totalCells = board.cells.length;
  const progressFill = h('div', { class: 'progress-fill', style: 'width:0%' });
  const progressBar = h('div', { class: 'progress-bar', style: 'flex:1;' }, progressFill);
  const progressLabel = h('span', { style: 'font-size:0.8rem;color:var(--clr-text-dim);' }, `0 / ${totalCells} cells solved`);

  function updateProgress() {
    const solved = board.cells.filter((c) => c.locked).length;
    const pct = Math.round((solved / totalCells) * 100);
    progressFill.style.width = `${pct}%`;
    progressLabel.textContent = `${solved} / ${totalCells} cells solved`;
  }

  // HUD
  const hud = h('div', { class: 'game-hud' },
    heartBar.el,
    h('div', { style: 'display:flex;align-items:center;gap:16px;' }, progressBar, progressLabel),
    timer.el,
    h('div', { style: 'display:flex;gap:8px;align-items:center;' },
      hintBtn,
      h('button', { class: 'btn btn-ghost', style: 'font-size:0.85rem;', onClick: onBack }, '✕'),
    ),
  );

  const guidePanel = h('div', { class: 'game-side-panel game-side-panel--guide' }, symbolGuide);
  const cluesPanel = h('div', { class: 'game-side-panel game-side-panel--clues' }, clueList.el);
  const guideTab = h('button', { class: 'game-tab active', role: 'tab', 'aria-selected': 'true' }, 'Guide');
  const cluesTab = h('button', { class: 'game-tab', role: 'tab', 'aria-selected': 'false' }, 'Clues');
  guideTab.addEventListener('click', () => setMobileTab('guide'));
  cluesTab.addEventListener('click', () => setMobileTab('clues'));

  function setMobileTab(tab) {
    const showGuide = tab === 'guide';
    guideTab.classList.toggle('active', showGuide);
    cluesTab.classList.toggle('active', !showGuide);
    guideTab.setAttribute('aria-selected', showGuide ? 'true' : 'false');
    cluesTab.setAttribute('aria-selected', showGuide ? 'false' : 'true');
    guidePanel.classList.toggle('mobile-hidden', !showGuide);
    cluesPanel.classList.toggle('mobile-hidden', showGuide);
  }

  const el = h('div', { class: 'screen game-screen', id: 'screen-game' },
    hud,
    h('div', { class: 'game-main' },
      h('div', { class: 'game-play-area' },
        palette.el,
        h('div', { class: 'board-wrap' }, boardView.el),
        h('div', { class: 'game-feedback' }, mascot.el, hintPanel.el),
      ),
      h('div', { class: 'game-tabs', role: 'tablist', 'aria-label': 'Game reference panels' }, guideTab, cluesTab),
      h('div', { class: 'game-side-panels' },
        guidePanel,
        cluesPanel,
      ),
    ),
  );
  setMobileTab('guide');

  // ── Event handler ──────────────────────────────────────────────────────────
  function handleEvent(evt) {
    switch (evt.type) {
      case 'tick':
        timer.setTime(evt.elapsed);
        break;

      case 'correct': {
        boardView.update(board.byId.get(evt.cellId));
        updateProgress();
        Sound.correct();
        mascot.react('happy');
        announce(`Cell ${evt.cellId} confirmed. Correct!`);

        // Update clue states
        const results = engine.evaluateAll(controller.known);
        clueList.updateStates(results);

        // Update hint button remaining count
        hintBtn.textContent = `💡 Hint (${diffConfig.hintLimit - controller.hintsUsed} left)`;
        break;
      }

      case 'wrong': {
        Sound.wrong();
        mascot.react('oops');
        heartBar.setHearts(evt.hearts);
        hintPanel.showHint(evt.explanation, 7000, 'Oops');
        const cellEl = boardView.cellEls.get(evt.cellId);
        if (cellEl) shake(cellEl);
        announce(`Wrong! ${evt.explanation}`);
        break;
      }

      case 'hint':
        hintPanel.showHint(evt.explanation);
        hintBtn.textContent = `💡 Hint (${diffConfig.hintLimit - controller.hintsUsed} left)`;
        break;

      case 'won':
        Sound.win();
        onWin({ elapsed: evt.elapsed, stars: evt.stars, mistakes: evt.mistakes, hintsUsed: evt.hintsUsed, journal: controller.journal });
        break;

      case 'lost':
        onLose({ board, clues });
        break;
    }
  }

  mascot.react('idle');
  return el;
}
