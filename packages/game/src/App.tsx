import { useState } from 'react';
import { GameEngine } from '@dev-cards/data';
import type { GameState } from '@dev-cards/data';
import GameBoard from './components/GameBoard/GameBoard';
import MainMenu from './components/UI/MainMenu';
import styles from './App.module.css';

function App() {
  const [gameEngine] = useState(() => new GameEngine());
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentView, setCurrentView] = useState<'menu' | 'game'>('menu');

  const startNewGame = () => {
    const newGameState = gameEngine.createNewGame();
    setGameState(newGameState);
    setCurrentView('game');
  };

  const returnToMenu = () => {
    setCurrentView('menu');
    setGameState(null);
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dev-Cards</h1>
        <p className={styles.subtitle}>The Developer's Card Game</p>
      </header>

      <main className={styles.main}>
        {currentView === 'menu' ? (
          <MainMenu onStartGame={startNewGame} />
        ) : (
          <GameBoard
            gameState={gameState!}
            gameEngine={gameEngine}
            onReturnToMenu={returnToMenu}
          />
        )}
      </main>

      <footer className={styles.footer}>
        <p>
          Manage your bugs, technical debt, and productivity to complete your
          project!
        </p>
      </footer>
    </div>
  );
}

export default App;
