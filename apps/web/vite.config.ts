import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api/auth": {
        target: "http://localhost:4001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth/, "")
      },
      "/api/products": {
        target: "http://localhost:4002",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/products/, "")
      },
      "/api/orders": {
        target: "http://localhost:4003",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/orders/, "")
      }
    }
  }
});
