import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { registerServiceWorker } from "./pwa/registerSW";

registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
