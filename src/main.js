/** @file main.js — bootstraps the app, manages screen routing and persistent settings */

import { TitleScreen } from './ui/screens/TitleScreen.js';
import { LevelSelectScreen } from './ui/screens/LevelSelectScreen.js';
import { TutorialScreen } from './ui/screens/TutorialScreen.js';
import { GameScreen } from './ui/screens/GameScreen.js';
import { ResultScreen } from './ui/screens/ResultScreen.js';
import { LogicLabScreen } from './ui/screens/LogicLabScreen.js';
import { SettingsScreen } from './ui/screens/SettingsScreen.js';
import { generate, generateDaily } from './core/Generator.js';
import { storage } from './state/storage.js';
import { Sound } from './audio/Sound.js';
import { transition } from './ui/effects/Transitions.js';

const app = document.getElementById('app');
let currentScreenEl = null;

// Apply persisted visual settings on boot
if (storage.get('colorblind_mode', false)) document.body.classList.add('cb-mode');
if (storage.get('large_text', false)) document.body.classList.add('large-text');
if (storage.get('dyslexia_font', false)) document.body.classList.add('dyslexia');
if (storage.get('sound_muted', false)) Sound.setMute(true);

function setScreen(newScreenEl, dir = 'left') {
  if (!currentScreenEl) {
    app.appendChild(newScreenEl);
    currentScreenEl = newScreenEl;
    return;
  }
  app.appendChild(newScreenEl);
  transition(currentScreenEl, newScreenEl, dir);
  currentScreenEl = newScreenEl;
}

function showTitle() {
  const title = TitleScreen({
    onPlay: () => showLevelSelect(),
    onTutorial: () => showTutorial(),
    onLogicLab: () => showLogicLab(),
    onDaily: () => startDailyGame(),
    onSettings: () => showSettings(),
  });
  setScreen(title, 'right');
}

function showLevelSelect() {
  const select = LevelSelectScreen({
    onSelect: (diffId, mode) => startGame(diffId, mode),
    onBack: () => showTitle(),
  });
  setScreen(select, 'left');
}

function showTutorial() {
  const tut = TutorialScreen({
    onDone: () => showLevelSelect(),
    onBack: () => showTitle(),
  });
  setScreen(tut, 'left');
}

function showLogicLab() {
  const lab = LogicLabScreen({
    onBack: () => showTitle(),
  });
  setScreen(lab, 'left');
}

function showSettings() {
  const set = SettingsScreen({
    onBack: () => showTitle(),
  });
  setScreen(set, 'left');
}

function startGame(diffId, mode, customSeed = null) {
  const seed = customSeed !== null ? customSeed : Math.floor(Math.random() * 1000000);
  const { board, clues } = generate(diffId, seed);

  const game = GameScreen({
    board,
    clues,
    difficultyId: diffId,
    mode,
    onWin: (stats) => {
      // Record stars & unlock progression
      const prevStars = storage.get(`stars_${diffId}`, 0);
      if (stats.stars > prevStars) {
        storage.set(`stars_${diffId}`, stats.stars);
      }
      const progression = ['beginner', 'intermediate', 'advanced', 'expert'];
      const curIdx = progression.indexOf(diffId);
      if (curIdx >= 0 && curIdx < progression.length - 1) {
        const nextDiff = progression[curIdx + 1];
        const unlocked = storage.get('unlocked', ['beginner']);
        if (!unlocked.includes(nextDiff)) {
          unlocked.push(nextDiff);
          storage.set('unlocked', unlocked);
        }
      }

      showResult(true, stats, diffId, mode);
    },
    onLose: () => {
      showResult(false, { elapsed: 0, mistakes: 3, hintsUsed: 0 }, diffId, mode);
    },
    onBack: () => showLevelSelect(),
  });

  setScreen(game, 'left');
}

function startDailyGame() {
  const { board, clues } = generateDaily('intermediate');
  const game = GameScreen({
    board,
    clues,
    difficultyId: 'intermediate',
    mode: 'classic',
    onWin: (stats) => showResult(true, stats, 'intermediate', 'classic'),
    onLose: () => showResult(false, { elapsed: 0, mistakes: 3, hintsUsed: 0 }, 'intermediate', 'classic'),
    onBack: () => showTitle(),
  });
  setScreen(game, 'left');
}

function showResult(won, stats, diffId, mode) {
  const progression = ['beginner', 'intermediate', 'advanced', 'expert'];
  const curIdx = progression.indexOf(diffId);
  const nextDiff = (curIdx >= 0 && curIdx < progression.length - 1) ? progression[curIdx + 1] : diffId;

  const result = ResultScreen({
    won,
    stats,
    onNext: () => startGame(nextDiff, mode),
    onReplay: () => startGame(diffId, mode),
    onMenu: () => showLevelSelect(),
  });
  setScreen(result, 'left');
}

// First time user? Route to tutorial, otherwise Title
const tutorialDone = storage.get('tutorialDone', false);
if (!tutorialDone) {
  showTutorial();
} else {
  showTitle();
}
