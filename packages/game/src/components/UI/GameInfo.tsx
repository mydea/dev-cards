import { useState, useEffect, memo, useMemo } from 'react';
import type { GameState } from '@dev-cards/data';
import styles from './GameInfo.module.css';

interface GameInfoProps {
  gameState: GameState;
  onReturnToMenu: () => void;
}

function GameInfo({ gameState, onReturnToMenu }: GameInfoProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  const handleEndGameClick = () => {
    const confirmed = window.confirm(
      'Are you sure you want to end the current game?\n\nThis will discard all your current progress and return to the main menu.'
    );

    if (confirmed) {
      onReturnToMenu();
    }
  };

  // Update current time every second
  useEffect(() => {
    // Don't start interval if game has ended
    if (gameState.stats.endTime) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.stats.endTime]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const elapsedTime = gameState.stats.endTime
    ? gameState.stats.endTime - gameState.stats.startTime
    : currentTime - gameState.stats.startTime;

  // Calculate card statistics (memoized to prevent unnecessary recalculations)
  const statistics = useMemo(() => {
    const cardsPlayed = gameState.piles.graveyard.length;
    const cardsRemaining =
      gameState.piles.deck.length +
      gameState.piles.discard.length +
      gameState.piles.hand.length;

    return { cardsPlayed, cardsRemaining };
  }, [
    gameState.piles.graveyard.length,
    gameState.piles.deck.length,
    gameState.piles.discard.length,
    gameState.piles.hand.length,
  ]);

  return (
    <div className={styles.gameInfo}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Round</div>
          <div className={styles.statValue}>{gameState.stats.currentRound}</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statLabel}>Time</div>
          <div className={styles.timeValue}>{formatTime(elapsedTime)}</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statLabel}>Cards Played</div>
          <div className={styles.statValue}>{statistics.cardsPlayed}</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statLabel}>Cards Remaining</div>
          <div className={styles.statValue}>{statistics.cardsRemaining}</div>
        </div>
      </div>

      <button
        className={styles.endGameButton}
        onClick={handleEndGameClick}
        type="button"
        title="End current game and return to main menu"
      >
        End Game
      </button>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when gameState properties don't change
export default memo(GameInfo, (prevProps, nextProps) => {
  const prevStats = prevProps.gameState.stats;
  const nextStats = nextProps.gameState.stats;
  const prevPiles = prevProps.gameState.piles;
  const nextPiles = nextProps.gameState.piles;

  // Only re-render if the displayed statistics have changed
  return (
    prevStats.currentRound === nextStats.currentRound &&
    prevStats.endTime === nextStats.endTime &&
    prevPiles.graveyard.length === nextPiles.graveyard.length &&
    prevPiles.hand.length === nextPiles.hand.length &&
    prevPiles.deck.length === nextPiles.deck.length &&
    prevPiles.discard.length === nextPiles.discard.length
  );
});
