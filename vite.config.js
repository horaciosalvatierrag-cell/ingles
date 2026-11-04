import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/ingles/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    // Keep the development server private to this device.
    host: "localhost",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
});
