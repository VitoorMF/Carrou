import { useNavigate, useLocation } from "react-router-dom";
import "./LandingPage.css";

import logo from "../../assets/page/landing/logo.svg";
import { useEffect, useState } from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

type TypewriterOptions = {
    words: string[];
    baseSpeed?: number;
    deleteSpeed?: number;
    pauseMs?: number;
    loop?: boolean;
};

const provider = new GoogleAuthProvider();

function useTypewriter({
    words,
    baseSpeed = 80,
    deleteSpeed = 40,
    pauseMs = 2000,
    loop = true,
}: TypewriterOptions) {
    const [wordIndex, setWordIndex] = useState(0);
    const [text, setText] = useState("");
    const [phase, setPhase] = useState<"typing" | "pause" | "deleting">("typing");

    useEffect(() => {
        const word = words[wordIndex];
        let delay = baseSpeed;

        if (phase === "typing") {
            delay = baseSpeed + Math.random() * 40;

            if (text === word) {
                delay = pauseMs;
                setPhase("pause");
            } else {
                const timer = setTimeout(() => {
                    setText(word.slice(0, text.length + 1));
                }, delay);

                return () => clearTimeout(timer);
            }
        }

        if (phase === "pause") {
            const timer = setTimeout(() => {
                setPhase("deleting");
            }, pauseMs);

            return () => clearTimeout(timer);
        }

        if (phase === "deleting") {
            delay = deleteSpeed;

            if (text === "") {
                const next = (wordIndex + 1) % words.length;

                if (!loop && wordIndex === words.length - 1) return;

                setWordIndex(next);
                setPhase("typing");
            } else {
                const timer = setTimeout(() => {
                    setText(word.slice(0, text.length - 1));
                }, delay);

                return () => clearTimeout(timer);
            }
        }
    }, [text, phase, wordIndex, words, baseSpeed, deleteSpeed, pauseMs, loop]);

    return text;
}

function HeroTitle() {
    const typed = useTypewriter({
        words: [
            "carrossel",
            "post viral e",
            "conteúdo de valor",
            "roteiro de vendas",
        ],
    });

    return (
        <div className="lp_hero_text">
            <h1 className="lp_title">
                Crie seu primeiro <span className="highlight">{typed}</span> profissional em segundos
            </h1>
        </div>
    );
}

export function LandingPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const sections = [
        { id: "hero", label: "Início" },
        { id: "como", label: "Como funciona" },
        { id: "beneficios", label: "Benefícios" },
        { id: "templates", label: "Templates" },
        { id: "faq", label: "FAQ" },
    ];

    function scrollToSection(id: string) {
        const el = document.getElementById(id);
        if (!el) {
            return;
        }

        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setIsNavOpen(false);
    }

    function openAuthModal() {
        setAuthError(null);
        setIsAuthOpen(true);
    }

    function closeAuthModal() {
        if (authLoading) {
            return;
        }

        setIsAuthOpen(false);
    }

    async function handleGoogleLogin() {
        try {
            setAuthLoading(true);
            setAuthError(null);

            const auth = getAuth();
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
                    specialization: "Seu Cargo",
                    tokensBalance: 10,
                    updatedAt: serverTimestamp(),
                    createdAt: serverTimestamp(),
                },
                { merge: true }
            );

            setIsAuthOpen(false);
            navigate("/");
        } catch (e: any) {
            setAuthError(e?.message ?? "Erro ao entrar com Google");
        } finally {
            setAuthLoading(false);
        }
    }

    useEffect(() => {
        const sectionsToReveal = Array.from(document.querySelectorAll<HTMLElement>(".reveal_section"));
        if (sectionsToReveal.length === 0) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is_visible");
                    }
                });
            },
            { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
        );

        sectionsToReveal.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, []);





    return (
        <div className="lp">
            <header className="lp_header lp_container">
                <div className="lp_logo">
                    <img src={logo} alt="Carrosselize" />
                </div>
            </header>

            <main className="lp_main">
                <section className="lp_hero" id="hero">
                    <div className="lp_container lp_hero_grid">
                        <div className="lp_hero_left">
                            <HeroTitle />

                            <textarea className="prompt_input" name="content" id="content" placeholder="5 erros que iniciantes cometem na academia..." />

                            <button className="btn btn_primary" onClick={openAuthModal}>
                                Começar agora
                            </button>
                        </div>
                    </div>

                    <div className={`floating_nav ${isNavOpen ? "open" : ""}`}>
                        {isNavOpen && (
                            <div className="floating_nav_panel" role="navigation" aria-label="Navegação da landing">
                                <div className="floating_nav_links">
                                    {sections.map((section) => (
                                        <button
                                            key={section.id}
                                            type="button"
                                            className="floating_nav_link"
                                            onClick={() => scrollToSection(section.id)}
                                        >
                                            {section.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            className="btn btn_help"
                            aria-expanded={isNavOpen}
                            aria-label={isNavOpen ? "Fechar navegação" : "Abrir navegação"}
                            onClick={() => setIsNavOpen((prev) => !prev)}
                        >
                            {isNavOpen ? "×" : "☰"}
                        </button>
                    </div>
                </section>

                <section className="lp_section reveal_section">
                    <div className="lp_preview">
                        <div className="preview_mock" />
                        <div className="preview_mock" />
                        <div className="preview_mock" />
                    </div>
                </section>

                <section className="lp_section reveal_section" id="como">
                    <div className="lp_container">
                        <h2 className="lp_h2">Como funciona</h2>
                        <p className="lp_p">3 passos simples pra sair do texto pro post.</p>

                        <div className="lp_steps">
                            <div className="card">
                                <div className="card_top">1</div>
                                <h3>Cole seu conteúdo</h3>
                                <p>Você cola o texto ou um resumo do tema.</p>
                            </div>
                            <div className="card">
                                <div className="card_top">2</div>
                                <h3>Escolha um estilo</h3>
                                <p>Minimal, 3D editorial, playful… (e mais).</p>
                            </div>
                            <div className="card">
                                <div className="card_top">3</div>
                                <h3>Edite e exporte</h3>
                                <p>Arraste elementos e exporte pronto pro Instagram.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="lp_section reveal_section" id="beneficios">
                    <div className="lp_container">
                        <h2 className="lp_h2">Por que Carrosselize?</h2>

                        <div className="lp_features">
                            <div className="feature card">
                                <h3>Consistência visual</h3>
                                <p>Tipografia, espaçamento e cores sempre alinhados.</p>
                            </div>
                            <div className="feature card">
                                <h3>Rápido de verdade</h3>
                                <p>Geração + layout em segundos, sem começar do zero.</p>
                            </div>
                            <div className="feature card">
                                <h3>Editor inteligente</h3>
                                <p>Elementos ajustam melhor no slide sem quebrar o design.</p>
                            </div>
                            <div className="feature card">
                                <h3>Feito pra IG</h3>
                                <p>1080×1350, safe-area e export certeiro.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="lp_section reveal_section" id="templates">
                    <div className="lp_container">
                        <div className="lp_split">
                            <div>
                                <h2 className="lp_h2">Templates prontos</h2>
                                <p className="lp_p">
                                    Comece com um layout e só ajuste o conteúdo.
                                </p>

                                <button className="btn btn_primary" onClick={openAuthModal}>
                                    Testar templates
                                </button>
                            </div>

                            <div className="lp_mock_grid">
                                <div className="mock" />
                                <div className="mock" />
                                <div className="mock" />
                                <div className="mock" />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="lp_section reveal_section" id="faq">
                    <div className="lp_container">
                        <h2 className="lp_h2">FAQ</h2>

                        <div className="lp_faq">
                            <details className="faq_item">
                                <summary>Preciso saber design?</summary>
                                <p>Não. O layout já sai coerente e você só faz ajustes finos se quiser.</p>
                            </details>
                            <details className="faq_item">
                                <summary>Posso editar depois de gerar?</summary>
                                <p>Sim. Você edita texto, arrasta elementos e troca estilos.</p>
                            </details>
                            <details className="faq_item">
                                <summary>Exporta em qual formato?</summary>
                                <p>Normalmente PNG por slide (ou PDF, se você implementar).</p>
                            </details>
                        </div>

                        <div className="lp_final_cta">
                            <h3>Pronto pra criar seu primeiro carrossel?</h3>
                            <button className="btn btn_primary" onClick={openAuthModal}>
                                Começar agora
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {isAuthOpen && (
                <div className="auth_modal_overlay" role="presentation" onClick={closeAuthModal}>
                    <div
                        className="auth_modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Entrar no Carrosselize"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="auth_modal_close"
                            onClick={closeAuthModal}
                            disabled={authLoading}
                            aria-label="Fechar login"
                        >
                            ×
                        </button>

                        <p className="lp_auth_chip">Acesso imediato</p>
                        <h2 className="auth_modal_title">Entrar no Carrosselize</h2>
                        <p className="auth_modal_subtitle">
                            Faça login para salvar seus projetos e começar a gerar carrosséis agora.
                        </p>

                        <button className="google_btn" onClick={handleGoogleLogin} disabled={authLoading}>
                            <span className="google_icon" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.8454H13.8436C13.635 11.9704 12.9995 12.9231 12.0468 13.5613V15.8195H14.9564C16.6595 14.2513 17.64 11.9459 17.64 9.2045Z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0468 13.5613C11.2409 14.1013 10.2109 14.4204 9 14.4204C6.6568 14.4204 4.6732 12.8372 3.9655 10.71H0.9573V13.0418C2.4382 15.9818 5.4818 18 9 18Z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M3.9655 10.71C3.7855 10.17 3.6832 9.5931 3.6832 9C3.6832 8.4068 3.7855 7.83 3.9655 7.29V4.9582H0.9573C0.3477 6.1732 0 7.5482 0 9C0 10.4518 0.3477 11.8268 0.9573 13.0418L3.9655 10.71Z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M9 3.5795C10.3214 3.5795 11.5077 4.0345 12.4405 4.9268L15.0218 2.3455C13.4632 0.8932 11.4259 0 9 0C5.4818 0 2.4382 2.0182 0.9573 4.9582L3.9655 7.29C4.6732 5.1627 6.6568 3.5795 9 3.5795Z"
                                        fill="#EA4335"
                                    />
                                </svg>
                            </span>
                            {authLoading ? "Entrando..." : "Continuar com Google"}
                        </button>


                        {authError ? <p className="lp_auth_error">{authError}</p> : null}
                    </div>
                </div>
            )}

            <footer className="lp_footer">
                <div className="lp_container lp_footer_inner">
                    <span>© {new Date().getFullYear()} Carrosselize</span>
                    <span className="lp_footer_muted">Feito por Vitor</span>
                </div>
            </footer>
        </div>
    );
}
