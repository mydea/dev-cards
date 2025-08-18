import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, GameEngine } from '@dev-cards/data';
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

  // Animation refs
  const animationLayerRef = useRef<AnimationLayerRef>(null);
  const graveyardRef = useRef<HTMLDivElement>(null);
  const discardRef = useRef<HTMLDivElement>(null);

  // Track card elements for animations
  const [cardElements, setCardElements] = useState<{
    [cardId: string]: HTMLElement;
  }>({});

  const handleCardMount = (cardId: string, element: HTMLElement) => {
    console.log('Card mounted:', cardId, !!element);
    setCardElements((prev) => {
      // Only update if the element is different to prevent unnecessary re-renders
      if (prev[cardId] === element) return prev;
      return { ...prev, [cardId]: element };
    });
  };

  const handleCardUnmount = (cardId: string) => {
    console.log('Card unmounted:', cardId);
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
    const cardInstance = gameState.piles.hand.find(
      (card) => card.instanceId === cardInstanceId
    );

    if (!cardInstance || !animationLayerRef.current || !graveyardRef.current) {
      // Fallback to immediate play if animation isn't available
      handlePlayCard(cardInstanceId);
      return;
    }

    // Trigger the animation first
    animationLayerRef.current.animateCardToGraveyard(
      cardInstance,
      cardElement,
      graveyardRef.current,
      () => {
        // After animation completes, process the actual card action
        handlePlayCard(cardInstanceId);
      }
    );
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

  // Animated end turn handler
  const handleEndTurnAnimated = () => {
    console.log('handleEndTurnAnimated called');
    console.log('Cards in hand:', gameState.piles.hand.length);
    console.log('Tracked card elements:', Object.keys(cardElements));

    if (gameState.piles.hand.length === 0) {
      console.log('No cards in hand - immediate end turn');
      handleEndTurn();
      return;
    }

    // Get card elements for cards in hand
    const handCardElements = gameState.piles.hand
      .map((card) => cardElements[card.instanceId])
      .filter(Boolean);

    console.log(
      'Found',
      handCardElements.length,
      'card elements for end turn animation'
    );

    if (handCardElements.length === 0) {
      console.log('No card elements found - immediate end turn');
      handleEndTurn();
      return;
    }

    // Trigger animation for end turn (same as discard but for end turn)
    handleDiscardAllCardsWithAnimationForEndTurn(handCardElements);
  };

  // Animated discard handler for end turn (same logic as tech debt reduction)
  const handleDiscardAllCardsWithAnimationForEndTurn = (
    elementsToAnimate: HTMLElement[]
  ) => {
    const cardsToDiscard = [...gameState.piles.hand];

    console.log(
      'Starting end turn discard animation for',
      cardsToDiscard.length,
      'cards'
    );
    console.log(
      'Card elements received for end turn:',
      elementsToAnimate.length
    );

    if (
      cardsToDiscard.length === 0 ||
      !animationLayerRef.current ||
      !discardRef.current
    ) {
      console.log('Fallback to immediate end turn action');
      // Fallback to immediate action if no cards or animation isn't available
      handleEndTurn();
      return;
    }

    // Animate all cards to discard pile with staggered timing
    let completedAnimations = 0;
    const totalCards = cardsToDiscard.length;

    cardsToDiscard.forEach((cardInstance, index) => {
      const cardElement = elementsToAnimate[index];
      console.log(`End Turn - Card ${index}: element exists:`, !!cardElement);

      if (!cardElement) {
        completedAnimations++;
        if (completedAnimations === totalCards) {
          console.log(
            'All end turn animations complete (no elements) - processing game logic'
          );
          handleEndTurn();
        }
        return;
      }

      // Stagger the animation start times
      setTimeout(() => {
        console.log(
          `Starting end turn animation ${index} for card ${cardInstance.instanceId}`
        );
        animationLayerRef.current?.animateCardToDiscard(
          cardInstance,
          cardElement,
          discardRef.current!,
          () => {
            completedAnimations++;
            console.log(
              `End turn animation ${index} complete - ${completedAnimations}/${totalCards}`
            );
            // When all animations are done, process the end turn action
            if (completedAnimations === totalCards) {
              console.log(
                'All end turn animations complete - processing game logic'
              );
              handleEndTurn();
            }
          }
        );
      }, index * 100); // 100ms stagger between each card
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
    console.log('handleTechnicalDebtReductionAnimated called');
    console.log('Cards in hand:', gameState.piles.hand.length);
    console.log('Tracked card elements:', Object.keys(cardElements));

    if (gameState.piles.hand.length === 0) {
      console.log('No cards in hand - immediate action');
      handleTechnicalDebtReduction();
      return;
    }

    // Get card elements for cards in hand
    const handCardElements = gameState.piles.hand
      .map((card) => cardElements[card.instanceId])
      .filter(Boolean);

    console.log(
      'Found',
      handCardElements.length,
      'card elements for animation'
    );

    if (handCardElements.length === 0) {
      console.log('No card elements found - immediate action');
      handleTechnicalDebtReduction();
      return;
    }

    // Trigger animation directly
    handleDiscardAllCardsWithAnimation(handCardElements);
  };

  // Animated discard handler for multiple cards
  const handleDiscardAllCardsWithAnimation = (
    elementsToAnimate: HTMLElement[]
  ) => {
    const cardsToDiscard = [...gameState.piles.hand];

    console.log(
      'Starting discard animation for',
      cardsToDiscard.length,
      'cards'
    );
    console.log('Card elements received:', elementsToAnimate.length);

    if (
      cardsToDiscard.length === 0 ||
      !animationLayerRef.current ||
      !discardRef.current
    ) {
      console.log('Fallback to immediate action');
      // Fallback to immediate action if no cards or animation isn't available
      handleTechnicalDebtReduction();
      return;
    }

    // Animate all cards to discard pile with staggered timing
    let completedAnimations = 0;
    const totalCards = cardsToDiscard.length;

    cardsToDiscard.forEach((cardInstance, index) => {
      const cardElement = elementsToAnimate[index];
      console.log(`Card ${index}: element exists:`, !!cardElement);

      if (!cardElement) {
        completedAnimations++;
        if (completedAnimations === totalCards) {
          console.log(
            'All animations complete (no elements) - processing game logic'
          );
          handleTechnicalDebtReduction();
        }
        return;
      }

      // Stagger the animation start times
      setTimeout(() => {
        console.log(
          `Starting animation ${index} for card ${cardInstance.instanceId}`
        );
        animationLayerRef.current?.animateCardToDiscard(
          cardInstance,
          cardElement,
          discardRef.current!,
          () => {
            completedAnimations++;
            console.log(
              `Animation ${index} complete - ${completedAnimations}/${totalCards}`
            );
            // When all animations are done, process the game action
            if (completedAnimations === totalCards) {
              console.log('All animations complete - processing game logic');
              handleTechnicalDebtReduction();
            }
          }
        );
      }, index * 100); // 100ms stagger between each card
    });
  };

  const handleNewGame = () => {
    const newGameState = gameEngine.createNewGame();
    setGameState(newGameState);
    setShowParticles(false);
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
              cards={gameState.piles.hand}
              onPlayCard={handlePlayCardWithAnimation}
              onCardMount={(cardId, element) => {
                console.log(
                  'GameBoard received onCardMount:',
                  cardId,
                  !!element
                );
                handleCardMount(cardId, element);
              }}
              onCardUnmount={(cardId) => {
                console.log('GameBoard received onCardUnmount:', cardId);
                handleCardUnmount(cardId);
              }}
              gameState={gameState}
              disabled={gameOver.isGameOver}
            />
          </motion.div>

          <motion.div className={styles.actions} variants={sectionVariants}>
            <GameActions
              onEndTurn={handleEndTurnAnimated}
              onTechnicalDebtReduction={handleTechnicalDebtReductionAnimated}
              gameState={gameState}
              disabled={gameOver.isGameOver}
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
