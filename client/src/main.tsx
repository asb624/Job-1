// Polyfill for Node.js objects missing in browser environment
if (typeof window !== 'undefined' && !(window as any).global) {
  (window as any).global = window;
}

// Configure feature flags immediately before any imports
// Disable WebSockets and Call features by default
(window as any).__featureFlags = {
  enableWebSockets: false,
  enableCallFeature: false
};

// Add process polyfill
if (typeof window !== 'undefined' && typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

console.log('Application initialization started with WebSockets and Call features disabled');

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import i18n initialization
import "./lib/i18n";

createRoot(document.getElementById("root")!).render(<App />);
