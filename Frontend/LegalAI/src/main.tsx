import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter as Router } from "react-router-dom";
import "./index.css";
import { ToastContainer } from "react-toastify";
import { GoogleOAuthProvider } from "@react-oauth/google";


// Fetch client ID securely
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_KEY;

if (!clientId) {
  console.error("Google OAuth Client ID is not defined.");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
   
        <GoogleOAuthProvider clientId={clientId}>
          <Router>
            <App />
            <ToastContainer />
          </Router>
        </GoogleOAuthProvider>
     
  </StrictMode>
);
