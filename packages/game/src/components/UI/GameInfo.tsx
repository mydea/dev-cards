import type { GameState } from '@dev-cards/data';
import styles from './GameInfo.module.css';

interface GameInfoProps {
  gameState: GameState;
  onReturnToMenu: () => void;
}

function GameInfo({ gameState, onReturnToMenu }: GameInfoProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const elapsedTime = gameState.stats.endTime
    ? gameState.stats.endTime - gameState.stats.startTime
    : Date.now() - gameState.stats.startTime;

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
          <div className={styles.statValue}>{formatTime(elapsedTime)}</div>
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

export default GameInfo;
