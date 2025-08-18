import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, GameEngine } from '@dev-cards/data';
import { checkWinCondition, checkLoseCondition } from '@dev-cards/data';
import GameInfo from '../UI/GameInfo';
import ResourceDisplay from '../UI/ResourceDisplay';
import GameActions from '../UI/GameActions';
import ParticleEffect from '../UI/ParticleEffect';
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
            onPlayCard={handlePlayCard}
            gameState={gameState}
            disabled={gameOver.isGameOver}
          />
        </motion.div>

        <motion.div className={styles.actions} variants={sectionVariants}>
          <GameActions
            onEndTurn={handleEndTurn}
            onTechnicalDebtReduction={handleTechnicalDebtReduction}
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
  );
}

export default GameBoard;
