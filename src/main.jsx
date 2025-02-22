import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Providers from "./providers";

ReactDOM.createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
);
