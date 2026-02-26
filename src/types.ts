export enum Language {
  ENGLISH = 'English',
  SPANISH = 'Spanish',
  FRENCH = 'French',
  GERMAN = 'German',
  ITALIAN = 'Italian',
  PORTUGUESE = 'Portuguese',
  JAPANESE = 'Japanese',
  CHINESE = 'Chinese',
  KOREAN = 'Korean',
  RUSSIAN = 'Russian',
  ARABIC = 'Arabic',
  HINDI = 'Hindi',
}

export interface PlayerLocation {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

export enum DeckTheme {
  NONE = 'None',
  DISNEY_APRILCOTS = 'Disney Apricots',
  MARVEL_APRILCOTS = 'Marvel Apricots',
  STAR_WARS_APRILCOTS = 'Star Wars Apricots',
  HOLLYWOOD_LAND_APRILCOTS = 'Hollywood Land Apricots',
  STAND_UP_COMEDY = 'Stand-Up Comedy',
  HOLLYWOOD_ICONS = 'Hollywood Icons',
  FREE_CARDS = 'Free Cards',
}

export interface Card {
  id: string;
  text: string;
  type: 'prompt' | 'answer';
  deckTheme: DeckTheme;
}

export interface Deck {
  theme: DeckTheme;
  name: string;
  description: string;
  cards: Card[];
  cost: number;
  unlocked: boolean;
}

export interface Player {
  id: string;
  name: string;
  points: number;
  language: Language;
  unlockedDecks: DeckTheme[];
}

export interface GameState {
  players: Player[];
  currentRound: number;
  promptCard: Card | null;
  playedAnswerCards: { playerId: string; card: Card }[];
  winningPlayerId: string | null;
  language: Language;
  activeDecks: DeckTheme[];
  pointsEarned: number;
}
