import {
  BACKGROUND_MUSIC_VOLUME,
  BG_MUSIC_SRC,
  INTRO_AUDIO_SRC,
  audioManager,
  isAudioSourceUnavailable,
  isAutoplayBlockedError,
} from '../audio.js';
import { createElement, createImage } from '../dom.js';

const START_FALLBACK_DELAY_MS = 1200;
const INTRO_BACKGROUND_SRC = '/assets/introscherm_zonder_startknop.png';
const INTRO_START_BUTTON_SRC = '/assets/introscherm_startknop.png';

type IntroScreenProps = {
  onStart: () => void;
};

export function IntroScreen({ onStart }: IntroScreenProps) {
  console.log('IntroScreen mounted');
  console.log('INTRO_AUDIO_SRC', INTRO_AUDIO_SRC);
  console.log('BG_MUSIC_SRC', BG_MUSIC_SRC);

  let hasStartedGame = false;
  let introStarted = false;
  let unsubscribeIntroEnded: () => void = () => undefined;

  const continueToGame = () => {
    if (hasStartedGame) {
      return;
    }

    console.log('intro ended, navigating to game');
    hasStartedGame = true;
    startButton.disabled = true;
    audioManager.getBackgroundMusic().volume = BACKGROUND_MUSIC_VOLUME;
    unsubscribeIntroEnded();
    onStart();
  };

  const navigateToGameAfterShortFallback = () => {
    window.setTimeout(continueToGame, START_FALLBACK_DELAY_MS);
  };

  const showStartButton = () => {
    if (hasStartedGame) {
      return;
    }

    startButton.hidden = false;
    startButton.disabled = false;
  };

  const hideStartButton = () => {
    startButton.disabled = true;
    startButton.hidden = true;
  };

  const startBackgroundMusicSoftly = async () => {
    audioManager.duckMusic('intro-explanation');
    try {
      await audioManager.playBackgroundMusic();
      console.log('background music started');
    } catch (error) {
      console.warn('background music could not start', error);
    }
  };

  async function handleStart() {
    console.log('start clicked');

    if (introStarted || audioManager.isIntroPlaying()) {
      return;
    }

    introStarted = true;
    hideStartButton();
    audioManager.markAudioUnlocked();
    audioManager.setIntroPlaying(true);

    const introAudio = audioManager.getIntroAudio();
    introAudio.currentTime = 0;

    await startBackgroundMusicSoftly();

    try {
      await introAudio.play();
      console.log('intro audio started');
    } catch (error) {
      audioManager.setIntroPlaying(false);
      audioManager.restoreMusicVolume('intro-explanation');
      introStarted = false;

      if (isAutoplayBlockedError(error)) {
        console.log('autoplay blocked, waiting for start');
        showStartButton();
        return;
      }

      if (isAudioSourceUnavailable(introAudio, error)) {
        console.warn('Intro audio could not be loaded; continuing to game after fallback delay.', error);
        navigateToGameAfterShortFallback();
        return;
      }

      console.warn('Intro audio could not play; waiting for start button.', error);
      showStartButton();
    }
  }

  const shell = createElement('main', 'game-shell');
  const stage = createElement('section', 'game-stage intro-stage');
  stage.setAttribute('aria-label', 'Introductie');

  const background = createImage(INTRO_BACKGROUND_SRC, '', 'intro-background-layer');
  background.addEventListener('load', () => console.log('Intro background loaded'), { once: true });
  stage.append(background);

  const startButton = createElement('button', 'intro-start-button');
  startButton.type = 'button';
  startButton.setAttribute('aria-label', 'Start Rijmmonster');

  const startButtonImage = createImage(INTRO_START_BUTTON_SRC, '', 'intro-start-button-image');
  startButtonImage.addEventListener('load', () => console.log('Start button loaded'), { once: true });
  startButton.append(startButtonImage);

  startButton.addEventListener('click', () => {
    void handleStart();
  });

  stage.append(startButton);
  shell.append(createElement('div', 'portrait-warning', 'Draai de iPad naar liggend beeld om Rijmmonster te spelen.'), stage);

  unsubscribeIntroEnded = audioManager.onIntroEnded(continueToGame);

  window.setTimeout(() => {
    console.log('Attempting intro autoplay');
    audioManager.attemptAutoplayIntro().then((autoplayStarted) => {
      if (autoplayStarted) {
        introStarted = true;
        hideStartButton();
        return;
      }

      if (audioManager.state.autoplayBlocked) {
        console.log('autoplay blocked, waiting for start');
        showStartButton();
        return;
      }

      const introAudio = audioManager.getIntroAudio();
      if (audioManager.state.introUnavailable || isAudioSourceUnavailable(introAudio, introAudio.error ?? undefined)) {
        console.warn('Intro audio could not be loaded; continuing to game after fallback delay.', introAudio.error);
        hideStartButton();
        navigateToGameAfterShortFallback();
      }
    }).catch((error) => {
      if (isAutoplayBlockedError(error)) {
        console.log('autoplay blocked, waiting for start');
        showStartButton();
        return;
      }

      console.warn('Intro autoplay failed unexpectedly; waiting for start button.', error);
      showStartButton();
    });
  }, 0);

  return shell;
}
