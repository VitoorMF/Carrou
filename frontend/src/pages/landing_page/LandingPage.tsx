import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

import logo from "../../assets/page/landing/logo.svg";
import { useEffect, useState } from "react";

type TypewriterOptions = {
    words: string[];
    baseSpeed?: number;
    deleteSpeed?: number;
    pauseMs?: number;
    loop?: boolean;
};

export function useTypewriter({
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

export default function HeroTitle() {
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

    return (
        <div className="lp">
            <header className="lp_header lp_container">
                <div className="lp_logo">
                    <img src={logo} alt="Carrosselize" />
                </div>

                {/* <div className="lp_menu">
                    <img src={menu} alt="Menu" />
                </div> */}
            </header>

            <main className="lp_main">
                {/* HERO */}
                <section className="lp_hero">
                    <HeroTitle />

                    <textarea className="prompt_input" name="content" id="content" placeholder="5 erros que iniciantes cometem na academia..." />

                    <button className="btn btn_primary">Começar Agora</button>

                    <button className="btn btn_help">
                        ?
                    </button>

                </section>

                {/* preview */}
                <section className="lp_section">
                    <div className="lp_preview">
                        <div className="preview_mock" />
                        <div className="preview_mock" />
                        <div className="preview_mock" />
                    </div>
                </section>



                {/* COMO FUNCIONA */}
                <section className="lp_section" id="como">
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

                {/* BENEFÍCIOS */}
                <section className="lp_section" id="beneficios">
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

                {/* TEMPLATES */}
                <section className="lp_section" id="templates">
                    <div className="lp_container">
                        <div className="lp_split">
                            <div>
                                <h2 className="lp_h2">Templates prontos</h2>
                                <p className="lp_p">
                                    Comece com um layout e só ajuste o conteúdo.
                                </p>

                                <button className="btn btn_primary" onClick={() => navigate("/auth")}>
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

                {/* FAQ */}
                <section className="lp_section" id="faq">
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
                            <button className="btn btn_primary" onClick={() => navigate("/auth")}>
                                Começar agora
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="lp_footer">
                <div className="lp_container lp_footer_inner">
                    <span>© {new Date().getFullYear()} Carrosselize</span>
                    <span className="lp_footer_muted">Feito por Vitor</span>
                </div>
            </footer>
        </div>
    );
}
