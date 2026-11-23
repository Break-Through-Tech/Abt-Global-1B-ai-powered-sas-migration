import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { RunProvider } from "./state";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RunProvider>
      <App />
    </RunProvider>
  </StrictMode>,
);
