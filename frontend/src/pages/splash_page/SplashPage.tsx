import "./SplashPage.css";

export default function SplashPage() {
    return (
        <div className="splash_container">
            <div className="splash_content">
                <div className="logo_block">
                    <div className="token_spinner" />
                    <h1>Carrosselize</h1>
                </div>

                <p className="loading_text">Carregando sua experiência...</p>
            </div>
        </div>
    );
}
