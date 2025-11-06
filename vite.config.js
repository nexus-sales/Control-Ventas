/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
        suppressWarnings: true,
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,json}", "assets/**"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: {
              cacheName: "pwa-pages",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: ({ request }) => ["style", "script", "worker"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "pwa-assets",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url }) =>
              typeof globalThis !== "undefined" &&
              globalThis.location &&
              url.origin === globalThis.location.origin &&
              url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico)$/i),
            handler: "NetworkFirst",
            options: {
              cacheName: "pwa-media",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url }) =>
              typeof globalThis !== "undefined" &&
              globalThis.location &&
              url.origin === globalThis.location.origin &&
              url.pathname.startsWith("/api"),
            handler: "NetworkFirst",
            options: {
              cacheName: "pwa-api",
              networkTimeoutSeconds: 5,
              fetchOptions: {
                credentials: "include",
              },
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 30 },
            },
          },
        ],
      },
      includeAssets: [
        "favicon.ico",
        "pwa-192.png",
        "pwa-512.png",
        "apple-touch-icon.png",
      ],
      manifest: {
        name: "App Control Ventas & Comisiones",
        short_name: "AppCV",
        description: "Control de ventas, comisiones y liquidaciones",
        theme_color: "#0ea5e9",
        background_color: "#f0f9ff",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        scope: "/",
        start_url: "/?source=pwa",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "apple-touch-icon.png", sizes: "180x180", type: "image/png" },
          {
            src: "pwa-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Panel de Ventas",
            url: "/ventas",
            description: "Ir al módulo de ventas",
          },
          {
            name: "Dashboard",
            url: "/",
            description: "Ver estadísticas principales",
          },
        ],
      },
  injectRegister: null,
      includeManifestIcons: true,
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
});
