import { INSTRUCTION_BG_SRC, SPEAKER_BUTTON_SRC } from '../assets.js';
import type { RhymeTask } from '../data/gameData.js';
import { createElement, createImage } from '../dom.js';

type InstructionBarProps = {
  task: RhymeTask;
  onReplay: () => void;
  disabled?: boolean;
};

function splitRhyme(prompt: string, rhymePart: string) {
  const startIndex = prompt.toLocaleLowerCase('nl-NL').lastIndexOf(rhymePart.toLocaleLowerCase('nl-NL'));

  if (startIndex === -1) {
    return { start: prompt, rhyme: '' };
  }

  return {
    start: prompt.slice(0, startIndex),
    rhyme: prompt.slice(startIndex),
  };
}

export function InstructionBar({ task, onReplay, disabled = false }: InstructionBarProps) {
  const bar = createElement('section', 'instruction-bar');
  bar.setAttribute('aria-label', 'Opdracht');
  bar.style.setProperty('--instruction-bg-src', `url("${INSTRUCTION_BG_SRC}")`);

  const speakerButton = createElement('button', 'speaker-button');
  speakerButton.type = 'button';
  speakerButton.disabled = disabled;
  speakerButton.setAttribute('aria-label', 'Luister nog een keer');
  speakerButton.append(createImage(SPEAKER_BUTTON_SRC));
  speakerButton.addEventListener('click', onReplay);

  const copy = createElement('div', 'instruction-copy');
  const promptWord = createElement('div', 'prompt-word');
  promptWord.setAttribute('aria-label', `Voorbeeldwoord ${task.prompt}`);

  const { start, rhyme } = splitRhyme(task.prompt, task.rhymePart);
  promptWord.append(createElement('span', undefined, start));
  promptWord.append(createElement('span', 'rhyme-part', rhyme));
  copy.append(promptWord, createElement('p', undefined, 'Wat rijmt?'));

  bar.append(speakerButton, copy);
  return bar;
}
