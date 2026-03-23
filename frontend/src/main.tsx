import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { UserDataProvider } from "./lib/contexts/UserDataContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UserDataProvider>
      <RouterProvider router={router} />
    </UserDataProvider>
  </React.StrictMode>
);
