import { memo, useCallback } from 'react';
import type { CardInstance, GameState } from '@dev-cards/data';
import { validateCardPlay } from '@dev-cards/data';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../Card/Card';
import styles from './Hand.module.css';

interface HandProps {
  cards: CardInstance[];
  onPlayCard: (cardInstanceId: string, cardElement: HTMLElement) => void;
  onCardMount?: (cardId: string, element: HTMLElement) => void;
  onCardUnmount?: (cardId: string) => void;
  animatingCardIds?: Set<string>;
  gameState: GameState;
  disabled?: boolean;
}

function Hand({
  cards,
  onPlayCard,
  onCardMount,
  onCardUnmount: _onCardUnmount,
  animatingCardIds = new Set(),
  gameState,
  disabled = false,
}: HandProps) {
  // Memoize card click handler to prevent unnecessary re-renders of Card components
  const handleCardClick = useCallback(
    (cardInstance: CardInstance, event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;

      const validation = validateCardPlay(cardInstance, gameState);
      if (validation.canPlay) {
        const cardElement = event.currentTarget;
        onPlayCard(cardInstance.instanceId, cardElement);
      }
    },
    [disabled, gameState, onPlayCard]
  );

  // Only show empty hand UI if there are no cards AND no animations in progress AND not disabled
  if (cards.length === 0 && animatingCardIds.size === 0 && !disabled) {
    return (
      <motion.div
        className={styles.emptyHand}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
      >
        <motion.div
          className={styles.emptyHandIcon}
          initial={{ opacity: 0, rotateY: -90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          🃏
        </motion.div>
        <motion.div
          className={styles.emptyHandText}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          No cards in hand
        </motion.div>
      </motion.div>
    );
  }

  // Animation variants for the hand container
  const handVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const showHint = !disabled && animatingCardIds.size === 0 && cards.length > 0;

  return (
    <motion.div
      className={styles.hand}
      variants={handVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className={styles.handLabel}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {animatingCardIds.size > 0 && cards.length === 0
          ? 'Your Hand (drawing cards...)'
          : `Your Hand (${cards.length} cards)`}
      </motion.div>

      <div className={styles.cards}>
        {cards.map((cardInstance) => {
          const validation = validateCardPlay(cardInstance, gameState);
          const isPlayable = validation.canPlay && !disabled;
          const isAnimating = animatingCardIds.has(cardInstance.instanceId);

          return (
            <div
              key={cardInstance.instanceId}
              ref={(el) => {
                if (el && onCardMount) {
                  onCardMount(cardInstance.instanceId, el);
                }
              }}
              style={{
                display: 'inline-block',
                margin: '10px',
              }}
            >
              <Card
                cardInstance={cardInstance}
                onClick={(event) => handleCardClick(cardInstance, event)}
                isPlayable={isPlayable}
                disabled={disabled}
                isAnimating={isAnimating}
                validationError={
                  !validation.canPlay
                    ? validation.reasons.join(', ')
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {showHint && (
          <motion.div
            className={styles.handHint}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={!showHint ? { delay: 0.5 } : { delay: 0, duration: 0 }}
          >
            <span className={styles.hintIcon}>💡</span>
            Click on cards to play them
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

Hand.displayName = 'Hand';

// Memoize Hand component to prevent unnecessary re-renders
export default memo(Hand, (prevProps, nextProps) => {
  // Only re-render if essential props have changed
  return (
    prevProps.cards.length === nextProps.cards.length &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.animatingCardIds?.size === nextProps.animatingCardIds?.size &&
    prevProps.cards.every(
      (card, index) => nextProps.cards[index]?.instanceId === card.instanceId
    ) &&
    // Compare game state properties that affect card validation
    prevProps.gameState.resources.productivityPoints ===
      nextProps.gameState.resources.productivityPoints &&
    prevProps.gameState.piles.hand.length ===
      nextProps.gameState.piles.hand.length
  );
});
