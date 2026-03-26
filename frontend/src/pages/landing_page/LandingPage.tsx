import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

import logo from "../../assets/page/landing/logo.svg";
import slide01 from "../../assets/page/landing/previews/slide-01.png";
import slide02 from "../../assets/page/landing/previews/slide-02.png";
import slide03 from "../../assets/page/landing/previews/slide-03.png";
import slide04 from "../../assets/page/landing/previews/slide-04.png";
import slide05 from "../../assets/page/landing/previews/slide-05.png";
import slide06 from "../../assets/page/landing/previews/slide-06.png";
import { Menu, X, Layers, Zap, Wand2, Smartphone, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
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

const PREVIEW_MOCKS: string[] = [
    slide01,
    slide02,
    slide03,
    slide04,
    slide05,
    slide06,
];

export function LandingPage() {
    const navigate = useNavigate();

    const previewSectionRef = useRef<HTMLElement>(null);
    const previewTrackRef = useRef<HTMLDivElement>(null);

    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [promptValue, setPromptValue] = useState("");
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        const section = previewSectionRef.current;
        const track = previewTrackRef.current;
        if (!section || !track) return;

        function onScroll() {
            const rect = section!.getBoundingClientRect();
            const entered = window.innerHeight - rect.top;
            const total = window.innerHeight + rect.height;
            const progress = Math.max(0, Math.min(1, entered / total));
            const isMobile = window.innerWidth <= 920;
            const x = isMobile ? 9 - progress * 30 : 20 - progress * 30;
            track!.style.transform = `rotate(-4deg) translateX(${x}%)`;
        }

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const sections = [
        { id: "hero", label: "Início" },
        { id: "como", label: "Como funciona" },
        { id: "beneficios", label: "Benefícios" },
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

    function handleHeroCta() {
        if (promptValue.trim()) {
            localStorage.setItem("carrosselize_pending_prompt", promptValue.trim());
        }
        openAuthModal();
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
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // Primeiro login — cria o documento com valores iniciais
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email ?? "",
                    displayName: user.displayName ?? "User",
                    avatarUrl: user.photoURL ?? "",
                    specialization: "",
                    creditsBalance: 0,
                    trialUsed: false,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            } else {
                // Login subsequente — só atualiza email (pode ter mudado no Google)
                await setDoc(userRef, {
                    email: user.email ?? "",
                    updatedAt: serverTimestamp(),
                }, { merge: true });
            }

            setIsAuthOpen(false);
            const hasPendingPrompt = !!localStorage.getItem("carrosselize_pending_prompt");
            navigate(hasPendingPrompt ? "/create" : "/");
        } catch (e: any) {
            setAuthError(e?.message ?? "Erro ao entrar com Google");
        } finally {
            setAuthLoading(false);
        }
    }






    return (
        <div className="lp">
            <header className="lp_header lp_container">
                <div className="lp_logo">
                    <img src={logo} alt="Carrosselize" />
                </div>
                <button className="btn btn_secondary" onClick={openAuthModal}>
                    Entrar
                </button>
            </header>

            <main className="lp_main">
                <section className="lp_hero" id="hero">
                    <div className="lp_container lp_hero_grid">
                        <div className="lp_hero_left">
                            <HeroTitle />

                            <textarea
                                className="prompt_input"
                                name="content"
                                id="content"
                                placeholder="5 erros que iniciantes cometem na academia..."
                                value={promptValue}
                                onChange={(e) => setPromptValue(e.target.value)}
                            />

                            <button
                                className="btn btn_primary"
                                onClick={handleHeroCta}
                            >
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
                            {isNavOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </section>

                <section className="lp_preview_section" ref={previewSectionRef}>
                    <div className="lp_preview_sticky">
                        <div className="lp_preview_track" ref={previewTrackRef}>
                            {PREVIEW_MOCKS.map((src, i) => (
                                <div key={i} className="preview_mock">
                                    {src && <img src={src} alt={`Preview ${i + 1}`} />}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="lp_section" id="como">
                    <div className="lp_container">
                        <h2 className="lp_h2">Como funciona</h2>
                        <p className="lp_p">3 passos simples pra sair do texto pro post.</p>

                        <div className="lp_steps_timeline">
                            <div className="timeline_step">
                                <div className="timeline_num">1</div>
                                <h3>Cole seu conteúdo</h3>
                                <p>Você cola o texto ou um resumo do tema.</p>
                            </div>
                            <div className="timeline_step">
                                <div className="timeline_num">2</div>
                                <h3>Escolha um estilo</h3>
                                <p>Minimal, 3D editorial, playful… (e mais).</p>
                            </div>
                            <div className="timeline_step">
                                <div className="timeline_num">3</div>
                                <h3>Edite e exporte</h3>
                                <p>Arraste elementos e exporte pronto pro Instagram.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="lp_section" id="beneficios">
                    <div className="lp_container">
                        <h2 className="lp_h2">Por que Carrosselize?</h2>

                        <div className="lp_features_alt">
                            <div className="feature_alt">
                                <div className="feature_alt_icon_wrap">
                                    <Layers size={52} />
                                </div>
                                <div className="feature_alt_text">
                                    <h3>Consistência visual</h3>
                                    <p>Tipografia, espaçamento e cores sempre alinhados — sem precisar ajustar nada manualmente.</p>
                                </div>
                            </div>
                            <div className="feature_alt feature_alt_reverse">
                                <div className="feature_alt_icon_wrap">
                                    <Zap size={52} />
                                </div>
                                <div className="feature_alt_text">
                                    <h3>Rápido de verdade</h3>
                                    <p>Geração + layout em segundos, sem começar do zero cada vez.</p>
                                </div>
                            </div>
                            <div className="feature_alt">
                                <div className="feature_alt_icon_wrap">
                                    <Wand2 size={52} />
                                </div>
                                <div className="feature_alt_text">
                                    <h3>Editor inteligente</h3>
                                    <p>Elementos ajustam no slide sem quebrar o design. Você edita, o layout respeita.</p>
                                </div>
                            </div>
                            <div className="feature_alt feature_alt_reverse">
                                <div className="feature_alt_icon_wrap">
                                    <Smartphone size={52} />
                                </div>
                                <div className="feature_alt_text">
                                    <h3>Feito pra IG</h3>
                                    <p>1080×1350, safe-area e export certeiro. Sai do editor direto pro feed.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                <section className="lp_section" id="faq">
                    <div className="lp_container">
                        <h2 className="lp_h2">FAQ</h2>

                        <div className="lp_faq">
                            {[
                                { q: "Preciso saber design?", a: "Não. O layout já sai coerente e você só faz ajustes finos se quiser." },
                                { q: "Posso editar depois de gerar?", a: "Sim. Você edita texto, arrasta elementos e troca estilos." },
                                { q: "Exporta em qual formato?", a: "PNG por slide, em alta resolução (1080×1350). Você baixa um ZIP com todos os slides prontos pro Instagram." },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className={`faq_item${openFaq === i ? " faq_open" : ""}`}
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                >
                                    <div className="faq_summary">
                                        <span>{item.q}</span>
                                        <ChevronDown size={18} className="faq_chevron" />
                                    </div>
                                    <div className="faq_body">
                                        <p>{item.a}</p>
                                    </div>
                                </div>
                            ))}
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
                            <X size={16} />
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
