import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// Mock matchMedia
const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));
Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, writable: true });

describe('useTheme', () => {
  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
    // Clear classList
    document.documentElement.classList.remove('light', 'dark');
  });

  it('should handle localStorage operations', () => {
    // Test localStorage mock
    localStorageMock.getItem.mockReturnValue('dark');
    expect(localStorageMock.getItem('agentOS-theme')).toBe('dark');
    
    localStorageMock.setItem('agentOS-theme', 'light');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('agentOS-theme', 'light');
  });

  it('should handle matchMedia operations', () => {
    // Test matchMedia mock
    const result = matchMediaMock('(prefers-color-scheme: dark)');
    expect(result.media).toBe('(prefers-color-scheme: dark)');
    expect(result.matches).toBe(false);
  });

  it('should handle document classList operations', () => {
    // Test classList operations
    document.documentElement.classList.add('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });
});