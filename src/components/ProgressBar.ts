import { createElement, createImage } from '../dom';

type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  const group = createElement('section', 'progress-group');
  group.setAttribute('aria-label', `Voortgang ${current} van ${total}`);

  const heartTrack = createElement('div', 'heart-track');
  const heartFill = createElement('div', 'heart-fill');
  heartFill.style.width = `${Math.min(100, (current / total) * 100)}%`;
  heartTrack.append(createImage('/assets/hartjesstatus.png'), heartFill);

  group.append(createImage('/assets/snoeppot.png', 'Snoeppot', 'candy-jar'), heartTrack);
  return group;
}
