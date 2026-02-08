import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    // ✅ PWA PLUGIN (THIS WAS MISSING)
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

  // ✅ YOUR BUILD OPTIMIZATION (UNCHANGED)
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) return "firebase-vendor";
            if (id.includes("react-router-dom")) return "router-vendor";
            if (id.includes("react") || id.includes("react-dom"))
              return "react-vendor";
            if (id.includes("@emailjs") || id.includes("emailjs"))
              return "emailjs-vendor";
            if (id.includes("react-icons") || id.includes("@heroicons"))
              return "icons-vendor";
            if (id.includes("react-toastify")) return "toastify-vendor";
            return "vendor";
          }
        },
      },
    },
  },
});
