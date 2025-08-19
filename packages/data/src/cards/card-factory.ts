import type { Card, CardInstance } from '../types';
import { generateUUID } from '../utils/uuid';

/**
 * Creates a card instance from a card definition
 */
export function createCardInstance(
  card: Card,
  instanceId?: string
): CardInstance {
  return {
    card,
    instanceId:
      instanceId ||
      `${card.id}_${generateUUID()}`,
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
