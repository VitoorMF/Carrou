import { useEffect, useState } from "react";
import "./CreatePage.css";
import { db } from "../../services/firebase";
import { useNavigate } from "react-router-dom";
import { generateCarousel } from "../../services/functions";

import { useAuth } from "../../lib/hooks/useAuth";
import { onSnapshot, doc } from "firebase/firestore";
import token from "../../assets/icons/token_icon.svg";
import {
    DEFAULT_TEMPLATE_ID,
    TEMPLATE_CATALOG,
    findTemplateById,
    type TemplateId,
} from "../../templates/templateCatalog";


type UserData = {
    avatarUrl?: string;
    displayName?: string;
    creditsBalance?: number;
    trialUsed?: boolean;
};

const USE_FIREBASE_EMULATORS = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
const IMPROVE_PROMPT_ENDPOINT = USE_FIREBASE_EMULATORS
    ? "http://127.0.0.1:5001/carrosselize/us-central1/improvePrompt"
    : "https://us-central1-carrosselize.cloudfunctions.net/improvePrompt";


function friendlyError(message?: string): string {
    if (!message) return "Erro ao gerar carrossel. Tente novamente.";
    if (message.includes("network") || message.includes("fetch") || message.includes("Failed to fetch"))
        return "Sem conexão. Verifique sua internet e tente novamente.";
    if (message.includes("auth") || message.includes("unauthenticated") || message.includes("Usuário não autenticado"))
        return "Sessão expirada. Recarregue a página e tente novamente.";
    if (message.includes("Créditos insuficientes"))
        return "Créditos insuficientes. Adquira mais créditos para continuar.";
    if (message.includes("timeout") || message.includes("AbortError") || message.includes("demorou"))
        return "A geração demorou demais. Tente um prompt mais curto.";
    if (message.includes("prompt") || message.includes("content") || message.includes("policy"))
        return "Prompt não permitido. Tente reformular o conteúdo.";
    return "Erro ao gerar carrossel. Tente novamente.";
}

export default function CreatePage() {
    const { user } = useAuth();
    const [prompt, setPrompt] = useState("");

    const [layout, setLayout] = useState<TemplateId | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        const pending = localStorage.getItem("carrosselize_pending_prompt");
        if (pending) {
            setPrompt(pending);
            localStorage.removeItem("carrosselize_pending_prompt");
        }
    }, []);

    useEffect(() => {
        if (!err) return;
        const t = setTimeout(() => setErr(null), 4000);
        return () => clearTimeout(t);
    }, [err]);
    const navigate = useNavigate();
    const [optimizing, setOptimizing] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);

    const selectedLayout = findTemplateById(layout);



    useEffect(() => {
        if (!user) {
            setUserData(null);
            return;
        }

        const unsub = onSnapshot(
            doc(db, "users", user.uid),
            (snap) => {
                if (snap.exists()) {
                    setUserData(snap.data() as UserData);
                }
            },
            (err) => {
                console.error("Erro ao carregar dados do usuário:", err);
            }
        );

        return () => unsub();
    }, [user]);

    async function handleImprovePrompt() {
        if (!prompt.trim() || optimizing || loading) return;

        try {
            setOptimizing(true);
            setErr(null);

            const res = await fetch(IMPROVE_PROMPT_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    theme: selectedLayout?.defaultTheme ?? "auto",
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

            const fallbackTemplate = findTemplateById(DEFAULT_TEMPLATE_ID);
            const { projectId } = await generateCarousel({
                prompt: prompt.trim(),
                templateId: selectedLayout?.id,
                theme: selectedLayout?.defaultTheme ?? fallbackTemplate?.defaultTheme ?? "microblog",
            });

            navigate(`/editor/${projectId}`);
        } catch (e: any) {
            console.error("ERRO handleCreate:", e);
            setErr(friendlyError(e?.message));
        } finally {
            setLoading(false);
        }
    }



    // CreatePage.tsx (somente o JSX/HTML da página)
    return (
        <>
        <section className="createPage">
            <header className="createHeader">
                <div className="headerLeft">
                    <h1 className="title">Criar carrossel</h1>
                    <p className="subtitle">Escolha um layout pronto, gere e ajuste só os campos no editor.</p>
                </div>

                <div className="headerRight">
                    {userData?.trialUsed === false ? (
                        <div className="pill creditsPill">
                            <span className="pillText">🎁 1 carrossel grátis</span>
                        </div>
                    ) : (
                        <div className="pill creditsPill" onClick={() => navigate("/plans")}>
                            <img src={token} alt="Créditos" />
                            <span className="pillText">{userData?.creditsBalance ?? 0}</span>
                        </div>
                    )}
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
                                className="ghostBtn blackBtn"
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

                        </div>
                    </div>

                    <div className="primaryActions">
                        <button
                            className="primaryBtn"
                            onClick={handleCreate}
                            disabled={
                                loading ||
                                !prompt.trim() ||
                                (userData?.trialUsed !== false && (userData?.creditsBalance ?? 0) === 0)
                            }
                        >
                            {loading ? (
                                <>
                                    <span className="spinner" />
                                    Gerando…
                                </>
                            ) : userData?.trialUsed !== false && (userData?.creditsBalance ?? 0) === 0 ? (
                                <span>Sem créditos</span>
                            ) : userData?.trialUsed === false ? (
                                <span>Gerar carrossel grátis</span>
                            ) : (
                                <div className="btnLabel">
                                    <span>Gerar carrossel</span>
                                    <div className="creditsCost">
                                        <span>-1</span>
                                        <img src={token} alt="Créditos" />
                                    </div>
                                </div>
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

                </div>

                {/* RIGHT: Settings card */}
                <div className="card settingsCard">
                    <div className="cardTop">
                        <div className="cardTitleWrap">
                            <h2 className="cardTitle">Layouts</h2>
                            <p className="cardHint">Escolha um preset visual e ajuste só o conteúdo no editor.</p>
                        </div>
                    </div>

                    <div className="settingsList">
                        <div className="settingGroup">

                            <div className="layoutPresets">
                                {TEMPLATE_CATALOG.map((preset) => (
                                    <button
                                        type="button"
                                        key={preset.id}
                                        className={`layoutPreset ${layout === preset.id ? "isActive" : ""}`}
                                        onClick={() => setLayout(preset.id)}
                                        disabled={loading}
                                        title={preset.description}
                                    >
                                        <TemplatePreview templateId={preset.id} />
                                        <span className="layoutPresetLabel">{preset.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>

            {err && (
                <div className="create_snackbar">
                    <span>⚠ {err}</span>
                </div>
            )}
        </>
    );
}

function TemplatePreview({ templateId }: { templateId: TemplateId }) {
    if (templateId === "streetwearPro") {
        return (
            <div className="layoutPreview is-streetwearPro" aria-hidden="true">
                <span className="previewStreetwearFrame" />
                <span className="previewStreetwearTitle">HYPE</span>
                <span className="previewStreetwearAccent" />
                <span className="previewStreetwearLine previewStreetwearLineTop" />
                <span className="previewStreetwearLine previewStreetwearLineBottom" />
            </div>
        );
    }

    if (templateId === "luxuryMinimal") {
        return (
            <div className="layoutPreview is-luxuryMinimal" aria-hidden="true">
                <span className="previewLuxuryCard" />
                <span className="previewLuxuryOverline" />
                <span className="previewLuxuryTitle" />
                <span className="previewLuxuryBody previewLuxuryBodyTop" />
                <span className="previewLuxuryBody previewLuxuryBodyBottom" />
                <span className="previewLuxurySeal" />
            </div>
        );
    }

    if (templateId === "microBlogBold") {
        return (
            <div className="layoutPreview is-microBlogBold" aria-hidden="true">
                <span className="previewMicroPanel" />
                <span className="previewMicroPhoto" />
                <span className="previewMicroAccentBar" />
                <span className="previewMicroLabelLine" />
                <span className="previewMicroTitleLine previewMicroTitleLineTop" />
                <span className="previewMicroTitleLine previewMicroTitleLineBottom" />
                <span className="previewMicroSupport previewMicroSupportTop" />
                <span className="previewMicroSignatureLine" />
            </div>
        );
    }

    if (templateId === "glassEditorial") {
        return (
            <div className="layoutPreview is-glassEditorial" aria-hidden="true">
                <span className="previewGlassBg" />
                <span className="previewGlassPanel" />
                <span className="previewGlassChrome" />
                <span className="previewGlassDot previewGlassDotOne" />
                <span className="previewGlassDot previewGlassDotTwo" />
                <span className="previewGlassDot previewGlassDotThree" />
                <span className="previewGlassTitleLine previewGlassTitleLineTop" />
                <span className="previewGlassBodyLine previewGlassBodyLineTop" />
                <span className="previewGlassFooterLine" />
            </div>
        );
    }

    return (
        <div className="layoutPreview is-editorial3D" aria-hidden="true">
            <span className="previewEditorialPanel" />
            <span className="previewEditorialCube" />
            <span className="previewEditorialTitle" />
            <span className="previewEditorialBody previewEditorialBodyTop" />
            <span className="previewEditorialBody previewEditorialBodyBottom" />
        </div>
    );
}

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
