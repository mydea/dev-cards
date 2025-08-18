import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import styles from './Pile.module.css';

type PileType = 'deck' | 'discard' | 'graveyard';

interface PileProps {
  type: PileType;
  cardCount: number;
  onClick?: () => void;
  disabled?: boolean;
}

const Pile = forwardRef<HTMLDivElement, PileProps>(
  ({ type, cardCount, onClick, disabled = false }, ref) => {
    const getStackLayers = (count: number): number => {
      if (count === 0) return 0;
      if (count <= 3) return count;
      if (count <= 10) return Math.min(5, Math.ceil(count / 2));
      return Math.min(8, Math.ceil(count / 4));
    };

    const stackLayers = getStackLayers(cardCount);

    const getLabel = (type: PileType): string => {
      switch (type) {
        case 'deck':
          return 'Draw Pile';
        case 'discard':
          return 'Discard';
        case 'graveyard':
          return 'Graveyard';
      }
    };

    const getColor = (
      type: PileType
    ): { bg: string; border: string; text: string; glow: string } => {
      switch (type) {
        case 'deck':
          return {
            bg: 'var(--color-primary-50)',
            border: 'var(--color-primary-200)',
            text: 'var(--color-primary-700)',
            glow: 'rgba(59, 130, 246, 0.3)',
          };
        case 'discard':
          return {
            bg: 'var(--color-gray-50)',
            border: 'var(--color-gray-200)',
            text: 'var(--color-gray-700)',
            glow: 'rgba(168, 85, 247, 0.3)',
          };
        case 'graveyard':
          return {
            bg: 'var(--color-gray-800)',
            border: 'var(--color-gray-600)',
            text: 'var(--color-gray-300)',
            glow: 'rgba(239, 68, 68, 0.3)',
          };
      }
    };

    const colors = getColor(type);

    const pileVariants = {
      initial: { opacity: 0, scale: 0.9, y: 20 },
      animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 25,
        },
      },
      tap: { scale: 0.95 },
      hover: {
        scale: 1.02,
        y: -8,
        rotateX: 5,
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 25,
        },
      },
    };

    return (
      <motion.div
        className={styles.pile}
        variants={pileVariants}
        whileHover={!disabled ? 'hover' : undefined}
        whileTap={!disabled ? 'tap' : undefined}
        onClick={onClick}
        style={{ cursor: disabled ? 'default' : 'pointer' }}
      >
        <motion.div
          ref={ref}
          className={styles.pileStack}
          data-type={type}
          style={
            {
              '--card-count': cardCount,
              '--stack-layers': stackLayers,
              '--bg-color': colors.bg,
              '--border-color': colors.border,
              '--text-color': colors.text,
            } as React.CSSProperties
          }
          style={{
            boxShadow:
              cardCount > 0
                ? `0 4px 8px rgba(0, 0, 0, 0.1), 0 0 20px ${colors.glow}`
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Render background stack layers (behind top card) */}
          {stackLayers > 1 &&
            Array.from({ length: stackLayers - 1 }, (_, index) => (
              <div
                key={index}
                className={styles.stackLayer}
                style={
                  {
                    '--layer-index': index + 1, // Start from 1 (behind top card)
                    zIndex: stackLayers - index - 1,
                  } as React.CSSProperties
                }
              />
            ))}

          {/* Top card - always looks the same */}
          <div className={styles.topCard}>
            <div className={styles.pileLabel}>{getLabel(type)}</div>
            <motion.div
              className={styles.pileCount}
              key={`${type}-${cardCount}`}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {cardCount}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    );
  }
);

Pile.displayName = 'Pile';

export default Pile;
