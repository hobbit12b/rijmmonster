import type { AnswerOption } from '../data/gameData';
import { createElement, createImage } from '../dom';

type AnswerButtonProps = {
  option: AnswerOption;
  index: number;
  disabled?: boolean;
  showDebugLabel?: boolean;
  feedback?: 'correct' | 'wrong' | null;
  onChoose: () => void;
};

export function AnswerButton({ option, index, disabled = false, showDebugLabel = false, feedback = null, onChoose }: AnswerButtonProps) {
  const assetNumber = Math.min(index + 1, 3);
  const button = createElement('button', `answer-button answer-button--${index + 1} ${feedback ? `answer-button--${feedback}` : ''}`);
  button.type = 'button';
  button.disabled = disabled;
  button.setAttribute('aria-label', `Antwoord ${index + 1}`);
  button.append(createImage(`/assets/knop_${assetNumber}.png`));
  button.append(createElement('span', 'answer-number', String(index + 1)));

  if (showDebugLabel) {
    button.append(createElement('span', 'debug-label', option.label));
  }

  button.addEventListener('click', onChoose);
  return button;
}
