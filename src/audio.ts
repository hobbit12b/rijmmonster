const BACKGROUND_MUSIC_SRC = 'assets/achtergrondmuziek_selectie1.mp3';
export const BACKGROUND_MUSIC_VOLUME = 0.12;
export const DUCKED_BACKGROUND_MUSIC_VOLUME = 0.04;

const duckReasons = new Set<string>();
let backgroundMusic: HTMLAudioElement | null = null;

function currentBackgroundVolume() {
  return duckReasons.size > 0 ? DUCKED_BACKGROUND_MUSIC_VOLUME : BACKGROUND_MUSIC_VOLUME;
}

function getBackgroundMusic() {
  if (!backgroundMusic) {
    backgroundMusic = document.createElement('audio');
    backgroundMusic.src = BACKGROUND_MUSIC_SRC;
    backgroundMusic.loop = true;
    backgroundMusic.preload = 'auto';
    backgroundMusic.volume = currentBackgroundVolume();
  }

  return backgroundMusic;
}

function applyBackgroundVolume() {
  if (backgroundMusic) {
    backgroundMusic.volume = currentBackgroundVolume();
  }
}

export function startBackgroundMusic() {
  const music = getBackgroundMusic();
  music.volume = currentBackgroundVolume();

  if (!music.paused) {
    return Promise.resolve();
  }

  return music.play();
}

export function duckBackgroundMusic(reason: string) {
  duckReasons.add(reason);
  applyBackgroundVolume();
}

export function restoreBackgroundMusic(reason: string) {
  duckReasons.delete(reason);
  applyBackgroundVolume();
}
