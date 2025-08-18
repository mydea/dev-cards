import type { CardInstance } from './card';
import type { GamePhase, GameEndState } from './enums';
import type { EffectResolution } from './effects';

type CardId = string;

/**
 * Core game resources that the player manages
 */
export interface GameResources {
  /** Current progress towards project completion (0-100) */
  progress: number;

  /** Current number of bugs in the code */
  bugs: number;

  /** Current technical debt (reduces PP per round) */
  technicalDebt: number;

  /** Current productivity points for this round */
  productivityPoints: number;
}

/**
 * Game statistics and metadata
 */
export interface GameStats {
  /** Current round number */
  currentRound: number;

  /** Total number of cards played this game */
  cardsPlayed: number;

  /** Total number of times player discarded all cards to reduce TD */
  techDebtReductions: number;

  /** Game start timestamp */
  startTime: number;

  /** Game end timestamp (if game is over) */
  endTime?: number;

  /** Final score (if game is over) */
  finalScore?: number;
}

/**
 * Card collections in different piles
 */
export interface GamePiles {
  /** Face-down cards that can be drawn */
  deck: CardInstance[];

  /** Cards currently in player's hand */
  hand: CardInstance[];

  /** Face-down cards that have been discarded */
  discard: CardInstance[];

  /** Face-down cards that have been played (cannot return) */
  graveyard: CardInstance[];
}

/**
 * History entry for tracking game events
 */
export interface GameHistoryEntry {
  /** Round when this event occurred */
  round: number;

  /** Type of action/event */
  action:
    | 'card_played'
    | 'round_start'
    | 'round_end'
    | 'tech_debt_reduction'
    | 'game_end';

  /** Card involved (if applicable) */
  cardId?: CardId;

  /** Effects that were resolved (if applicable) */
  effectResolutions?: EffectResolution[];

  /** State before the action */
  stateBefore: Partial<GameResources>;

  /** State after the action */
  stateAfter: Partial<GameResources>;

  /** Human-readable description */
  description: string;

  /** Timestamp */
  timestamp: number;
}

/**
 * Complete game state
 */
export interface GameState {
  /** Current game phase */
  phase: GamePhase;

  /** Current game end state */
  endState: GameEndState;

  /** Core game resources */
  resources: GameResources;

  /** Game statistics */
  stats: GameStats;

  /** Card piles */
  piles: GamePiles;

  /** Game history for replay/undo */
  history: GameHistoryEntry[];

  /** Random seed for reproducible gameplay */
  seed: string;

  /** Player identifier (for leaderboard) */
  playerId?: string;
}

/**
 * Configuration for a new game
 */
export interface GameConfig {
  /** Random seed (optional, will be generated if not provided) */
  seed?: string;

  /** Player identifier */
  playerId?: string;

  /** Deck to use (optional, will use default if not provided) */
  deckIds?: CardId[];

  /** Starting resources (optional, will use defaults) */
  startingResources?: Partial<GameResources>;
}

/**
 * Serializable save state for persistence
 */
export interface SaveState {
  /** Game state */
  gameState: GameState;

  /** Save timestamp */
  savedAt: number;

  /** Save version for compatibility */
  version: string;
}

/**
 * Player action types
 */
export type PlayerAction =
  | { type: 'PLAY_CARD'; cardInstanceId: string }
  | { type: 'DISCARD_ALL_FOR_TD_REDUCTION' }
  | { type: 'END_TURN' }
  | { type: 'START_NEW_GAME'; config?: GameConfig }
  | { type: 'LOAD_GAME'; saveState: SaveState };

/**
 * Game action result
 */
export interface ActionResult {
  /** Whether the action was successful */
  success: boolean;

  /** Updated game state (if successful) */
  newState?: GameState;

  /** Error message (if failed) */
  error?: string;

  /** Additional data from the action */
  data?: any;
}
