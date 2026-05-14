import { preloadAudio } from './audio.js';
import { GameScreen } from './components/GameScreen.js';
import { IntroScreen } from './components/IntroScreen.js';

export function App(root: HTMLElement) {
  preloadAudio();
  const startGame = () => {
    const gameScreen = new GameScreen(root);
    gameScreen.mount();
  };

  root.replaceChildren(IntroScreen({ onStart: startGame }));
}
