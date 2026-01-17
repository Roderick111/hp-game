import '@testing-library/jest-dom';

// Mock scrollTo for tests
Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  value: () => {},
  writable: true,
});
