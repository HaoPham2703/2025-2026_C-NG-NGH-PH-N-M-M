import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3475,
    proxy: {
      "/api": {
        target: "http://localhost:5001", // API Gateway port
        changeOrigin: true,
        secure: false,
      },
      "/payment-service-2": {
        target: "http://localhost:3005", // Payment Service 2 port
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/payment-service-2/, ""),
      },
    },
  },
});
