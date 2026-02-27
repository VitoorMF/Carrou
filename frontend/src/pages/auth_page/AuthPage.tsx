import "./AuthPage.css";
import { useState } from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useNavigate } from "react-router-dom";

const provider = new GoogleAuthProvider();

export default function AuthPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const auth = getAuth();

    async function handleGoogleLogin() {
        try {
            setLoading(true);
            setError(null);

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userRef = doc(db, "users", user.uid);

            await setDoc(
                userRef,
                {
                    uid: user.uid,
                    email: user.email ?? "",
                    displayName: user.displayName ?? "User",
                    avatarUrl: user.photoURL ?? "",
                    specialization: "Seu Cargo", // valor padrão, o usuário pode editar depois
                    tokensBalance: 10, // saldo inicial de tokens
                    updatedAt: serverTimestamp(),
                    createdAt: serverTimestamp(),
                },
                { merge: true }
            );

            navigate("/dashboard");
        } catch (e: any) {
            setError(e?.message ?? "Erro ao entrar com Google");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth_page">
            <div className="auth_bg" />

            <div className="auth_card">
                <div className="auth_head">
                    <div className="auth_logo">
                        <div className="auth_logo_dot" />
                    </div>

                    <h1 className="auth_title">Entrar no Carrosselize</h1>
                    <p className="auth_subtitle">
                        Crie carrosséis profissionais em segundos — sem Canva, sem designer.
                    </p>
                </div>

                <button
                    className="google_btn"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <span className="google_icon" aria-hidden="true">G</span>
                    {loading ? "Entrando..." : "Continuar com Google"}
                </button>

                <div className="auth_divider">
                    <span>ou</span>
                </div>

                <form className="auth_form" onSubmit={(e) => e.preventDefault()}>
                    <label className="auth_label">
                        Email
                        <input className="auth_input" type="email" placeholder="seuemail@email.com" disabled />
                    </label>

                    <label className="auth_label">
                        Senha
                        <input className="auth_input" type="password" placeholder="••••••••" disabled />
                    </label>

                    <button className="primary_btn" disabled title="Em breve">
                        Entrar (em breve)
                    </button>
                </form>

                <div className="auth_links">
                    <button className="link_btn" disabled title="Em breve">
                        Esqueci minha senha
                    </button>
                    <span className="dot">•</span>
                    <button className="link_btn" disabled title="Em breve">
                        Criar conta
                    </button>
                </div>

                {error ? <p className="auth_error">{error}</p> : null}

                <p className="auth_foot">
                    Ao continuar, você concorda com nossos <span>Termos</span> e <span>Política</span>.
                </p>
            </div>
        </div>
    );
}
