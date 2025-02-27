/**
 * Interface for the keypress event object from readline
 */
export interface KeypressEvent {
  sequence?: string;
  name: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
}

/**
 * Interface for an idea with ELO ranking
 */
export interface Idea {
  id: string;
  text: string;
  elo: number;
  comparisons: Comparison[];
}

/**
 * Interface for a comparison between two ideas
 */
export interface Comparison {
  opponentId: string;
  result: "win" | "loss" | "draw";
  date: string;
  eloChange: number;
}

/**
 * Interface for the ideas database
 */
export interface IdeasDatabase {
  ideas: Idea[];
  lastUpdated: string;
}
