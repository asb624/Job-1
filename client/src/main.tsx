// Polyfills for WebRTC libraries (simple-peer)
if (typeof window !== 'undefined') {
  // Explicitly define global on the window object
  window.global = window;
  
  // Polyfill process
  if (!window.process) {
    window.process = { env: {} } as any;
  }
  
  // Polyfill Buffer
  if (!window.Buffer) {
    window.Buffer = {
      isBuffer: () => false
    } as any;
  }
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import i18n initialization
import "./lib/i18n";

createRoot(document.getElementById("root")!).render(<App />);
