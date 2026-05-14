import { createElement, createImage } from '../dom.js';

type IntroScreenProps = {
  onStart: () => void;
};

export function IntroScreen({ onStart }: IntroScreenProps) {
  let hasStarted = false;

  const startGame = () => {
    if (hasStarted) {
      return;
    }

    hasStarted = true;
    introAudio.pause();
    introAudio.currentTime = 0;
    onStart();
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
  startButton.addEventListener('click', startGame);

  const hint = createElement('p', 'intro-hint', 'Start zelf als het geluid niet automatisch begint.');

  const introAudio = document.createElement('audio');
  introAudio.src = 'assets/uitleg.mp3';
  introAudio.preload = 'auto';
  introAudio.addEventListener('ended', startGame);

  card.append(monster, copy, startButton, hint, introAudio);
  stage.append(card);
  shell.append(createElement('div', 'portrait-warning', 'Draai de iPad naar liggend beeld om Rijmmonster te spelen.'), stage);

  window.setTimeout(() => {
    void introAudio.play().catch(() => {
      hint.textContent = 'Tik op Start spel om meteen te beginnen.';
    });
  }, 150);

  return shell;
}
