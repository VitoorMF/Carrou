import { Outlet } from "react-router-dom";
import { useAuth } from "../../lib/hooks/useAuth";
import { AppSidebar } from "../app_sidebar/AppSidebar";
import "../app_sidebar/AppSidebar.css";

export default function AppLayout() {
    const { user, loading } = useAuth();

    // Before auth resolves or when not logged in, render outlet without shell
    // (LandingPage / SplashPage handle their own layout)
    if (loading || !user) {
        return <Outlet />;
    }

    return (
        <div className="app_shell app_shell_locked">
            <AppSidebar />

            <main className="app_shell_main app_shell_main_scroll">
                <Outlet />
            </main>
        </div>
    );
}
