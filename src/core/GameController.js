/** @file GameController.js — state machine: idle→generating→playing→won|lost|abandoned */

import { ClueEngine } from './ClueEngine.js';
import { findHint } from './HintEngine.js';
import { explainViolation } from './Explainer.js';
import { store } from '../state/store.js';
import { HINT_LIMIT_CLASSIC } from '../config/constants.js';
import { isMine, toState } from './values.js';

/**
 * @typedef {'idle'|'generating'|'playing'|'paused'|'won'|'lost'|'abandoned'} GameState
 * @typedef {'classic'|'practice'|'timed'} GameMode
 */

export class GameController {
  /**
   * @param {{ board, clues, difficulty, mode: GameMode, onEvent: Function }} opts
   */
  constructor({ board, clues, difficulty, mode = 'classic', onEvent = () => {} }) {
    this.board = board;
    this.clues = clues;
    this.difficulty = difficulty;
    this.mode = mode;
    this.onEvent = onEvent;

    this.engine = new ClueEngine(clues);

    /** @type {Map<string, 0|1>} confirmed cell values */
    this.known = new Map();

    this.maxHearts = difficulty.hearts ?? 3;
    this.hearts = this.maxHearts;
    this.hintsUsed = 0;
    this.hintLimit = mode === 'practice' ? Infinity : (difficulty.hintLimit ?? HINT_LIMIT_CLASSIC);
    this.mistakes = 0;

    /** @type {GameState} */
    this.state = 'playing';

    this.startTime = Date.now();
    this.elapsed = 0; // seconds
    this._timerInterval = null;
    this._startTimer();

    // Deduction journal for result screen
    this.journal = [];
  }

  _startTimer() {
    this._timerInterval = setInterval(() => {
      if (this.state === 'playing') {
        this.elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.onEvent({ type: 'tick', elapsed: this.elapsed });
      }
    }, 1000);
  }

  _stopTimer() {
    clearInterval(this._timerInterval);
  }

  /**
  * Player declares a cell using the canonical value: safe=1, mine=0.
   * @param {string} cellId
   * @param {0|1} value
   */
  declare(cellId, value) {
    if (this.state !== 'playing') return;
    const cell = this.board.byId.get(cellId);
    if (!cell || cell.locked) return;

    const correct = cell.value === value;

    if (correct) {
      cell.state = toState(value);
      cell.locked = true;
      this.known.set(cellId, value);

      // Find clues now satisfied
      const clueResults = this.engine.evaluateAll(this.known);
      const satisfiedClues = this.clues.filter(
        (c) => clueResults.get(c.id) === true
      );

      this.onEvent({ type: 'correct', cellId, value, satisfiedClues });

      if (this.mode === 'practice') {
        // Show explanation even on correct move
        const hint = findHint(
          this.board.cells.map((c) => c.id),
          this.clues,
          this.known
        );
        if (hint) {
          this.onEvent({ type: 'hint', ...hint });
        }
      }

      this._checkWin();
    } else {
      // Wrong declaration
      const violated = this.engine.firstViolation(
        new Map([...this.known, [cellId, value]])
      );
      const explanation = violated
        ? explainViolation(violated, cellId, value)
        : `That's not quite right — ${cellId} is actually ${isMine(cell.value) ? 'a mine' : 'safe'}.`;

      if (this.mode !== 'practice') {
        this.hearts--;
        this.mistakes++;
      }
      this.onEvent({ type: 'wrong', cellId, value, explanation, hearts: this.hearts });

      if (this.hearts <= 0 && this.mode !== 'practice') {
        this._lose();
      }
    }
  }

  /**
   * Clear (un-declare) a cell back to unknown.
   * @param {string} cellId
   */
  clear(cellId) {
    if (this.state !== 'playing') return;
    const cell = this.board.byId.get(cellId);
    if (!cell || cell.locked) return;
    cell.state = 'unknown';
    this.onEvent({ type: 'cleared', cellId });
  }

  /**
   * Request a hint.
   * @returns {{ used: boolean, hint?: Object, reason?: string }}
   */
  requestHint() {
    if (this.hintsUsed >= this.hintLimit) {
      return { used: false, reason: 'No hints left!' };
    }
    const hint = findHint(
      this.board.cells.map((c) => c.id),
      this.clues,
      this.known
    );
    if (!hint) {
      return { used: false, reason: 'No forced deduction available — try exploring another cell.' };
    }
    this.hintsUsed++;
    this.onEvent({ type: 'hint', ...hint, hintsRemaining: this.hintLimit - this.hintsUsed });
    return { used: true, hint };
  }

  pause() {
    if (this.state === 'playing') { this.state = 'paused'; this._stopTimer(); }
  }

  resume() {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.startTime = Date.now() - this.elapsed * 1000;
      this._startTimer();
    }
  }

  _checkWin() {
    const allLocked = this.board.cells.every((c) => c.locked);
    if (allLocked && this.engine.allSatisfied(this.known)) {
      this.state = 'won';
      this._stopTimer();
      const stars = this._calcStars();
      this.onEvent({ type: 'won', elapsed: this.elapsed, stars, mistakes: this.mistakes, hintsUsed: this.hintsUsed });
    }
  }

  _lose() {
    this.state = 'lost';
    this._stopTimer();
    this.onEvent({ type: 'lost', elapsed: this.elapsed });
  }

  _calcStars() {
    if (this.mistakes === 0 && this.hintsUsed === 0) return 3;
    if (this.mistakes <= 1 && this.hintsUsed <= 1) return 2;
    return 1;
  }

  /** Computed difficulty meter: rough score from board size and mine density */
  get difficultyScore() {
    const { rows, cols } = this.board;
    const total = rows * cols;
    const mineCount = this.board.cells.filter((c) => isMine(c.value)).length;
    return Math.round((mineCount / total) * 100);
  }
}
