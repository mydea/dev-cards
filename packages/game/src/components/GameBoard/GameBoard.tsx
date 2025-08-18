import { useState, useEffect } from 'react';
import type { GameState, GameEngine } from '@dev-cards/data';
import { checkWinCondition, checkLoseCondition } from '@dev-cards/data';
import GameInfo from '../UI/GameInfo';
import ResourceDisplay from '../UI/ResourceDisplay';
import GameActions from '../UI/GameActions';
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

  // Check for game over conditions whenever game state changes
  useEffect(() => {
    const hasWon = checkWinCondition(gameState);
    const hasLost = checkLoseCondition(gameState);

    if (hasWon) {
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
    setGameOver({
      isGameOver: false,
      won: false,
      message: '',
    });
  };

  return (
    <div className={styles.gameBoard}>
      <div className={styles.header}>
        <GameInfo gameState={gameState} onReturnToMenu={onReturnToMenu} />
        <ResourceDisplay gameState={gameState} />
      </div>

      <div className={styles.gameArea}>
        <div className={styles.piles}>
          <div className={styles.pile}>
            <div className={styles.pileCard} data-type="deck">
              <div className={styles.pileLabel}>Draw Pile</div>
              <div className={styles.pileCount}>
                {gameState.piles.deck.length}
              </div>
            </div>
          </div>

          <div className={styles.pile}>
            <div className={styles.pileCard} data-type="discard">
              <div className={styles.pileLabel}>Discard</div>
              <div className={styles.pileCount}>
                {gameState.piles.discard.length}
              </div>
            </div>
          </div>

          <div className={styles.pile}>
            <div className={styles.pileCard} data-type="graveyard">
              <div className={styles.pileLabel}>Graveyard</div>
              <div className={styles.pileCount}>
                {gameState.piles.graveyard.length}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.handArea}>
          <Hand
            cards={gameState.piles.hand}
            onPlayCard={handlePlayCard}
            gameState={gameState}
            disabled={gameOver.isGameOver}
          />
        </div>

        <div className={styles.actions}>
          <GameActions
            onEndTurn={handleEndTurn}
            onTechnicalDebtReduction={handleTechnicalDebtReduction}
            gameState={gameState}
            disabled={gameOver.isGameOver}
          />
        </div>
      </div>

      {gameOver.isGameOver && (
        <div className={styles.gameOverlay}>
          <div className={styles.gameOverContent}>
            <h2>{gameOver.won ? '🎉 Victory!' : '💥 Game Over'}</h2>
            <p>{gameOver.message}</p>
            {gameOver.won && (
              <p className={styles.finalScore}>
                Final Score: {gameState.stats.currentRound} rounds
              </p>
            )}
            <div>
              <button
                className={styles.newGameButton}
                onClick={handleNewGame}
                type="button"
              >
                New Game
              </button>
              <button
                className={styles.menuButton}
                onClick={onReturnToMenu}
                type="button"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameBoard;
