import { createBrowserRouter } from "react-router-dom";
import CreatePage from "./pages/create_page/CreatePage";
import EditPage from "./pages/edit_page/EditPage";
import ShapePlayground from "./pages/ShapePlayground";
import AuthPage from "./pages/auth_page/AuthPage";
import HomePage from "./pages/home_page/HomePage";

export const router = createBrowserRouter([
    { path: "/", element: <HomePage /> },
    { path: "/create", element: <CreatePage /> },
    { path: "/auth", element: <AuthPage /> },
    { path: "/editor/:projectId", element: <EditPage /> },
    { path: "/playground", element: <ShapePlayground /> },

]);
