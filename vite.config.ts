/// <reference types="vitest" />

import { defineConfig } from "vite";
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  plugins: [vue()],
  server: {
    host: "0.0.0.0", 
    port: 5173, 
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
  base: "./",
});
