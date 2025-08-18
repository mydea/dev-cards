import type { CardInstance, GameState } from '@dev-cards/data';
import { validateCardPlay } from '@dev-cards/data';
import Card from '../Card/Card';
import styles from './Hand.module.css';

interface HandProps {
  cards: CardInstance[];
  onPlayCard: (cardInstanceId: string) => void;
  gameState: GameState;
  disabled?: boolean;
}

function Hand({ cards, onPlayCard, gameState, disabled = false }: HandProps) {
  const handleCardClick = (cardInstance: CardInstance) => {
    if (disabled) return;

    const validation = validateCardPlay(cardInstance, gameState);
    if (validation.canPlay) {
      onPlayCard(cardInstance.instanceId);
    }
  };

  if (cards.length === 0) {
    return (
      <div className={styles.emptyHand}>
        <div className={styles.emptyHandIcon}>🃏</div>
        <div className={styles.emptyHandText}>No cards in hand</div>
      </div>
    );
  }

  return (
    <div className={styles.hand}>
      <div className={styles.handLabel}>Your Hand ({cards.length} cards)</div>
      <div className={styles.cards}>
        {cards.map((cardInstance, index) => {
          const validation = validateCardPlay(cardInstance, gameState);
          const isPlayable = validation.canPlay && !disabled;

          return (
            <Card
              key={cardInstance.instanceId}
              cardInstance={cardInstance}
              onClick={() => handleCardClick(cardInstance)}
              isPlayable={isPlayable}
              disabled={disabled}
              validationError={
                !validation.canPlay ? validation.reasons.join(', ') : undefined
              }
              style={
                {
                  '--card-index': index,
                  '--total-cards': cards.length,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>

      {!disabled && (
        <div className={styles.handHint}>
          <span className={styles.hintIcon}>💡</span>
          Click on cards to play them
        </div>
      )}
    </div>
  );
}

export default Hand;
