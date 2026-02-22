import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    // Allow any host (e.g. Render URL) so preview server doesn't block requests
    allowedHosts: true,
  },
  build: {
    sourcemap: false,
    reportCompressedSize: false,
  },
});
