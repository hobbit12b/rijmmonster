type ImportMetaWithEnv = ImportMeta & {
  env?: {
    BASE_URL?: string;
  };
};

const baseUrl = (import.meta as ImportMetaWithEnv).env?.BASE_URL ?? new URL('.', document.baseURI).pathname;

export const assetPath = (path: string) => `${baseUrl}${path.replace(/^\/+/, '')}`;

export const INTRO_BG_SRC = assetPath('assets/introscherm_zonder_startknop.png');
export const INTRO_BUTTON_SRC = assetPath('assets/introscherm_startknop.png');
export const FILLED_HEART_SRC = assetPath('assets/hartjesstatus.png');
export const BACKGROUND_STAGE_SRC = assetPath('assets/achtergrond.png');
export const HOME_BUTTON_SRC = assetPath('assets/knop_home.png');
export const SETTINGS_BUTTON_SRC = assetPath('assets/knop_instellingen.png');
export const SPEAKER_BUTTON_SRC = assetPath('assets/knop_geluid.png');
export const CANDY_JAR_SRC = assetPath('assets/snoeppot.png');
export const INSTRUCTION_BG_SRC = assetPath('assets/achtergrond tekstvak.png');

export const answerButtonSrc = (index: number) => assetPath(`assets/knop_${Math.min(index + 1, 3)}.png`);
