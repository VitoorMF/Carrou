import { useState } from 'react'
import './CreatePage.css'
import { auth, db } from '../../services/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { generateCarousel } from '../../services/functions';
import type { Carousel, GenerateCarouselPayload } from '../../types/caroussel';
import { signInAnonymously } from 'firebase/auth';
import { editorial3D } from '../../layouts/editorial3D';
import { applyAutoLayoutAsync } from '../../editor/autoLayout';
import { luxuryMinimal } from '../../layouts/luxuryMinimal';
import { microblogBold } from '../../layouts/microBlog';

async function ensureAuth() {
    if (auth.currentUser) return auth.currentUser;
    const cred = await signInAnonymously(auth);
    return cred.user;
}


async function saveProjectToFirestore(carousel: Carousel) {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado.");

    let normalized;
    if (carousel.meta.style === "editorial3D") {
        normalized = editorial3D(carousel);
    } if (carousel.meta.style === "luxuryMinimal") {
        normalized = luxuryMinimal(carousel);
    } if (carousel.meta.style === "microBlogBold") {
        normalized = microblogBold(carousel);
    }

    const computed = await applyAutoLayoutAsync(normalized);

    const docData = stripUndefined({
        ownerId: user.uid,
        status: "ready",
        meta: computed.meta,
        ai: {
            generator: "generateCarousel:v1",
            raw: carousel,
        },
        slides: computed.slides,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    const ref = await addDoc(collection(db, "projects"), docData);
    return ref.id;
}

export default function CreatePage() {
    const [prompt, setPrompt] = useState("");

    const [formato, setFormato] = useState<string | null>(null);
    const [active, setActive] = useState<string | null>(null);
    const [publico, setPublico] = useState<string | null>(null);
    const [cta, setCta] = useState<string | null>(null);
    const [layout, setLayout] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const navigate = useNavigate();
    const [optimizing, setOptimizing] = useState(false);
    const [advancedSettingsVisible, setAdvancedSettingsVisible] = useState(false);


    const selectedObjective = objetivos.find(o => o.id === active);
    const selectedFormat = formatos.find(f => f.id === formato);
    const selectedAudience = publicos.find(p => p.id === publico);
    const selectedCta = ctas.find(c => c.id === cta);
    const selectedTheme = theme.find(t => t.id === layout);

    const hasAnySelection =
        selectedObjective ||
        selectedFormat ||
        selectedAudience ||
        selectedCta ||
        selectedTheme;



    async function handleImprovePrompt() {
        if (!prompt.trim() || optimizing || loading) return;

        try {
            setOptimizing(true);
            setErr(null);

            const res = await fetch("http://localhost:5001/carrosselize/us-central1/improvePrompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    // opcional: ajuda a IA a respeitar suas escolhas
                    objective: active,
                    format: formato,
                    audience: publico,
                    cta,
                    theme: selectedTheme?.label ?? layout,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Falha ao otimizar prompt.");
            }

            const data = await res.json();
            if (!data?.improvedPrompt) throw new Error("Resposta inválida da IA.");

            setPrompt(data.improvedPrompt);
        } catch (e: any) {
            setErr(e?.message ?? "Erro ao otimizar prompt.");
        } finally {
            setOptimizing(false);
        }
    }


    async function handleCreate() {
        try {
            setLoading(true);
            setErr(null);

            const payload: GenerateCarouselPayload = {
                prompt: prompt.trim(),
                meta: {
                    objective: active ?? "educacional",
                    format: formato ?? "dicas",
                    audience: publico ?? "iniciante",
                    cta: cta ?? "salvar",
                    style: layout ?? "editorial3D",
                    slideCount: 6,
                    language: "pt-BR",
                    title: "AI will choose the title",
                },
            };

            const raw = await generateCarousel(payload);

            // normaliza pra garantir que title é string SEMPRE
            const carousel: Carousel = {
                ...raw,
                meta: {
                    ...raw.meta,
                    style: payload.meta.style,
                    title: raw.meta.title ?? payload.meta.title ?? "Carrossel",
                },
            };

            await ensureAuth();

            const projectId = await saveProjectToFirestore(carousel);
            console.log("vou navegar para:", `/editor/${projectId}`);
            navigate(`/editor/${projectId}`);

        } catch (e: any) {
            setErr(e?.message ?? "Erro ao gerar carrossel");
        } finally {
            setLoading(false);
        }
    }



    // CreatePage.tsx (somente o JSX/HTML da página)
    return (
        <section className="createPage">
            <header className="createHeader">
                <div className="headerLeft">
                    <button className="ghostBtn" onClick={() => navigate(-1)}>← Voltar</button>
                    <h1 className="title">Criar carrossel</h1>
                    <p className="subtitle">Configure objetivo, formato e estilo — depois gere e abra no editor.</p>
                </div>

                <div className="headerRight">
                    <div className="pill">
                        <span className="pillDot" />
                        <span className="pillText">{loading ? "Gerando..." : "Pronto para gerar"}</span>
                    </div>
                </div>
            </header>

            <div className="createGrid">
                {/* LEFT: Prompt card */}
                <div className="card promptCard">
                    <div className="cardTop">
                        <div className="cardTitleWrap">
                            <h2 className="cardTitle">Prompt</h2>
                            <p className="cardHint">Seja específico: tema, público e promessa.</p>
                        </div>

                        <div className="miniActions">
                            <button
                                type="button"
                                className="ghostBtn"
                                onClick={() => setPrompt("")}
                                disabled={!prompt.trim() || loading}
                                title="Limpar prompt"
                            >
                                Limpar
                            </button>

                            <button
                                type="button"
                                className="ghostBtn"
                                onClick={() =>
                                    setPrompt(prompts[Math.floor(Math.random() * prompts.length)])
                                }
                                disabled={loading}
                                title="Exemplo"
                            >
                                Exemplo
                            </button>
                        </div>
                    </div>

                    <div className="textareaShell">
                        <textarea
                            className="textarea"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ex: Faça um carrossel sobre..."
                            disabled={loading}
                        />
                        <div className="textareaFooter">
                            <span className="charCount">{prompt.length} caracteres</span>
                            <span className="kbdHint">
                                <span className="kbd">⌘</span> + <span className="kbd">Enter</span> para gerar
                            </span>
                        </div>
                    </div>

                    <div className="primaryActions">
                        <button
                            className="primaryBtn"
                            onClick={handleCreate}
                            disabled={loading || !prompt.trim()}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner" />
                                    Gerando…
                                </>
                            ) : (
                                "Gerar carrossel"
                            )}
                        </button>

                        <button
                            type="button"
                            className="secondaryBtn"
                            onClick={handleImprovePrompt}
                            disabled={loading || optimizing || !prompt.trim()}
                        >
                            {optimizing ? "Otimizando..." : "Otimizar prompt"}
                        </button>
                    </div>

                    {err && <p className="errorText">{err}</p>}
                </div>

                {/* RIGHT: Settings card */}
                <div className="card settingsCard">
                    <div className="cardTop">
                        <div className="cardTitleWrap">
                            <h2 className="cardTitle">Estilo e estrutura</h2>
                            <p className="cardHint">Escolhas rápidas que guiam a IA.</p>
                        </div>
                    </div>

                    <div className="settingsList">
                        <div className="settingGroup">
                            <div className="groupHead">
                                <p className="groupTitle">Tema</p>
                                <p className="groupDesc">Visual e sensação do design.</p>
                            </div>
                            <div className="chips">
                                {theme.map((e) => (
                                    <button
                                        type="button"
                                        key={e.id}
                                        className={`chip ${layout === e.id ? "isActive" : ""}`}
                                        onClick={() => setLayout(e.id)}
                                        disabled={loading}
                                    >
                                        {e.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="settingGroup">
                            <div className="groupHead">
                                <p className="groupTitle">Objetivo</p>
                                <p className="groupDesc">O que você quer que o post faça?</p>
                            </div>
                            <div className="chips">
                                {objetivos.map((obj) => (
                                    <button
                                        type="button"
                                        key={obj.id}
                                        className={`chip ${active === obj.id ? "isActive" : ""}`}
                                        onClick={() => setActive(obj.id)}
                                        disabled={loading}
                                    >
                                        {obj.label}
                                    </button>
                                ))}
                            </div>
                        </div>



                        <button
                            type="button"
                            className="ghostBtn"
                            onClick={() => setAdvancedSettingsVisible(!advancedSettingsVisible)}
                        >
                            {advancedSettingsVisible ? "Ocultar configurações avançadas" : "Mostrar configurações avançadas"}
                        </button>
                        {advancedSettingsVisible && (<>
                            <div className="settingGroup">
                                <div className="groupHead">
                                    <p className="groupTitle">Formato</p>
                                    <p className="groupDesc">Estrutura de narrativa do carrossel.</p>
                                </div>
                                <div className="chips chipsIcon">
                                    {formatos.map((fmt) => (
                                        <button
                                            type="button"
                                            key={fmt.id}
                                            className={`chip chipIcon ${formato === fmt.id ? "isActive" : ""}`}
                                            onClick={() => setFormato(fmt.id)}
                                            disabled={loading}
                                            title={fmt.label}
                                        >
                                            <span className="chipIconInner">{fmt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="settingGroup">
                                <div className="groupHead">
                                    <p className="groupTitle">Público-alvo</p>
                                    <p className="groupDesc">Para quem você está falando?</p>
                                </div>
                                <div className="chips">
                                    {publicos.map((p) => (
                                        <button
                                            type="button"
                                            key={p.id}
                                            className={`chip ${publico === p.id ? "isActive" : ""}`}
                                            onClick={() => setPublico(p.id)}
                                            disabled={loading}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="settingGroup">
                                <div className="groupHead">
                                    <p className="groupTitle">CTA automático</p>
                                    <p className="groupDesc">Terminar com chamada pra ação?</p>
                                </div>
                                <div className="chips">
                                    {ctas.map((c) => (
                                        <button
                                            type="button"
                                            key={c.id}
                                            className={`chip ${cta === c.id ? "isActive" : ""}`}
                                            onClick={() => setCta(c.id)}
                                            disabled={loading}
                                        >
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div></>)}
                    </div>

                    {hasAnySelection && (
                        <div className="summaryBar">
                            {selectedObjective && (
                                <div className="summaryItem">
                                    <span className="summaryLabel">Objetivo</span>
                                    <span className="summaryValue">{selectedObjective.label}</span>
                                </div>
                            )}

                            {selectedFormat && (
                                <div className="summaryItem">
                                    <span className="summaryLabel">Formato</span>
                                    <span className="summaryValue">{selectedFormat.label}</span>
                                </div>
                            )}

                            {selectedAudience && (
                                <div className="summaryItem">
                                    <span className="summaryLabel">Público</span>
                                    <span className="summaryValue">{selectedAudience.label}</span>
                                </div>
                            )}

                            {selectedCta && (
                                <div className="summaryItem">
                                    <span className="summaryLabel">CTA</span>
                                    <span className="summaryValue">{selectedCta.label}</span>
                                </div>
                            )}

                            {selectedTheme && (
                                <div className="summaryItem">
                                    <span className="summaryLabel">Tema</span>
                                    <span className="summaryValue">{selectedTheme.label}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );



}


const objetivos = [
    { id: "venda", label: "Venda Direta" },
    { id: "educacional", label: "Educacional" },
    { id: "autoridade", label: "Autoridade" },
    { id: "relacionamento", label: "Relacionamento" },
    { id: "lancamento", label: "Lançamento" },
    { id: "storytelling", label: "Storytelling" },
    { id: "engajamento", label: "Pergunta / engajamento" },
];

const formatos = [
    { id: "passo", label: "🧩 Passo a passo" },
    { id: "erros", label: "❌ Erros comuns" },
    { id: "checklist", label: "✅ Checklist" },
    { id: "antesDepois", label: "⚔️ Antes vs Depois" },
    { id: "mitoVerdade", label: "📊 Mito vs Verdade" },
    { id: "framework", label: "🧠 Framework (3 passos / 5 pilares)" },
    { id: "historia", label: "🧵 História em sequência" },
    { id: "dicas", label: "📌 Dicas rápidas" },
];

const publicos = [
    { id: "iniciante", label: "Iniciantes" },
    { id: "profissional", label: "Profissionais" },
    { id: "empreendedor", label: "Empreendedores" },
    { id: "designer", label: "Designers" },
    { id: "dev", label: "Devs" },
    { id: "criador", label: "Criadores de conteúdo" },
];

const ctas = [
    { id: "seguir", label: "Seguir perfil" },
    { id: "salvar", label: "Salvar post" },
    { id: "comentar", label: "Comentar" },
    { id: "comprar", label: "Comprar" },
    { id: "linkBio", label: "Entrar no link da bio" },
];

const theme = [
    {
        id: "editorial3D",
        label: "Editorial 3D"
    },
    {
        id: "luxuryMinimal",
        label: "Luxury Minimal"
    },
    {
        id: "microBlogBold",
        label: "Micro Blog Bold"
    },
];

const prompts = [
    "Faça um carrossel explicando por que pequenas empresas precisam de presença digital em 2026. Use 7 slides e um CTA final.",
    "Crie um carrossel mostrando como transformar seguidores em clientes usando conteúdo estratégico. Use 6 slides.",
    "Crie um carrossel ensinando 5 erros que impedem alguém de crescer no Instagram. Use linguagem simples e CTA no final",
    "Faça um carrossel com dicas práticas para melhorar a produtividade no dia a dia.",
    "Crie um carrossel mostrando hábitos simples que melhoram a qualidade de vida.",
    "Faça um carrossel ensinando como organizar melhor os estudos.",
    "Crie um carrossel com reflexões sobre disciplina e constância.",
    "Crie um carrossel explicando de forma simples o que é inteligência artificial.",
];







export function stripUndefined<T>(obj: T): T {
    if (Array.isArray(obj)) {
        return obj.map(stripUndefined) as any;
    }

    if (obj && typeof obj === "object") {
        const out: any = {};
        for (const [k, v] of Object.entries(obj)) {
            if (v === undefined) continue;
            out[k] = stripUndefined(v);
        }
        return out;
    }

    return obj;
}
