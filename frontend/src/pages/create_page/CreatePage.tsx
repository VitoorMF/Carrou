import { useEffect, useState } from "react";
import "./CreatePage.css";
import { auth, db } from "../../services/firebase";
import { useNavigate } from "react-router-dom";
import { generateCarousel } from "../../services/functions";
import { signInAnonymously } from "firebase/auth";
import { AppSidebar } from "../../components/app_sidebar/AppSidebar";
import { useAuth } from "../../lib/hooks/useAuth";
import { onSnapshot, doc } from "firebase/firestore";
import {
    DEFAULT_TEMPLATE_ID,
    TEMPLATE_CATALOG,
    findTemplateById,
    type TemplateId,
} from "../../templates/templateCatalog";


type UserData = {
    avatarUrl?: string;
    displayName?: string;
    tokensBalance?: number;
};

const USE_FIREBASE_EMULATORS = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
const IMPROVE_PROMPT_ENDPOINT = USE_FIREBASE_EMULATORS
    ? "http://127.0.0.1:5001/carrosselize/us-central1/improvePrompt"
    : "https://us-central1-carrosselize.cloudfunctions.net/improvePrompt";

async function ensureAuth() {
    if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
        return auth.currentUser;
    }

    const cred = await signInAnonymously(auth);
    await cred.user.getIdToken(true);

    return cred.user;
}

export default function CreatePage() {
    const { user } = useAuth();
    const [prompt, setPrompt] = useState("");

    const [layout, setLayout] = useState<TemplateId | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
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

            await ensureAuth();

            const fallbackTemplate = findTemplateById(DEFAULT_TEMPLATE_ID);
            const { projectId } = await generateCarousel({
                prompt: prompt.trim(),
                templateId: selectedLayout?.id,
                theme: selectedLayout?.defaultTheme ?? fallbackTemplate?.defaultTheme ?? "microblog",
            });

            navigate(`/editor/${projectId}`);
        } catch (e: any) {
            console.error("ERRO handleCreate:", e);
            setErr(e?.message ?? "Erro ao gerar carrossel");
        } finally {
            setLoading(false);
        }
    }



    // CreatePage.tsx (somente o JSX/HTML da página)
    return (
        <div className="app_shell">
            <AppSidebar
                avatarUrl={userData?.avatarUrl ?? user?.photoURL ?? null}
                initials={userData?.displayName?.[0]?.toUpperCase() ?? user?.displayName?.[0]?.toUpperCase() ?? "U"}
            />

            <main className="app_shell_main">
                <section className="createPage">
                    <header className="createHeader">
                        <div className="headerLeft">
                            <h1 className="title">Criar carrossel</h1>
                            <p className="subtitle">Escolha um layout pronto, gere e ajuste só os campos no editor.</p>
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
                                    <h2 className="cardTitle">Layout pronto</h2>
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
                                                <div className={`layoutPreview is-${preset.id}`} aria-hidden="true">
                                                    <span className="layoutPreviewBar" />
                                                    <span className="layoutPreviewHero" />
                                                    <span className="layoutPreviewText top" />
                                                    <span className="layoutPreviewText bottom" />
                                                </div>
                                                <span className="layoutPresetLabel">{preset.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
            </main>
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
