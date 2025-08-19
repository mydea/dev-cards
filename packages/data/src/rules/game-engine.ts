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
  CardEffect,
  EffectResolution,
} from '../types';
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
   * Processes a player action with predetermined coin flip results
   */
  processActionWithPredeterminedCoinFlips(
    action: PlayerAction,
    coinFlipResults: Array<{
      effect: any;
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
    const tempState = { ...currentGameState };
    tempState.piles = {
      deck: [...currentGameState.piles.deck],
      hand: [], // Clear hand as it would be discarded
      discard: [
        ...currentGameState.piles.discard,
        ...currentGameState.piles.hand,
      ], // Add current hand to discard
      graveyard: [...currentGameState.piles.graveyard],
    };

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
      effect: CardEffect;
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
      effect: CardEffect;
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
   * Handles playing a card with predetermined coin flip results
   */
  private handlePlayCardWithPredeterminedCoinFlips(
    cardInstanceId: string,
    coinFlipResults: Array<{
      effect: any;
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

    // Create new state
    let newState = { ...this.gameState };

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
      return {
        success: false,
        error:
          'Cannot reduce technical debt: You must not have played any cards this round',
      };
    }

    const newState = {
      ...this.gameState,

      resources: {
        ...this.gameState.resources,
        technicalDebt: Math.max(0, this.gameState.resources.technicalDebt - 2),
      },
    };

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

    // Move remaining cards in hand to discard pile
    const stateWithDiscardedHand = {
      ...this.gameState,
      piles: {
        deck: [...this.gameState.piles.deck],
        hand: [],
        discard: [
          ...this.gameState.piles.discard,
          ...this.gameState.piles.hand,
        ],
        graveyard: [...this.gameState.piles.graveyard],
      },
    };

    // Try to draw new hand (5 cards)
    const result = this.drawCards(stateWithDiscardedHand, 5);

    let newState: GameState;

    if (!result.success) {
      // Game over - actually failed to draw enough cards after trying
      newState = {
        ...stateWithDiscardedHand,
        phase: GAME_PHASE_GAME_OVER,
        endState: GAME_END_STATE_LOST_NO_CARDS,
        stats: {
          ...stateWithDiscardedHand.stats,
          endTime: Date.now(),
        },
      };
    } else {
      // Successfully drew cards - start new round and replenish PP (20 - TD)
      const drawnState = result.newState!;
      newState = {
        ...drawnState,
        stats: {
          ...drawnState.stats,
          currentRound: drawnState.stats.currentRound + 1,
        },
        resources: {
          ...drawnState.resources,
          productivityPoints: Math.max(
            0,
            20 - drawnState.resources.technicalDebt
          ),
        },
      };

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
    effectResolutions?: EffectResolution[]
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
