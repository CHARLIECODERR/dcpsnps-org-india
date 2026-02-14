import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "DCPS NPS India Portal",
        short_name: "DCPS",
        description: "DCPS NPS India Web Application",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],

  optimizeDeps: {
    include: [
      "@mui/x-date-pickers/DatePicker",
      "@mui/x-date-pickers/AdapterDayjs",
    ],
  },

  // 🔥 SIMPLE BUILD (NO manualChunks)
  build: {
    chunkSizeWarningLimit: 1500,
  },
});