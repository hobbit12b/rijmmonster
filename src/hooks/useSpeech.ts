export type SpeakOptions = {
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
};

const defaultVoiceSettings = {
  lang: 'nl-NL',
  rate: 0.78,
  pitch: 1.08,
};

export function createSpeechController() {
  let activeUtterance: SpeechSynthesisUtterance | null = null;

  function stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    activeUtterance = null;
  }

  function speak(text: string, options: SpeakOptions = {}) {
    stop();

    if (!('speechSynthesis' in window)) {
      globalThis.setTimeout(() => options.onEnd?.(), 350);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = defaultVoiceSettings.lang;
    utterance.rate = options.rate ?? defaultVoiceSettings.rate;
    utterance.pitch = options.pitch ?? defaultVoiceSettings.pitch;
    utterance.onend = () => {
      activeUtterance = null;
      options.onEnd?.();
    };
    utterance.onerror = () => {
      activeUtterance = null;
      options.onEnd?.();
    };

    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  return { speak, stop };
}
