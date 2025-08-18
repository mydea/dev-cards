import type { Card, CardInstance } from '../types';

/**
 * Creates a card instance from a card definition
 */
export function createCardInstance(card: Card, instanceId?: string): CardInstance {
  return {
    card,
    instanceId: instanceId || `${card.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    isPlayable: false,
    visualState: {
      isSelected: false,
      isHighlighted: false,
      isAnimating: false,
    },
  };
}

/**
 * Creates multiple card instances from a card definition
 */
export function createCardInstances(card: Card, count: number): CardInstance[] {
  return Array.from({ length: count }, () => createCardInstance(card));
}
