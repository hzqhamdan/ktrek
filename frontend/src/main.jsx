import React from "react";

import ReactDOM from "react-dom/client";

import App from "./App";

import "./index.css";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastProvider } from "./components/ui/toast-1";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {" "}
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </GoogleOAuthProvider>{" "}
  </React.StrictMode>
);
