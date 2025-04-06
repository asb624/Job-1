/**
 * Vite plugin to inject polyfills at the HTML level
 * This ensures the polyfills are loaded before any other JavaScript
 */

export default function webrtcPolyfillsPlugin() {
  const polyfillsScript = `
    <script>
      // WebRTC Polyfills - loaded before any other scripts
      window.global = window;
      window.process = window.process || { env: {} };
      window.Buffer = window.Buffer || { isBuffer: function(obj) { return false; } };
    </script>
  `;

  return {
    name: 'vite-plugin-webrtc-polyfills',
    transformIndexHtml(html: string): string {
      // Insert polyfills right after the opening head tag
      return html.replace('<head>', `<head>${polyfillsScript}`);
    }
  };
}