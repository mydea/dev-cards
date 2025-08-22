// Test utilities for React components
export * from '@testing-library/react';

// Mock implementations for commonly mocked modules
export const mockGameState = {
  resources: {
    progress: 50,
    bugs: 2,
    technicalDebt: 10,
    productivityPoints: 8,
  },
  stats: {
    round: 5,
    startTime: Date.now() - 300000, // 5 minutes ago
    endTime: null,
  },
  piles: {
    graveyard: [],
    hand: [],
    deck: [],
  },
  phase: 'PLANNING',
  isGameOver: false,
  difficulty: 'NORMAL',
} as const;

// Mock card instances for testing
export const mockCardInstance = {
  id: 'card-1',
  card: {
    id: 'test-card',
    name: 'Test Card',
    description: 'A test card for unit testing',
    cost: 2,
    image: '/test-card.png',
    category: 'FEATURE',
    effects: [
      {
        type: 'ADD_PROGRESS' as const,
        value: 10,
        randomType: 'STATIC' as const,
      },
    ],
  },
};

// Mock framer-motion components for testing
export const mockMotionDiv = ({ children, ...props }: any) => {
  const element = document.createElement('div');
  Object.assign(element, props);
  if (typeof children === 'string') {
    element.textContent = children;
  } else if (children) {
    element.appendChild(children);
  }
  return element;
};

// Export commonly used testing utilities
export { vi } from 'vitest';
