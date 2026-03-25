import "./SplashPage.css";
import logo from "../../assets/page/landing/icon.svg";

export default function SplashPage() {
    return (
        <div className="splash_container">
            <div className="splash_content">
                <img src={logo} alt="Carrosselize" className="splash_logo" />
                <div className="splash_spinner" />
            </div>
        </div>
    );
}
