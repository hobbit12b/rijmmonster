import { answerButtonSrc } from '../assets.js';
import type { AnswerOption } from '../data/gameData.js';
import { createElement, createImage } from '../dom.js';

type AnswerButtonProps = {
  option: AnswerOption;
  index: number;
  disabled?: boolean;
  isSpeaking?: boolean;
  feedback?: 'correct' | 'wrong' | null;
  onChoose: () => void;
};

export function AnswerButton({ option, index, disabled = false, isSpeaking = false, feedback = null, onChoose }: AnswerButtonProps) {
  const classNames = [
    'answer-button',
    `answer-button--${index + 1}`,
    isSpeaking ? 'answer-button--speaking' : '',
    feedback ? `answer-button--${feedback}` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const button = createElement('button', classNames);
  button.type = 'button';
  button.disabled = disabled;
  button.setAttribute('aria-label', `Antwoord ${index + 1}: ${option.label}`);
  button.append(createElement('span', 'button-sparkles', '✦ ✧ ✦'));
  button.append(createImage(answerButtonSrc(index)));
  button.addEventListener('click', onChoose);
  return button;
}
