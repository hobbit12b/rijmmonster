import { GameScreen } from './components/GameScreen';

export function App(root: HTMLElement) {
  const gameScreen = new GameScreen(root);
  gameScreen.mount();
}
