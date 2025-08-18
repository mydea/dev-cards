import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, GameEngine, CardInstance } from '@dev-cards/data';
import { checkWinCondition, checkLoseCondition } from '@dev-cards/data';
import GameInfo from '../UI/GameInfo';
import ResourceDisplay from '../UI/ResourceDisplay';
import GameActions from '../UI/GameActions';
import ParticleEffect from '../UI/ParticleEffect';
import AnimationLayer, { type AnimationLayerRef } from '../UI/AnimationLayer';
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

  const handlePlayCard = (cardInstanceId: string) => {
    try {
      const result = gameEngine.processAction({
        type: 'PLAY_CARD',
        cardInstanceId,
      });

      if (result.success && result.newState) {
        setGameState(result.newState);
      } else {
        console.error('Error playing card:', result.error);
      }
    } catch (error) {
      console.error('Error playing card:', error);
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

    // Prepare the card play to see if it has discard requirements
    const preparation = gameEngine.prepareCardPlay(cardInstanceId);

    if (!preparation.success) {
      console.error('Card preparation failed:', preparation.error);
      return;
    }

    // Check if there are cards to discard as requirements
    const hasDiscardRequirements =
      preparation.cardsToDiscard && preparation.cardsToDiscard.length > 0;

    if (hasDiscardRequirements) {
      // Handle card with discard requirements
      handleCardWithDiscardRequirements(
        cardInstanceId,
        cardElement,
        preparation.cardsToDiscard || []
      );
    } else {
      // Handle normal card without discard requirements
      handleNormalCardAnimation(cardInstanceId, cardElement);
    }
  };

  // Handle normal card animation (no discard requirements)
  const handleNormalCardAnimation = (
    cardInstanceId: string,
    cardElement: HTMLElement
  ) => {
    const cardInstance = gameState.piles.hand.find(
      (card) => card.instanceId === cardInstanceId
    );

    if (!cardInstance) return;

    // Start animation state
    setIsAnimating(true);
    setAnimatingCardIds((prev) => new Set(prev).add(cardInstanceId));

    // Trigger the animation first
    animationLayerRef.current!.animateCardToGraveyard(
      cardInstance,
      cardElement,
      graveyardRef.current!,
      () => {
        // After animation completes, process the actual card action
        try {
          const result = gameEngine.processAction({
            type: 'PLAY_CARD',
            cardInstanceId,
          });

          if (result.success && result.newState) {
            // Check if any cards were drawn from effects
            const drawnCards = result.data?.appliedEffects
              ?.flatMap((effect: any) => effect.drawnCards || [])
              .filter(Boolean);

            if (drawnCards && drawnCards.length > 0) {
              // Add drawn cards to animating state BEFORE updating game state
              const drawnCardIds = new Set(
                drawnCards.map((card) => card.instanceId)
              );
              setAnimatingCardIds(
                (prev) => new Set([...prev, ...drawnCardIds])
              );

              // Update game state (cards are now in hand but hidden by animating state)
              setGameState(result.newState);

              // Animate the drawn cards
              handleDrawCardsAnimated(drawnCards, () => {
                setIsAnimating(false);
                setAnimatingCardIds((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(cardInstanceId);
                  return newSet;
                });
              });
            } else {
              // No cards drawn, just update state and finish
              setGameState(result.newState);
              setIsAnimating(false);
              setAnimatingCardIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(cardInstanceId);
                return newSet;
              });
            }
          } else {
            console.error('Error playing card:', result.error);
            setIsAnimating(false);
            setAnimatingCardIds((prev) => {
              const newSet = new Set(prev);
              newSet.delete(cardInstanceId);
              return newSet;
            });
          }
        } catch (error) {
          console.error('Error playing card:', error);
          setIsAnimating(false);
          setAnimatingCardIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(cardInstanceId);
            return newSet;
          });
        }
      }
    );
  };

  // Handle card with discard requirements
  const handleCardWithDiscardRequirements = (
    cardInstanceId: string,
    cardElement: HTMLElement,
    cardsToDiscard: CardInstance[]
  ) => {
    const cardInstance = gameState.piles.hand.find(
      (card) => card.instanceId === cardInstanceId
    );

    if (!cardInstance) return;

    // Start animation state
    setIsAnimating(true);

    // Mark all cards that will be animated
    const allAnimatingCards = [
      cardInstanceId,
      ...cardsToDiscard.map((c) => c.instanceId),
    ];
    setAnimatingCardIds(new Set(allAnimatingCards));

    let completedAnimations = 0;
    const totalAnimations = 1 + cardsToDiscard.length;

    const completeAnimation = () => {
      completedAnimations++;
      if (completedAnimations === totalAnimations) {
        // All animations complete, now process the card
        try {
          const result = gameEngine.processAction({
            type: 'PLAY_CARD',
            cardInstanceId,
          });

          if (result.success && result.newState) {
            // Check if any cards were drawn from effects
            const drawnCards = result.data?.appliedEffects
              ?.flatMap((effect: any) => effect.drawnCards || [])
              .filter(Boolean);

            if (drawnCards && drawnCards.length > 0) {
              // Add drawn cards to animating state BEFORE updating game state
              const drawnCardIds = new Set(
                drawnCards.map((card) => card.instanceId)
              );
              setAnimatingCardIds(
                (prev) => new Set([...prev, ...drawnCardIds])
              );

              // Update game state (cards are now in hand but hidden by animating state)
              setGameState(result.newState);

              // Animate the drawn cards
              handleDrawCardsAnimated(drawnCards, () => {
                setIsAnimating(false);
                setAnimatingCardIds(new Set());
              });
            } else {
              // No cards drawn, just update state and finish
              setGameState(result.newState);
              setIsAnimating(false);
              setAnimatingCardIds(new Set());
            }
          } else {
            console.error('Error playing card:', result.error);
            setIsAnimating(false);
            setAnimatingCardIds(new Set());
          }
        } catch (error) {
          console.error('Error playing card:', error);
          setIsAnimating(false);
          setAnimatingCardIds(new Set());
        }
      }
    };

    // Animate the main card to graveyard
    animationLayerRef.current!.animateCardToGraveyard(
      cardInstance,
      cardElement,
      graveyardRef.current!,
      completeAnimation
    );

    // Animate requirement discards to discard pile
    cardsToDiscard.forEach((discardCard) => {
      const discardElement = cardElements[discardCard.instanceId];
      if (discardElement && discardRef.current) {
        animationLayerRef.current!.animateCardToDiscard(
          discardCard,
          discardElement,
          discardRef.current,
          completeAnimation
        );
      } else {
        completeAnimation();
      }
    });
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
      }, index * 50); // 50ms stagger between cards - faster than before
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

  const pileVariants = {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
    tap: { scale: 0.95 },
    hover: {
      scale: 1.05,
      y: -4,
      transition: { duration: 0.2 },
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
            <motion.div
              className={styles.pile}
              variants={pileVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <motion.div
                ref={deckRef}
                className={styles.pileCard}
                data-type="deck"
                animate={{
                  boxShadow:
                    gameState.piles.deck.length > 0
                      ? '0 4px 8px rgba(0, 0, 0, 0.1), 0 0 20px rgba(59, 130, 246, 0.3)'
                      : '0 2px 4px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div className={styles.pileLabel}>Draw Pile</div>
                <motion.div
                  className={styles.pileCount}
                  key={`deck-${gameState.piles.deck.length}`}
                  initial={{ scale: 1.2, color: '#3b82f6' }}
                  animate={{ scale: 1, color: 'inherit' }}
                  transition={{ duration: 0.3 }}
                >
                  {gameState.piles.deck.length}
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              className={styles.pile}
              variants={pileVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <motion.div
                ref={discardRef}
                className={styles.pileCard}
                data-type="discard"
                animate={{
                  boxShadow:
                    gameState.piles.discard.length > 0
                      ? '0 4px 8px rgba(0, 0, 0, 0.1), 0 0 20px rgba(168, 85, 247, 0.3)'
                      : '0 2px 4px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div className={styles.pileLabel}>Discard</div>
                <motion.div
                  className={styles.pileCount}
                  key={`discard-${gameState.piles.discard.length}`}
                  initial={{ scale: 1.2, color: '#a855f7' }}
                  animate={{ scale: 1, color: 'inherit' }}
                  transition={{ duration: 0.3 }}
                >
                  {gameState.piles.discard.length}
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              className={styles.pile}
              variants={pileVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <motion.div
                ref={graveyardRef}
                className={styles.pileCard}
                data-type="graveyard"
                animate={{
                  boxShadow:
                    gameState.piles.graveyard.length > 0
                      ? '0 4px 8px rgba(0, 0, 0, 0.1), 0 0 20px rgba(239, 68, 68, 0.3)'
                      : '0 2px 4px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div className={styles.pileLabel}>Graveyard</div>
                <motion.div
                  className={styles.pileCount}
                  key={`graveyard-${gameState.piles.graveyard.length}`}
                  initial={{ scale: 1.2, color: '#ef4444' }}
                  animate={{ scale: 1, color: 'inherit' }}
                  transition={{ duration: 0.3 }}
                >
                  {gameState.piles.graveyard.length}
                </motion.div>
              </motion.div>
            </motion.div>
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
              disabled={gameOver.isGameOver || isAnimating}
            />
          </motion.div>

          <motion.div className={styles.actions} variants={sectionVariants}>
            <GameActions
              onEndTurn={handleEndTurnAnimated}
              onTechnicalDebtReduction={handleTechnicalDebtReductionAnimated}
              gameState={gameState}
              disabled={gameOver.isGameOver || isAnimating}
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
      </motion.div>
    </AnimationLayer>
  );
}

export default GameBoard;
