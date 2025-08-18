import { useState } from 'react';
import type { CardInstance } from '@dev-cards/data';
import styles from './Card.module.css';

interface CardProps {
  cardInstance: CardInstance;
  onClick?: () => void;
  isPlayable?: boolean;
  disabled?: boolean;
  validationError?: string;
  style?: React.CSSProperties;
}

function Card({
  cardInstance,
  onClick,
  isPlayable = false,
  disabled = false,
  validationError,
  style,
}: CardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { card } = cardInstance;

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
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
    return card.effects
      .map((effect) => {
        let description = '';

        switch (effect.type) {
          case 'ADD_PROGRESS':
            if (effect.randomType === 'STATIC') {
              description = `+${effect.value}% progress`;
            } else if (effect.randomType === 'COIN_FLIP') {
              description = `🪙 ${effect.headsValue}% or ${effect.tailsValue}% progress`;
            }
            break;
          case 'REMOVE_BUGS':
            if (effect.randomType === 'STATIC') {
              description = `-${effect.value} 🐛`;
            } else if (effect.randomType === 'COIN_FLIP') {
              description = `🪙 -${effect.headsValue} or -${effect.tailsValue} 🐛`;
            }
            break;
          case 'ADD_BUGS':
            if (effect.randomType === 'STATIC') {
              description = `+${effect.value} 🐛`;
            } else if (effect.randomType === 'COIN_FLIP') {
              description = `🪙 +${effect.headsValue} or +${effect.tailsValue} 🐛`;
            }
            break;
          case 'REMOVE_TECHNICAL_DEBT':
            if (effect.randomType === 'STATIC') {
              description = `-${effect.value} TD`;
            } else if (effect.randomType === 'COIN_FLIP') {
              description = `🪙 -${effect.headsValue} or -${effect.tailsValue} TD`;
            }
            break;
          case 'ADD_TECHNICAL_DEBT':
            if (effect.randomType === 'STATIC') {
              description = `+${effect.value} TD`;
            } else if (effect.randomType === 'COIN_FLIP') {
              description = `🪙 +${effect.headsValue} or +${effect.tailsValue} TD`;
            }
            break;
          case 'DRAW_CARDS':
            if (effect.randomType === 'STATIC') {
              description = `Draw ${effect.value} cards`;
            }
            break;
          case 'SHUFFLE_DISCARD_TO_DECK':
            if (effect.randomType === 'STATIC') {
              description = `Shuffle ${effect.value} from discard`;
            }
            break;
          default:
            description = 'Unknown effect';
        }

        return description;
      })
      .join(' • ');
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
          case 'SEND_TO_GRAVEYARD':
            return `bury ${req.value}`;
          default:
            return 'Unknown';
        }
      })
      .join(' • ');
  };

  return (
    <div
      className={styles.cardWrapper}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={styles.card}
        onClick={handleClick}
        data-playable={isPlayable && !disabled}
        data-disabled={disabled}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick && !disabled ? 0 : -1}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled) {
            e.preventDefault();
            onClick();
          }
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
              // Fallback to placeholder if image fails to load
              e.currentTarget.style.display = 'none';
              const nextElement = e.currentTarget
                .nextElementSibling as HTMLElement;
              if (nextElement) {
                nextElement.style.display = 'flex';
              }
            }}
          />
          <div className={styles.imagePlaceholder}>🎯</div>
        </div>

        <div className={styles.cardEffects}>{formatEffects()}</div>

        <div className={styles.cardQuote}>"{card.quote}"</div>

        {!isPlayable && !disabled && (
          <div className={styles.cardOverlay}>
            <span className={styles.overlayIcon}>🚫</span>
          </div>
        )}
      </div>

      {showTooltip && validationError && (
        <div className={styles.tooltip}>{validationError}</div>
      )}
    </div>
  );
}

export default Card;
