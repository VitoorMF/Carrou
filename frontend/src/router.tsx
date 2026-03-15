import { createBrowserRouter } from "react-router-dom";
import CreatePage from "./pages/create_page/CreatePage";
import EditPage from "./pages/edit_page/EditPage";
import AuthPage from "./pages/auth_page/AuthPage";
import HomePage from "./pages/home_page/HomePage";
import BillingPage from "./pages/plans_page/PlansPage";
import ProfilePage from "./pages/profile_page/ProfilePage";
import LayoutEditor from "./pages/ShapePlayground";

export const router = createBrowserRouter([
    { path: "/", element: <HomePage /> },
    { path: "/create", element: <CreatePage /> },
    { path: "/plans", element: <BillingPage /> },
    { path: "/billing", element: <BillingPage /> },
    { path: "/profile", element: <ProfilePage /> },
    { path: "/auth", element: <AuthPage /> },
    { path: "/editor/:projectId", element: <EditPage /> },
    { path: "/playground", element: <LayoutEditor /> },
]);
