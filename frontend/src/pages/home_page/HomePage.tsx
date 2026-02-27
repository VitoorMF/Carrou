
import { useAuth } from "../../lib/hooks/useAuth";
import { DashboardPage } from "../dashboard_page/DashboardPage";
import { LandingPage } from "../landing_page/LandingPage";
import SplashPage from "../splash_page/SplashPage";

export default function HomePage() {
    const { user, loading } = useAuth();

    if (loading) return <SplashPage />;

    if (!user) return <LandingPage />;

    return <DashboardPage />;
}
