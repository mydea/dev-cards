import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  GameState,
  GameEngine,
  CardInstance,
  CoinFlipEffect,
} from '@dev-cards/data';
import { checkWinCondition, checkLoseCondition } from '@dev-cards/data';
import GameInfo from '../UI/GameInfo';
import ResourceDisplay from '../UI/ResourceDisplay';
import GameActions from '../UI/GameActions';
import ParticleEffect from '../UI/ParticleEffect';
import AnimationLayer, { type AnimationLayerRef } from '../UI/AnimationLayer';
import Pile from '../UI/Pile';
import CoinFlipOverlay from '../UI/CoinFlipOverlay';
import Hand from '../Hand/Hand';
import styles from './GameBoard.module.css';

interface GameBoardProps {
  gameState: GameState;
  gameEngine: GameEngine;
  onReturnToMenu: () => void;
}

interface GameOverState {
  isGameOver: boolean;
  won: boolean;
  message: string;
}

function GameBoard({
  gameState: initialGameState,
  gameEngine,
  onReturnToMenu,
}: GameBoardProps) {
  const [gameState, setGameState] = useState(initialGameState);
  const [gameOver, setGameOver] = useState<GameOverState>({
    isGameOver: false,
    won: false,
    message: '',
  });

  const [showParticles, setShowParticles] = useState(false);

  // Coin flip queue state
  const [coinFlipQueue, setCoinFlipQueue] = useState<{
    effects: Array<{
      effect: CoinFlipEffect;
      result: 'heads' | 'tails';
      resolvedValue: number;
    }>;
    cardInstanceId?: string;
    cardsToDiscard?: CardInstance[];
  }>({
    effects: [],
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingCardIds, setAnimatingCardIds] = useState<Set<string>>(
    new Set()
  );

  // Animation refs
  const animationLayerRef = useRef<AnimationLayerRef>(null);
  const graveyardRef = useRef<HTMLDivElement>(null);
  const discardRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  // Track card elements for animations
  const [cardElements, setCardElements] = useState<{
    [cardId: string]: HTMLElement;
  }>({});

  const handleCardMount = (cardId: string, element: HTMLElement) => {
    setCardElements((prev) => {
      // Only update if the element is different to prevent unnecessary re-renders
      if (prev[cardId] === element) return prev;
      return { ...prev, [cardId]: element };
    });
  };

  const handleCardUnmount = (cardId: string) => {
    setCardElements((prev) => {
      // Only update if the element actually exists
      if (!(cardId in prev)) return prev;
      const newElements = { ...prev };
      delete newElements[cardId];
      return newElements;
    });
  };

  // Check for game over conditions whenever game state changes
  useEffect(() => {
    const hasWon = checkWinCondition(gameState);
    const hasLost = checkLoseCondition(gameState);

    if (hasWon) {
      setShowParticles(true);
      setGameOver({
        isGameOver: true,
        won: true,
        message: `Congratulations! You completed your project in ${gameState.stats.currentRound} rounds with ${gameState.stats.cardsPlayed} cards played.`,
      });
    } else if (hasLost) {
      setGameOver({
        isGameOver: true,
        won: false,
        message: 'Not enough cards to continue playing!',
      });
    }
  }, [gameState]);

  const handlePlayCard = (
    cardInstanceId: string
  ): {
    success: boolean;
    newState?: GameState;
    cardsToDraw?: number;
    error?: string;
  } => {
    try {
      const result = gameEngine.processAction({
        type: 'PLAY_CARD',
        cardInstanceId,
      });

      if (result.success && result.newState) {
        // Update game state immediately
        setGameState(result.newState);

        // Extract cards to draw from effect results
        const cardsToDraw =
          (result.data as { appliedEffects: any[]; cardsToDraw?: number })
            ?.cardsToDraw || 0;

        return {
          success: true,
          newState: result.newState,
          cardsToDraw: cardsToDraw > 0 ? cardsToDraw : undefined,
        };
      } else {
        console.error('Error playing card:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error playing card:', error);
      return { success: false, error: String(error) };
    }
  };

  // New animated card play handler
  const handlePlayCardWithAnimation = (
    cardInstanceId: string,
    cardElement: HTMLElement
  ) => {
    // Check if this card is already being animated to prevent double-processing
    if (animatingCardIds.has(cardInstanceId)) {
      return;
    }

    const cardInstance = gameState.piles.hand.find(
      (card) => card.instanceId === cardInstanceId
    );

    if (!cardInstance || !animationLayerRef.current || !graveyardRef.current) {
      // Fallback to immediate play if animation isn't available
      handlePlayCard(cardInstanceId);
      return;
    }

    // Prepare the card play to see if it has discard requirements or coin flips
    const preparation = gameEngine.prepareCardPlay(cardInstanceId);

    // Check if there are coin flip effects that need animation
    if (
      preparation.success &&
      preparation.coinFlipEffects &&
      preparation.coinFlipEffects.length > 0
    ) {
      // Set up the coin flip queue - no processing yet
      setCoinFlipQueue({
        effects: preparation.coinFlipEffects,
        cardInstanceId,
        cardsToDiscard: preparation.cardsToDiscard,
      });
      return; // Wait for coin flip animations to complete
    }

    // No coin flips, process the card play immediately (game logic)
    const playResult = handlePlayCard(cardInstanceId);

    if (!playResult.success) {
      return; // Stop if card play failed
    }

    // Start visual-only animation
    setIsAnimating(true);
    setAnimatingCardIds((prev) => new Set(prev).add(cardInstanceId));

    // Animate card to graveyard
    animationLayerRef.current.animateCardToGraveyard(
      cardInstance,
      cardElement,
      graveyardRef.current,
      () => {
        // Animation complete - remove from animating set
        setAnimatingCardIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cardInstanceId);
          return newSet;
        });

        // If there are cards to draw from effects, animate them now
        if (playResult.cardsToDraw && playResult.cardsToDraw > 0) {
          console.log(
            `Drawing ${playResult.cardsToDraw} cards from card effects`
          );
          drawCards(playResult.cardsToDraw, () => {
            setIsAnimating(false);
          });
        } else {
          setIsAnimating(false);
        }
      }
    );
  };

  // Visual-only animation for simple card to graveyard
  const handleVisualCardToGraveyardAnimation = (
    cardElement: HTMLElement,
    cardInstanceId: string
  ) => {
    // Find the card instance in the updated game state (it should be in graveyard now)
    const cardInstance = gameState.piles.graveyard.find(
      (card) => card.instanceId === cardInstanceId
    );

    if (!cardInstance) {
      // Card not found, just clean up animation state
      setIsAnimating(false);
      setAnimatingCardIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardInstanceId);
        return newSet;
      });
      return;
    }

    // Pure visual animation - no game logic
    animationLayerRef.current!.animateCardToGraveyard(
      cardInstance,
      cardElement,
      graveyardRef.current!,
      () => {
        // Animation complete - just clean up UI state
        setIsAnimating(false);
        setAnimatingCardIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cardInstanceId);
          return newSet;
        });
      }
    );
  };

  // Visual-only animation for cards with discard requirements
  const handleVisualDiscardAnimation = (
    cardElement: HTMLElement,
    cardsToDiscard: CardInstance[],
    mainCardInstanceId: string
  ) => {
    // Find the main card in graveyard (game state already updated)
    const mainCard = gameState.piles.graveyard.find(
      (card) => card.instanceId === mainCardInstanceId
    );

    if (!mainCard) {
      setIsAnimating(false);
      setAnimatingCardIds(new Set());
      return;
    }

    let completedAnimations = 0;
    const totalAnimations = 1 + cardsToDiscard.length;

    const completeVisualAnimation = () => {
      completedAnimations++;
      if (completedAnimations === totalAnimations) {
        // All visual animations complete
        setIsAnimating(false);
        setAnimatingCardIds(new Set());
      }
    };

    // Animate main card to graveyard (visual only)
    animationLayerRef.current!.animateCardToGraveyard(
      mainCard,
      cardElement,
      graveyardRef.current!,
      completeVisualAnimation
    );

    // Animate discarded cards to discard pile (visual only)
    cardsToDiscard.forEach((discardCard) => {
      const discardElement = cardElements[discardCard.instanceId];
      if (discardElement && discardRef.current) {
        animationLayerRef.current!.animateCardToDiscard(
          discardCard,
          discardElement,
          discardRef.current,
          completeVisualAnimation
        );
      } else {
        completeVisualAnimation();
      }
    });
  };

  // Handle all coin flip effects completion
  const handleAllCoinFlipsComplete = (
    results: Array<{
      effect: CoinFlipEffect;
      result: 'heads' | 'tails';
      resolvedValue: number;
    }>
  ) => {
    const { cardInstanceId, cardsToDiscard } = coinFlipQueue;

    if (!cardInstanceId) {
      console.error('No card instance ID in coin flip queue');
      return;
    }

    // Clear the queue
    setCoinFlipQueue({
      effects: [],
    });

    // Now process the card with predetermined coin flip results
    try {
      const result = gameEngine.processActionWithPredeterminedCoinFlips(
        {
          type: 'PLAY_CARD',
          cardInstanceId,
        },
        results
      );

      if (result.success && result.newState) {
        setGameState(result.newState);

        // Check for game over conditions
        const winCondition = checkWinCondition(result.newState);
        const loseCondition = checkLoseCondition(result.newState);

        if (winCondition) {
          setGameOver({
            isGameOver: true,
            won: true,
            message: 'Congratulations! You won!',
          });
          setShowParticles(true);
        } else if (loseCondition) {
          setGameOver({
            isGameOver: true,
            won: false,
            message: 'Game Over! Try again.',
          });
        }

        const playResult = {
          success: true,
          drawnCards: [],
        };

        if (playResult.success) {
          // Start visual-only animation
          setIsAnimating(true);
          setAnimatingCardIds((prev) => new Set(prev).add(cardInstanceId));

          const cardElement = cardElements[cardInstanceId];
          if (cardElement) {
            if (cardsToDiscard && cardsToDiscard.length > 0) {
              // Animate discard requirements (visual only)
              handleVisualDiscardAnimation(
                cardElement,
                cardsToDiscard,
                cardInstanceId
              );
            } else {
              // Simple card to graveyard animation (visual only)
              handleVisualCardToGraveyardAnimation(cardElement, cardInstanceId);
            }

            // Handle draw animations if any cards were drawn
            if (playResult.drawnCards && playResult.drawnCards.length > 0) {
              const drawnCardIds: string[] = playResult.drawnCards.map(
                (card: CardInstance) => card.instanceId
              );
              setAnimatingCardIds(
                (prev) => new Set<string>([...prev, ...drawnCardIds])
              );

              handleDrawCardsAnimated(playResult.drawnCards, () => {
                // Draw animations complete
              });
            }
          }
        }
      } else {
        console.error('Card play failed after coin flip:', result.error);
        // Reset animation states
        setIsAnimating(false);
        setAnimatingCardIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cardInstanceId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error processing card after coin flip:', error);
      // Reset animation states
      setIsAnimating(false);
      setAnimatingCardIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardInstanceId);
        return newSet;
      });
    }
  };

  const handleEndTurn = () => {
    try {
      const result = gameEngine.processAction({ type: 'END_TURN' });

      if (result.success && result.newState) {
        setGameState(result.newState);
      } else {
        console.error('Error ending turn:', result.error);
        // Handle insufficient cards case
        if (result.error && result.error.includes('cards')) {
          setGameOver({
            isGameOver: true,
            won: false,
            message: 'Not enough cards to continue playing!',
          });
        }
      }
    } catch (error) {
      console.error('Error ending turn:', error);
    }
  };

  // Handle animated card drawing from deck to hand
  const handleDrawCardsAnimated = (
    cardsToDraw: CardInstance[],
    onComplete: () => void
  ) => {
    if (!deckRef.current || cardsToDraw.length === 0) {
      onComplete();
      return;
    }

    let completedAnimations = 0;
    const totalCards = cardsToDraw.length;

    // NOTE: Cards should already be in animating state when this function is called
    // We don't set animating state here anymore, just manage the individual card completions

    const completeDrawAnimation = (cardInstanceId: string) => {
      completedAnimations++;

      // Remove this specific card from animating state so it appears in hand
      setAnimatingCardIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardInstanceId);
        return newSet;
      });

      if (completedAnimations === totalCards) {
        onComplete();
      }
    };

    // Animate all cards from deck to hand with short stagger
    cardsToDraw.forEach((cardInstance, index) => {
      setTimeout(() => {
        // Find hand area element - approximate position
        const handArea = document.querySelector(
          '[class*="handArea"]'
        ) as HTMLElement;
        const targetElement = handArea || document.body;

        animationLayerRef.current?.animateCardFromDeck(
          cardInstance,
          deckRef.current!,
          targetElement,
          () => completeDrawAnimation(cardInstance.instanceId)
        );
      }, index * 150); // 150ms stagger between cards
    });
  };

  // Unified function to draw cards with animation (used by both end turn and card effects)
  const drawCards = (numCards: number, onComplete: () => void) => {
    const currentState = gameEngine.getGameState()!;
    const drawPlan = gameEngine.getDrawCardsPlan(currentState, numCards);

    if (!drawPlan.canDraw) {
      console.error(
        `Cannot draw ${numCards} cards - insufficient cards available`
      );
      onComplete();
      return;
    }

    if (drawPlan.needsShuffle) {
      // Draw what we can from deck first, then shuffle, then draw remaining
      const deckCards = Math.min(drawPlan.deckCards, numCards);

      if (deckCards > 0) {
        // Draw available cards from deck first
        animateDrawFromDeck(currentState, deckCards, () => {
          // After first draw, animate shuffle and draw remaining
          animateShuffleAndDrawRemaining(
            currentState,
            numCards - deckCards,
            onComplete
          );
        });
      } else {
        // No cards in deck, just shuffle and draw all
        animateShuffleAndDrawRemaining(currentState, numCards, onComplete);
      }
    } else {
      // No shuffle needed, just draw all cards
      animateDrawFromDeck(currentState, numCards, onComplete);
    }
  };

  // New animated end turn handler with shuffle support
  const handleEndTurnAnimated = () => {
    if (!animationLayerRef.current || !discardRef.current || !deckRef.current) {
      // Fall back to immediate turn end if animations aren't available
      handleEndTurn();
      return;
    }

    setIsAnimating(true);

    // Step 1: Get the current game state (may have been updated by tech debt reduction)
    const currentGameState = gameEngine.getGameState()!;
    const stateAfterDiscard = {
      ...currentGameState,
      piles: {
        ...currentGameState.piles,
        hand: [],
        discard: [
          ...currentGameState.piles.discard,
          ...currentGameState.piles.hand,
        ],
      },
    };

    const drawPlan = gameEngine.getDrawCardsPlan(stateAfterDiscard, 5);

    if (!drawPlan.canDraw) {
      // Can't draw enough cards - end game
      setIsAnimating(false);
      handleEndTurn(); // This will trigger lose condition
      return;
    }

    // Start the animation sequence
    if (currentGameState.piles.hand.length > 0) {
      // Step 1: Animate cards to discard pile, then draw new hand
      animateCardsToDiscardForEndTurn(currentGameState, () => {
        // After discard, draw 5 new cards
        drawCards(5, () => {
          completeEndTurn();
        });
      });
    } else {
      // No cards to discard, just draw new hand
      drawCards(5, () => {
        completeEndTurn();
      });
    }
  };

  // Simple function to animate cards to discard pile for end turn
  const animateCardsToDiscardForEndTurn = (
    currentGameState: GameState,
    onComplete: () => void
  ) => {
    const cardsToDiscard = [...currentGameState.piles.hand];
    const handCardElements = cardsToDiscard
      .map((card) => cardElements[card.instanceId])
      .filter(Boolean);

    if (handCardElements.length === 0) {
      // No elements to animate, do immediate discard
      const stateAfterDiscard = {
        ...currentGameState,
        piles: {
          ...currentGameState.piles,
          hand: [],
          discard: [...currentGameState.piles.discard, ...cardsToDiscard],
        },
      };
      setGameState(stateAfterDiscard);
      gameEngine.updateGameState(stateAfterDiscard);
      onComplete();
      return;
    }

    // Mark cards as animating
    const cardIds = cardsToDiscard.map((card) => card.instanceId);
    setAnimatingCardIds(new Set(cardIds));

    let completedAnimations = 0;
    const totalCards = cardsToDiscard.length;

    cardsToDiscard.forEach((cardInstance, index) => {
      const cardElement = handCardElements[index];
      if (!cardElement) {
        completedAnimations++;
        if (completedAnimations === totalCards) {
          completeDiscardForEndTurn(currentGameState, onComplete);
        }
        return;
      }

      animationLayerRef.current?.animateCardToDiscard(
        cardInstance,
        cardElement,
        discardRef.current!,
        () => {
          completedAnimations++;
          if (completedAnimations === totalCards) {
            completeDiscardForEndTurn(currentGameState, onComplete);
          }
        }
      );
    });
  };

  const completeDiscardForEndTurn = (
    originalGameState: GameState,
    onComplete: () => void
  ) => {
    // Update game state after discard animation
    const stateAfterDiscard = {
      ...originalGameState,
      piles: {
        ...originalGameState.piles,
        hand: [],
        discard: [
          ...originalGameState.piles.discard,
          ...originalGameState.piles.hand,
        ],
      },
    };
    setGameState(stateAfterDiscard);
    gameEngine.updateGameState(stateAfterDiscard);
    setAnimatingCardIds(new Set());
    onComplete();
  };

  const animateCardsToDiscardForNewTurn = (
    drawPlan: {
      canDraw: boolean;
      deckCards: number;
      needsShuffle: boolean;
      discardCards: number;
      totalAvailable: number;
    },
    currentGameState: GameState
  ) => {
    const cardsToDiscard = [...currentGameState.piles.hand];
    const handCardElements = cardsToDiscard
      .map((card) => cardElements[card.instanceId])
      .filter(Boolean);

    if (handCardElements.length === 0) {
      // No elements to animate, do immediate discard
      const stateAfterDiscard = {
        ...currentGameState,
        piles: {
          ...currentGameState.piles,
          hand: [],
          discard: [...currentGameState.piles.discard, ...cardsToDiscard],
        },
      };
      setGameState(stateAfterDiscard);
      gameEngine.updateGameState(stateAfterDiscard);
      handleDrawingSequence(stateAfterDiscard, drawPlan);
      return;
    }

    // Mark cards as animating
    const cardIds = cardsToDiscard.map((card) => card.instanceId);
    setAnimatingCardIds(new Set(cardIds));

    let completedAnimations = 0;
    const totalCards = cardsToDiscard.length;

    cardsToDiscard.forEach((cardInstance, index) => {
      const cardElement = handCardElements[index];
      if (!cardElement) {
        completedAnimations++;
        if (completedAnimations === totalCards) {
          completeDiscardStep(drawPlan, currentGameState);
        }
        return;
      }

      animationLayerRef.current?.animateCardToDiscard(
        cardInstance,
        cardElement,
        discardRef.current!,
        () => {
          completedAnimations++;
          if (completedAnimations === totalCards) {
            completeDiscardStep(drawPlan, currentGameState);
          }
        }
      );
    });
  };

  const completeDiscardStep = (
    drawPlan: {
      canDraw: boolean;
      deckCards: number;
      needsShuffle: boolean;
      discardCards: number;
      totalAvailable: number;
    },
    originalGameState: GameState
  ) => {
    // Update game state after discard animation - use the original state that may include tech debt reduction
    const stateAfterDiscard = {
      ...originalGameState,
      piles: {
        ...originalGameState.piles,
        hand: [],
        discard: [
          ...originalGameState.piles.discard,
          ...originalGameState.piles.hand,
        ],
      },
    };
    setGameState(stateAfterDiscard);
    gameEngine.updateGameState(stateAfterDiscard);
    setAnimatingCardIds(new Set());

    // Step 2: Start drawing sequence
    handleDrawingSequence(stateAfterDiscard, drawPlan);
  };

  const handleDrawingSequence = (
    currentState: GameState,
    drawPlan: {
      canDraw: boolean;
      deckCards: number;
      needsShuffle: boolean;
      discardCards: number;
      totalAvailable: number;
    }
  ) => {
    if (drawPlan.needsShuffle) {
      // Draw what we can from deck first, then shuffle, then draw remaining
      const deckCards = Math.min(drawPlan.deckCards, 5);

      if (deckCards > 0) {
        // Draw available cards from deck first
        animateDrawFromDeck(currentState, deckCards, () => {
          // After first draw, animate shuffle
          animateShuffleAndDrawRemaining(currentState, 5 - deckCards);
        });
      } else {
        // No cards in deck, just shuffle and draw all
        animateShuffleAndDrawRemaining(currentState, 5);
      }
    } else {
      // No shuffle needed, just draw all 5 cards
      animateDrawFromDeck(currentState, 5, () => {
        completeEndTurn();
      });
    }
  };

  const animateDrawFromDeck = (
    currentState: GameState,
    cardCount: number,
    onComplete: () => void
  ) => {
    if (cardCount === 0) {
      onComplete();
      return;
    }

    // Get the cards that would be drawn
    const { newState, drawnCards } = gameEngine.performDraw(
      currentState,
      cardCount
    );

    // Update game state with drawn cards and sync game engine
    setGameState(newState);
    gameEngine.updateGameState(newState);

    // Mark drawn cards as animating (so they're hidden during animation)
    const drawnCardIds = new Set(
      drawnCards.map((card: CardInstance) => card.instanceId)
    );
    setAnimatingCardIds(drawnCardIds);

    // Animation completion tracking
    let completedAnimations = 0;
    const completeDrawAnimation = (cardId: string) => {
      // Remove this specific card from animating set so it appears in hand immediately
      setAnimatingCardIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });

      // Track completion for final callback
      completedAnimations++;
      if (completedAnimations === drawnCards.length) {
        onComplete(); // All cards already individually removed from animating set
      }
    };

    // Find hand area element - use the same approach as existing code
    const handArea = document.querySelector(
      '[class*="handArea"]'
    ) as HTMLElement;
    const targetElement = handArea || document.body;

    // Animate each card from deck to hand with stagger
    drawnCards.forEach((card: CardInstance, index: number) => {
      setTimeout(() => {
        animationLayerRef.current?.animateCardFromDeck(
          card,
          deckRef.current!,
          targetElement,
          () => completeDrawAnimation(card.instanceId)
        );
      }, index * 150); // 150ms stagger between cards
    });
  };

  const animateShuffleAndDrawRemaining = (
    _originalState: GameState,
    remainingCards: number,
    onComplete: () => void
  ) => {
    // Get current game state which includes already drawn cards
    const currentStateWithDrawnCards = gameEngine.getGameState()!;

    // First animate shuffle from discard to deck
    animationLayerRef.current?.animateDiscardToDeck(
      currentStateWithDrawnCards.piles.discard.length,
      discardRef.current!,
      deckRef.current!,
      () => {
        // Update game state after shuffle - this preserves the already drawn cards in hand
        const stateAfterShuffle = gameEngine.performShuffle(
          currentStateWithDrawnCards
        );
        setGameState(stateAfterShuffle);
        gameEngine.updateGameState(stateAfterShuffle);

        // Then draw remaining cards - this will add to the existing hand
        animateDrawFromDeck(stateAfterShuffle, remainingCards, onComplete);
      }
    );
  };

  const completeEndTurn = () => {
    // Use a timeout to ensure the latest game state is used
    setTimeout(() => {
      setGameState((currentState) => {
        // Add the round progression and PP replenishment to current state
        const newState = {
          ...currentState,
          stats: {
            ...currentState.stats,
            currentRound: currentState.stats.currentRound + 1,
          },
          resources: {
            ...currentState.resources,
            productivityPoints: Math.max(
              0,
              20 - currentState.resources.technicalDebt
            ),
          },
          // Add round_start to history so tech debt reduction becomes available
          history: [
            ...currentState.history,
            {
              round: currentState.stats.currentRound + 1,
              action: 'round_start' as const,
              stateBefore: currentState.resources,
              stateAfter: {
                ...currentState.resources,
                productivityPoints: Math.max(
                  0,
                  20 - currentState.resources.technicalDebt
                ),
              },
              timestamp: Date.now(),
            },
          ],
        };
        // Sync the game engine state
        gameEngine.updateGameState(newState);
        return newState;
      });
      setIsAnimating(false);
      setAnimatingCardIds(new Set());
    }, 0);
  };

  // Old methods below are now replaced by the new animation system above
  // Keeping them for reference but they should eventually be removed

  // Animated discard handler for end turn
  const handleDiscardAllCardsWithAnimationForEndTurn = (
    elementsToAnimate: HTMLElement[],
    cardsToDraw?: CardInstance[]
  ) => {
    const cardsToDiscard = [...gameState.piles.hand];

    if (
      cardsToDiscard.length === 0 ||
      !animationLayerRef.current ||
      !discardRef.current
    ) {
      if (cardsToDraw && cardsToDraw.length > 0) {
        // Skip discard, go straight to draw animation
        // Add new cards to animating state BEFORE processing end turn
        const newAnimatingIds = new Set(
          cardsToDraw.map((card) => card.instanceId)
        );
        setAnimatingCardIds(newAnimatingIds);

        // Process end turn (this adds cards to game state)
        handleEndTurn();

        // Then start draw animations (cards are hidden by animatingCardIds)
        handleDrawCardsAnimated(cardsToDraw, () => {
          setIsAnimating(false);
        });
      } else {
        setIsAnimating(false);
        setAnimatingCardIds(new Set());
        handleEndTurn();
      }
      return;
    }

    // Animate all cards to discard pile with staggered timing
    let completedAnimations = 0;
    const totalCards = cardsToDiscard.length;

    cardsToDiscard.forEach((cardInstance, index) => {
      const cardElement = elementsToAnimate[index];

      if (!cardElement) {
        completedAnimations++;
        if (completedAnimations === totalCards) {
          // After discarding, clear animating IDs and process end turn first
          setAnimatingCardIds(new Set()); // Clear animating card IDs

          if (cardsToDraw && cardsToDraw.length > 0) {
            // Add new cards to animating state BEFORE processing end turn
            const newAnimatingIds = new Set(
              cardsToDraw.map((card) => card.instanceId)
            );
            setAnimatingCardIds(newAnimatingIds);

            // Process end turn (this adds cards to game state)
            handleEndTurn();

            // Then start draw animations (cards are hidden by animatingCardIds)
            handleDrawCardsAnimated(cardsToDraw, () => {
              setIsAnimating(false);
            });
          } else {
            handleEndTurn();
            setIsAnimating(false);
          }
        }
        return;
      }

      // Start all animations immediately (no stagger)
      animationLayerRef.current?.animateCardToDiscard(
        cardInstance,
        cardElement,
        discardRef.current!,
        () => {
          completedAnimations++;
          // When all discard animations are done, process end turn then animate drawing
          if (completedAnimations === totalCards) {
            setAnimatingCardIds(new Set()); // Clear animating card IDs

            if (cardsToDraw && cardsToDraw.length > 0) {
              // Add new cards to animating state BEFORE processing end turn
              const newAnimatingIds = new Set(
                cardsToDraw.map((card) => card.instanceId)
              );
              setAnimatingCardIds(newAnimatingIds);

              // Process end turn (this adds cards to game state)
              handleEndTurn();

              // Then start draw animations (cards are hidden by animatingCardIds)
              handleDrawCardsAnimated(cardsToDraw, () => {
                setIsAnimating(false);
              });
            } else {
              handleEndTurn();
              setIsAnimating(false);
            }
          }
        }
      );
    });
  };

  // Unified tech debt reduction that uses the end turn flow
  const handleTechnicalDebtReductionAnimated = () => {
    try {
      // First, reduce technical debt by 2 using the game engine
      const result = gameEngine.reduceTechnicalDebt();

      if (!result.success || !result.newState) {
        console.error('Error reducing technical debt:', result.error);
        return;
      }

      // Update component state to match
      setGameState(result.newState);

      // Then use the unified end turn animation flow
      handleEndTurnAnimated();
    } catch (error) {
      console.error('Error reducing technical debt:', error);
    }
  };

  const handleNewGame = () => {
    const newGameState = gameEngine.createNewGame();
    setGameState(newGameState);
    setShowParticles(false);
    setIsAnimating(false);
    setAnimatingCardIds(new Set());
    setGameOver({
      isGameOver: false,
      won: false,
      message: '',
    });
    setCoinFlipQueue({
      effects: [],
    });
  };

  // Animation variants
  const boardVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
    exit: { opacity: 0 },
  };

  const sectionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
  };

  return (
    <AnimationLayer ref={animationLayerRef}>
      <motion.div
        className={styles.gameBoard}
        variants={boardVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <motion.div className={styles.header} variants={sectionVariants}>
          <GameInfo gameState={gameState} onReturnToMenu={onReturnToMenu} />
          <ResourceDisplay gameState={gameState} />
        </motion.div>

        <motion.div className={styles.gameArea} variants={sectionVariants}>
          <motion.div
            className={styles.piles}
            initial="initial"
            animate="animate"
            variants={{
              initial: { opacity: 0 },
              animate: {
                opacity: 1,
                transition: { staggerChildren: 0.1 },
              },
            }}
          >
            <Pile
              ref={deckRef}
              type="deck"
              cardCount={gameState.piles.deck.length}
            />

            <Pile
              ref={discardRef}
              type="discard"
              cardCount={gameState.piles.discard.length}
            />

            <Pile
              ref={graveyardRef}
              type="graveyard"
              cardCount={gameState.piles.graveyard.length}
            />
          </motion.div>

          <motion.div className={styles.handArea} variants={sectionVariants}>
            <Hand
              cards={gameState.piles.hand.filter(
                (card) => !animatingCardIds.has(card.instanceId)
              )}
              onPlayCard={handlePlayCardWithAnimation}
              onCardMount={handleCardMount}
              onCardUnmount={handleCardUnmount}
              animatingCardIds={animatingCardIds}
              gameState={gameState}
              disabled={
                gameOver.isGameOver ||
                isAnimating ||
                coinFlipQueue.effects.length > 0
              }
            />
          </motion.div>

          <motion.div className={styles.actions} variants={sectionVariants}>
            <GameActions
              onEndTurn={handleEndTurnAnimated}
              onTechnicalDebtReduction={handleTechnicalDebtReductionAnimated}
              gameState={gameState}
              disabled={
                gameOver.isGameOver ||
                isAnimating ||
                coinFlipQueue.effects.length > 0
              }
            />
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {gameOver.isGameOver && (
            <motion.div
              className={styles.gameOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className={styles.gameOverContent}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                    delay: 0.1,
                  },
                }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  y: 50,
                  transition: { duration: 0.2 },
                }}
              >
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {gameOver.won ? '🎉 Victory!' : '💥 Game Over'}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {gameOver.message}
                </motion.p>

                {gameOver.won && (
                  <>
                    <motion.p
                      className={styles.finalScore}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, type: 'spring' }}
                    >
                      Final Score: {gameState.stats.finalScore} points
                    </motion.p>

                    <motion.div
                      className={styles.scoreBreakdown}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <div className={styles.scoreStat}>
                        <span>🏆 Rounds:</span> {gameState.stats.currentRound}
                      </div>
                      <div className={styles.scoreStat}>
                        <span>🃏 Cards Played:</span>{' '}
                        {gameState.stats.cardsPlayed}
                      </div>
                      <div className={styles.scoreStat}>
                        <span>⏱️ Time:</span>{' '}
                        {Math.round(
                          ((gameState.stats.endTime! -
                            gameState.stats.startTime) /
                            1000 /
                            60) *
                            10
                        ) / 10}
                        m
                      </div>
                    </motion.div>
                  </>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.button
                    className={styles.newGameButton}
                    onClick={handleNewGame}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    New Game
                  </motion.button>
                  <motion.button
                    className={styles.menuButton}
                    onClick={onReturnToMenu}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    Main Menu
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <ParticleEffect
          isActive={showParticles}
          type="celebration"
          onComplete={() => setShowParticles(false)}
        />

        {/* Coin flip overlay */}
        <CoinFlipOverlay
          queue={coinFlipQueue.effects}
          onAllComplete={handleAllCoinFlipsComplete}
          cardInstanceId={coinFlipQueue.cardInstanceId || ''}
        />
      </motion.div>
    </AnimationLayer>
  );
}

export default GameBoard;
