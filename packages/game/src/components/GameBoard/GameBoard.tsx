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
    const winCondition = checkWinCondition(gameState);
    const loseCondition = checkLoseCondition(gameState);

    if (winCondition.hasWon) {
      setGameOver({
        isGameOver: true,
        won: true,
        message: `Congratulations! You completed your project in ${gameState.stats.currentRound} rounds!`,
      });
    } else if (loseCondition.hasLost) {
      setGameOver({
        isGameOver: true,
        won: false,
        message: loseCondition.reason || 'Game Over',
      });
    }
  }, [gameState]);

  const handlePlayCard = (cardInstanceId: string) => {
    try {
      const newGameState = gameEngine.playCard(gameState, cardInstanceId);
      setGameState(newGameState);
    } catch (error) {
      console.error('Error playing card:', error);
    }
  };

  const handleEndTurn = () => {
    try {
      const newGameState = gameEngine.endTurn(gameState);
      setGameState(newGameState);
    } catch (error) {
      console.error('Error ending turn:', error);
      // Handle insufficient cards case
      if (error instanceof Error && error.message.includes('cards')) {
        setGameOver({
          isGameOver: true,
          won: false,
          message: 'Not enough cards to continue playing!',
        });
      }
    }
  };

  const handleTechnicalDebtReduction = () => {
    try {
      const newGameState = gameEngine.reduceTechnicalDebt(gameState);
      setGameState(newGameState);
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
                {gameState.piles.drawPile.length}
              </div>
            </div>
          </div>

          <div className={styles.pile}>
            <div className={styles.pileCard} data-type="discard">
              <div className={styles.pileLabel}>Discard</div>
              <div className={styles.pileCount}>
                {gameState.piles.discardPile.length}
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
