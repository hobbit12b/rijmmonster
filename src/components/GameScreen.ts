import { audioManager, duckMusic, playBackgroundMusic, restoreMusicVolume, type WordAudioOptions } from '../audio.js';
import { gameData } from '../data/gameData.js';
import { createElement, createImage } from '../dom.js';
import { AnswerButton } from './AnswerButton.js';
import { InstructionBar } from './InstructionBar.js';
import { Monster, type MonsterPose } from './Monster.js';
import { ProgressBar } from './ProgressBar.js';

const LISTENING_GAP_MS = 420;
const FEEDBACK_MS = 620;
const NEXT_ROUND_DELAY_MS = 120;
const GAME_SPEECH_DUCK_REASON = 'game-speech';

type Feedback = 'correct' | 'wrong' | null;

export class GameScreen {
  private readonly root: HTMLElement;
  private timers: number[] = [];
  private taskIndex = 0;
  private progress = 0;
  private monsterPose: MonsterPose = 'idle';
  private isPlayingAudio = false;
  private selectedAnswer: number | null = null;
  private activeSpokenOption: number | null = null;
  private feedback: Feedback = null;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  mount() {
    void playBackgroundMusic().catch(() => {
      // The intro start button normally unlocks audio. If not, speech still works and
      // another user gesture can resume the shared music instance later.
    });
    this.render();
    window.setTimeout(() => this.playRoundAudio(), 200);
  }

  private get task() {
    return gameData[this.taskIndex];
  }

  private get roundLocked() {
    return this.isPlayingAudio || this.feedback !== null;
  }

  private clearTimers() {
    this.timers.forEach((timer) => window.clearTimeout(timer));
    this.timers = [];
  }

  private queueTimer(callback: () => void, delay: number) {
    const timer = window.setTimeout(callback, delay);
    this.timers.push(timer);
  }

  private setState(update: () => void) {
    update();
    this.render();
  }

  private finishListening() {
    this.setState(() => {
      this.isPlayingAudio = false;
      this.activeSpokenOption = null;
      this.monsterPose = 'idle';
    });
  }

  private speak(text: string, options: WordAudioOptions = {}) {
    audioManager.playWord(text, {
      ...options,
      onStart: () => {
        duckMusic(GAME_SPEECH_DUCK_REASON);
        options.onStart?.();
      },
      onEnd: () => {
        restoreMusicVolume(GAME_SPEECH_DUCK_REASON);
        options.onEnd?.();
      },
    });
  }

  private speakQuestion() {
    this.setState(() => {
      this.activeSpokenOption = null;
    });

    this.speak('Wat rijmt?', {
      rate: 0.92,
      onEnd: () => this.queueTimer(() => this.speakOptionsFrom(0), LISTENING_GAP_MS),
    });
  }

  private speakOptionsFrom(index: number) {
    const option = this.task.options[index];

    if (!option) {
      this.finishListening();
      return;
    }

    this.setState(() => {
      this.activeSpokenOption = index;
    });

    const optionText = `${this.task.prompt}, ${option.label}.`;

    this.speak(optionText, {
      rate: 0.92,
      onEnd: () => this.queueTimer(() => this.speakOptionsFrom(index + 1), LISTENING_GAP_MS),
    });
  }

  private playFullPrompt = () => {
    this.speakQuestion();
  };

  private playRoundAudio = () => {
    this.clearTimers();
    this.setState(() => {
      this.feedback = null;
      this.selectedAnswer = null;
      this.activeSpokenOption = null;
      this.isPlayingAudio = true;
      this.monsterPose = 'listening';
    });

    this.playFullPrompt();
  };

  private replayPrompt = () => {
    this.clearTimers();
    this.setState(() => {
      this.feedback = null;
      this.selectedAnswer = null;
      this.activeSpokenOption = null;
      this.isPlayingAudio = true;
      this.monsterPose = 'listening';
    });

    this.playFullPrompt();
  };

  private chooseAnswer(index: number) {
    if (this.roundLocked) {
      return;
    }

    const isCorrect = this.task.options[index].correct;

    audioManager.stopWordAudio();
    restoreMusicVolume(GAME_SPEECH_DUCK_REASON);
    this.clearTimers();
    this.setState(() => {
      this.selectedAnswer = index;
      this.activeSpokenOption = null;
      this.feedback = isCorrect ? 'correct' : 'wrong';
      this.monsterPose = isCorrect ? 'happy' : 'oops';
      this.isPlayingAudio = true;
    });

    this.speak(isCorrect ? 'Goed zo!' : 'Bijna. Luister nog eens.', {
      rate: 0.88,
      onEnd: () => {
        this.queueTimer(() => {
          if (isCorrect) {
            this.setState(() => {
              this.progress = Math.min(gameData.length, this.progress + 1);
              this.taskIndex = (this.taskIndex + 1) % gameData.length;
              this.feedback = null;
              this.selectedAnswer = null;
              this.activeSpokenOption = null;
              this.monsterPose = 'idle';
              this.isPlayingAudio = false;
            });
            this.queueTimer(this.playRoundAudio, NEXT_ROUND_DELAY_MS);
          } else {
            this.setState(() => {
              this.feedback = null;
              this.selectedAnswer = null;
              this.activeSpokenOption = null;
              this.monsterPose = 'idle';
              this.isPlayingAudio = false;
            });
            this.queueTimer(this.playRoundAudio, NEXT_ROUND_DELAY_MS);
          }
        }, FEEDBACK_MS);
      },
    });
  }

  private render() {
    const stage = createElement('div', 'game-stage');
    stage.append(createImage('/assets/achtergrond.png', '', 'background-layer'));

    const homeButton = createElement('button', 'corner-button corner-button--home');
    homeButton.type = 'button';
    homeButton.setAttribute('aria-label', 'Home');
    homeButton.append(createImage('/assets/knop_home.png'));

    const settingsButton = createElement('button', 'corner-button corner-button--settings');
    settingsButton.type = 'button';
    settingsButton.setAttribute('aria-label', 'Instellingen');
    settingsButton.append(createImage('/assets/knop_instellingen.png'));

    const playArea = createElement('div', 'play-area');
    playArea.setAttribute('aria-live', 'polite');

    const answerRow = createElement('div', 'answer-row');
    this.task.options.forEach((option, index) => {
      answerRow.append(
        AnswerButton({
          option,
          index,
          disabled: this.roundLocked,
          isSpeaking: this.activeSpokenOption === index,
          feedback: this.selectedAnswer === index ? this.feedback : null,
          onChoose: () => this.chooseAnswer(index),
        }),
      );
    });

    playArea.append(answerRow, Monster(this.monsterPose));
    stage.append(
      homeButton,
      settingsButton,
      InstructionBar({ task: this.task, onReplay: this.replayPrompt, disabled: this.isPlayingAudio }),
      playArea,
      ProgressBar({ current: this.progress, total: gameData.length }),
    );

    const shell = createElement('main', 'game-shell');
    shell.append(createElement('div', 'portrait-warning', 'Draai de iPad naar liggend beeld om Rijmmonster te spelen.'), stage);
    this.root.replaceChildren(shell);
  }
}
