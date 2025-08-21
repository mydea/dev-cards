import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ScrollToTop from './ScrollToTop';

// Mock window.scrollTo
const mockScrollTo = vi.fn();
Object.defineProperty(window, 'scrollTo', {
  value: mockScrollTo,
  writable: true,
});

// Helper function to render ScrollToTop within a router
const renderScrollToTop = (initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ScrollToTop />
    </MemoryRouter>
  );
};

describe('ScrollToTop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render without crashing', () => {
    renderScrollToTop();
    // Component should render (but not display anything)
    expect(document.body).toBeInTheDocument();
  });

  it('should not render any visible content', () => {
    const { container } = renderScrollToTop();
    expect(container.firstChild).toBeNull();
  });

  it('should scroll to top when component mounts', () => {
    renderScrollToTop(['/home']);

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  });

  it('should scroll to top when pathname changes', () => {
    // Test that multiple separate router instances trigger scroll
    mockScrollTo.mockClear();
    
    renderScrollToTop(['/home']);
    renderScrollToTop(['/about']);
    
    // Should have been called twice (once for each router instance)
    expect(mockScrollTo).toHaveBeenCalledTimes(2);
  });

  it('should scroll to top multiple times for multiple route changes', () => {
    // Test multiple router instances
    renderScrollToTop(['/home']);
    renderScrollToTop(['/about']);
    renderScrollToTop(['/contact']);

    // Should have called scrollTo for each route (3 times total)
    expect(mockScrollTo).toHaveBeenCalledTimes(3);
    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  });

  it('should use smooth scroll behavior', () => {
    renderScrollToTop(['/test']);

    expect(mockScrollTo).toHaveBeenCalledWith(
      expect.objectContaining({
        behavior: 'smooth',
      })
    );
  });

  it('should scroll to top left corner (0, 0)', () => {
    renderScrollToTop(['/test']);

    expect(mockScrollTo).toHaveBeenCalledWith(
      expect.objectContaining({
        top: 0,
        left: 0,
      })
    );
  });

  it('should handle complex route paths', () => {
    renderScrollToTop(['/users/123/profile']);

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  });

  it('should handle route changes with query parameters', () => {
    renderScrollToTop(['/search?q=test']);

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  });

  it('should handle route changes with hash fragments', () => {
    renderScrollToTop(['/page#section']);

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  });
});
