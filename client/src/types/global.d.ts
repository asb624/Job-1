// Type declarations for global interface extensions
interface Window {
  global?: any;
  __featureFlags?: {
    enableWebSockets: boolean;
    enableCallFeature: boolean;
  };
}