import {
  BACKGROUND_MUSIC_VOLUME,
  BG_MUSIC_SRC,
  INTRO_AUDIO_SRC,
  audioManager,
} from '../audio.js';
import { INTRO_BG_SRC, INTRO_BUTTON_SRC } from '../assets.js';
import { createElement, createImage } from '../dom.js';

type IntroScreenProps = {
  onStart: () => void;
};

export function IntroScreen({ onStart }: IntroScreenProps) {
  console.log('IntroScreen mounted');
  console.log('INTRO_AUDIO_SRC', INTRO_AUDIO_SRC);
  console.log('BG_MUSIC_SRC', BG_MUSIC_SRC);
  console.log('INTRO_BG_SRC', INTRO_BG_SRC);
  console.log('INTRO_BUTTON_SRC', INTRO_BUTTON_SRC);

  let hasStartedGame = false;
  let introStarted = false;
  let unsubscribeIntroEnded: () => void = () => undefined;

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

  const continueToGame = () => {
    if (hasStartedGame) {
      return;
    }

    console.log('intro ended, navigating to game');
    hasStartedGame = true;
    hideStartButton();
    audioManager.restoreMusicVolume('intro-explanation');
    audioManager.getBackgroundMusic().volume = BACKGROUND_MUSIC_VOLUME;
    unsubscribeIntroEnded();
    onStart();
  };

  const startBackgroundMusicSoftly = async () => {
    audioManager.duckMusic('intro-explanation');
    console.log('background music play requested');

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
      console.log('intro audio play requested');
      await introAudio.play();
      console.log('intro audio started');
    } catch (error) {
      audioManager.setIntroPlaying(false);
      audioManager.restoreMusicVolume('intro-explanation');
      introStarted = false;
      console.log('intro audio failed', error);
      console.warn('intro audio failed', error);
      showStartButton();
    }
  }

  const shell = createElement('main', 'game-shell');
  const stage = createElement('section', 'game-stage intro-stage');
  stage.setAttribute('aria-label', 'Introductie');

  const background = createImage(INTRO_BG_SRC, '', 'intro-background-layer');
  background.addEventListener('load', () => console.log('Intro background loaded'), { once: true });
  stage.append(background);

  const startButton = createElement('button', 'intro-start-button');
  startButton.type = 'button';
  startButton.setAttribute('aria-label', 'Start Rijmmonster');

  const startButtonImage = createImage(INTRO_BUTTON_SRC, '', 'intro-start-button-image');
  startButtonImage.addEventListener('load', () => console.log('Start button loaded'), { once: true });
  startButton.append(startButtonImage);

  startButton.addEventListener('click', () => {
    void handleStart();
  });

  audioManager.getIntroAudio().addEventListener('error', () => {
    console.warn('Intro audio failed to load');
    introStarted = false;
    audioManager.setIntroPlaying(false);
    audioManager.restoreMusicVolume('intro-explanation');
    showStartButton();
  });

  stage.append(startButton);
  shell.append(createElement('div', 'portrait-warning', 'Draai de iPad naar liggend beeld om Rijmmonster te spelen.'), stage);

  unsubscribeIntroEnded = audioManager.onIntroEnded(continueToGame);

  return shell;
}
