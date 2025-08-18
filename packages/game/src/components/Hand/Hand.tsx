import type { CardInstance, GameState } from '@dev-cards/data';
import { validateCardPlay } from '@dev-cards/data';
import { motion, AnimatePresence } from 'framer-motion';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import Card from '../Card/Card';
import styles from './Hand.module.css';

interface HandProps {
  cards: CardInstance[];
  onPlayCard: (cardInstanceId: string, cardElement: HTMLElement) => void;
  onDiscardAll?: (cardElements: HTMLElement[]) => void;
  gameState: GameState;
  disabled?: boolean;
}

interface HandRef {
  discardAllCardsAnimated: (onComplete: () => void) => void;
}

const Hand = forwardRef<HandRef, HandProps>(
  ({ cards, onPlayCard, onDiscardAll, gameState, disabled = false }, ref) => {
    const cardRefs = useRef<{ [instanceId: string]: HTMLDivElement | null }>(
      {}
    );

    // Expose the discard method to parent components
    useImperativeHandle(
      ref,
      () => ({
        discardAllCardsAnimated: (onComplete: () => void) => {
          const cardElements = cards
            .map((card) => cardRefs.current[card.instanceId])
            .filter((element): element is HTMLDivElement => element !== null);

          if (cardElements.length === 0 || !onDiscardAll) {
            onComplete();
            return;
          }

          // Call the parent's discard animation handler
          onDiscardAll(cardElements);
          onComplete();
        },
      }),
      [cards, onDiscardAll]
    );

    const handleCardClick = (
      cardInstance: CardInstance,
      event: React.MouseEvent<HTMLDivElement>
    ) => {
      if (disabled) return;

      const validation = validateCardPlay(cardInstance, gameState);
      if (validation.canPlay) {
        const cardElement = event.currentTarget;
        onPlayCard(cardInstance.instanceId, cardElement);
      }
    };

    if (cards.length === 0) {
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

    const cardContainerVariants = {
      hidden: { opacity: 0, y: 50 },
      show: {
        opacity: 1,
        y: 0,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 25,
        },
      },
    };

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
          Your Hand ({cards.length} cards)
        </motion.div>

        <motion.div
          className={styles.cards}
          layout
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <AnimatePresence mode="popLayout">
            {cards.map((cardInstance, index) => {
              const validation = validateCardPlay(cardInstance, gameState);
              const isPlayable = validation.canPlay && !disabled;

              return (
                <motion.div
                  key={cardInstance.instanceId}
                  ref={(el) => {
                    cardRefs.current[cardInstance.instanceId] = el;
                  }}
                  variants={cardContainerVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 0.8, y: -50 }}
                  layout
                  transition={{
                    layout: { type: 'spring', stiffness: 300, damping: 25 },
                  }}
                  style={
                    {
                      '--card-index': index,
                      '--total-cards': cards.length,
                    } as React.CSSProperties
                  }
                >
                  <Card
                    cardInstance={cardInstance}
                    onClick={(event) => handleCardClick(cardInstance, event)}
                    isPlayable={isPlayable}
                    disabled={disabled}
                    validationError={
                      !validation.canPlay
                        ? validation.reasons.join(', ')
                        : undefined
                    }
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {!disabled && (
            <motion.div
              className={styles.handHint}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.5 }}
            >
              <span className={styles.hintIcon}>💡</span>
              Click on cards to play them
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

Hand.displayName = 'Hand';

export default Hand;
export type { HandRef };
