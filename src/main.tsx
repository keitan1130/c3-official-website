import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./index.css";

const ROOT_ELEMENT = document.getElementById("root");
if (!ROOT_ELEMENT) throw new Error("root element is missing");

createRoot(ROOT_ELEMENT).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
