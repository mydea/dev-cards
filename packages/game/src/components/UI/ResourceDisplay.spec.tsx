import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ResourceDisplay from './ResourceDisplay';
import type { GameState } from '@dev-cards/data';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, animate, initial, exit, transition, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, animate, initial, exit, transition, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const createMockGameState = (resources: Partial<GameState['resources']> = {}): GameState => ({
  resources: {
    progress: 50,
    bugs: 2,
    technicalDebt: 10,
    productivityPoints: 8,
    ...resources,
  },
  stats: {
    round: 5,
    startTime: Date.now(),
    endTime: null,
  },
  piles: {
    graveyard: [],
    hand: [],
    deck: [],
    discard: [],
  },
  phase: 'PLANNING',
  isGameOver: false,
  difficulty: 'NORMAL',
} as GameState);

describe('ResourceDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic resource display', () => {
    it('should render all resource values correctly', () => {
      const gameState = createMockGameState({
        progress: 75,
        bugs: 3,
        technicalDebt: 15,
        productivityPoints: 12,
      });

      render(<ResourceDisplay gameState={gameState} />);

      expect(screen.getByText('75%')).toBeInTheDocument(); // progress
      expect(screen.getByText('3')).toBeInTheDocument(); // bugs
      expect(screen.getByText('15')).toBeInTheDocument(); // technical debt
      expect(screen.getByText('12')).toBeInTheDocument(); // productivity points
    });

    it('should render zero values correctly', () => {
      const gameState = createMockGameState({
        progress: 0,
        bugs: 0,
        technicalDebt: 0,
        productivityPoints: 0,
      });

      render(<ResourceDisplay gameState={gameState} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getAllByText('0')).toHaveLength(3); // bugs, tech debt, PP
    });

    it('should render maximum values correctly', () => {
      const gameState = createMockGameState({
        progress: 100,
        bugs: 99,
        technicalDebt: 100,
        productivityPoints: 50,
      });

      render(<ResourceDisplay gameState={gameState} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('99')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  describe('Progress bar styling', () => {
    it('should apply correct class for low progress', () => {
      const gameState = createMockGameState({ progress: 25 });
      const { container } = render(<ResourceDisplay gameState={gameState} />);

      const progressBar = container.querySelector('[style*="width: 25%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should apply correct class for medium progress', () => {
      const gameState = createMockGameState({ progress: 60 });
      const { container } = render(<ResourceDisplay gameState={gameState} />);

      const progressBar = container.querySelector('[style*="width: 60%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should apply correct class for high progress', () => {
      const gameState = createMockGameState({ progress: 90 });
      const { container } = render(<ResourceDisplay gameState={gameState} />);

      const progressBar = container.querySelector('[style*="width: 90%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should handle 100% progress correctly', () => {
      const gameState = createMockGameState({ progress: 100 });
      const { container } = render(<ResourceDisplay gameState={gameState} />);

      const progressBar = container.querySelector('[style*="width: 100%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Change detection and animations', () => {
    it('should detect progress increase', () => {
      const initialGameState = createMockGameState({ progress: 50 });
      const { rerender } = render(<ResourceDisplay gameState={initialGameState} />);

      expect(screen.getByText('50%')).toBeInTheDocument();

      const updatedGameState = createMockGameState({ progress: 65 });
      rerender(<ResourceDisplay gameState={updatedGameState} />);

      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    it('should detect progress decrease', () => {
      const initialGameState = createMockGameState({ progress: 80 });
      const { rerender } = render(<ResourceDisplay gameState={initialGameState} />);

      const updatedGameState = createMockGameState({ progress: 65 });
      rerender(<ResourceDisplay gameState={updatedGameState} />);

      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    it('should detect bugs increase', () => {
      const initialGameState = createMockGameState({ bugs: 2 });
      const { rerender } = render(<ResourceDisplay gameState={initialGameState} />);

      const updatedGameState = createMockGameState({ bugs: 5 });
      rerender(<ResourceDisplay gameState={updatedGameState} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should detect bugs decrease', () => {
      const initialGameState = createMockGameState({ bugs: 5 });
      const { rerender } = render(<ResourceDisplay gameState={initialGameState} />);

      const updatedGameState = createMockGameState({ bugs: 2 });
      rerender(<ResourceDisplay gameState={updatedGameState} />);

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should detect technical debt changes', () => {
      const initialGameState = createMockGameState({ technicalDebt: 10 });
      const { rerender } = render(<ResourceDisplay gameState={initialGameState} />);

      const updatedGameState = createMockGameState({ technicalDebt: 15 });
      rerender(<ResourceDisplay gameState={updatedGameState} />);

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should detect productivity points changes', () => {
      const initialGameState = createMockGameState({ productivityPoints: 8 });
      const { rerender } = render(<ResourceDisplay gameState={initialGameState} />);

      const updatedGameState = createMockGameState({ productivityPoints: 12 });
      rerender(<ResourceDisplay gameState={updatedGameState} />);

      expect(screen.getByText('12')).toBeInTheDocument();
    });
  });

  describe('Multiple simultaneous changes', () => {
    it('should handle multiple resource changes at once', () => {
      const initialGameState = createMockGameState({
        progress: 30,
        bugs: 1,
        technicalDebt: 5,
        productivityPoints: 3,
      });
      const { rerender } = render(<ResourceDisplay gameState={initialGameState} />);

      const updatedGameState = createMockGameState({
        progress: 50,
        bugs: 3,
        technicalDebt: 8,
        productivityPoints: 6,
      });
      rerender(<ResourceDisplay gameState={updatedGameState} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('should handle mixed positive and negative changes', () => {
      const initialGameState = createMockGameState({
        progress: 40,
        bugs: 5,
        technicalDebt: 12,
        productivityPoints: 8,
      });
      const { rerender } = render(<ResourceDisplay gameState={initialGameState} />);

      const updatedGameState = createMockGameState({
        progress: 60, // +20
        bugs: 2,     // -3
        technicalDebt: 15, // +3
        productivityPoints: 5, // -3
      });
      rerender(<ResourceDisplay gameState={updatedGameState} />);

      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Extreme values', () => {
    it('should handle negative values gracefully', () => {
      // Even though game logic might prevent this, component should handle it
      const gameState = createMockGameState({
        progress: -5,
        bugs: -1,
        technicalDebt: -2,
        productivityPoints: -3,
      });

      render(<ResourceDisplay gameState={gameState} />);

      expect(screen.getByText('-5%')).toBeInTheDocument();
      expect(screen.getByText('-1')).toBeInTheDocument();
      expect(screen.getByText('-2')).toBeInTheDocument();
      expect(screen.getByText('-3')).toBeInTheDocument();
    });

    it('should handle very large values', () => {
      const gameState = createMockGameState({
        progress: 999,
        bugs: 100,
        technicalDebt: 200,
        productivityPoints: 150,
      });

      render(<ResourceDisplay gameState={gameState} />);

      expect(screen.getByText('999%')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  describe('No changes scenario', () => {
    it('should handle when no values change', () => {
      const gameState = createMockGameState({
        progress: 50,
        bugs: 2,
        technicalDebt: 10,
        productivityPoints: 8,
      });

      const { rerender } = render(<ResourceDisplay gameState={gameState} />);

      // Re-render with same values
      rerender(<ResourceDisplay gameState={gameState} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  describe('Component stability', () => {
    it('should be stable across multiple re-renders with same data', () => {
      const gameState = createMockGameState({
        progress: 75,
        bugs: 1,
        technicalDebt: 5,
        productivityPoints: 10,
      });

      const { rerender } = render(<ResourceDisplay gameState={gameState} />);

      // Multiple re-renders with same data
      for (let i = 0; i < 5; i++) {
        rerender(<ResourceDisplay gameState={gameState} />);
      }

      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should handle rapid successive changes', () => {
      let gameState = createMockGameState({ progress: 0 });
      const { rerender } = render(<ResourceDisplay gameState={gameState} />);

      // Rapidly increase progress
      for (let progress = 10; progress <= 100; progress += 10) {
        gameState = createMockGameState({ progress });
        rerender(<ResourceDisplay gameState={gameState} />);
      }

      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Progress bar edge cases', () => {
    it('should handle progress over 100%', () => {
      const gameState = createMockGameState({ progress: 150 });
      const { container } = render(<ResourceDisplay gameState={gameState} />);

      expect(screen.getByText('150%')).toBeInTheDocument();
      // Progress bar should be clamped to 100% width visually
      const progressBar = container.querySelector('[style*="width: 100%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should handle zero progress correctly', () => {
      const gameState = createMockGameState({ progress: 0 });
      const { container } = render(<ResourceDisplay gameState={gameState} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
      const progressBar = container.querySelector('[style*="width: 0%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });
});
