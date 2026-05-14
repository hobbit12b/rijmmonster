export const INTRO_AUDIO_SRC = '/audio/intro-rijmen.mp3';
export const BACKGROUND_MUSIC_SRC = '/audio/background-music.mp3';
export const CORRECT_AUDIO_SRC = '/audio/correct.mp3';
export const WRONG_AUDIO_SRC = '/audio/wrong-soft.mp3';

export const BACKGROUND_MUSIC_VOLUME = 0.18;
export const DUCKED_BACKGROUND_MUSIC_VOLUME = 0.08;

type AudioKey = 'intro' | 'backgroundMusic' | 'correct' | 'wrong';
type PlaybackAudioKey = Exclude<AudioKey, 'backgroundMusic'>;

type ManagedAudio = {
  element: HTMLAudioElement;
  src: string;
  label: string;
  warned: boolean;
  loaded: boolean;
};

export type WordAudioOptions = {
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
};

type AudioManagerState = {
  audioUnlocked: boolean;
  introLoaded: boolean;
  introPlaying: boolean;
  introPlayed: boolean;
  musicPlaying: boolean;
  autoplayBlocked: boolean;
  isPageVisible: boolean;
};

const AUDIO_SOURCES: Record<AudioKey, { src: string; label: string }> = {
  intro: { src: INTRO_AUDIO_SRC, label: 'intro-audio' },
  backgroundMusic: { src: BACKGROUND_MUSIC_SRC, label: 'achtergrondmuziek' },
  correct: { src: CORRECT_AUDIO_SRC, label: 'correct-geluid' },
  wrong: { src: WRONG_AUDIO_SRC, label: 'fout-geluid' },
};

const defaultVoiceSettings = {
  lang: 'nl-NL',
  rate: 0.78,
  pitch: 1.08,
};

function isPageVisible() {
  return document.visibilityState !== 'hidden';
}

function isAutoplayBlocked(error: unknown) {
  return error instanceof DOMException && error.name === 'NotAllowedError';
}

class AudioManager {
  readonly state: AudioManagerState = {
    audioUnlocked: false,
    introLoaded: false,
    introPlaying: false,
    introPlayed: false,
    musicPlaying: false,
    autoplayBlocked: false,
    isPageVisible: isPageVisible(),
  };

  private readonly audio = new Map<AudioKey, ManagedAudio>();
  private readonly duckReasons = new Set<string>();
  private stateListeners = new Set<(state: AudioManagerState) => void>();
  private introEndedListeners = new Set<() => void>();
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private introWasPlayingBeforeHidden = false;
  private musicWasPlayingBeforeHidden = false;
  private speechWasSpeakingBeforeHidden = false;

  constructor() {
    this.attachLifecycleListeners();
  }

  subscribe(listener: (state: AudioManagerState) => void) {
    this.stateListeners.add(listener);
    listener({ ...this.state });

    return () => {
      this.stateListeners.delete(listener);
    };
  }

  onIntroEnded(listener: () => void) {
    this.introEndedListeners.add(listener);

    return () => {
      this.introEndedListeners.delete(listener);
    };
  }

  preloadAudio() {
    this.getAudio('intro');
    this.getAudio('backgroundMusic');
    this.getAudio('correct');
    this.getAudio('wrong');

    this.audio.forEach((managed) => {
      managed.element.preload = 'auto';
      try {
        managed.element.load();
      } catch (error) {
        this.warnMissingOrInvalid(managed, error);
      }
    });
  }

  async attemptAutoplayIntro() {
    this.preloadAudio();

    try {
      await this.playIntroExplanation();
      this.state.audioUnlocked = true;
      this.state.autoplayBlocked = false;
      void this.playBackgroundMusic().catch(() => {
        // Intro may autoplay while music is blocked independently on some browsers.
      });
      this.emitState();
      return true;
    } catch (error) {
      this.state.introPlaying = false;
      this.state.autoplayBlocked = true;
      if (!isAutoplayBlocked(error)) {
        this.state.introLoaded = true;
        this.warnMissingOrInvalid(this.getAudio('intro'), error);
      }
      this.restoreMusicVolume('intro-explanation');
      this.emitState();
      return false;
    }
  }

  async unlockAudio() {
    this.state.audioUnlocked = true;
    this.state.autoplayBlocked = false;
    this.emitState();

    const intro = this.getAudio('intro').element;
    if (intro.readyState === HTMLMediaElement.HAVE_NOTHING) {
      intro.load();
    }

    return this.playIntroExplanation();
  }

  async playIntroExplanation() {
    if (this.state.introPlayed) {
      return;
    }

    const intro = this.getAudio('intro').element;
    intro.currentTime = 0;
    this.duckMusic('intro-explanation');

    try {
      await intro.play();
      this.state.introPlaying = true;
      this.emitState();
    } catch (error) {
      this.state.introPlaying = false;
      this.emitState();
      throw error;
    }
  }

  async playBackgroundMusic() {
    const music = this.getAudio('backgroundMusic').element;
    music.loop = true;
    music.volume = this.currentMusicVolume();

    if (!this.state.isPageVisible) {
      return;
    }

    if (!music.paused) {
      this.state.musicPlaying = true;
      this.emitState();
      return;
    }

    try {
      await music.play();
      this.state.musicPlaying = true;
      this.emitState();
    } catch (error) {
      if (!isAutoplayBlocked(error)) {
        this.warnMissingOrInvalid(this.getAudio('backgroundMusic'), error);
      }
      this.state.musicPlaying = false;
      this.emitState();
      throw error;
    }
  }

  pauseBackgroundMusic() {
    const music = this.getAudio('backgroundMusic').element;
    music.pause();
    this.state.musicPlaying = false;
    this.emitState();
  }

  async resumeBackgroundMusic() {
    if (!this.state.audioUnlocked || !this.state.isPageVisible) {
      return;
    }

    return this.playBackgroundMusic();
  }

  stopBackgroundMusic() {
    const music = this.getAudio('backgroundMusic').element;
    music.pause();
    music.currentTime = 0;
    this.state.musicPlaying = false;
    this.emitState();
  }

  duckMusic(reason = 'speech') {
    this.duckReasons.add(reason);
    this.applyMusicVolume();
  }

  restoreMusicVolume(reason = 'speech') {
    this.duckReasons.delete(reason);
    this.applyMusicVolume();
  }

  playWord(textOrAudioKey: string, options: WordAudioOptions = {}) {
    if (textOrAudioKey === 'correct' || textOrAudioKey === 'wrong' || textOrAudioKey === 'intro') {
      return this.playManagedEffect(textOrAudioKey, options);
    }

    this.stopWordAudio();
    options.onStart?.();

    if (!('speechSynthesis' in window)) {
      globalThis.setTimeout(() => options.onEnd?.(), 350);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textOrAudioKey);
    utterance.lang = defaultVoiceSettings.lang;
    utterance.rate = options.rate ?? defaultVoiceSettings.rate;
    utterance.pitch = options.pitch ?? defaultVoiceSettings.pitch;
    utterance.onend = () => {
      this.activeUtterance = null;
      options.onEnd?.();
    };
    utterance.onerror = () => {
      this.activeUtterance = null;
      options.onEnd?.();
    };

    this.activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  stopWordAudio() {
    if (this.activeUtterance) {
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.activeUtterance = null;
    this.getAudio('correct').element.pause();
    this.getAudio('wrong').element.pause();
  }

  private async playManagedEffect(key: PlaybackAudioKey, options: WordAudioOptions) {
    const managed = this.getAudio(key);
    const element = managed.element;
    element.currentTime = 0;
    options.onStart?.();

    try {
      await element.play();
      element.onended = () => options.onEnd?.();
    } catch (error) {
      this.warnMissingOrInvalid(managed, error);
      options.onEnd?.();
    }
  }

  private getAudio(key: AudioKey) {
    const existing = this.audio.get(key);
    if (existing) {
      return existing;
    }

    const config = AUDIO_SOURCES[key];
    const element = new Audio(config.src);
    element.preload = 'auto';
    if (key === 'backgroundMusic') {
      element.loop = true;
      element.volume = this.currentMusicVolume();
    }

    const managed: ManagedAudio = {
      element,
      src: config.src,
      label: config.label,
      warned: false,
      loaded: false,
    };

    element.addEventListener('canplaythrough', () => {
      managed.loaded = true;
      if (key === 'intro') {
        this.state.introLoaded = true;
        this.emitState();
      }
    }, { once: true });

    element.addEventListener('loadeddata', () => {
      managed.loaded = true;
      if (key === 'intro') {
        this.state.introLoaded = true;
        this.emitState();
      }
    }, { once: true });

    element.addEventListener('error', () => {
      this.warnMissingOrInvalid(managed, element.error ?? undefined);
      if (key === 'intro') {
        this.state.introLoaded = true;
        this.emitState();
      }
    });

    if (key === 'intro') {
      element.addEventListener('play', () => {
        this.state.introPlaying = true;
        this.emitState();
      });
      element.addEventListener('pause', () => {
        this.state.introPlaying = false;
        this.emitState();
      });
      element.addEventListener('ended', () => {
        this.state.introPlaying = false;
        this.state.introPlayed = true;
        this.restoreMusicVolume('intro-explanation');
        this.emitState();
        this.introEndedListeners.forEach((listener) => listener());
      });
    }

    this.audio.set(key, managed);
    return managed;
  }

  private currentMusicVolume() {
    return this.duckReasons.size > 0 ? DUCKED_BACKGROUND_MUSIC_VOLUME : BACKGROUND_MUSIC_VOLUME;
  }

  private applyMusicVolume() {
    const music = this.audio.get('backgroundMusic')?.element;
    if (music) {
      music.volume = this.currentMusicVolume();
    }
  }

  private emitState() {
    const snapshot = { ...this.state };
    this.stateListeners.forEach((listener) => listener(snapshot));
  }

  private warnMissingOrInvalid(managed: ManagedAudio, error?: unknown) {
    if (managed.warned) {
      return;
    }

    managed.warned = true;
    console.warn(`Rijmie audio kon niet worden geladen of afgespeeld: ${managed.label} (${managed.src}).`, error);
  }

  private attachLifecycleListeners() {
    const pauseForHiddenPage = () => {
      this.state.isPageVisible = false;

      const intro = this.getAudio('intro').element;
      const music = this.getAudio('backgroundMusic').element;
      this.introWasPlayingBeforeHidden = !intro.paused && !this.state.introPlayed;
      this.musicWasPlayingBeforeHidden = !music.paused;
      this.speechWasSpeakingBeforeHidden = 'speechSynthesis' in window && window.speechSynthesis.speaking;
      intro.pause();
      this.pauseBackgroundMusic();
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
      }

      this.emitState();
    };

    const resumeForVisiblePage = () => {
      const visible = isPageVisible();
      this.state.isPageVisible = visible;

      if (visible && this.state.audioUnlocked) {
        if (this.musicWasPlayingBeforeHidden) {
          void this.resumeBackgroundMusic().catch(() => undefined);
        }
        if (this.introWasPlayingBeforeHidden && !this.state.introPlayed) {
          void this.getAudio('intro').element.play().catch(() => undefined);
        }
        if (this.speechWasSpeakingBeforeHidden && 'speechSynthesis' in window) {
          window.speechSynthesis.resume();
        }
      }

      this.emitState();
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        pauseForHiddenPage();
      } else {
        resumeForVisiblePage();
      }
    });
    window.addEventListener('blur', pauseForHiddenPage);
    window.addEventListener('focus', resumeForVisiblePage);
    window.addEventListener('pagehide', pauseForHiddenPage);
    window.addEventListener('pageshow', resumeForVisiblePage);
  }
}

export const audioManager = new AudioManager();

export function preloadAudio() {
  audioManager.preloadAudio();
}

export function attemptAutoplayIntro() {
  return audioManager.attemptAutoplayIntro();
}

export function unlockAudio() {
  return audioManager.unlockAudio();
}

export function playIntroExplanation() {
  return audioManager.playIntroExplanation();
}

export function playBackgroundMusic() {
  return audioManager.playBackgroundMusic();
}

export function pauseBackgroundMusic() {
  audioManager.pauseBackgroundMusic();
}

export function resumeBackgroundMusic() {
  return audioManager.resumeBackgroundMusic();
}

export function stopBackgroundMusic() {
  audioManager.stopBackgroundMusic();
}

export function duckMusic(reason?: string) {
  audioManager.duckMusic(reason);
}

export function restoreMusicVolume(reason?: string) {
  audioManager.restoreMusicVolume(reason);
}

export function playWord(textOrAudioKey: string, options?: WordAudioOptions) {
  audioManager.playWord(textOrAudioKey, options);
}
