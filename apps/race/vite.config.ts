import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const onActions = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  base: onActions ? "/slotforge/race/" : "/",
  plugins: [react()],
  server: { port: 5174 },
});
