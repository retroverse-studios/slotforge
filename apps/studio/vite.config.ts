import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const onActions = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  base: onActions ? "/slotforge/studio/" : "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "SlotForge Studio",
        short_name: "SlotForge",
        description: "Design and validate AFX-compatible HO slot car tracks.",
        theme_color: "#0f1115",
        background_color: "#0f1115",
        display: "standalone",
        start_url: ".",
        scope: ".",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: [
      {
        find: "@slotforge/core",
        replacement: fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      },
      {
        find: "@content",
        replacement: fileURLToPath(new URL("../../content", import.meta.url)),
      },
    ],
  },
  server: {
    fs: { allow: [repoRoot] },
  },
});
