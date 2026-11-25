import { defineConfig } from "vite";

const onActions = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  base: onActions ? "/slotforge/" : "/",
});
