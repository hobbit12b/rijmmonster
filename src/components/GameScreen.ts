import { gameData } from '../data/gameData.js';
import { createElement, createImage } from '../dom.js';
import { createSpeechController } from '../hooks/useSpeech.js';
import { AnswerButton } from './AnswerButton.js';
import { InstructionBar } from './InstructionBar.js';
import { Monster, type MonsterPose } from './Monster.js';
import { ProgressBar } from './ProgressBar.js';

const SHOW_DEBUG_LABELS = true;
const LISTENING_GAP_MS = 420;
const FEEDBACK_MS = 620;
const NEXT_ROUND_DELAY_MS = 120;

type Feedback = 'correct' | 'wrong' | null;

export class GameScreen {
  private readonly root: HTMLElement;
  private readonly speech = createSpeechController();
  private timers: number[] = [];
  private taskIndex = 0;
  private progress = 0;
  private monsterPose: MonsterPose = 'idle';
  private isPlayingAudio = false;
  private selectedAnswer: number | null = null;
  private feedback: Feedback = null;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  mount() {
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
      this.monsterPose = 'idle';
    });
  }

  private speakOptionsFrom(index: number) {
    const option = this.task.options[index];

    if (!option) {
      this.finishListening();
      return;
    }

    this.speech.speak(option.label, {
      onEnd: () => this.queueTimer(() => this.speakOptionsFrom(index + 1), LISTENING_GAP_MS),
    });
  }

  private playRoundAudio = () => {
    this.clearTimers();
    this.setState(() => {
      this.feedback = null;
      this.selectedAnswer = null;
      this.isPlayingAudio = true;
      this.monsterPose = 'listening';
    });

    this.speech.speak(this.task.prompt, {
      onEnd: () => this.queueTimer(() => this.speakOptionsFrom(0), LISTENING_GAP_MS),
    });
  };


  private replayPrompt = () => {
    this.clearTimers();
    this.setState(() => {
      this.isPlayingAudio = true;
      this.monsterPose = 'listening';
    });

    this.speech.speak(this.task.prompt, {
      onEnd: () => {
        this.setState(() => {
          this.isPlayingAudio = false;
          this.monsterPose = 'idle';
        });
      },
    });
  };

  private chooseAnswer(index: number) {
    if (this.roundLocked) {
      return;
    }

    const isCorrect = this.task.options[index].correct;

    this.speech.stop();
    this.clearTimers();
    this.setState(() => {
      this.selectedAnswer = index;
      this.feedback = isCorrect ? 'correct' : 'wrong';
      this.monsterPose = isCorrect ? 'happy' : 'oops';
      this.isPlayingAudio = true;
    });

    this.speech.speak(isCorrect ? 'Goed zo!' : 'Bijna. Luister nog eens.', {
      rate: 0.88,
      onEnd: () => {
        this.queueTimer(() => {
          if (isCorrect) {
            this.setState(() => {
              this.progress = Math.min(gameData.length, this.progress + 1);
              this.taskIndex = (this.taskIndex + 1) % gameData.length;
              this.feedback = null;
              this.selectedAnswer = null;
              this.monsterPose = 'idle';
              this.isPlayingAudio = false;
            });
            this.queueTimer(this.playRoundAudio, NEXT_ROUND_DELAY_MS);
          } else {
            this.setState(() => {
              this.feedback = null;
              this.selectedAnswer = null;
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
    stage.append(createElement('div', 'ground-shadow'));

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

    const answerRow = createElement('div', 'answer-row answer-row--top');
    this.task.options.forEach((option, index) => {
      answerRow.append(
        AnswerButton({
          option,
          index,
          disabled: this.roundLocked,
          showDebugLabel: SHOW_DEBUG_LABELS,
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
