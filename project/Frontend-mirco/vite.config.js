import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3475,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5001", // API Gateway port (changed to avoid conflict)
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
