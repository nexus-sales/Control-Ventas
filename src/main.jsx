import React from "react";
import * as Tooltip from '@radix-ui/react-tooltip';
import { BrowserRouter } from "react-router-dom";
import ReactDOM from "react-dom/client";
import "./index.css";
import AppCVv2 from "./AppCVv2.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Tooltip.Provider>
        <AppCVv2 />
      </Tooltip.Provider>
    </BrowserRouter>
  </React.StrictMode>,
);

// PWA (auto update)
if ("serviceWorker" in navigator) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        window.dispatchEvent(
          new CustomEvent("pwa:need-refresh", {
            detail: { update: updateSW },
          })
        );
      },
      onOfflineReady() {
        window.dispatchEvent(new Event("pwa:offline-ready"));
      },
      onRegisteredSW(swUrl, registration) {
        console.info("[PWA] Service worker registrado", swUrl, registration);
      },
      onRegisterError(error) {
        // LOG ELIMINADO
      },
    });
  });
}