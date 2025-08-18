import { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
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
  flipAnimation?: boolean; // For cards drawn from deck that need to flip
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
  animateCardFromDeck: (
    cardInstance: CardInstance,
    deckElement: HTMLElement,
    handElement: HTMLElement,
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

        // Add scroll compensation for accurate positioning
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        const flyingCard: FlyingCard = {
          id: `flying-${cardInstance.instanceId}-${Date.now()}`,
          cardInstance,
          startPosition: {
            x: startRect.left + scrollX,
            y: startRect.top + scrollY,
          },
          endPosition: {
            x: endRect.left + scrollX + endRect.width / 2 - startRect.width / 2,
            y:
              endRect.top + scrollY + endRect.height / 2 - startRect.height / 2,
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

        // Add scroll compensation for accurate positioning
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        const flyingCard: FlyingCard = {
          id: `flying-discard-${cardInstance.instanceId}-${Date.now()}`,
          cardInstance,
          startPosition: {
            x: startRect.left + scrollX,
            y: startRect.top + scrollY,
          },
          endPosition: {
            x: endRect.left + scrollX + endRect.width / 2 - startRect.width / 2,
            y:
              endRect.top + scrollY + endRect.height / 2 - startRect.height / 2,
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

    const animateCardFromDeck = useCallback(
      (
        cardInstance: CardInstance,
        deckElement: HTMLElement,
        handElement: HTMLElement,
        onComplete: () => void
      ) => {
        const startRect = deckElement.getBoundingClientRect();
        const endRect = handElement.getBoundingClientRect();

        // Add scroll compensation for accurate positioning
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        const flyingCard: FlyingCard = {
          id: `flying-draw-${cardInstance.instanceId}-${Date.now()}`,
          cardInstance,
          startPosition: {
            x: startRect.left + scrollX,
            y: startRect.top + scrollY,
          },
          endPosition: {
            x: endRect.left + scrollX + endRect.width / 2 - startRect.width / 2,
            y:
              endRect.top + scrollY + endRect.height / 2 - startRect.height / 2,
          },
          flipAnimation: true,
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
        animateCardFromDeck,
      }),
      [animateCardToGraveyard, animateCardToDiscard, animateCardFromDeck]
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
                  rotateY: flyingCard.flipAnimation ? 180 : 0, // Start face-down for drawn cards
                  zIndex: 1000,
                }}
                animate={{
                  x: flyingCard.endPosition.x,
                  y: flyingCard.endPosition.y,
                  scale: flyingCard.flipAnimation ? 1 : 0.6,
                  rotate: flyingCard.flipAnimation
                    ? 0
                    : Math.random() * 20 - 10,
                  rotateY: 0, // Flip to face-up
                }}
                exit={{
                  scale: 0,
                  opacity: 0,
                }}
                transition={{
                  duration: flyingCard.flipAnimation ? 0.8 : 0.4,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  rotateY: {
                    duration: flyingCard.flipAnimation ? 0.4 : 0,
                    delay: flyingCard.flipAnimation ? 0.2 : 0,
                  },
                }}
                onAnimationComplete={flyingCard.onComplete}
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                <motion.div
                  initial={{ rotateY: flyingCard.flipAnimation ? 180 : 0 }}
                  animate={{ rotateY: 0 }}
                  transition={{
                    duration: flyingCard.flipAnimation ? 0.4 : 0,
                    delay: flyingCard.flipAnimation ? 0.2 : 0,
                  }}
                  style={{
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <Card
                    cardInstance={flyingCard.cardInstance}
                    disabled={true}
                    style={{ pointerEvents: 'none' }}
                  />
                </motion.div>
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
