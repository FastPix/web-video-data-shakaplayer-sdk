import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// StrictMode double-invokes effects in dev; the hook's cleanup calls
// player.fp.destroy(), so mount>unmount>remount does not double-count views.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
