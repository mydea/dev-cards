import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import GameInfo from './GameInfo';
import type { GameState } from '@dev-cards/data';

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

// Mock Date.now for consistent testing
const mockDateNow = vi.fn();
Object.defineProperty(Date, 'now', {
  value: mockDateNow,
  writable: true,
});

const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
  resources: {
    progress: 75,
    bugs: 1,
    technicalDebt: 8,
    productivityPoints: 12,
  },
  stats: {
    round: 10,
    startTime: 1000000000, // Fixed timestamp for testing
    endTime: null,
  },
  piles: {
    graveyard: [
      { id: 'card1', card: { id: 'test1', name: 'Card 1' } as any },
      { id: 'card2', card: { id: 'test2', name: 'Card 2' } as any },
      { id: 'card3', card: { id: 'test3', name: 'Card 3' } as any },
    ],
    hand: [
      { id: 'hand1', card: { id: 'hand1', name: 'Hand Card' } as any },
    ],
    deck: [],
    discard: [], // Add missing discard pile
  },
  phase: 'ACTION',
  isGameOver: false,
  difficulty: 'NORMAL',
  ...overrides,
} as GameState);

describe('GameInfo', () => {
  const mockOnReturnToMenu = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockDateNow.mockReturnValue(1000300000); // 5 minutes after start time
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should render game information correctly', () => {
    const gameState = createMockGameState();
    render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);

    expect(screen.getByText('Round 10')).toBeInTheDocument();
    expect(screen.getByText('5:00')).toBeInTheDocument(); // 5 minutes elapsed
    expect(screen.getByText('3 cards played')).toBeInTheDocument();
    expect(screen.getByText('1 card in hand')).toBeInTheDocument();
  });

  describe('Time formatting', () => {
    it('should format time correctly for minutes and seconds', () => {
      const gameState = createMockGameState();
      mockDateNow.mockReturnValue(1000000000 + 75000); // 1 minute 15 seconds later
      
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      expect(screen.getByText('1:15')).toBeInTheDocument();
    });

    it('should format time correctly for seconds only', () => {
      const gameState = createMockGameState();
      mockDateNow.mockReturnValue(1000000000 + 45000); // 45 seconds later
      
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      expect(screen.getByText('0:45')).toBeInTheDocument();
    });

    it('should format time correctly for less than 10 seconds', () => {
      const gameState = createMockGameState();
      mockDateNow.mockReturnValue(1000000000 + 5000); // 5 seconds later
      
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      expect(screen.getByText('0:05')).toBeInTheDocument();
    });

    it('should handle zero elapsed time', () => {
      const gameState = createMockGameState();
      mockDateNow.mockReturnValue(1000000000); // Same as start time
      
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      expect(screen.getByText('0:00')).toBeInTheDocument();
    });

    it('should format time correctly for longer durations', () => {
      const gameState = createMockGameState();
      mockDateNow.mockReturnValue(1000000000 + 3675000); // 1 hour, 1 minute, 15 seconds later
      
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      expect(screen.getByText('61:15')).toBeInTheDocument(); // Shows as minutes:seconds
    });
  });

  describe('Game ended state', () => {
    it('should show final time when game has ended', () => {
      const gameState = createMockGameState({
        stats: {
          round: 15,
          startTime: 1000000000,
          endTime: 1000000000 + 180000, // 3 minutes later
        },
      });
      
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      expect(screen.getByText('3:00')).toBeInTheDocument();
    });

    it('should not update time when game has ended', () => {
      const gameState = createMockGameState({
        stats: {
          round: 15,
          startTime: 1000000000,
          endTime: 1000000000 + 180000, // 3 minutes
        },
      });
      
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      expect(screen.getByText('3:00')).toBeInTheDocument();
      
      // Advance time and trigger re-render
      act(() => {
        mockDateNow.mockReturnValue(1000000000 + 360000); // 6 minutes later
        vi.advanceTimersByTime(1000);
      });
      
      // Time should still show 3:00 (game ended time)
      expect(screen.getByText('3:00')).toBeInTheDocument();
    });
  });

  describe('Statistics calculation', () => {
    it('should count cards played correctly', () => {
      const gameState = createMockGameState({
        piles: {
          graveyard: [
            { id: 'card1', card: { id: 'test1' } as any },
            { id: 'card2', card: { id: 'test2' } as any },
            { id: 'card3', card: { id: 'test3' } as any },
            { id: 'card4', card: { id: 'test4' } as any },
            { id: 'card5', card: { id: 'test5' } as any },
          ],
          hand: [],
          deck: [],
        },
      });
      
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      expect(screen.getByText('5 cards played')).toBeInTheDocument();
    });

    it('should count cards in hand correctly', () => {
      const gameState = createMockGameState({
        piles: {
          graveyard: [],
          hand: [
            { id: 'hand1', card: { id: 'h1' } as any },
            { id: 'hand2', card: { id: 'h2' } as any },
            { id: 'hand3', card: { id: 'h3' } as any },
          ],
          deck: [],
        },
      });
      
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      expect(screen.getByText('3 cards in hand')).toBeInTheDocument();
    });

    it('should handle singular forms correctly', () => {
      const gameState = createMockGameState({
        piles: {
          graveyard: [{ id: 'card1', card: { id: 'test1' } as any }],
          hand: [{ id: 'hand1', card: { id: 'h1' } as any }],
          deck: [],
        },
      });
      
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      expect(screen.getByText('1 card played')).toBeInTheDocument();
      expect(screen.getByText('1 card in hand')).toBeInTheDocument();
    });

    it('should handle zero cards correctly', () => {
      const gameState = createMockGameState({
        piles: {
          graveyard: [],
          hand: [],
          deck: [],
        },
      });
      
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      expect(screen.getByText('0 cards played')).toBeInTheDocument();
      expect(screen.getByText('0 cards in hand')).toBeInTheDocument();
    });
  });

  describe('End game functionality', () => {
    it('should show end game button', () => {
      const gameState = createMockGameState();
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      expect(screen.getByText('End Game')).toBeInTheDocument();
    });

    it('should show confirmation dialog when end game is clicked', () => {
      mockConfirm.mockReturnValue(false);
      const gameState = createMockGameState();
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      fireEvent.click(screen.getByText('End Game'));
      
      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to end the current game?\n\nThis will discard all your current progress and return to the main menu.'
      );
      expect(mockOnReturnToMenu).not.toHaveBeenCalled();
    });

    it('should call onReturnToMenu when user confirms end game', () => {
      mockConfirm.mockReturnValue(true);
      const gameState = createMockGameState();
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      fireEvent.click(screen.getByText('End Game'));
      
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockOnReturnToMenu).toHaveBeenCalledTimes(1);
    });

    it('should not call onReturnToMenu when user cancels end game', () => {
      mockConfirm.mockReturnValue(false);
      const gameState = createMockGameState();
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      fireEvent.click(screen.getByText('End Game'));
      
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockOnReturnToMenu).not.toHaveBeenCalled();
    });
  });

  describe('Timer updates', () => {
    it('should update time every second during active game', () => {
      const gameState = createMockGameState();
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      expect(screen.getByText('5:00')).toBeInTheDocument();
      
      // Advance time by 1 second
      act(() => {
        mockDateNow.mockReturnValue(1000301000);
        vi.advanceTimersByTime(1000);
      });
      
      expect(screen.getByText('5:01')).toBeInTheDocument();
    });

    it('should not start timer interval when game has ended', () => {
      const gameState = createMockGameState({
        stats: {
          round: 15,
          startTime: 1000000000,
          endTime: 1000000000 + 180000,
        },
      });
      
      const { rerender } = render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      expect(screen.getByText('3:00')).toBeInTheDocument();
      
      // Advance timers - time should not change since game has ended
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      
      expect(screen.getByText('3:00')).toBeInTheDocument();
    });
  });

  describe('Round display', () => {
    it('should display current round correctly', () => {
      const gameState = createMockGameState({ stats: { round: 1, startTime: 1000000000, endTime: null } });
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      expect(screen.getByText('Round 1')).toBeInTheDocument();
    });

    it('should handle large round numbers', () => {
      const gameState = createMockGameState({ stats: { round: 999, startTime: 1000000000, endTime: null } });
      render(<GameInfo gameState={gameState} onReturnToMenu={mockOnReturnToMenu} />);
      
      expect(screen.getByText('Round 999')).toBeInTheDocument();
    });
  });
});
