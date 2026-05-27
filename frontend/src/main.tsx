import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CopyGuard } from "./components/CopyGuard";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CopyGuard>
          <App />
        </CopyGuard>
        <Toaster
          position="top-center"
          toastOptions={{
            className: "text-sm",
            style: {
              background: "#1e293b",
              color: "#f1f5f9",
              border: "1px solid rgba(148, 163, 184, 0.2)",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#1e293b" } },
            error: { iconTheme: { primary: "#f87171", secondary: "#1e293b" } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
