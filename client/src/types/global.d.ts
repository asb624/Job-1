// Global types for browser polyfills

interface Window {
  global: typeof globalThis;
  process: {
    env: Record<string, string>;
  };
  Buffer: {
    isBuffer: (obj: any) => boolean;
  };
}