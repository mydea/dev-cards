import type { GameState } from '@dev-cards/data';
import styles from './ResourceDisplay.module.css';

interface ResourceDisplayProps {
  gameState: GameState;
}

function ResourceDisplay({ gameState }: ResourceDisplayProps) {
  const { progress, bugs, technicalDebt, productivityPoints } =
    gameState.resources;

  const getProgressColor = (value: number) => {
    if (value >= 75) return 'high';
    if (value >= 50) return 'medium';
    if (value >= 25) return 'low';
    return 'very-low';
  };

  const getBugsColor = (value: number) => {
    if (value === 0) return 'none';
    if (value <= 2) return 'low';
    if (value <= 5) return 'medium';
    return 'high';
  };

  const getTechnicalDebtColor = (value: number) => {
    if (value === 0) return 'none';
    if (value <= 5) return 'low';
    if (value <= 10) return 'medium';
    if (value <= 15) return 'high';
    return 'critical';
  };

  const getProductivityColor = (value: number) => {
    if (value >= 15) return 'high';
    if (value >= 10) return 'medium';
    if (value >= 5) return 'low';
    return 'critical';
  };

  return (
    <div className={styles.resourceDisplay}>
      <div className={styles.resource} data-type="progress">
        <div className={styles.resourceIcon}>📈</div>
        <div className={styles.resourceInfo}>
          <div className={styles.resourceLabel}>Progress</div>
          <div
            className={styles.resourceValue}
            data-level={getProgressColor(progress)}
          >
            {progress}%
          </div>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className={styles.resource} data-type="bugs">
        <div className={styles.resourceIcon}>🐛</div>
        <div className={styles.resourceInfo}>
          <div className={styles.resourceLabel}>Bugs</div>
          <div className={styles.resourceValue} data-level={getBugsColor(bugs)}>
            {bugs}
          </div>
        </div>
      </div>

      <div className={styles.resource} data-type="technical-debt">
        <div className={styles.resourceIcon}>⚡</div>
        <div className={styles.resourceInfo}>
          <div className={styles.resourceLabel}>Tech Debt</div>
          <div
            className={styles.resourceValue}
            data-level={getTechnicalDebtColor(technicalDebt)}
          >
            {technicalDebt}/20
          </div>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${(technicalDebt / 20) * 100}%` }}
            data-type="debt"
          />
        </div>
      </div>

      <div className={styles.resource} data-type="productivity">
        <div className={styles.resourceIcon}>💪</div>
        <div className={styles.resourceInfo}>
          <div className={styles.resourceLabel}>Productivity</div>
          <div
            className={styles.resourceValue}
            data-level={getProductivityColor(productivityPoints)}
          >
            {productivityPoints}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResourceDisplay;
