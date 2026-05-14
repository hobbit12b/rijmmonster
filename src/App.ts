import { GameScreen } from './components/GameScreen.js';

export function App(root: HTMLElement) {
  const gameScreen = new GameScreen(root);
  gameScreen.mount();
}
