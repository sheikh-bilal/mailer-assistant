import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        content: "src/content.js",
        index: path.resolve(__dirname, "index.html"),
      },
      output: {
        entryFileNames: "assets/[name].js",
      },
    },
    outDir: "dist",
  },
});
