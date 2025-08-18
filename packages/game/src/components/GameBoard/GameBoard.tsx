import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  GameState,
  GameEngine,
  CardInstance,
  EffectResolution,
  CardEffect,
} from '@dev-cards/data';
import { checkWinCondition, checkLoseCondition } from '@dev-cards/data';
import GameInfo from '../UI/GameInfo';
import ResourceDisplay from '../UI/ResourceDisplay';
import GameActions from '../UI/GameActions';
import ParticleEffect from '../UI/ParticleEffect';
import AnimationLayer, { type AnimationLayerRef } from '../UI/AnimationLayer';
import Pile from '../UI/Pile';
import CoinFlip from '../UI/CoinFlip';
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

  // Coin flip animation state
  const [coinFlipState, setCoinFlipState] = useState<{
    isVisible: boolean;
    effects: Array<{
      effect: CardEffect;
      result: 'heads' | 'tails';
      resolvedValue: number;
    }>;
    currentIndex: number;
    cardInstanceId?: string;
  }>({
    isVisible: false,
    effects: [],
    currentIndex: 0,
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
        message: `Congratulations! You completed your project in ${gameState.stats.currentRound} rounds!`,
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
    drawnCards?: CardInstance[];
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

        // Check if any cards were drawn from effects
        const drawnCards: CardInstance[] = result.data?.appliedEffects
          ?.flatMap((effect: EffectResolution) => effect.drawnCards || [])
          .filter(Boolean);

        return {
          success: true,
          newState: result.newState,
          drawnCards: drawnCards.length > 0 ? drawnCards : undefined,
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
      // Start coin flip animations before processing card
      setCoinFlipState({
        isVisible: true,
        effects: preparation.coinFlipEffects,
        currentIndex: 0,
        cardInstanceId,
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

    if (
      preparation.success &&
      preparation.cardsToDiscard &&
      preparation.cardsToDiscard.length > 0
    ) {
      // Animate discard requirements (visual only)
      handleVisualDiscardAnimation(
        cardElement,
        preparation.cardsToDiscard,
        cardInstanceId
      );
    } else {
      // Simple card to graveyard animation (visual only)
      handleVisualCardToGraveyardAnimation(cardElement, cardInstanceId);
    }

    // Handle draw animations if any cards were drawn
    if (playResult.drawnCards && playResult.drawnCards.length > 0) {
      const drawnCardIds: string[] = playResult.drawnCards.map(
        (card) => card.instanceId as string
      );
      setAnimatingCardIds(
        (prev) => new Set<string>([...prev, ...drawnCardIds])
      );

      handleDrawCardsAnimated(playResult.drawnCards, () => {
        // Draw animations complete - don't need to do anything here
        // The individual card animations will handle their own cleanup
      });
    }
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

  // Handle coin flip animation completion
  const handleCoinFlipComplete = (_result: 'heads' | 'tails') => {
    const { effects, currentIndex, cardInstanceId } = coinFlipState;

    if (currentIndex < effects.length - 1) {
      // More coin flips to show
      setCoinFlipState((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
      }));
    } else {
      // All coin flips complete, hide overlay and process card
      setCoinFlipState({
        isVisible: false,
        effects: [],
        currentIndex: 0,
      });

      if (cardInstanceId) {
        // Process the card play now that animations are complete
        const playResult = handlePlayCard(cardInstanceId);

        if (playResult.success) {
          // Start visual-only animation
          setIsAnimating(true);
          setAnimatingCardIds((prev) => new Set(prev).add(cardInstanceId));

          const cardElement = cardElements[cardInstanceId];
          if (cardElement) {
            // Get the preparation again for visual animation
            const preparation = gameEngine.prepareCardPlay(cardInstanceId);

            if (
              preparation.success &&
              preparation.cardsToDiscard &&
              preparation.cardsToDiscard.length > 0
            ) {
              // Animate discard requirements (visual only)
              handleVisualDiscardAnimation(
                cardElement,
                preparation.cardsToDiscard,
                cardInstanceId
              );
            } else {
              // Simple card to graveyard animation (visual only)
              handleVisualCardToGraveyardAnimation(cardElement, cardInstanceId);
            }

            // Handle draw animations if any cards were drawn
            if (playResult.drawnCards && playResult.drawnCards.length > 0) {
              const drawnCardIds: string[] = playResult.drawnCards.map(
                (card) => card.instanceId as string
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
      }
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
      }, index * 100); // 100ms stagger between cards
    });
  };

  // Animated end turn handler
  const handleEndTurnAnimated = () => {
    // Prepare the end turn to get cards to draw
    const preparation = gameEngine.prepareEndTurn();
    if (!preparation.success) {
      console.error('End turn preparation failed:', preparation.error);
      // Fall back to normal end turn
      handleEndTurn();
      return;
    }

    if (gameState.piles.hand.length === 0) {
      // No cards to discard, just draw new cards
      setIsAnimating(true);

      if (preparation.cardsToDraw && preparation.cardsToDraw.length > 0) {
        // Add new cards to animating state BEFORE processing end turn
        const newAnimatingIds = new Set(
          preparation.cardsToDraw.map((card) => card.instanceId)
        );
        setAnimatingCardIds(newAnimatingIds);

        // Process end turn (this adds cards to game state)
        handleEndTurn();

        // Then start draw animations (cards are hidden by animatingCardIds)
        handleDrawCardsAnimated(preparation.cardsToDraw, () => {
          setIsAnimating(false);
        });
      } else {
        handleEndTurn();
        setIsAnimating(false);
      }
      return;
    }

    // Get card elements for cards in hand
    const handCardElements = gameState.piles.hand
      .map((card) => cardElements[card.instanceId])
      .filter(Boolean);

    if (handCardElements.length === 0) {
      handleEndTurn();
      return;
    }

    // Start animation state
    setIsAnimating(true);
    const cardIds = gameState.piles.hand.map((card) => card.instanceId);
    setAnimatingCardIds(new Set(cardIds));

    // Modify the discard animation to trigger draw animations after
    handleDiscardAllCardsWithAnimationForEndTurn(
      handCardElements,
      preparation.cardsToDraw || []
    );
  };

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

  const handleTechnicalDebtReduction = () => {
    try {
      const result = gameEngine.processAction({
        type: 'DISCARD_ALL_FOR_TD_REDUCTION',
      });

      if (result.success && result.newState) {
        setGameState(result.newState);
      } else {
        console.error('Error reducing technical debt:', result.error);
      }
    } catch (error) {
      console.error('Error reducing technical debt:', error);
    }
  };

  // Animated discard handler using tracked card elements
  const handleTechnicalDebtReductionAnimated = () => {
    if (gameState.piles.hand.length === 0) {
      handleTechnicalDebtReduction();
      return;
    }

    // Get card elements for cards in hand
    const handCardElements = gameState.piles.hand
      .map((card) => cardElements[card.instanceId])
      .filter(Boolean);

    if (handCardElements.length === 0) {
      handleTechnicalDebtReduction();
      return;
    }

    // Start animation state
    setIsAnimating(true);
    const cardIds = gameState.piles.hand.map((card) => card.instanceId);
    setAnimatingCardIds(new Set(cardIds));

    // Trigger animation directly
    handleDiscardAllCardsWithAnimation(handCardElements);
  };

  // Animated discard handler for multiple cards
  const handleDiscardAllCardsWithAnimation = (
    elementsToAnimate: HTMLElement[]
  ) => {
    const cardsToDiscard = [...gameState.piles.hand];

    if (
      cardsToDiscard.length === 0 ||
      !animationLayerRef.current ||
      !discardRef.current
    ) {
      setIsAnimating(false);
      setAnimatingCardIds(new Set());
      handleTechnicalDebtReduction();
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
          setIsAnimating(false);
          setAnimatingCardIds(new Set());
          handleTechnicalDebtReduction();
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
          // When all animations are done, process the game action
          if (completedAnimations === totalCards) {
            setIsAnimating(false);
            setAnimatingCardIds(new Set());
            handleTechnicalDebtReduction();
          }
        }
      );
    });
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
    setCoinFlipState({
      isVisible: false,
      effects: [],
      currentIndex: 0,
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
                gameOver.isGameOver || isAnimating || coinFlipState.isVisible
              }
            />
          </motion.div>

          <motion.div className={styles.actions} variants={sectionVariants}>
            <GameActions
              onEndTurn={handleEndTurnAnimated}
              onTechnicalDebtReduction={handleTechnicalDebtReductionAnimated}
              gameState={gameState}
              disabled={
                gameOver.isGameOver || isAnimating || coinFlipState.isVisible
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
                  <motion.p
                    className={styles.finalScore}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                  >
                    Final Score: {gameState.stats.currentRound} rounds
                  </motion.p>
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

        {/* Coin flip animation overlay */}
        <CoinFlip
          isVisible={coinFlipState.isVisible}
          result={
            coinFlipState.effects[coinFlipState.currentIndex]?.result || 'heads'
          }
          effect={
            coinFlipState.effects[coinFlipState.currentIndex]?.effect || {
              type: 'ADD_PROGRESS',
              headsValue: 0,
              tailsValue: 0,
            }
          }
          onComplete={handleCoinFlipComplete}
        />
      </motion.div>
    </AnimationLayer>
  );
}

export default GameBoard;
