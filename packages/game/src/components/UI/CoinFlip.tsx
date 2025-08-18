import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CoinFlip.module.css';

interface CoinFlipProps {
  onComplete: (result: 'heads' | 'tails') => void;
  result: 'heads' | 'tails';
  isVisible: boolean;
}

function CoinFlip({ onComplete, result, isVisible }: CoinFlipProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (isVisible && !isFlipping) {
      // Start the flip animation
      setIsFlipping(true);
      setShowResult(false);

      // Complete the animation after flip duration
      setTimeout(() => {
        setIsFlipping(false);
        setShowResult(true);

        // Show result for 1 second, then complete
        setTimeout(() => {
          onComplete(result);
        }, 3000); // Show result for 3000ms
      }, 1500); // Flip for 1.5 seconds
    }
  }, [isVisible, result, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.coinFlipOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
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
                    rotateY: result === 'heads' ? [0, 360 * 3, 720 * 3] : [0, 360 * 3, 900 * 3],
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
                    duration: 1.5,
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

          <AnimatePresence>
            {showResult && (
              <motion.div
                className={styles.result}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.resultText}>
                  {result === 'heads' ? '🎯 HEADS!' : '🎲 TAILS!'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CoinFlip;
