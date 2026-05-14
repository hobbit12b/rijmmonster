import { attemptAutoplayIntro, audioManager, playBackgroundMusic, unlockAudio } from '../audio.js';
import { createElement, createImage } from '../dom.js';

function isAutoplayBlocked(error: unknown) {
  return error instanceof DOMException && error.name === 'NotAllowedError';
}

type IntroScreenProps = {
  onStart: () => void;
};

export function IntroScreen({ onStart }: IntroScreenProps) {
  let hasStartedGame = false;
  let isStartingFromButton = false;
  let unsubscribeState: () => void = () => undefined;
  let unsubscribeIntroEnded: () => void = () => undefined;

  const continueToGame = () => {
    if (hasStartedGame) {
      return;
    }

    hasStartedGame = true;
    unsubscribeState();
    unsubscribeIntroEnded();
    onStart();
  };

  const shell = createElement('main', 'game-shell');
  const stage = createElement('section', 'game-stage intro-stage');
  stage.setAttribute('aria-label', 'Introductie');
  stage.append(createImage('/assets/introscherm.png', '', 'intro-background-layer'));

  const overlay = createElement('div', 'intro-controls');

  const loader = createElement('div', 'intro-loader');
  loader.setAttribute('aria-label', 'Audio laden');
  loader.setAttribute('role', 'status');

  const loaderDot = createElement('span', 'intro-loader-dot');
  loader.append(loaderDot);

  const startButton = createElement('button', 'intro-start-button', 'start');
  startButton.type = 'button';
  startButton.disabled = true;
  startButton.hidden = true;
  startButton.addEventListener('click', () => {
    if (isStartingFromButton || startButton.disabled) {
      return;
    }

    isStartingFromButton = true;
    startButton.disabled = true;
    startButton.hidden = true;
    loader.hidden = false;

    void unlockAudio()
      .then(() => playBackgroundMusic().catch(() => undefined))
      .catch((error: unknown) => {
        // Safari/iPad may still block audio. Keep the screen stable and allow another
        // explicit tap without showing a technical error to children. Missing audio files
        // are already warned by AudioManager; in that case continue so the app never crashes.
        if (!isAutoplayBlocked(error)) {
          continueToGame();
          return;
        }

        isStartingFromButton = false;
        startButton.disabled = false;
        startButton.hidden = false;
        loader.hidden = true;
      });
  });

  overlay.append(loader, startButton);
  stage.append(overlay);
  shell.append(createElement('div', 'portrait-warning', 'Draai de iPad naar liggend beeld om Rijmmonster te spelen.'), stage);

  unsubscribeState = audioManager.subscribe((state) => {
    if (state.introPlayed) {
      continueToGame();
      return;
    }

    if (state.introPlaying) {
      startButton.hidden = true;
      startButton.disabled = true;
      loader.hidden = true;
      return;
    }

    const canStartByButton = state.introLoaded && state.autoplayBlocked && !isStartingFromButton;
    startButton.hidden = !canStartByButton;
    startButton.disabled = !canStartByButton;
    loader.hidden = state.introLoaded || state.introPlaying;
  });

  unsubscribeIntroEnded = audioManager.onIntroEnded(continueToGame);

  window.setTimeout(() => {
    void attemptAutoplayIntro();
  }, 0);

  return shell;
}
