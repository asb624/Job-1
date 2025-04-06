import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import i18n initialization
import "./lib/i18n";

createRoot(document.getElementById("root")!).render(<App />);
