import { createElement, createImage } from '../dom.js';

export type MonsterPose = 'idle' | 'listening' | 'happy' | 'oops';

const poseAssets: Record<MonsterPose, string> = {
  idle: '/assets/idle.png',
  listening: '/assets/luisteren2.png',
  happy: '/assets/blij.png',
  oops: '/assets/twijfel.png',
};

const poseLabels: Record<MonsterPose, string> = {
  idle: 'Rijmmonster wacht rustig.',
  listening: 'Rijmmonster luistert mee.',
  happy: 'Rijmmonster is blij.',
  oops: 'Rijmmonster denkt nog even na.',
};

export function Monster(pose: MonsterPose) {
  const monster = createElement('div', `monster monster--${pose}`);
  monster.append(createImage(poseAssets[pose], poseLabels[pose]));
  return monster;
}
