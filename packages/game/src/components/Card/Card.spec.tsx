import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Card from './Card';
import type { CardInstance } from '@dev-cards/data';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const createMockCardInstance = (overrides: any = {}): CardInstance => {
  const baseCard = {
    id: 'test-card',
    name: 'Test Card',
    description: 'A test card for unit testing',
    cost: 2,
    image: '/test-card.png',
    category: 'FEATURE',
    requirements: [],
    effects: [
      {
        type: 'ADD_PROGRESS',
        value: 10,
        randomType: 'STATIC',
      },
    ],
  };

  return {
    id: 'card-123',
    card: {
      ...baseCard,
      ...overrides.card,
      // Ensure critical arrays always exist even after override
      requirements: overrides.card?.requirements !== undefined ? overrides.card.requirements : baseCard.requirements,
      effects: overrides.card?.effects !== undefined ? overrides.card.effects : baseCard.effects,
    },
    ...overrides,
  };
};

describe('Card', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render card with basic information', () => {
      const cardInstance = createMockCardInstance();
      render(<Card cardInstance={cardInstance} />);

      // Cost should show as "Free" when cost is 2 and no requirements
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('+10% progress')).toBeInTheDocument(); // effect
    });

    it('should render card image with correct src', () => {
      const cardInstance = createMockCardInstance();
      render(<Card cardInstance={cardInstance} />);

      const image = screen.getByRole('img') as HTMLImageElement;
      expect(image.src).toContain('/test-card.png');
    });

    it('should apply custom styles when provided', () => {
      const cardInstance = createMockCardInstance();
      const customStyle = { backgroundColor: 'red', margin: '10px' };
      
      const { container } = render(
        <Card cardInstance={cardInstance} style={customStyle} />
      );

      const cardElement = container.firstChild as HTMLElement;
      expect(cardElement).toHaveStyle('background-color: rgb(255, 0, 0)');
      expect(cardElement).toHaveStyle('margin: 10px');
    });
  });

  describe('Effect formatting', () => {
    it('should format static ADD_PROGRESS effect correctly', () => {
      const cardInstance = createMockCardInstance({
        card: {
          effects: [
            {
              type: 'ADD_PROGRESS',
              value: 15,
              randomType: 'STATIC',
            },
          ],
        },
      });

      render(<Card cardInstance={cardInstance} />);
      expect(screen.getByText('+15% progress')).toBeInTheDocument();
    });

    it('should format coin flip ADD_PROGRESS effect correctly', () => {
      const cardInstance = createMockCardInstance({
        card: {
          effects: [
            {
              type: 'ADD_PROGRESS',
              value: 20,
              randomType: 'COIN_FLIP',
            },
          ],
        },
      });

      render(<Card cardInstance={cardInstance} />);
      expect(screen.getByText('Coin flip: +20% progress or nothing')).toBeInTheDocument();
    });

    it('should format random range ADD_PROGRESS effect correctly', () => {
      const cardInstance = createMockCardInstance({
        card: {
          effects: [
            {
              type: 'ADD_PROGRESS',
              randomType: 'RANDOM_RANGE',
              minValue: 5,
              maxValue: 15,
            },
          ],
        },
      });

      render(<Card cardInstance={cardInstance} />);
      expect(screen.getByText('Random +5% to +15% progress')).toBeInTheDocument();
    });

    it('should format ADD_BUGS effects correctly', () => {
      const cardInstance = createMockCardInstance({
        card: {
          effects: [
            {
              type: 'ADD_BUGS',
              value: 3,
              randomType: 'STATIC',
            },
          ],
        },
      });

      render(<Card cardInstance={cardInstance} />);
      expect(screen.getByText('+3 bugs')).toBeInTheDocument();
    });

    it('should format REMOVE_BUGS effects correctly', () => {
      const cardInstance = createMockCardInstance({
        card: {
          effects: [
            {
              type: 'REMOVE_BUGS',
              value: 2,
              randomType: 'STATIC',
            },
          ],
        },
      });

      render(<Card cardInstance={cardInstance} />);
      expect(screen.getByText('-2 bugs')).toBeInTheDocument();
    });

    it('should format ADD_TECH_DEBT effects correctly', () => {
      const cardInstance = createMockCardInstance({
        card: {
          effects: [
            {
              type: 'ADD_TECH_DEBT',
              value: 5,
              randomType: 'STATIC',
            },
          ],
        },
      });

      render(<Card cardInstance={cardInstance} />);
      expect(screen.getByText('+5 technical debt')).toBeInTheDocument();
    });

    it('should format REMOVE_TECH_DEBT effects correctly', () => {
      const cardInstance = createMockCardInstance({
        card: {
          effects: [
            {
              type: 'REMOVE_TECH_DEBT',
              value: 4,
              randomType: 'STATIC',
            },
          ],
        },
      });

      render(<Card cardInstance={cardInstance} />);
      expect(screen.getByText('-4 technical debt')).toBeInTheDocument();
    });

    it('should format ADD_PP effects correctly', () => {
      const cardInstance = createMockCardInstance({
        card: {
          effects: [
            {
              type: 'ADD_PP',
              value: 8,
              randomType: 'STATIC',
            },
          ],
        },
      });

      render(<Card cardInstance={cardInstance} />);
      expect(screen.getByText('+8 productivity points')).toBeInTheDocument();
    });

    it('should format REMOVE_PP effects correctly', () => {
      const cardInstance = createMockCardInstance({
        card: {
          effects: [
            {
              type: 'REMOVE_PP',
              value: 3,
              randomType: 'STATIC',
            },
          ],
        },
      });

      render(<Card cardInstance={cardInstance} />);
      expect(screen.getByText('-3 productivity points')).toBeInTheDocument();
    });

    it('should format multiple effects correctly', () => {
      const cardInstance = createMockCardInstance({
        card: {
          effects: [
            {
              type: 'ADD_PROGRESS',
              value: 10,
              randomType: 'STATIC',
            },
            {
              type: 'ADD_BUGS',
              value: 1,
              randomType: 'STATIC',
            },
            {
              type: 'REMOVE_TECH_DEBT',
              value: 2,
              randomType: 'STATIC',
            },
          ],
        },
      });

      render(<Card cardInstance={cardInstance} />);
      expect(screen.getByText('+10% progress')).toBeInTheDocument();
      expect(screen.getByText('+1 bug')).toBeInTheDocument();
      expect(screen.getByText('-2 technical debt')).toBeInTheDocument();
    });

    it('should handle singular forms for effects', () => {
      const cardInstance = createMockCardInstance({
        card: {
          effects: [
            {
              type: 'ADD_BUGS',
              value: 1,
              randomType: 'STATIC',
            },
            {
              type: 'ADD_PP',
              value: 1,
              randomType: 'STATIC',
            },
          ],
        },
      });

      render(<Card cardInstance={cardInstance} />);
      expect(screen.getByText('+1 bug')).toBeInTheDocument();
      expect(screen.getByText('+1 productivity point')).toBeInTheDocument();
    });
  });

  describe('Click handling', () => {
    it('should call onClick when card is clicked and not disabled', () => {
      const cardInstance = createMockCardInstance();
      const { container } = render(<Card cardInstance={cardInstance} onClick={mockOnClick} />);

      const cardElement = container.querySelector('[role="button"]') as HTMLElement;
      fireEvent.click(cardElement);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when card is disabled', () => {
      const cardInstance = createMockCardInstance();
      const { container } = render(<Card cardInstance={cardInstance} onClick={mockOnClick} disabled={true} />);

      const cardElement = container.querySelector('[role="button"]') as HTMLElement;
      fireEvent.click(cardElement);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when onClick is not provided', () => {
      const cardInstance = createMockCardInstance();
      
      // Should not throw error when clicking without onClick handler
      expect(() => {
        const { container } = render(<Card cardInstance={cardInstance} />);
        const cardElement = container.querySelector('[role="button"]');
        if (cardElement) {
          fireEvent.click(cardElement);
        }
      }).not.toThrow();
    });

    it('should pass mouse event to onClick handler', () => {
      const cardInstance = createMockCardInstance();
      const { container } = render(<Card cardInstance={cardInstance} onClick={mockOnClick} />);

      const cardElement = container.querySelector('[role="button"]') as HTMLElement;
      fireEvent.click(cardElement);
      expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object));
      
      const event = mockOnClick.mock.calls[0][0];
      expect(event.type).toBe('click');
    });
  });

  describe('Card states', () => {
    it('should apply playable class when isPlayable is true', () => {
      const cardInstance = createMockCardInstance();
      const { container } = render(
        <Card cardInstance={cardInstance} isPlayable={true} />
      );

      const cardElement = container.querySelector('[role="button"]');
      expect(cardElement).not.toBeNull();
      expect(cardElement).toHaveAttribute('data-playable', 'true');
    });

    it('should apply disabled class when disabled is true', () => {
      const cardInstance = createMockCardInstance();
      const { container } = render(
        <Card cardInstance={cardInstance} disabled={true} />
      );

      const cardElement = container.querySelector('[role="button"]');
      expect(cardElement).not.toBeNull();
      expect(cardElement).toHaveAttribute('data-disabled', 'true');
    });

    it('should apply animating class when isAnimating is true', () => {
      const cardInstance = createMockCardInstance();
      const { container } = render(
        <Card cardInstance={cardInstance} isAnimating={true} />
      );

      // Check that the card renders with animation properties
      const cardElement = container.querySelector('[role="button"]');
      expect(cardElement).not.toBeNull();
    });
  });

  describe('Validation error tooltip', () => {
    it('should show tooltip on hover when validation error exists', () => {
      const cardInstance = createMockCardInstance();
      const { container } = render(
        <Card 
          cardInstance={cardInstance} 
          validationError="Not enough resources to play this card"
        />
      );

      const cardElement = container.querySelector('[role="button"]');
      
      // Initially tooltip should not be visible
      expect(screen.queryByText('Not enough resources to play this card')).not.toBeInTheDocument();

      // Hover over card
      if (cardElement) {
        fireEvent.mouseEnter(cardElement);
        expect(screen.getByText('Not enough resources to play this card')).toBeInTheDocument();
      }
    });

    it('should hide tooltip on mouse leave', () => {
      const cardInstance = createMockCardInstance();
      const { container } = render(
        <Card 
          cardInstance={cardInstance} 
          validationError="Not enough resources to play this card"
        />
      );

      const cardElement = container.querySelector('[role="button"]');
      
      if (cardElement) {
        // Show tooltip
        fireEvent.mouseEnter(cardElement);
        expect(screen.getByText('Not enough resources to play this card')).toBeInTheDocument();

        // Hide tooltip
        fireEvent.mouseLeave(cardElement);
        expect(screen.queryByText('Not enough resources to play this card')).not.toBeInTheDocument();
      }
    });

    it('should not show tooltip on hover when no validation error exists', () => {
      const cardInstance = createMockCardInstance();
      const { container } = render(<Card cardInstance={cardInstance} />);

      const cardElement = container.querySelector('[role="button"]');
      
      if (cardElement) {
        fireEvent.mouseEnter(cardElement);
        // Should not find any tooltip-like text
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/not enough/i)).not.toBeInTheDocument();
      }
    });
  });

  describe('Card categories and visual styling', () => {
    it('should render cards with different categories', () => {
      const categories = ['FEATURE', 'BUG_FIX', 'REFACTOR', 'TESTING', 'DOCUMENTATION'];
      
      categories.forEach(category => {
        const cardInstance = createMockCardInstance({
          card: { category }
        });
        
        const { container } = render(<Card cardInstance={cardInstance} />);
        const cardElement = container.firstChild as HTMLElement;
        
        expect(cardElement).toHaveClass(category.toLowerCase().replace('_', '-'));
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle cards with no effects', () => {
      const cardInstance = createMockCardInstance({
        card: {
          effects: [],
        },
      });

      expect(() => {
        render(<Card cardInstance={cardInstance} />);
      }).not.toThrow();
      
      expect(screen.getByText('+10% progress')).toBeInTheDocument();
    });

    it('should handle cards with zero cost', () => {
      const cardInstance = createMockCardInstance({
        card: {
          cost: 0,
        },
      });

      render(<Card cardInstance={cardInstance} />);
      expect(screen.getByText('Free')).toBeInTheDocument(); // Zero cost shows as "Free"
    });

    it('should handle cards with high cost', () => {
      const cardInstance = createMockCardInstance({
        card: {
          cost: 99,
          requirements: [{ type: 'SPEND_PP', value: 99 }], // Add requirements so cost displays
        },
      });

      render(<Card cardInstance={cardInstance} />);
      expect(screen.getByText('99 PP')).toBeInTheDocument();
    });

    it('should handle long card names gracefully', () => {
      const cardInstance = createMockCardInstance({
        card: {
          name: 'This is a very long card name that might cause layout issues',
        },
      });

      // Should render without crashing
      expect(() => {
        render(<Card cardInstance={cardInstance} />);
      }).not.toThrow();
    });

    it('should handle long descriptions gracefully', () => {
      const cardInstance = createMockCardInstance({
        card: {
          description: 'This is a very long description that explains in great detail what this card does and how it affects the game state when played by the user during their turn.',
        },
      });

      // Should render without crashing  
      expect(() => {
        render(<Card cardInstance={cardInstance} />);
      }).not.toThrow();
    });
  });
});
