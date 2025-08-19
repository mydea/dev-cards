import type { GameState, GameHistory } from '@dev-cards/data';
import { validateTechnicalDebtReduction } from '@dev-cards/data';
import styles from './GameActions.module.css';

interface GameActionsProps {
  onEndTurn: () => void;
  onTechnicalDebtReduction: () => void;
  gameState: GameState;
  history: GameHistory;
  disabled?: boolean;
}

function GameActions({
  onEndTurn,
  onTechnicalDebtReduction,
  gameState,
  history,
  disabled = false,
}: GameActionsProps) {
  const canReduceDebt =
    validateTechnicalDebtReduction(gameState, history) && !disabled;
  const hasCards = gameState.piles.hand.length > 0;

  return (
    <div className={styles.gameActions}>
      <button
        className={styles.actionButton}
        onClick={onTechnicalDebtReduction}
        disabled={!canReduceDebt}
        type="button"
        title={
          canReduceDebt
            ? 'Discard all cards to reduce Technical Debt by 2'
            : 'Cannot reduce TD: You must not have played any cards this round'
        }
      >
        <span className={styles.buttonIcon}>⚡</span>
        <span className={styles.buttonText}>
          <span className={styles.buttonLabel}>Reduce Tech Debt</span>
          <span className={styles.buttonSubtext}>Discard all cards</span>
        </span>
      </button>

      <button
        className={styles.actionButton}
        onClick={onEndTurn}
        disabled={disabled}
        type="button"
        title="End current turn and draw 5 new cards"
        data-primary={!hasCards}
      >
        <span className={styles.buttonIcon}>🔄</span>
        <span className={styles.buttonText}>
          <span className={styles.buttonLabel}>End Turn</span>
          <span className={styles.buttonSubtext}>Draw new hand</span>
        </span>
      </button>
    </div>
  );
}

export default GameActions;
