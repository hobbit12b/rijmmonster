import { attemptAutoplayIntro, audioManager } from '../audio.js';
import { createElement, createImage } from '../dom.js';

const DEBUG_UI = false;
const START_FALLBACK_DELAY_MS = 350;

type IntroScreenProps = {
  onStart: () => void;
};

export function IntroScreen({ onStart }: IntroScreenProps) {
  let hasStartedGame = false;
  let unsubscribeIntroEnded: () => void = () => undefined;

  const continueToGame = () => {
    if (hasStartedGame) {
      return;
    }

    hasStartedGame = true;
    unsubscribeIntroEnded();
    onStart();
  };

  const navigateToGameAfterShortFallback = () => {
    window.setTimeout(continueToGame, START_FALLBACK_DELAY_MS);
  };

  async function handleStart() {
    console.log('start hit-area clicked');

    if (audioManager.isIntroPlaying()) {
      return;
    }

    if (audioManager.state.introPlayed) {
      continueToGame();
      return;
    }

    audioManager.markAudioUnlocked();
    audioManager.setIntroPlaying(true);

    const introAudio = audioManager.getIntroAudio();
    const bgMusic = audioManager.getBackgroundMusic();

    try {
      bgMusic.currentTime = bgMusic.currentTime || 0;
      bgMusic.volume = 0.18;
      await bgMusic.play();
      audioManager.markMusicPlaying(true);
      console.log('background music play called');
    } catch (error) {
      audioManager.markMusicPlaying(false);
      console.warn('Background music could not play', error);
    }

    try {
      introAudio.currentTime = 0;
      bgMusic.volume = 0.08;
      await introAudio.play();
      console.log('intro play called');
    } catch (error) {
      console.warn('Intro audio could not play', error);
      audioManager.setIntroPlaying(false);
      bgMusic.volume = 0.18;
      navigateToGameAfterShortFallback();
    }
  }

  const shell = createElement('main', 'game-shell');
  const stage = createElement('section', 'game-stage intro-stage');
  stage.setAttribute('aria-label', 'Introductie');
  stage.append(createImage('/assets/introscherm.png', '', 'intro-background-layer'));

  const startButton = createElement(
    'button',
    DEBUG_UI ? 'intro-start-hit-area intro-start-hit-area--debug' : 'intro-start-hit-area',
  );
  startButton.type = 'button';
  startButton.setAttribute('aria-label', 'Start Rijmmonster');
  startButton.addEventListener('click', () => {
    void handleStart();
  });

  stage.append(startButton);
  shell.append(createElement('div', 'portrait-warning', 'Draai de iPad naar liggend beeld om Rijmmonster te spelen.'), stage);

  unsubscribeIntroEnded = audioManager.onIntroEnded(continueToGame);

  window.setTimeout(() => {
    void attemptAutoplayIntro();
  }, 0);

  return shell;
}
