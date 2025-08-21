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
    const { rerender } = render(
      <MemoryRouter initialEntries={['/home']}>
        <ScrollToTop />
      </MemoryRouter>
    );

    // Clear the initial call
    mockScrollTo.mockClear();

    // Change the route
    rerender(
      <MemoryRouter initialEntries={['/about']}>
        <ScrollToTop />
      </MemoryRouter>
    );

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  });

  it('should scroll to top multiple times for multiple route changes', () => {
    let currentPath = '/home';
    const { rerender } = render(
      <MemoryRouter initialEntries={[currentPath]}>
        <ScrollToTop />
      </MemoryRouter>
    );

    // Clear the initial call
    mockScrollTo.mockClear();

    // First route change
    currentPath = '/about';
    rerender(
      <MemoryRouter initialEntries={[currentPath]}>
        <ScrollToTop />
      </MemoryRouter>
    );

    // Second route change
    currentPath = '/contact';
    rerender(
      <MemoryRouter initialEntries={[currentPath]}>
        <ScrollToTop />
      </MemoryRouter>
    );

    expect(mockScrollTo).toHaveBeenCalledTimes(2);
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
    const { rerender } = render(
      <MemoryRouter initialEntries={['/search']}>
        <ScrollToTop />
      </MemoryRouter>
    );

    // Clear the initial call
    mockScrollTo.mockClear();

    // Change route with query parameters
    rerender(
      <MemoryRouter initialEntries={['/search?q=test']}>
        <ScrollToTop />
      </MemoryRouter>
    );

    expect(mockScrollTo).toHaveBeenCalledTimes(1);
    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  });

  it('should handle route changes with hash fragments', () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/page']}>
        <ScrollToTop />
      </MemoryRouter>
    );

    // Clear the initial call
    mockScrollTo.mockClear();

    // Change route with hash
    rerender(
      <MemoryRouter initialEntries={['/page#section']}>
        <ScrollToTop />
      </MemoryRouter>
    );

    expect(mockScrollTo).toHaveBeenCalledTimes(1);
    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  });
});
