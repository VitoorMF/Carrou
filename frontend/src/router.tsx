import { createBrowserRouter } from "react-router-dom";
import CreatePage from "./pages/create_page/CreatePage";
import EditPage from "./pages/edit_page/EditPage";
import ShapePlayground from "./pages/ShapePlayground";
import AuthPage from "./pages/auth_page/AuthPage";
import HomePage from "./pages/home_page/HomePage";
import PlansPage from "./pages/plans_page/PlansPage";
import ProfilePage from "./pages/profile_page/ProfilePage";

export const router = createBrowserRouter([
    { path: "/", element: <HomePage /> },
    { path: "/create", element: <CreatePage /> },
    { path: "/plans", element: <PlansPage /> },
    { path: "/profile", element: <ProfilePage /> },
    { path: "/auth", element: <AuthPage /> },
    { path: "/editor/:projectId", element: <EditPage /> },
    { path: "/playground", element: <ShapePlayground /> },
]);
