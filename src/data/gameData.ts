export type AnswerOption = {
  label: string;
  correct: boolean;
};

export type RhymeTask = {
  prompt: string;
  rhymePart: string;
  options: AnswerOption[];
};

export const gameData: RhymeTask[] = [
  {
    prompt: 'fluis',
    rhymePart: 'uis',
    options: [
      { label: 'guis', correct: true },
      { label: 'gons', correct: false },
    ],
  },
  {
    prompt: 'maan',
    rhymePart: 'aan',
    options: [
      { label: 'faan', correct: true },
      { label: 'mop', correct: false },
    ],
  },
  {
    prompt: 'rook',
    rhymePart: 'ook',
    options: [
      { label: 'sook', correct: true },
      { label: 'rim', correct: false },
    ],
  },
];
