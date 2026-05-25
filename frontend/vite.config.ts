import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://tradingplatform-rd74.onrender.com/api/",
        changeOrigin: true,
      },
    },
  },
});
