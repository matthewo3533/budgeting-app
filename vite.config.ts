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
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("chart.js") || id.includes("react-chartjs")) return "charts";
            if (id.includes("react") || id.includes("react-dom")) return "react";
            return "vendor";
          }
        },
      },
    },
  },
});
