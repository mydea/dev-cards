import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CoinFlipEffect } from '@dev-cards/data';
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

interface CoinFlipQueueItem {
  effect: CoinFlipEffect;
  result: 'heads' | 'tails';
  resolvedValue: number;
}

interface OutcomesListProps {
  effect: CoinFlipEffect;
  result?: 'heads' | 'tails' | null;
  showResult: boolean;
}

function OutcomesList({ effect, result, showResult }: OutcomesListProps) {
  const getOutcomeClass = (outcome: 'heads' | 'tails') => {
    if (!showResult) {
      return styles.outcome;
    }
    return result === outcome ? styles.outcomeWinner : styles.outcomeLoser;
  };

  return (
    <div className={styles.outcomesList}>
      <div className={getOutcomeClass('heads')}>
        🎯 Heads: {formatEffectValue(effect.type, effect.headsValue)}
      </div>
      <div className={getOutcomeClass('tails')}>
        🎲 Tails: {formatEffectValue(effect.type, effect.tailsValue)}
      </div>
    </div>
  );
}

interface CoinFlipOverlayProps {
  queue: CoinFlipQueueItem[];
  onAllComplete: (results: CoinFlipQueueItem[]) => void;
  cardInstanceId: string;
}

const COIN_FLIP_DURATION = 1000;
const RESULT_DISPLAY_DURATION = 3000;

function CoinFlipOverlay({ queue, onAllComplete }: CoinFlipOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [completedResults, setCompletedResults] = useState<CoinFlipQueueItem[]>(
    []
  );

  const isVisible = queue.length > 0 && currentIndex < queue.length;
  const currentEffect = queue[currentIndex];

  // Handle individual coin flip completion
  const handleSingleCoinFlipComplete = () => {
    const updatedResults = [...completedResults, currentEffect];
    setCompletedResults(updatedResults);

    if (currentIndex < queue.length - 1) {
      // More coin flips to process
      setCurrentIndex(currentIndex + 1);
      setIsFlipping(false); // Reset for next flip
    } else {
      // All coin flips complete
      onAllComplete(updatedResults);

      // Reset state
      setCurrentIndex(0);
      setCompletedResults([]);
      setIsFlipping(false);
    }
  };

  // Handle click to skip current coin flip
  const handleClick = () => {
    if (!isVisible || !currentEffect) {
      return;
    }

    // If flipping, stop it immediately
    if (isFlipping) {
      setIsFlipping(false);
      return;
    }

    // Else, complete the flip
    handleSingleCoinFlipComplete();
  };

  // Start animation when a new effect is active
  useEffect(() => {
    if (isVisible && currentEffect && !isFlipping) {
      setIsFlipping(true);

      let timers: ReturnType<typeof setTimeout>[] = [];

      // Complete the animation after flip duration
      timers.push(
        setTimeout(() => {
          setIsFlipping(false);

          // Show result for designated time, then complete
          timers.push(
            setTimeout(() => {
              handleSingleCoinFlipComplete();
            }, RESULT_DISPLAY_DURATION)
          );
        }, COIN_FLIP_DURATION)
      );

      return () => {
        timers.forEach((timer) => clearTimeout(timer));
      };
    }
  }, [currentIndex, isVisible, currentEffect]);

  if (!isVisible || !currentEffect) return null;

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
          cursor: !isFlipping ? 'pointer' : 'default',
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
          <div className={styles.coinFlipLabel}>
            Coin Flip {currentIndex + 1}/{queue.length}!
          </div>

          <motion.div
            className={styles.coin}
            animate={
              isFlipping
                ? {
                    // Calculate rotation to end on correct face
                    // Heads = even number of 180° rotations (0°, 360°, 720°)
                    // Tails = odd number of 180° rotations (180°, 540°, 900°)
                    rotateY:
                      currentEffect.result === 'heads'
                        ? [0, 360 * 2, 720 * 2]
                        : [0, 360 * 2, 900 * 2],
                    scale: [1, 1.2, 1],
                  }
                : {
                    // When not flipping, immediately snap to final result
                    rotateY:
                      currentEffect.result === 'heads' ? 720 * 2 : 900 * 2,
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
            <div className={styles.effectType}>
              {getEffectDisplayName(currentEffect.effect.type)}
            </div>
            <OutcomesList
              effect={currentEffect.effect}
              result={currentEffect.result}
              showResult={!isFlipping}
            />
            {isFlipping && (
              <div className={styles.waitText}>Wait for it...</div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CoinFlipOverlay;
