import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameEngine } from '@dev-cards/data';
import type { GameState } from '@dev-cards/data';
import GameBoard from '../components/GameBoard/GameBoard';
import styles from './GamePage.module.css';

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [gameEngine] = useState(() => new GameEngine());
  const [gameState, setGameState] = useState<GameState>(() => {
    return gameEngine.createNewGame();
  });

  const handleReturnToMenu = () => {
    navigate('/');
  };

  const handleNewGame = () => {
    const newGameState = gameEngine.createNewGame();
    setGameState(newGameState);
  };

  return (
    <div className={styles.gamePage}>
      <GameBoard
        gameState={gameState}
        gameEngine={gameEngine}
        onReturnToMenu={handleReturnToMenu}
        onNewGame={handleNewGame}
      />
    </div>
  );
};

export default GamePage;
