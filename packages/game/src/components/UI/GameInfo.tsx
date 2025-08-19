import { useState, useEffect, memo, useMemo } from 'react';
import type { GameState } from '@dev-cards/data';
import styles from './GameInfo.module.css';

interface GameInfoProps {
  gameState: GameState;
  onReturnToMenu: () => void;
}

function GameInfo({ gameState, onReturnToMenu }: GameInfoProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());

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

  // Calculate additional statistics (memoized to prevent unnecessary recalculations)
  const statistics = useMemo(() => {
    const cardsInHand = gameState.piles.hand.length;
    const cardsInDeck = gameState.piles.deck.length;
    const avgCardsPerRound =
      gameState.stats.currentRound > 0
        ? (gameState.stats.cardsPlayed / gameState.stats.currentRound).toFixed(
            1
          )
        : '0.0';
    const progressPerRound =
      gameState.stats.currentRound > 0
        ? (gameState.resources.progress / gameState.stats.currentRound).toFixed(
            1
          )
        : '0.0';

    return { cardsInHand, cardsInDeck, avgCardsPerRound, progressPerRound };
  }, [
    gameState.piles.hand.length,
    gameState.piles.deck.length,
    gameState.stats.cardsPlayed,
    gameState.stats.currentRound,
    gameState.resources.progress,
  ]);

  return (
    <div className={styles.gameInfo}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Round</div>
          <div className={styles.statValue}>{gameState.stats.currentRound}</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statLabel}>Cards Played</div>
          <div className={styles.statValue}>{gameState.stats.cardsPlayed}</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statLabel}>Time</div>
          <div className={styles.timeValue}>{formatTime(elapsedTime)}</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statLabel}>Hand</div>
          <div className={styles.statValue}>{statistics.cardsInHand}</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statLabel}>Deck</div>
          <div className={styles.statValue}>{statistics.cardsInDeck}</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statLabel}>Avg/Round</div>
          <div className={styles.statValue}>{statistics.avgCardsPerRound}</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statLabel}>Progress/Round</div>
          <div className={styles.statValue}>{statistics.progressPerRound}%</div>
        </div>
      </div>

      <button
        className={styles.menuButton}
        onClick={onReturnToMenu}
        type="button"
        title="Return to main menu"
      >
        Menu
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
  const prevResources = prevProps.gameState.resources;
  const nextResources = nextProps.gameState.resources;

  // Only re-render if relevant statistics have changed
  return (
    prevStats.currentRound === nextStats.currentRound &&
    prevStats.cardsPlayed === nextStats.cardsPlayed &&
    prevStats.endTime === nextStats.endTime &&
    prevPiles.hand.length === nextPiles.hand.length &&
    prevPiles.deck.length === nextPiles.deck.length &&
    prevResources.progress === nextResources.progress
  );
});
