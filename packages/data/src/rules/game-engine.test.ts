import { describe, it, expect } from 'vitest';
import { GameEngine } from './game-engine';
import {
  GAME_END_STATE_IN_PROGRESS,
  GAME_PHASE_PLANNING,
  GAME_END_STATE_WON,
} from '../types';
import { cloneGameState, calculateScore } from '../utils';

describe('GameEngine', () => {
  it('should create a new game with correct initial state', () => {
    const engine = new GameEngine();
    const gameState = engine.createNewGame();

    expect(gameState.phase).toBe(GAME_PHASE_PLANNING);
    expect(gameState.endState).toBe(GAME_END_STATE_IN_PROGRESS);
    expect(gameState.resources.progress).toBe(0);
    expect(gameState.resources.bugs).toBe(0);
    expect(gameState.resources.technicalDebt).toBe(0);
    expect(gameState.resources.productivityPoints).toBe(20);
    expect(gameState.stats.currentRound).toBe(1);
    expect(gameState.piles.hand.length).toBe(5);
    expect(gameState.piles.deck.length).toBeGreaterThan(0);
  });

  it('should validate card play requirements correctly', () => {
    const engine = new GameEngine();
    const gameState = engine.createNewGame();

    // Find a card that requires PP
    const cardWithPPRequirement = gameState.piles.hand.find((card) =>
      card.card.requirements.some((req) => req.type === 'SPEND_PP')
    );

    if (cardWithPPRequirement) {
      const result = engine.processAction({
        type: 'PLAY_CARD',
        cardInstanceId: cardWithPPRequirement.instanceId,
      });

      // Should succeed if we have enough PP
      const ppRequirement = cardWithPPRequirement.card.requirements.find(
        (req) => req.type === 'SPEND_PP'
      );
      if (ppRequirement && ppRequirement.value <= 20) {
        expect(result.success).toBe(true);
        expect(result.newState).toBeDefined();
        expect(result.newState!.stats.cardsPlayed).toBe(1);
      }
    }
  });

  it('should handle technical debt reduction', () => {
    const engine = new GameEngine();
    const gameState = engine.createNewGame();
    const initialHandSize = gameState.piles.hand.length;

    const result = engine.processAction({
      type: 'DISCARD_ALL_FOR_TD_REDUCTION',
    });

    expect(result.success).toBe(true);
    expect(result.newState).toBeDefined();

    // Should have reduced technical debt (was 0, should still be 0 but action should succeed)
    expect(result.newState!.resources.technicalDebt).toBe(0);

    // Should have new hand after ending turn
    expect(result.newState!.piles.hand.length).toBe(5);

    // Should be in next round
    expect(result.newState!.stats.currentRound).toBe(2);
  });

  it('should handle end turn correctly', () => {
    const engine = new GameEngine();
    const gameState = engine.createNewGame();

    const result = engine.processAction({
      type: 'END_TURN',
    });

    expect(result.success).toBe(true);
    expect(result.newState).toBeDefined();
    expect(result.newState!.stats.currentRound).toBe(2);
    expect(result.newState!.piles.hand.length).toBe(5);
    expect(result.newState!.resources.productivityPoints).toBe(20); // Fresh PP for new round
  });

  it('should maintain game state consistency', () => {
    const engine = new GameEngine();
    const gameState = engine.createNewGame();

    // Count total cards at start
    const totalCards =
      gameState.piles.deck.length +
      gameState.piles.hand.length +
      gameState.piles.discard.length +
      gameState.piles.graveyard.length;

    // Play a card
    const firstCard = gameState.piles.hand[0];
    const result = engine.processAction({
      type: 'PLAY_CARD',
      cardInstanceId: firstCard.instanceId,
    });

    if (result.success && result.newState) {
      // Total cards should remain the same
      const newTotalCards =
        result.newState.piles.deck.length +
        result.newState.piles.hand.length +
        result.newState.piles.discard.length +
        result.newState.piles.graveyard.length;

      expect(newTotalCards).toBe(totalCards);
    }
  });

  it('should create save state', () => {
    const engine = new GameEngine();
    engine.createNewGame();

    const saveState = engine.getSaveState()!;

    expect(saveState).toBeDefined();
    expect(saveState.gameState).toBeDefined();
    expect(saveState.savedAt).toBeDefined();
    expect(saveState.version).toBe('1.0.0');
  });

  describe('Scoring System', () => {
    it('should calculate perfect score (1000 points)', () => {
      const engine = new GameEngine();
      let gameState = engine.createNewGame();

      // Simulate a perfect game: 10 rounds, 10 cards, 30 seconds
      const perfectState = cloneGameState(gameState);
      perfectState.resources.progress = 100; // Win condition
      perfectState.resources.bugs = 0; // Win condition
      perfectState.stats.currentRound = 10; // Perfect rounds
      perfectState.stats.cardsPlayed = 10; // Perfect cards
      perfectState.stats.startTime = Date.now() - 30000; // 30 seconds ago
      perfectState.stats.endTime = Date.now();
      perfectState.endState = GAME_END_STATE_WON;

      // Test using the exported scoring function
      const score = calculateScore(perfectState);

      // Should get 700 (rounds) + 200 (cards) + 100 (time) = 1000
      expect(score).toBe(1000);
    });

    it('should calculate score for average performance', () => {
      const engine = new GameEngine();
      let gameState = engine.createNewGame();

      // Simulate average game: 25 rounds, 20 cards, 2 minutes
      const averageState = cloneGameState(gameState);
      averageState.resources.progress = 100;
      averageState.resources.bugs = 0;
      averageState.stats.currentRound = 25; // Mid-range rounds
      averageState.stats.cardsPlayed = 20; // Mid-range cards
      averageState.stats.startTime = Date.now() - 120000; // 2 minutes ago
      averageState.stats.endTime = Date.now();
      averageState.endState = GAME_END_STATE_WON;

      const score = calculateScore(averageState);

      // Round score: 700 - ((25-10)/(50-10)) * 700 = 700 - (15/40) * 700 = 437.5
      // Card score: 200 - ((20-10)/(25-10)) * 200 = 200 - (10/15) * 200 = 66.7
      // Time score: 100 - ((120-30)/(300-30)) * 100 = 100 - (90/270) * 100 = 66.7
      // Total: ~437 + 67 + 67 = ~571
      expect(score).toBeCloseTo(571);
    });

    it('should give zero score for poor performance', () => {
      const engine = new GameEngine();
      let gameState = engine.createNewGame();

      // Simulate poor game: 50+ rounds, 25+ cards, 5+ minutes
      const poorState = cloneGameState(gameState);
      poorState.resources.progress = 100;
      poorState.resources.bugs = 0;
      poorState.stats.currentRound = 60; // Worse than minimum
      poorState.stats.cardsPlayed = 30; // Worse than minimum
      poorState.stats.startTime = Date.now() - 400000; // 6.67 minutes ago
      poorState.stats.endTime = Date.now();
      poorState.endState = GAME_END_STATE_WON;

      const score = calculateScore(poorState);

      // All components should be 0
      expect(score).toBe(0);
    });

    it('should calculate boundary scores correctly', () => {
      const engine = new GameEngine();

      // Test exact boundary: 10 rounds, 10 cards, 30 seconds
      const boundaryState = cloneGameState(engine.createNewGame());
      boundaryState.resources.progress = 100;
      boundaryState.resources.bugs = 0;
      boundaryState.stats.currentRound = 10;
      boundaryState.stats.cardsPlayed = 10;
      boundaryState.stats.startTime = Date.now() - 30000;
      boundaryState.stats.endTime = Date.now();
      boundaryState.endState = GAME_END_STATE_WON;

      const score = calculateScore(boundaryState);
      expect(score).toBe(1000);
    });

    it('should calculate other boundary scores correctly', () => {
      const engine = new GameEngine();

      // Test other boundary: 50 rounds, 25 cards, 300 seconds
      const boundaryState = cloneGameState(engine.createNewGame());
      boundaryState.resources.progress = 100;
      boundaryState.resources.bugs = 0;
      boundaryState.stats.currentRound = 50;
      boundaryState.stats.cardsPlayed = 25;
      boundaryState.stats.startTime = Date.now() - 300000;
      boundaryState.stats.endTime = Date.now();
      boundaryState.endState = GAME_END_STATE_WON;

      const score = calculateScore(boundaryState);
      expect(score).toBe(0);
    });

    it('should handle edge case: very fast but many rounds', () => {
      const engine = new GameEngine();

      // Very fast (10 seconds) but many rounds (40)
      const edgeState = cloneGameState(engine.createNewGame());
      edgeState.resources.progress = 100;
      edgeState.resources.bugs = 0;
      edgeState.stats.currentRound = 40;
      edgeState.stats.cardsPlayed = 15;
      edgeState.stats.startTime = Date.now() - 10000; // 10 seconds
      edgeState.stats.endTime = Date.now();
      edgeState.endState = GAME_END_STATE_WON;

      const score = calculateScore(edgeState);

      // Round score: 700 - ((40-10)/(50-10)) * 700 = 175
      // Card score: 200 - ((15-10)/(25-10)) * 200 = 133.3
      // Time score: 100 (10 seconds < 30)
      // Total: ~175 + 133 + 100 = ~408
      expect(score).toBeCloseTo(408);
    });

    it('should return 0 score for lost games', () => {
      const engine = new GameEngine();
      let gameState = engine.createNewGame();

      // Create a lost game state
      const lostState = cloneGameState(gameState);
      lostState.resources.progress = 50; // Not won
      lostState.stats.currentRound = 5;
      lostState.stats.cardsPlayed = 5;
      lostState.stats.startTime = Date.now() - 60000;
      lostState.stats.endTime = Date.now();
      lostState.endState = 'LOST_NO_CARDS' as any; // Lost state

      const score = calculateScore(lostState);
      expect(score).toBe(0);
    });

    it('should test individual scoring components', () => {
      const engine = new GameEngine();

      // Test rounds component only
      const roundsOnlyState = cloneGameState(engine.createNewGame());
      roundsOnlyState.resources.progress = 100;
      roundsOnlyState.resources.bugs = 0;
      roundsOnlyState.stats.currentRound = 15; // Should give 612.5 points
      roundsOnlyState.stats.cardsPlayed = 30; // Should give 0 points
      roundsOnlyState.stats.startTime = Date.now() - 400000; // Should give 0 points
      roundsOnlyState.stats.endTime = Date.now();
      roundsOnlyState.endState = GAME_END_STATE_WON;

      const roundsScore = calculateScore(roundsOnlyState);
      // 700 - ((15-10)/(50-10)) * 700 = 700 - (5/40) * 700 = 612.5
      expect(roundsScore).toBe(613); // Rounded

      // Test cards component only
      const cardsOnlyState = cloneGameState(engine.createNewGame());
      cardsOnlyState.resources.progress = 100;
      cardsOnlyState.resources.bugs = 0;
      cardsOnlyState.stats.currentRound = 60; // Should give 0 points
      cardsOnlyState.stats.cardsPlayed = 12; // Should give 173.3 points
      cardsOnlyState.stats.startTime = Date.now() - 400000; // Should give 0 points
      cardsOnlyState.stats.endTime = Date.now();
      cardsOnlyState.endState = GAME_END_STATE_WON;

      const cardsScore = calculateScore(cardsOnlyState);
      // 200 - ((12-10)/(25-10)) * 200 = 200 - (2/15) * 200 = 173.3
      expect(cardsScore).toBe(173); // Rounded

      // Test time component only
      const timeOnlyState = cloneGameState(engine.createNewGame());
      timeOnlyState.resources.progress = 100;
      timeOnlyState.resources.bugs = 0;
      timeOnlyState.stats.currentRound = 60; // Should give 0 points
      timeOnlyState.stats.cardsPlayed = 30; // Should give 0 points
      timeOnlyState.stats.startTime = Date.now() - 60000; // 1 minute, should give 88.9 points
      timeOnlyState.stats.endTime = Date.now();
      timeOnlyState.endState = GAME_END_STATE_WON;

      const timeScore = calculateScore(timeOnlyState);
      // 100 - ((60-30)/(300-30)) * 100 = 100 - (30/270) * 100 = 88.9
      expect(timeScore).toBe(89); // Rounded
    });

    it('should handle edge cases within bounds', () => {
      const engine = new GameEngine();

      // Test 11 rounds (just over perfect boundary)
      const justOverState = cloneGameState(engine.createNewGame());
      justOverState.resources.progress = 100;
      justOverState.resources.bugs = 0;
      justOverState.stats.currentRound = 11;
      justOverState.stats.cardsPlayed = 11;
      justOverState.stats.startTime = Date.now() - 31000; // 31 seconds
      justOverState.stats.endTime = Date.now();
      justOverState.endState = GAME_END_STATE_WON;

      const score = calculateScore(justOverState);
      // Round: 700 - ((11-10)/(50-10)) * 700 = 682.5
      // Card: 200 - ((11-10)/(25-10)) * 200 = 186.7
      // Time: 100 - ((31-30)/(300-30)) * 100 = 99.6
      // Total: ~682 + 187 + 100 = ~969
      expect(score).toBeGreaterThan(960);
      expect(score).toBeLessThan(980);
    });
  });
});
