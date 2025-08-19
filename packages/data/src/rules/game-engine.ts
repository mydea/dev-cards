import type {
  GameState,
  GameConfig,
  ActionResult,
  PlayerAction,
  GameResources,
  GameStats,
  GamePiles,
  CardInstance,
  CoinFlipEffect,
} from '../types';
import { GameHistory } from '../utils/game-history';
import {
  GAME_PHASE_PLANNING,
  GAME_PHASE_GAME_OVER,
  GAME_END_STATE_IN_PROGRESS,
  GAME_END_STATE_WON,
  GAME_END_STATE_LOST_NO_CARDS,
  REQUIREMENT_TYPE_SPEND_PP,
  REQUIREMENT_TYPE_DISCARD_CARDS,
} from '../types';
import { createCardInstance, createDeck, shuffleDeck } from '../cards';
import { RANDOM_EFFECT_TYPE_COIN_FLIP } from '../types';
import {
  validateCardPlay,
  validateTechnicalDebtReduction,
  checkWinCondition,
  checkLoseCondition,
} from './validators';
import { resolveAndApplyEffects } from './effects-resolver';
import { generateUUID } from '../utils/uuid';
import { cloneGameState } from '../utils/deep-clone';

/**
 * Core game engine that manages game state and processes player actions
 */
export class GameEngine {
  private gameState: GameState | null = null;
  private history: GameHistory = new GameHistory();

  /**
   * Creates a new game with the given configuration
   */
  createNewGame(config?: GameConfig): GameState {
    const seed = config?.seed || `game_${generateUUID()}`;
    const playerId = config?.playerId;
    const deckCards = config?.deckIds
      ? createDeck().filter((card) => config.deckIds!.includes(card.id))
      : createDeck();

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
      seed,
      playerId,
    };

    // Clear history for new game and add initial entry
    this.history.clear();
    this.history.addEntry(
      'round_start',
      'Game started',
      initialResources,
      initialResources,
      1
    );

    return this.gameState;
  }

  /**
   * Gets the current game state
   */
  getGameState(): GameState | null {
    return this.gameState;
  }

  /**
   * Updates the game engine's internal state (for animation synchronization)
   */
  public updateGameState(newState: GameState): void {
    this.gameState = newState;
  }

  /**
   * Gets the current game history
   */
  public getHistory(): GameHistory {
    return this.history;
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
   * Processes a player action with predetermined coin flip results
   */
  processActionWithPredeterminedCoinFlips(
    action: PlayerAction,
    coinFlipResults: Array<{
      effect: CoinFlipEffect;
      result: 'heads' | 'tails';
      resolvedValue: number;
    }>
  ): ActionResult {
    if (!this.gameState) {
      return {
        success: false,
        error: 'No game in progress',
      };
    }

    try {
      switch (action.type) {
        case 'PLAY_CARD':
          return this.handlePlayCardWithPredeterminedCoinFlips(
            action.cardInstanceId,
            coinFlipResults
          );

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
   * Prepares end turn action and returns cards to be drawn for animation
   */
  public prepareEndTurn(): {
    success: boolean;
    error?: string;
    cardsToDraw?: CardInstance[];
  } {
    if (!this.gameState) {
      return { success: false, error: 'No game state' };
    }

    if (this.gameState.phase !== GAME_PHASE_PLANNING) {
      return {
        success: false,
        error: 'Cannot end turn outside planning phase',
      };
    }

    const currentGameState = this.gameState; // Store reference for TypeScript

    // Simulate the draw to see which cards would be drawn
    const tempState = cloneGameState(currentGameState);
    tempState.piles.hand = [];
    tempState.piles.discard = [
      ...currentGameState.piles.discard,
      ...currentGameState.piles.hand,
    ];

    const cardsToDraw: CardInstance[] = [];
    let cardsDrawn = 0;

    // Draw from deck first
    while (cardsDrawn < 5 && tempState.piles.deck.length > 0) {
      const card = tempState.piles.deck.shift()!;
      cardsToDraw.push(card);
      cardsDrawn++;
    }

    // If we need more cards and discard pile has cards, shuffle them back
    if (cardsDrawn < 5 && tempState.piles.discard.length > 0) {
      // Shuffle discard pile back into deck (excluding the cards we just added from current hand)
      const availableDiscard = tempState.piles.discard.filter(
        (card) => !currentGameState.piles.hand.includes(card)
      );
      const shuffledDiscard = shuffleDeck(availableDiscard);
      tempState.piles.deck.push(...shuffledDiscard);

      // Continue drawing
      while (cardsDrawn < 5 && tempState.piles.deck.length > 0) {
        const card = tempState.piles.deck.shift()!;
        cardsToDraw.push(card);
        cardsDrawn++;
      }
    }

    // Check if we can draw enough cards
    if (cardsDrawn < 5) {
      return {
        success: false,
        error: `Cannot draw enough cards for new hand: only ${cardsDrawn} available`,
      };
    }

    return {
      success: true,
      cardsToDraw,
    };
  }

  /**
   * Prepares a card for playing and returns requirements/coin flips for animation
   */
  public prepareCardPlay(cardInstanceId: string): {
    success: boolean;
    error?: string;
    cardsToDiscard?: CardInstance[];
    coinFlipEffects?: Array<{
      effect: CoinFlipEffect;
      result: 'heads' | 'tails';
      resolvedValue: number;
    }>;
  } {
    if (!this.gameState) {
      return { success: false, error: 'No game state' };
    }

    if (this.gameState.phase !== GAME_PHASE_PLANNING) {
      return { success: false, error: 'Cannot play cards in current phase' };
    }

    const cardInstance = this.gameState.piles.hand.find(
      (card) => card.instanceId === cardInstanceId
    );

    if (!cardInstance) {
      return { success: false, error: 'Card not found in hand' };
    }

    const validation = validateCardPlay(cardInstance, this.gameState);
    if (!validation.canPlay) {
      return { success: false, error: validation.reasons.join(', ') };
    }

    // Identify cards that need to be discarded for requirements
    const cardsToDiscard: CardInstance[] = [];
    const availableCards = this.gameState.piles.hand.filter(
      (card) => card.instanceId !== cardInstanceId
    );

    for (const requirement of cardInstance.card.requirements) {
      if (requirement.type === REQUIREMENT_TYPE_DISCARD_CARDS) {
        for (
          let i = 0;
          i < requirement.value && availableCards.length > 0;
          i++
        ) {
          const randomIndex = Math.floor(Math.random() * availableCards.length);
          const cardToDiscard = availableCards.splice(randomIndex, 1)[0];
          cardsToDiscard.push(cardToDiscard);
        }
      }
    }

    // Pre-resolve coin flip effects for animation
    const coinFlipEffects: Array<{
      effect: CoinFlipEffect;
      result: 'heads' | 'tails';
      resolvedValue: number;
    }> = [];

    cardInstance.card.effects.forEach((effect) => {
      if (effect.randomType === RANDOM_EFFECT_TYPE_COIN_FLIP) {
        const isHeads = Math.random() < 0.5;
        const result = isHeads ? 'heads' : 'tails';
        const resolvedValue = isHeads ? effect.headsValue : effect.tailsValue;

        coinFlipEffects.push({
          effect,
          result,
          resolvedValue,
        });
      }
    });

    return {
      success: true,
      cardsToDiscard,
      coinFlipEffects: coinFlipEffects.length > 0 ? coinFlipEffects : undefined,
    };
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

    // Create new state with deep clone to ensure immutability
    let newState = cloneGameState(this.gameState);

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

    // Extract total cards to draw from effects for UI animation
    let totalCardsToDraw = 0;
    effectResult.resolutions.forEach((resolution) => {
      if (resolution.cardsToDraw) {
        totalCardsToDraw += resolution.cardsToDraw;
      }
    });

    // Update stats
    newState.stats.cardsPlayed++;

    // Add to history
    this.history.addEntry(
      'card_played',
      `Played ${cardInstance.card.title}`,
      this.gameState.resources,
      newState.resources,
      newState.stats.currentRound,
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
        cardsToDraw: totalCardsToDraw > 0 ? totalCardsToDraw : undefined,
      },
    };
  }

  /**
   * Handles playing a card with predetermined coin flip results
   */
  private handlePlayCardWithPredeterminedCoinFlips(
    cardInstanceId: string,
    coinFlipResults: Array<{
      effect: CoinFlipEffect;
      result: 'heads' | 'tails';
      resolvedValue: number;
    }>
  ): ActionResult {
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

    // Create new state with deep clone to ensure immutability
    let newState = cloneGameState(this.gameState);

    // Pay requirements
    newState = this.payRequirements(cardInstance, newState);

    // Remove card from hand and put in graveyard
    newState.piles.hand.splice(cardIndex, 1);
    newState.piles.graveyard.push(cardInstance);

    // Create predetermined outcomes map
    const predeterminedOutcomes: { [effectIndex: number]: 'heads' | 'tails' } =
      {};
    let coinFlipIndex = 0;

    cardInstance.card.effects.forEach((effect, index) => {
      if (effect.randomType === RANDOM_EFFECT_TYPE_COIN_FLIP) {
        predeterminedOutcomes[index] = coinFlipResults[coinFlipIndex].result;
        coinFlipIndex++;
      }
    });

    // Apply card effects with predetermined coin flip results
    const effectResult = resolveAndApplyEffects(
      cardInstance.card.effects,
      newState,
      predeterminedOutcomes
    );
    newState = effectResult.newGameState;

    // Update stats
    newState.stats.cardsPlayed++;

    // Add to history
    this.history.addEntry(
      'card_played',
      `Played ${cardInstance.card.title}`,
      this.gameState.resources,
      newState.resources,
      newState.stats.currentRound,
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

    if (!validateTechnicalDebtReduction(this.gameState, this.history)) {
      return {
        success: false,
        error:
          'Cannot reduce technical debt: You must not have played any cards this round',
      };
    }

    const newState = cloneGameState(this.gameState);
    newState.resources.technicalDebt = Math.max(
      0,
      this.gameState.resources.technicalDebt - 2
    );

    // Add to history
    this.history.addEntry(
      'tech_debt_reduction',
      'Discarded all cards to reduce technical debt',
      this.gameState.resources,
      newState.resources,
      newState.stats.currentRound
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

    // Move remaining cards in hand to discard pile
    const stateWithDiscardedHand = cloneGameState(this.gameState);
    stateWithDiscardedHand.piles.hand = [];
    stateWithDiscardedHand.piles.discard = [
      ...this.gameState.piles.discard,
      ...this.gameState.piles.hand,
    ];

    // Try to draw new hand (5 cards)
    const result = this.drawCards(stateWithDiscardedHand, 5);

    let newState: GameState;

    if (!result.success) {
      // Game over - actually failed to draw enough cards after trying
      newState = cloneGameState(stateWithDiscardedHand);
      newState.phase = GAME_PHASE_GAME_OVER;
      newState.endState = GAME_END_STATE_LOST_NO_CARDS;
      newState.stats.endTime = Date.now();
    } else {
      // Successfully drew cards - start new round and replenish PP (20 - TD)
      const drawnState = result.newState!;
      newState = cloneGameState(drawnState);
      newState.stats.currentRound++;
      newState.resources.productivityPoints = Math.max(
        0,
        20 - drawnState.resources.technicalDebt
      );
    }

    // Add round start to history
    this.history.addEntry(
      'round_start',
      `Started round ${newState.stats.currentRound}`,
      this.gameState.resources,
      newState.resources,
      newState.stats.currentRound
    );

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
    const newState = cloneGameState(gameState);

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
   * Gets information about what would happen when drawing cards, for animation planning
   */
  public getDrawCardsPlan(
    gameState: GameState,
    count: number
  ): {
    canDraw: boolean;
    deckCards: number;
    needsShuffle: boolean;
    discardCards: number;
    totalAvailable: number;
  } {
    const deckCards = gameState.piles.deck.length;
    const discardCards = gameState.piles.discard.length;
    const totalAvailable = deckCards + discardCards;

    return {
      canDraw: totalAvailable >= count,
      deckCards,
      needsShuffle: deckCards < count && discardCards > 0,
      discardCards,
      totalAvailable,
    };
  }

  /**
   * Performs the shuffle operation (moves discard to deck)
   */
  public performShuffle(gameState: GameState): GameState {
    const newState = cloneGameState(gameState);
    newState.piles.deck = [
      ...gameState.piles.deck,
      ...shuffleDeck(gameState.piles.discard),
    ];
    newState.piles.discard = [];
    return newState;
  }

  /**
   * Reduces technical debt.
   */
  public reduceTechnicalDebt(): ActionResult {
    if (!this.gameState) {
      return { success: false, error: 'No game state' };
    }

    if (!validateTechnicalDebtReduction(this.gameState, this.history)) {
      return {
        success: false,
        error:
          'Cannot reduce technical debt: You must not have played any cards this round',
      };
    }

    const newState = cloneGameState(this.gameState);
    newState.resources.technicalDebt = Math.max(
      0,
      this.gameState.resources.technicalDebt - 2
    );

    // Add to history
    this.history.addEntry(
      'tech_debt_reduction',
      'Discarded all cards to reduce technical debt',
      this.gameState.resources,
      newState.resources,
      newState.stats.currentRound
    );

    this.gameState = newState;
    return {
      success: true,
      newState: this.gameState,
    };
  }

  /**
   * Draws specific number of cards from deck only (no shuffling)
   */
  public performDraw(
    gameState: GameState,
    count: number
  ): {
    newState: GameState;
    drawnCards: CardInstance[];
  } {
    const newState = cloneGameState(gameState);

    const drawnCards: CardInstance[] = [];
    const cardsToDraw = Math.min(count, newState.piles.deck.length);

    for (let i = 0; i < cardsToDraw; i++) {
      const card = newState.piles.deck.shift()!;
      newState.piles.hand.push(card);
      drawnCards.push(card);
    }

    return { newState, drawnCards };
  }

  /**
   * Pays the requirements for playing a card
   */
  private payRequirements(
    cardInstance: CardInstance,
    gameState: GameState
  ): GameState {
    const newState = cloneGameState(gameState);

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
   * Checks if the game has ended and determines the end state
   */
  checkGameEnd(): boolean {
    if (!this.gameState) return false;

    return this.gameState.endState !== GAME_END_STATE_IN_PROGRESS;
  }

  /**
   * Gets a serializable save state
   */
  getSaveState(): {
    gameState: GameState;
    savedAt: number;
    version: string;
  } | null {
    if (!this.gameState) return null;

    return {
      gameState: this.gameState,
      savedAt: Date.now(),
      version: '1.0.0',
    };
  }
}
