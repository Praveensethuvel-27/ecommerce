import '@testing-library/jest-dom/vitest';

// Most unit tests mock network requests explicitly.
// Keep a safe default to avoid accidental real network calls.
if (!globalThis.fetch) {
  globalThis.fetch = async () => {
    throw new Error('fetch is not mocked for this test');
  };
}

