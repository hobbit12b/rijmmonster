import { duckBackgroundMusic, restoreBackgroundMusic, startBackgroundMusic } from '../audio.js';
import { createElement, createImage } from '../dom.js';

type IntroScreenProps = {
  onStart: () => void;
};

const INTRO_DUCK_REASON = 'intro-explanation';

export function IntroScreen({ onStart }: IntroScreenProps) {
  let hasStartedGame = false;
  let hasStartedIntro = false;
  let hasFinishedIntro = false;

  const introAudio = document.createElement('audio');
  introAudio.src = 'assets/uitleg.mp3';
  introAudio.preload = 'auto';

  const continueToGame = () => {
    if (hasStartedGame) {
      return;
    }

    hasStartedGame = true;
    restoreBackgroundMusic(INTRO_DUCK_REASON);
    onStart();
  };

  const playIntroAudio = () => {
    if (hasFinishedIntro) {
      continueToGame();
      return Promise.resolve();
    }

    hasStartedIntro = true;
    duckBackgroundMusic(INTRO_DUCK_REASON);
    return introAudio.play().catch((error: unknown) => {
      restoreBackgroundMusic(INTRO_DUCK_REASON);
      throw error;
    });
  };

  const startIntro = () => {
    const musicPromise = startBackgroundMusic();
    const introPromise = playIntroAudio();

    void Promise.all([musicPromise, introPromise])
      .then(() => {
        hint.textContent = 'Luister naar Rijmie. Het spel start zo vanzelf.';
      })
      .catch(() => {
        hasStartedIntro = false;
        hint.textContent = 'Tik op Start spel om het geluid te starten.';
      });
  };

  const shell = createElement('main', 'game-shell');
  const stage = createElement('section', 'game-stage intro-stage');
  stage.setAttribute('aria-label', 'Introductie');
  stage.append(createImage('/assets/achtergrond.png', '', 'background-layer'));

  const card = createElement('div', 'intro-card');

  const monster = createElement('div', 'intro-monster');
  monster.append(createImage('/assets/monster.png', 'Rijmie het rijmmonster'));

  const copy = createElement('div', 'intro-copy');
  copy.append(
    createElement('p', 'intro-eyebrow', 'Hallo, ik ben Rijmie!'),
    createElement('h1', undefined, 'Luister en rijm mee'),
    createElement('p', undefined, 'Ik leg kort uit hoe je woorden vindt die aan het eind hetzelfde klinken.'),
  );

  const startButton = createElement('button', 'intro-start-button', 'Start spel');
  startButton.type = 'button';
  startButton.addEventListener('click', () => {
    if (hasFinishedIntro) {
      continueToGame();
      return;
    }

    startIntro();
  });

  const hint = createElement('p', 'intro-hint', 'Luister naar Rijmie. Het spel start daarna vanzelf.');

  introAudio.addEventListener('ended', () => {
    hasFinishedIntro = true;
    continueToGame();
  });

  introAudio.addEventListener('pause', () => {
    if (!hasFinishedIntro && !hasStartedGame) {
      restoreBackgroundMusic(INTRO_DUCK_REASON);
    }
  });

  introAudio.addEventListener('play', () => {
    if (!hasFinishedIntro && !hasStartedGame) {
      duckBackgroundMusic(INTRO_DUCK_REASON);
    }
  });

  card.append(monster, copy, startButton, hint, introAudio);
  stage.append(card);
  shell.append(createElement('div', 'portrait-warning', 'Draai de iPad naar liggend beeld om Rijmmonster te spelen.'), stage);

  window.setTimeout(() => {
    if (!hasStartedIntro) {
      startIntro();
    }
  }, 150);

  return shell;
}
