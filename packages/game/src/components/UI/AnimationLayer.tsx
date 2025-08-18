import {
  useState,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CardInstance } from '@dev-cards/data';
import Card from '../Card/Card';
import styles from './AnimationLayer.module.css';

interface FlyingCard {
  id: string;
  cardInstance: CardInstance;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  onComplete: () => void;
}

interface AnimationLayerProps {
  children: React.ReactNode;
}

interface AnimationLayerRef {
  animateCardToGraveyard: (
    cardInstance: CardInstance,
    startElement: HTMLElement,
    graveyardElement: HTMLElement,
    onComplete: () => void
  ) => void;
  animateCardToDiscard: (
    cardInstance: CardInstance,
    startElement: HTMLElement,
    discardElement: HTMLElement,
    onComplete: () => void
  ) => void;
}

const AnimationLayer = forwardRef<AnimationLayerRef, AnimationLayerProps>(
  ({ children }, ref) => {
    const [flyingCards, setFlyingCards] = useState<FlyingCard[]>([]);

    const animateCardToGraveyard = useCallback(
      (
        cardInstance: CardInstance,
        startElement: HTMLElement,
        graveyardElement: HTMLElement,
        onComplete: () => void
      ) => {
        const startRect = startElement.getBoundingClientRect();
        const endRect = graveyardElement.getBoundingClientRect();

        const flyingCard: FlyingCard = {
          id: `flying-${cardInstance.instanceId}-${Date.now()}`,
          cardInstance,
          startPosition: {
            x: startRect.left,
            y: startRect.top,
          },
          endPosition: {
            x: endRect.left + endRect.width / 2 - startRect.width / 2,
            y: endRect.top + endRect.height / 2 - startRect.height / 2,
          },
          onComplete: () => {
            // Remove this flying card from the list
            setFlyingCards((prev) =>
              prev.filter((fc) => fc.id !== flyingCard.id)
            );
            // Call the completion callback
            onComplete();
          },
        };

        setFlyingCards((prev) => [...prev, flyingCard]);
      },
      []
    );

    const animateCardToDiscard = useCallback(
      (
        cardInstance: CardInstance,
        startElement: HTMLElement,
        discardElement: HTMLElement,
        onComplete: () => void
      ) => {
        const startRect = startElement.getBoundingClientRect();
        const endRect = discardElement.getBoundingClientRect();

        const flyingCard: FlyingCard = {
          id: `flying-discard-${cardInstance.instanceId}-${Date.now()}`,
          cardInstance,
          startPosition: {
            x: startRect.left,
            y: startRect.top,
          },
          endPosition: {
            x: endRect.left + endRect.width / 2 - startRect.width / 2,
            y: endRect.top + endRect.height / 2 - startRect.height / 2,
          },
          onComplete: () => {
            // Remove this flying card from the list
            setFlyingCards((prev) =>
              prev.filter((fc) => fc.id !== flyingCard.id)
            );
            // Call the completion callback
            onComplete();
          },
        };

        setFlyingCards((prev) => [...prev, flyingCard]);
      },
      []
    );

    useImperativeHandle(
      ref,
      () => ({
        animateCardToGraveyard,
        animateCardToDiscard,
      }),
      [animateCardToGraveyard, animateCardToDiscard]
    );

    return (
      <div className={styles.animationLayer}>
        {children}
        <div className={styles.flyingCardsContainer}>
          <AnimatePresence>
            {flyingCards.map((flyingCard) => (
              <motion.div
                key={flyingCard.id}
                className={styles.flyingCard}
                initial={{
                  position: 'fixed',
                  x: flyingCard.startPosition.x,
                  y: flyingCard.startPosition.y,
                  scale: 1,
                  rotate: 0,
                  zIndex: 1000,
                }}
                animate={{
                  x: flyingCard.endPosition.x,
                  y: flyingCard.endPosition.y,
                  scale: 0.6,
                  rotate: Math.random() * 20 - 10, // Random rotation for natural feel
                }}
                exit={{
                  scale: 0,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for natural arc
                }}
                onAnimationComplete={flyingCard.onComplete}
              >
                <Card
                  cardInstance={flyingCard.cardInstance}
                  disabled={true}
                  style={{ pointerEvents: 'none' }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }
);

AnimationLayer.displayName = 'AnimationLayer';

export default AnimationLayer;
export type { AnimationLayerRef };
