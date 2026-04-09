import '@testing-library/jest-dom';

// Mock scrollTo for tests
Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  value: () => {},
  writable: true,
});

// Ensure localStorage is available (jsdom sometimes has issues)
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}
