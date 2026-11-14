import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./index.css";

import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { initializeTheme } from "@/util/theme";

initializeTheme();
const ROOT_ELEMENT = document.getElementById("root");
if (!ROOT_ELEMENT) throw new Error("root element is missing");
createRoot(ROOT_ELEMENT).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
