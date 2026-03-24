import { useLocation, useNavigate } from "react-router-dom";
import "./AppSidebar.css";
import logo from "../../assets/page/landing/icon.svg";
import token from "../../assets/icons/token_icon.svg";
import { useUserData } from "../../lib/contexts/UserDataContext";

type AppSidebarProps = {
    avatarUrl?: string | null;
    initials?: string;
};

function GridIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="4" width="6.5" height="6.5" rx="1.8" fill="none" />
            <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8" fill="none" />
            <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8" fill="none" />
            <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8" fill="none" />
        </svg>
    );
}

function PencilIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 20h4.2l10-10a1.4 1.4 0 0 0 0-2l-2.2-2.2a1.4 1.4 0 0 0-2 0L4 15.8V20Z" fill="none" />
            <path d="M12.8 7.2l4 4" fill="none" />
            <path d="M4 20l3.1-.6L4.6 17z" fill="none" />
        </svg>
    );
}

function CoinIcon() {
    return (
        <img src={token} alt="Créditos" />
    );
}

export function AppSidebar(_props: AppSidebarProps = {}) {
    const navigate = useNavigate();
    const location = useLocation();
    const userData = useUserData();

    const avatarUrl = userData?.avatarUrl;
    const initials = userData?.displayName?.[0]?.toUpperCase() ?? "U";

    const isDashboardActive = location.pathname === "/" || location.pathname.startsWith("/editor/");
    const isCreateActive = location.pathname.startsWith("/create");
    const isPlansActive = location.pathname.startsWith("/plans") || location.pathname.startsWith("/billing");
    const isProfileActive = location.pathname.startsWith("/profile");

    return (
        <aside className="app_sidebar" aria-label="Navegação principal">
            <div className="sidebar_logo">
                <img src={logo} alt="Carrosselize" className="sidebar_logo_img" />
            </div>

            <nav className="sidebar_nav">
                <button
                    type="button"
                    className={`sidebar_nav_item ${isDashboardActive ? "active" : ""}`}
                    onClick={() => navigate("/")}
                    title="Projetos"
                    aria-label="Projetos"
                >
                    <GridIcon />
                </button>

                <button
                    type="button"
                    className={`sidebar_nav_item ${isCreateActive ? "active" : ""}`}
                    onClick={() => navigate("/create")}
                    title={userData?.trialUsed === false ? "Criar — 1 grátis disponível" : "Criar"}
                    aria-label="Criar"
                >
                    <PencilIcon />
                    {userData?.trialUsed === false && <span className="sidebar_trial_badge" />}
                </button>

                <button
                    type="button"
                    className={`sidebar_nav_item ${isPlansActive ? "active" : ""}`}
                    onClick={() => navigate("/billing")}
                    title="Billing"
                    aria-label="Billing"
                >
                    <CoinIcon />
                </button>
            </nav>

            <button
                type="button"
                className={`sidebar_footer sidebar_avatar_button ${isProfileActive ? "active" : ""}`}
                onClick={() => navigate("/profile")}
                title={userData?.specialization === "" ? "Complete seu perfil" : "Perfil"}
                aria-label="Perfil"
            >
                {avatarUrl ? (
                    <img src={avatarUrl} alt="Perfil" className="sidebar_avatar_img" />
                ) : (
                    <div className="sidebar_avatar">{initials}</div>
                )}
                {userData?.specialization === "" && <span className="sidebar_profile_badge" />}
            </button>
        </aside>
    );
}
