import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CardInstance } from '@dev-cards/data';
import styles from './Card.module.css';

interface CardProps {
  cardInstance: CardInstance;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  isPlayable?: boolean;
  disabled?: boolean;
  isAnimating?: boolean;
  validationError?: string;
  style?: React.CSSProperties;
}

function Card({
  cardInstance,
  onClick,
  isPlayable = false,
  disabled = false,
  isAnimating = false,
  validationError,
  style,
}: CardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { card } = cardInstance;

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!disabled && onClick) {
      onClick(event);
    }
  };

  const handleMouseEnter = () => {
    if (validationError) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const formatEffects = () => {
    return card.effects.map((effect, index) => {
      switch (effect.type) {
        case 'ADD_PROGRESS':
          if (effect.randomType === 'STATIC') {
            return `+${effect.value}% progress`;
          } else if (effect.randomType === 'COIN_FLIP') {
            return (
              <span key={index} className={styles.coinFlipEffect}>
                <img
                  src="/assets/icons/coin-flip.png"
                  alt="coin flip"
                  className={styles.coinFlipIcon}
                />
                {effect.headsValue}% or {effect.tailsValue}% progress
              </span>
            );
          }
          break;
        case 'REMOVE_BUGS':
          if (effect.randomType === 'STATIC') {
            return `-${effect.value} 🐛 Bugs`;
          } else if (effect.randomType === 'COIN_FLIP') {
            return (
              <span key={index} className={styles.coinFlipEffect}>
                <img
                  src="/assets/icons/coin-flip.png"
                  alt="coin flip"
                  className={styles.coinFlipIcon}
                />
                -{effect.headsValue} or -{effect.tailsValue} 🐛 Bugs
              </span>
            );
          }
          break;
        case 'ADD_BUGS':
          if (effect.randomType === 'STATIC') {
            return `+${effect.value} 🐛 Bugs`;
          } else if (effect.randomType === 'COIN_FLIP') {
            return (
              <span key={index} className={styles.coinFlipEffect}>
                <img
                  src="/assets/icons/coin-flip.png"
                  alt="coin flip"
                  className={styles.coinFlipIcon}
                />
                +{effect.headsValue} or +{effect.tailsValue} 🐛 Bugs
              </span>
            );
          }
          break;
        case 'REMOVE_TECHNICAL_DEBT':
          if (effect.randomType === 'STATIC') {
            return `-${effect.value} ⚡ TD`;
          } else if (effect.randomType === 'COIN_FLIP') {
            return (
              <span key={index} className={styles.coinFlipEffect}>
                <img
                  src="/assets/icons/coin-flip.png"
                  alt="coin flip"
                  className={styles.coinFlipIcon}
                />
                -{effect.headsValue} or -{effect.tailsValue} ⚡ TD
              </span>
            );
          }
          break;
        case 'ADD_TECHNICAL_DEBT':
          if (effect.randomType === 'STATIC') {
            return `+${effect.value} ⚡ TD`;
          } else if (effect.randomType === 'COIN_FLIP') {
            return (
              <span key={index} className={styles.coinFlipEffect}>
                <img
                  src="/assets/icons/coin-flip.png"
                  alt="coin flip"
                  className={styles.coinFlipIcon}
                />
                +{effect.headsValue} or +{effect.tailsValue} ⚡ TD
              </span>
            );
          }
          break;
        case 'DRAW_CARDS':
          if (effect.randomType === 'STATIC') {
            return `Draw ${effect.value} cards`;
          }
          break;

        default:
          return 'Unknown effect';
      }

      return 'Unknown effect';
    });
  };

  const formatRequirements = () => {
    if (card.requirements.length === 0) return 'Free';

    return card.requirements
      .map((req) => {
        switch (req.type) {
          case 'SPEND_PP':
            return `${req.value} PP`;
          case 'DISCARD_CARDS':
            return `discard ${req.value}`;
          default:
            return 'Unknown';
        }
      })
      .join(' • ');
  };

  // Animation variants
  const cardVariants = {
    initial: {
      scale: 1,
      rotateY: 0,
      y: 0,
      z: 0,
    },
    hover: {
      scale: 1.05,
      y: -8,
      z: 50,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      },
    },
    playable: {
      boxShadow:
        '0 0 20px rgba(34, 197, 94, 0.6), 0 8px 25px rgba(0, 0, 0, 0.2)',
      borderColor: 'rgba(34, 197, 94, 0.8)',
    },
    notPlayable: {
      filter: 'grayscale(0.3) brightness(0.8)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
    animating: {
      opacity: 0,
      scale: 0.95,
      filter: 'grayscale(0.5)',
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
  };

  const wrapperVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      className={styles.cardWrapper}
      style={style}
      variants={wrapperVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      layout
    >
      <motion.div
        className={styles.card}
        variants={cardVariants}
        initial="initial"
        whileHover={!disabled && onClick ? 'hover' : undefined}
        whileTap={!disabled && onClick ? 'tap' : undefined}
        animate={
          isAnimating
            ? 'animating'
            : disabled
              ? 'notPlayable'
              : isPlayable
                ? 'playable'
                : 'initial'
        }
        onClick={handleClick}
        data-playable={isPlayable && !disabled}
        data-disabled={disabled}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick && !disabled ? 0 : -1}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled) {
            e.preventDefault();
            // Create a synthetic mouse event for keyboard activation
            const syntheticEvent = {
              currentTarget: e.currentTarget,
              preventDefault: () => {},
              stopPropagation: () => {},
            } as React.MouseEvent<HTMLDivElement>;
            onClick(syntheticEvent);
          }
        }}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{card.title}</h3>
          <div className={styles.cardCost}>{formatRequirements()}</div>
        </div>

        <div className={styles.cardImage}>
          <img
            src={card.image}
            alt={card.title}
            onError={(e) => {
              // Fallback to placeholder image if card image fails to load
              e.currentTarget.src = '/assets/images/icons/card-placeholder.png';
              e.currentTarget.onerror = null; // Prevent infinite loop if placeholder also fails
            }}
          />
        </div>

        <div className={styles.cardEffects}>
          {formatEffects().map((effect, index) => (
            <div key={index} className={styles.effectItem}>
              {effect}
            </div>
          ))}
        </div>

        <div className={styles.cardQuote}>"{card.quote}"</div>

        <AnimatePresence>
          {!isPlayable && !disabled && (
            <motion.div
              className={styles.cardOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className={styles.overlayIcon}>🚫</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showTooltip && validationError && (
          <div className={styles.tooltipContainer}>
            <motion.div
              className={styles.tooltip}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              {validationError}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Memoize Card component for better performance when rendering multiple cards
export default memo(Card, (prevProps, nextProps) => {
  return (
    prevProps.cardInstance.instanceId === nextProps.cardInstance.instanceId &&
    prevProps.isPlayable === nextProps.isPlayable &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isAnimating === nextProps.isAnimating &&
    prevProps.validationError === nextProps.validationError
  );
});
