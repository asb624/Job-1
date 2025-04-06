// Polyfills for WebRTC libraries (simple-peer)
if (typeof window !== 'undefined') {
  // Polyfill global
  if (!window.global) {
    (window as any).global = window;
  }
  
  // Polyfill process
  if (!window.process) {
    (window as any).process = { env: {} };
  }
  
  // Polyfill Buffer
  if (!window.Buffer) {
    (window as any).Buffer = {
      isBuffer: () => false
    };
  }
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import i18n initialization
import "./lib/i18n";

createRoot(document.getElementById("root")!).render(<App />);
