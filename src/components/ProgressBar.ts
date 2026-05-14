import { CANDY_JAR_SRC, FILLED_HEART_SRC } from '../assets.js';
import { createElement, createImage } from '../dom.js';

type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  const filledCount = Math.max(0, Math.min(current, total));
  const group = createElement('section', 'progress-group');
  group.setAttribute('aria-label', `Voortgang ${filledCount} van ${total}`);

  const heartTrack = createElement('div', 'heart-track');
  heartTrack.setAttribute('aria-hidden', 'true');

  for (let index = 0; index < total; index += 1) {
    const slot = createElement('div', `heart-slot${index < filledCount ? ' heart-slot--filled' : ''}`);

    if (index < filledCount) {
      const heart = createImage(FILLED_HEART_SRC, '', `heart-status-image${index === filledCount - 1 ? ' heart-status-image--new' : ''}`);
      slot.append(heart);
    }

    heartTrack.append(slot);
  }

  group.append(createImage(CANDY_JAR_SRC, 'Snoeppot', 'candy-jar'), heartTrack);
  return group;
}
