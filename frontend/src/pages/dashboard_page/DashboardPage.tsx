import "./DashboardPage.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, orderBy, query, where, deleteDoc, doc } from "firebase/firestore";
import { db, storage } from "../../services/firebase";
import { ref as storageRef, listAll, deleteObject } from "firebase/storage";
import { useAuth } from "../../lib/hooks/useAuth";
import { applyProfileCardIdentity } from "../../lib/applyProfileCardIdentity";
import token from "../../assets/icons/token_icon.svg";

import { Canvas } from "../../editor/canvas/Canvas";
import type { Carousel } from "../../editor/canvas/types";
import type { UserData } from "../../types/userData";

type FirestoreDate = { toDate?: () => Date } | Date | undefined;

type ProjectCard = {
    id: string;
    meta?: {
        title?: string;
        style?: string;
        slideCount?: number;
    };
    renderCarousel?: Carousel;
    slides?: unknown[];
    updatedAt?: FirestoreDate;
};


const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
});

function toDate(value: FirestoreDate) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value;
    }

    if (typeof value.toDate === "function") {
        return value.toDate();
    }

    return null;
}

export function DashboardPage() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [userData, setUserData] = useState<UserData | null>(null);
    const [projects, setProjects] = useState<ProjectCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState("");
    const [showTrialSnack, setShowTrialSnack] = useState(false);
    const trialSnackShown = useRef(false);

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

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user) {
            setProjects([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const q = query(
            collection(db, "projects"),
            where("ownerId", "==", user.uid),
            orderBy("updatedAt", "desc")
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                const list: ProjectCard[] = snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as Omit<ProjectCard, "id">),
                }));

                setProjects(list);
                setLoading(false);
            },
            (err) => {
                console.error(err);
                setError(err?.message ?? "Erro ao carregar projetos");
                setLoading(false);
            }
        );

        return () => unsub();
    }, [user, authLoading]);

    useEffect(() => {
        if (trialSnackShown.current || userData?.trialUsed !== false) return;
        trialSnackShown.current = true;
        setShowTrialSnack(true);
        const t = setTimeout(() => setShowTrialSnack(false), 5000);
        return () => clearTimeout(t);
    }, [userData]);

    useEffect(() => {
        if (!menuOpenId) {
            return;
        }

        const handleDocClick = () => setMenuOpenId(null);
        document.addEventListener("click", handleDocClick);
        return () => document.removeEventListener("click", handleDocClick);
    }, [menuOpenId]);

    const filteredProjects = useMemo(() => {
        const queryValue = searchValue.trim().toLowerCase();
        const matchingProjects = !queryValue
            ? projects
            : projects.filter((project) => {
                const title = project.meta?.title?.toLowerCase() ?? "";
                const style = project.meta?.style?.toLowerCase() ?? "";
                return title.includes(queryValue) || style.includes(queryValue);
            });

        return [...matchingProjects].sort((left, right) => {
            const leftTime = toDate(left.updatedAt)?.getTime() ?? 0;
            const rightTime = toDate(right.updatedAt)?.getTime() ?? 0;
            return rightTime - leftTime;
        });
    }, [projects, searchValue]);

    async function handleDeleteProject(project: ProjectCard) {
        setMenuOpenId(null);

        const confirmed = window.confirm("Deseja realmente apagar este carrossel?");
        if (!confirmed) {
            return;
        }

        try {
            const prefix = `projects/${project.id}`;
            const prefixRef = storageRef(storage, prefix);

            try {
                const listed = await listAll(prefixRef);
                if (listed.items.length > 0) {
                    await Promise.all(listed.items.map((item) => deleteObject(item)));
                }
            } catch (storageErr) {
                console.warn("Erro ao apagar arquivos no Storage:", storageErr);
            }

            await deleteDoc(doc(db, "projects", project.id));
        } catch (err) {
            console.error(err);
            alert("Erro ao apagar projeto");
        }
    }

    return (
        <>
                <div className="dashboard">
                    <div className="dashboard_surface">
                        <header className="dashboard_header">
                            <div className="title_block">
                                <p className="small_label">Workspace</p>
                                <h1>Projetos recentes</h1>
                            </div>

                            <div className="header_actions">
                                <button type="button" className="token_chip" onClick={() => navigate("/plans")}>
                                    <img src={token} alt="Créditos" />
                                    <span>{userData?.creditsBalance ?? 0}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate("/create")}
                                    className="create_button"
                                >
                                    Criar carrossel
                                </button>
                            </div>
                        </header>

                        {(() => {
                            const hasPhoto = !!userData?.avatarUrl;
                            const hasSpec = !!userData?.specialization;
                            const pct = userData == null ? null : (hasPhoto ? 50 : 0) + (hasSpec ? 50 : 0);
                            if (pct == null || pct === 100) return null;
                            return (
                                <button className="profile_progress" onClick={() => navigate("/profile")}>
                                    <span className="profile_progress_label">Perfil {pct}%</span>
                                    <span className="profile_progress_bar">
                                        <span className="profile_progress_fill" style={{ width: `${pct}%` }} />
                                    </span>
                                    <span className="profile_progress_cta">Completar →</span>
                                </button>
                            );
                        })()}

                        <section className="dashboard_toolbar">
                            <div className="search_box">
                                <span>⌕</span>
                                <input
                                    value={searchValue}
                                    onChange={(event) => setSearchValue(event.target.value)}
                                    placeholder="Buscar por título ou estilo"
                                />
                            </div>
                            <div className="toolbar_hint">{filteredProjects.length} projeto(s)</div>
                        </section>

                        <section className="dashboard_content">
                            {loading && <p className="status_text">Carregando projetos...</p>}
                            {error && <p className="status_text error">{error}</p>}

                            {!loading && !error && filteredProjects.length === 0 && (
                                projects.length === 0 && userData?.trialUsed === false ? (
                                    <div className="empty_state empty_state_trial">
                                        <div className="empty_trial_gift">🎁</div>
                                        <h3>Crie seu primeiro carrossel grátis!</h3>
                                        <p>Você tem uma geração gratuita esperando. Descreva seu conteúdo e a IA monta tudo pra você.</p>
                                        <button onClick={() => navigate("/create")}>Começar agora — é grátis</button>
                                    </div>
                                ) : (
                                    <div className="empty_state">
                                        <h3>Nenhum projeto encontrado</h3>
                                        <p>
                                            {projects.length === 0
                                                ? "Você ainda não criou nenhum carrossel."
                                                : "Tente outro termo de busca."}
                                        </p>
                                        {projects.length === 0 && (
                                            <button onClick={() => navigate("/create")}>Criar primeiro projeto</button>
                                        )}
                                    </div>
                                )
                            )}

                            {!loading && !error && filteredProjects.length > 0 && (
                                <div className="projects_grid">
                                    {filteredProjects.map((project) => {
                                        const slideCount = project?.meta?.slideCount
                                            ?? project?.renderCarousel?.slides?.length
                                            ?? (Array.isArray(project?.slides) ? project.slides.length : null);
                                        const subtitle = `${slideCount ?? "-"} slides`;
                                        const style = project?.meta?.style ?? "clean";
                                        const updatedAtDate = toDate(project.updatedAt);
                                        const updatedLabel = updatedAtDate
                                            ? dateFormatter.format(updatedAtDate)
                                            : "sem atualização";

                                        return (
                                            <article
                                                key={project.id}
                                                className="project_card"
                                                onClick={() => navigate(`/editor/${project.id}`)}
                                            >
                                                <div className="project_card_header">
                                                    <div className="project_info">
                                                        <input
                                                            className="project_title"
                                                            value={project?.meta?.title || "Sem título"}
                                                            onClick={(event) => event.stopPropagation()}
                                                            onChange={async (event) => {
                                                                const newTitle = event.target.value;

                                                                setProjects((prev) =>
                                                                    prev.map((proj) =>
                                                                        proj.id === project.id
                                                                            ? {
                                                                                ...proj,
                                                                                meta: {
                                                                                    ...proj.meta,
                                                                                    title: newTitle,
                                                                                },
                                                                            }
                                                                            : proj
                                                                    )
                                                                );

                                                                try {
                                                                    const { updateDoc, doc } = await import("firebase/firestore");
                                                                    await updateDoc(doc(db, "projects", project.id), {
                                                                        "meta.title": newTitle,
                                                                    });
                                                                } catch (err) {
                                                                    console.error("Erro ao atualizar título:", err);
                                                                    setError("Erro ao atualizar título");
                                                                }
                                                            }}
                                                        />

                                                        <div className="project_subtitle">{subtitle} • {style}</div>
                                                    </div>

                                                    <div className="three_dots_container">
                                                        <button
                                                            className="three_dots_edit_btn"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setMenuOpenId((prev) => (prev === project.id ? null : project.id));
                                                            }}
                                                            type="button"
                                                        >
                                                            <span className="three_dots_icon">⋮</span>
                                                        </button>

                                                        {menuOpenId === project.id && (
                                                            <div
                                                                className="options_menu"
                                                                onClick={(event) => event.stopPropagation()}
                                                            >
                                                                <button
                                                                    className="options_item"
                                                                    onClick={() => {
                                                                        setMenuOpenId(null);
                                                                        navigate(`/editor/${project.id}`);
                                                                    }}
                                                                >
                                                                    Abrir
                                                                </button>

                                                                <button
                                                                    className="options_item danger"
                                                                    onClick={() => handleDeleteProject(project)}
                                                                >
                                                                    Apagar
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="project_preview" aria-hidden="true">
                                                    <div className="project_preview_canvas">
                                                        <Canvas
                                                            carousel={applyProfileCardIdentity(project.renderCarousel ?? null, {
                                                                displayName: userData?.displayName ?? user?.displayName ?? "",
                                                                specialization: userData?.specialization ?? "",
                                                                avatarUrl: userData?.avatarUrl ?? user?.photoURL ?? "",
                                                            })}
                                                            slideIndex={0}
                                                            zoom={0.25}
                                                        />
                                                    </div>
                                                    <span className="preview_updated">Atualizado em {updatedLabel}</span>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>
                </div>

            {showTrialSnack && (
                <div className="trial_snackbar">
                    <span>🎁 Você tem 1 carrossel grátis!</span>
                    <button onClick={() => { setShowTrialSnack(false); navigate("/create"); }}>
                        Criar agora →
                    </button>
                </div>
            )}
        </>
    );
}
