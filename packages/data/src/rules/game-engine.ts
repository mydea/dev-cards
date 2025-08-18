import type {
  GameState,
  GameConfig,
  ActionResult,
  PlayerAction,
  GameResources,
  GameStats,
  GamePiles,
  CardInstance,
  GameHistoryEntry,
} from '../types';
import {
  GAME_PHASE_PLANNING,
  GAME_PHASE_GAME_OVER,
  GAME_END_STATE_IN_PROGRESS,
  GAME_END_STATE_WON,
  GAME_END_STATE_LOST_NO_CARDS,
  REQUIREMENT_TYPE_SPEND_PP,
  REQUIREMENT_TYPE_DISCARD_CARDS,
  REQUIREMENT_TYPE_SEND_TO_GRAVEYARD,
} from '../types';
import { DEFAULT_DECK, createCardInstance, shuffleDeck } from '../cards';
import {
  validateCardPlay,
  validateTechnicalDebtReduction,
  checkWinCondition,
  checkLoseCondition,
} from './validators';
import { resolveAndApplyEffects } from './effects-resolver';

/**
 * Core game engine that manages game state and processes player actions
 */
export class GameEngine {
  private gameState: GameState | null = null;

  /**
   * Creates a new game with the given configuration
   */
  createNewGame(config?: GameConfig): GameState {
    const seed = config?.seed || `game_${Date.now()}_${Math.random()}`;
    const playerId = config?.playerId;
    const deckCards = config?.deckIds
      ? DEFAULT_DECK.filter((card) => config.deckIds!.includes(card.id))
      : [...DEFAULT_DECK];

    // Create shuffled deck
    const shuffledDeck = shuffleDeck(deckCards);
    const cardInstances = shuffledDeck.map((card) => createCardInstance(card));

    // Initial hand (5 cards)
    const initialHand = cardInstances.splice(0, 5);

    const initialResources: GameResources = {
      progress: 0,
      bugs: 0,
      technicalDebt: 0,
      productivityPoints: 20, // Start with full PP
      ...config?.startingResources,
    };

    const initialStats: GameStats = {
      currentRound: 1,
      cardsPlayed: 0,
      techDebtReductions: 0,
      startTime: Date.now(),
    };

    const initialPiles: GamePiles = {
      deck: cardInstances,
      hand: initialHand,
      discard: [],
      graveyard: [],
    };

    this.gameState = {
      phase: GAME_PHASE_PLANNING,
      endState: GAME_END_STATE_IN_PROGRESS,
      resources: initialResources,
      stats: initialStats,
      piles: initialPiles,
      history: [],
      seed,
      playerId,
    };

    this.addHistoryEntry('round_start', 'Game started', {}, initialResources);

    return this.gameState;
  }

  /**
   * Gets the current game state
   */
  getGameState(): GameState | null {
    return this.gameState;
  }

  /**
   * Processes a player action and returns the result
   */
  processAction(action: PlayerAction): ActionResult {
    if (!this.gameState) {
      return {
        success: false,
        error: 'No game in progress',
      };
    }

    try {
      switch (action.type) {
        case 'PLAY_CARD':
          return this.handlePlayCard(action.cardInstanceId);

        case 'DISCARD_ALL_FOR_TD_REDUCTION':
          return this.handleTechnicalDebtReduction();

        case 'END_TURN':
          return this.handleEndTurn();

        case 'START_NEW_GAME':
          const newGame = this.createNewGame(action.config);
          return {
            success: true,
            newState: newGame,
          };

        case 'LOAD_GAME':
          this.gameState = action.saveState.gameState;
          return {
            success: true,
            newState: this.gameState,
          };

        default:
          return {
            success: false,
            error: `Unknown action type: ${(action as any).type}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handles playing a card
   */
  private handlePlayCard(cardInstanceId: string): ActionResult {
    if (!this.gameState) {
      return { success: false, error: 'No game state' };
    }

    if (this.gameState.phase !== GAME_PHASE_PLANNING) {
      return { success: false, error: 'Cannot play cards in current phase' };
    }

    // Find the card in hand
    const cardIndex = this.gameState.piles.hand.findIndex(
      (c) => c.instanceId === cardInstanceId
    );

    if (cardIndex === -1) {
      return { success: false, error: 'Card not found in hand' };
    }

    const cardInstance = this.gameState.piles.hand[cardIndex];

    // Validate card can be played
    const validation = validateCardPlay(cardInstance, this.gameState);
    if (!validation.canPlay) {
      return {
        success: false,
        error: `Cannot play card: ${validation.reasons.join(', ')}`,
      };
    }

    // Create new state
    let newState = { ...this.gameState };

    // Pay requirements
    newState = this.payRequirements(cardInstance, newState);

    // Remove card from hand and put in graveyard
    newState.piles.hand.splice(cardIndex, 1);
    newState.piles.graveyard.push(cardInstance);

    // Apply card effects
    const effectResult = resolveAndApplyEffects(
      cardInstance.card.effects,
      newState
    );
    newState = effectResult.newGameState;

    // Update stats
    newState.stats.cardsPlayed++;

    // Add to history
    this.addHistoryEntry(
      'card_played',
      `Played ${cardInstance.card.title}`,
      this.gameState.resources,
      newState.resources,
      cardInstance.card.id,
      effectResult.resolutions
    );

    // Check win/lose conditions
    if (checkWinCondition(newState)) {
      newState.phase = GAME_PHASE_GAME_OVER;
      newState.endState = GAME_END_STATE_WON;
      newState.stats.endTime = Date.now();
      newState.stats.finalScore = this.calculateScore(newState);
    } else if (checkLoseCondition(newState)) {
      newState.phase = GAME_PHASE_GAME_OVER;
      newState.endState = GAME_END_STATE_LOST_NO_CARDS;
      newState.stats.endTime = Date.now();
    }

    this.gameState = newState;

    return {
      success: true,
      newState: this.gameState,
      data: {
        appliedEffects: effectResult.resolutions,
      },
    };
  }

  /**
   * Handles technical debt reduction by discarding all cards
   */
  private handleTechnicalDebtReduction(): ActionResult {
    if (!this.gameState) {
      return { success: false, error: 'No game state' };
    }

    if (!validateTechnicalDebtReduction(this.gameState)) {
      return { success: false, error: 'Cannot reduce technical debt' };
    }

    const newState = { ...this.gameState };

    // Move all cards from hand to discard pile
    newState.piles.discard.push(...newState.piles.hand);
    newState.piles.hand = [];

    // Reduce technical debt by 2
    newState.resources.technicalDebt = Math.max(
      0,
      newState.resources.technicalDebt - 2
    );

    // Update stats
    newState.stats.techDebtReductions++;

    // Add to history
    this.addHistoryEntry(
      'tech_debt_reduction',
      'Discarded all cards to reduce technical debt',
      this.gameState.resources,
      newState.resources
    );

    // End turn after TD reduction
    this.gameState = newState;
    return this.handleEndTurn();
  }

  /**
   * Handles ending the current turn
   */
  private handleEndTurn(): ActionResult {
    if (!this.gameState) {
      return { success: false, error: 'No game state' };
    }

    let newState = { ...this.gameState };

    // Move remaining cards in hand to discard pile
    newState.piles.discard.push(...newState.piles.hand);
    newState.piles.hand = [];

    // Draw new hand (5 cards)
    const result = this.drawCards(newState, 5);
    if (!result.success) {
      // Game over - cannot draw enough cards
      newState.phase = GAME_PHASE_GAME_OVER;
      newState.endState = GAME_END_STATE_LOST_NO_CARDS;
      newState.stats.endTime = Date.now();
    } else {
      newState = result.newState!;

      // Start new round
      newState.stats.currentRound++;

      // Replenish PP (20 - TD)
      newState.resources.productivityPoints = Math.max(
        0,
        20 - newState.resources.technicalDebt
      );

      // Add round start to history
      this.addHistoryEntry(
        'round_start',
        `Started round ${newState.stats.currentRound}`,
        this.gameState.resources,
        newState.resources
      );
    }

    this.gameState = newState;

    return {
      success: true,
      newState: this.gameState,
    };
  }

  /**
   * Draws cards from deck to hand, shuffling discard pile if needed
   */
  private drawCards(
    gameState: GameState,
    count: number
  ): ActionResult & { newState?: GameState } {
    const newState = { ...gameState };
    newState.piles = {
      deck: [...gameState.piles.deck],
      hand: [...gameState.piles.hand],
      discard: [...gameState.piles.discard],
      graveyard: [...gameState.piles.graveyard],
    };

    let cardsDrawn = 0;

    // Draw from deck first
    while (cardsDrawn < count && newState.piles.deck.length > 0) {
      const card = newState.piles.deck.shift()!;
      newState.piles.hand.push(card);
      cardsDrawn++;
    }

    // If we need more cards and discard pile has cards, shuffle them back
    if (cardsDrawn < count && newState.piles.discard.length > 0) {
      // Shuffle discard pile back into deck
      const shuffledDiscard = shuffleDeck(newState.piles.discard);
      newState.piles.deck.push(...shuffledDiscard);
      newState.piles.discard = [];

      // Continue drawing
      while (cardsDrawn < count && newState.piles.deck.length > 0) {
        const card = newState.piles.deck.shift()!;
        newState.piles.hand.push(card);
        cardsDrawn++;
      }
    }

    // Check if we drew enough cards
    if (cardsDrawn < count) {
      return {
        success: false,
        error: `Cannot draw ${count} cards, only ${cardsDrawn} available`,
      };
    }

    return {
      success: true,
      newState,
    };
  }

  /**
   * Pays the requirements for playing a card
   */
  private payRequirements(
    cardInstance: CardInstance,
    gameState: GameState
  ): GameState {
    const newState = { ...gameState };

    for (const requirement of cardInstance.card.requirements) {
      switch (requirement.type) {
        case REQUIREMENT_TYPE_SPEND_PP:
          newState.resources.productivityPoints -= requirement.value;
          break;

        case REQUIREMENT_TYPE_DISCARD_CARDS:
          // Remove random cards from hand to discard
          for (let i = 0; i < requirement.value; i++) {
            if (newState.piles.hand.length > 0) {
              const randomIndex = Math.floor(
                Math.random() * newState.piles.hand.length
              );
              const discardedCard = newState.piles.hand.splice(
                randomIndex,
                1
              )[0];
              newState.piles.discard.push(discardedCard);
            }
          }
          break;

        case REQUIREMENT_TYPE_SEND_TO_GRAVEYARD:
          // Remove random cards from hand to graveyard
          for (let i = 0; i < requirement.value; i++) {
            if (newState.piles.hand.length > 0) {
              const randomIndex = Math.floor(
                Math.random() * newState.piles.hand.length
              );
              const graveyardCard = newState.piles.hand.splice(
                randomIndex,
                1
              )[0];
              newState.piles.graveyard.push(graveyardCard);
            }
          }
          break;
      }
    }

    return newState;
  }

  /**
   * Calculates the final score based on game performance
   */
  private calculateScore(gameState: GameState): number {
    if (gameState.endState !== GAME_END_STATE_WON) {
      return 0;
    }

    // Base score: fewer rounds = higher score
    const roundScore = Math.max(0, 100 - gameState.stats.currentRound * 5);

    // Time bonus: faster completion = higher score
    const timeMs = gameState.stats.endTime! - gameState.stats.startTime;
    const timeMinutes = timeMs / (1000 * 60);
    const timeScore = Math.max(0, 50 - timeMinutes);

    // Efficiency bonus: fewer total cards played = higher score
    const efficiencyScore = Math.max(0, 50 - gameState.stats.cardsPlayed);

    return Math.round(roundScore + timeScore + efficiencyScore);
  }

  /**
   * Adds an entry to the game history
   */
  private addHistoryEntry(
    action: GameHistoryEntry['action'],
    _description: string,
    stateBefore: Partial<GameResources>,
    stateAfter: Partial<GameResources>,
    cardId?: string,
    effectResolutions?: any[]
  ): void {
    if (!this.gameState) return;

    const entry: GameHistoryEntry = {
      round: this.gameState.stats.currentRound,
      action,
      cardId,
      effectResolutions,
      stateBefore,
      stateAfter,
      timestamp: Date.now(),
    };

    this.gameState.history.push(entry);
  }

  /**
   * Checks if the game has ended and determines the end state
   */
  checkGameEnd(): boolean {
    if (!this.gameState) return false;

    return this.gameState.endState !== GAME_END_STATE_IN_PROGRESS;
  }

  /**
   * Gets a serializable save state
   */
  getSaveState(): any {
    if (!this.gameState) return null;

    return {
      gameState: this.gameState,
      savedAt: Date.now(),
      version: '1.0.0',
    };
  }
}
