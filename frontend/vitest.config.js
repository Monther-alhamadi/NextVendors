import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{js,jsx,ts,tsx}", "src/**/*.spec.{js,jsx,ts,tsx}"],
    exclude: ["e2e/**", "dist/**", "node_modules/**"],
  },
});
