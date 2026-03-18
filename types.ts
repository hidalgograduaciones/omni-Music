export enum AppMode {
  HOME = 'HOME',
  LIVE_AVATAR = 'LIVE_AVATAR',
  IMAGE_STUDIO = 'IMAGE_STUDIO',
  MEDIA_LAB = 'MEDIA_LAB',
  STORY_ENGINE = 'STORY_ENGINE',
  OMNI_UPLOADER = 'OMNI_UPLOADER'
}

export type Language = 'en' | 'es';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  error: string | null;
}

export interface GameState {
  location: string;
  health: number;
  inventory: string[];
  narrative: string;
  visualPrompt: string;
  gameOver: boolean;
}
