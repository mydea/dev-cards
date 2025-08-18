import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CoinFlip.module.css';

// Helper functions for displaying effect information
function getEffectDisplayName(effectType: string): string {
  switch (effectType) {
    case 'ADD_PROGRESS':
      return 'Add Progress';
    case 'ADD_BUGS':
      return 'Add Bugs';
    case 'REMOVE_BUGS':
      return 'Remove Bugs';
    case 'ADD_TECHNICAL_DEBT':
      return 'Add Technical Debt';
    case 'REMOVE_TECHNICAL_DEBT':
      return 'Remove Technical Debt';
    case 'DRAW_CARDS':
      return 'Draw Cards';
    default:
      return effectType
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
  }
}

function formatEffectValue(effectType: string, value: number): string {
  if (value === 0) return 'No change';

  const isPositive = value > 0;
  const prefix = isPositive ? '+' : '';

  switch (effectType) {
    case 'ADD_PROGRESS':
      return `${prefix}${value} Progress`;
    case 'ADD_BUGS':
      return `${prefix}${value} Bug${Math.abs(value) !== 1 ? 's' : ''}`;
    case 'REMOVE_BUGS':
      return `${Math.abs(value)} Bug${Math.abs(value) !== 1 ? 's' : ''} removed`;
    case 'ADD_TECHNICAL_DEBT':
      return `${prefix}${value} Technical Debt`;
    case 'REMOVE_TECHNICAL_DEBT':
      return `${Math.abs(value)} Technical Debt removed`;
    case 'DRAW_CARDS':
      return `Draw ${value} card${value !== 1 ? 's' : ''}`;
    default:
      return `${prefix}${value}`;
  }
}

interface CoinFlipProps {
  onComplete: (result: 'heads' | 'tails') => void;
  result: 'heads' | 'tails';
  isVisible: boolean;
  effect: {
    type: string;
    headsValue: number;
    tailsValue: number;
  };
}

const COIN_FLIP_DURATION = 3000;
const RESULT_DISPLAY_DURATION = 3000;

function CoinFlip({ onComplete, result, isVisible, effect }: CoinFlipProps) {
  const [isFlipping, setIsFlipping] = useState(false);

  let isCompleted = false;

  useEffect(() => {
    if (isVisible && !isFlipping) {
      // Start the flip animation
      setIsFlipping(true);

      // Complete the animation after flip duration
      setTimeout(() => {
        setIsFlipping(false);

        // Show result for 1 second, then complete
        setTimeout(() => {
          if (isCompleted) {
            return;
          }
          isCompleted = true;
          onComplete(result);
        }, RESULT_DISPLAY_DURATION); // Show result for 3 seconds
      }, COIN_FLIP_DURATION); // Flip for 3 seconds
    }
  }, [isVisible, result, onComplete]);

  // Handle click to complete early (only when showing result)
  const handleClick = () => {
    if (!isVisible || isCompleted) {
      return;
    }

    // If flipping, stop it immediately
    if (isFlipping) {
      setIsFlipping(false);
      return;
    }

    // Else, complete the flip
    isCompleted = true;
    onComplete(result);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.coinFlipOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleClick}
        style={{
          cursor: !isFlipping && !isCompleted ? 'pointer' : 'default',
        }}
      >
        <motion.div
          className={styles.coinFlipContainer}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            delay: 0.1,
          }}
        >
          <div className={styles.coinFlipLabel}>Coin Flip!</div>

          <motion.div
            className={styles.coin}
            animate={
              isFlipping
                ? {
                    // Calculate rotation to end on correct face
                    // Heads = even number of 180° rotations (0°, 360°, 720°)
                    // Tails = odd number of 180° rotations (180°, 540°, 900°)
                    rotateY:
                      result === 'heads'
                        ? [0, 360 * 3, 720 * 3]
                        : [0, 360 * 3, 900 * 3],
                    scale: [1, 1.2, 1],
                  }
                : {
                    // When not flipping, immediately snap to final result
                    rotateY: result === 'heads' ? 720 : 900,
                    scale: 1,
                  }
            }
            transition={
              isFlipping
                ? {
                    duration: COIN_FLIP_DURATION / 1000,
                    ease: 'linear',
                  }
                : {
                    duration: 0, // Instant snap when not flipping
                  }
            }
          >
            <div className={`${styles.coinSide} ${styles.heads}`}>
              <span className={styles.coinText}>H</span>
            </div>
            <div className={`${styles.coinSide} ${styles.tails}`}>
              <span className={styles.coinText}>T</span>
            </div>
          </motion.div>

          {/* Always show result area to prevent layout shift */}
          <div className={styles.result}>
            {isFlipping ? (
              <>
                <div className={styles.effectType}>
                  {getEffectDisplayName(effect.type)}
                </div>
                <div className={styles.possibleOutcomes}>
                  <div className={styles.outcome}>
                    🎯 Heads:{' '}
                    {formatEffectValue(effect.type, effect.headsValue)}
                  </div>
                  <div className={styles.outcome}>
                    🎲 Tails:{' '}
                    {formatEffectValue(effect.type, effect.tailsValue)}
                  </div>
                </div>
                <div className={styles.waitText}>Wait for it...</div>
              </>
            ) : (
              <>
                <div className={styles.resultText}>
                  {result === 'heads' ? '🎯 HEADS!' : '🎲 TAILS!'}
                </div>
                <div className={styles.finalValue}>
                  {formatEffectValue(
                    effect.type,
                    result === 'heads' ? effect.headsValue : effect.tailsValue
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CoinFlip;
