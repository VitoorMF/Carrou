import "./DashboardPage.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, orderBy, query, where, deleteDoc, doc } from "firebase/firestore";
import { db, storage } from "../../services/firebase";
import { ref as storageRef, listAll, deleteObject } from "firebase/storage";
import { useAuth } from "../../lib/hooks/useAuth";

import token from "../../assets/icons/token_icon.svg";

type ProjectCard = {
    id: string;
    meta?: {
        title?: string;
        style?: string;
        slideCount?: number;
    };
    updatedAt?: any;
    createdAt?: any;
};

export function DashboardPage() {
    const navigate = useNavigate();

    const { user, loading: authLoading } = useAuth();
    const [userData, setUserData] = useState<any>(null);

    const [projects, setProjects] = useState<ProjectCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const unsub = onSnapshot(
            doc(db, "users", user.uid),
            (snap) => {
                if (snap.exists()) {
                    setUserData(snap.data());
                }
            },
            (err) => {
                console.error("Erro ao carregar dados do usuário:", err);
            }
        );

        return () => unsub();
    }, [user]);


    useEffect(() => {
        if (authLoading) return;

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
                    ...(d.data() as any),
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

    // Fecha o menu ao clicar em qualquer lugar da tela (best-effort).
    useEffect(() => {
        if (!menuOpenId) return;

        const handleDocClick = () => {
            setMenuOpenId(null);
        };

        document.addEventListener("click", handleDocClick);

        return () => document.removeEventListener("click", handleDocClick);
    }, [menuOpenId]);

    return (
        <div className="dashboard">

            <div className={`header_stack`}>
                <div className="dashboard_header" onClick={() => (true)}>
                    <div className="informational_card">
                        <div className="profile_photo">
                            {userData?.avatarUrl ? (
                                <img src={userData.avatarUrl} alt="Foto de perfil" />
                            ) : (
                                <div className="profile_placeholder">
                                    {userData?.displayName?.[0]?.toUpperCase() || "U"}
                                </div>
                            )}
                        </div>

                        <div className="user_info">
                            <div className="username">
                                {user?.displayName || "Usuário"}
                            </div>

                            <div className="tokens_card">
                                <img src={token} alt="Tokens" />
                                <span className="tokens_value">{userData?.tokensBalance || "0"} </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate("/create");
                        }}
                        className="create_button"
                    >
                        + Create
                    </button>
                </div>

            </div>



            <div className="dashboard_content">
                {loading && <p>Carregando...</p>}
                {error && <p className="error">{error}</p>}

                {!loading && !error && projects.length === 0 && (
                    <div className="empty_state">
                        <p>Você ainda não criou nenhum carrossel.</p>
                        <button onClick={() => navigate("/create")}>
                            Criar o primeiro
                        </button>
                    </div>
                )}

                {!loading && !error && projects.length > 0 && (
                    <div className="projects_grid">
                        {projects.map((p) => {
                            const subtitle = `${p?.meta?.slideCount ?? "-"} slides • ${p?.meta?.style ?? "style"
                                }`;

                            return (
                                <div
                                    key={p.id}
                                    onClick={() => navigate(`/editor/${p.id}`)}
                                    className="project_card"
                                >
                                    <div className="project_card_header">
                                        <div className="project_info">
                                            <input
                                                className="project_title"
                                                value={p?.meta?.title || "Sem título"}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={async (e) => {
                                                    const newTitle = e.target.value;
                                                    setProjects((prev) =>
                                                        prev.map((proj) =>
                                                            proj.id === p.id
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
                                                    // Persist to Firestore
                                                    try {
                                                        await import("firebase/firestore").then(({ updateDoc, doc }) =>
                                                            updateDoc(
                                                                doc(db, "projects", p.id),
                                                                { "meta.title": newTitle }
                                                            )
                                                        );
                                                    } catch (err) {
                                                        console.error("Erro ao atualizar título:", err);
                                                        setError("Erro ao atualizar título");
                                                    }
                                                }}
                                            />
                                            <div className="project_subtitle">{subtitle}</div>
                                        </div>

                                        <div className="three-dots_container">
                                            <div className="three-dots_edit-btn" onClick={(e) => {
                                                e.stopPropagation();
                                                setMenuOpenId((prev) => (prev === p.id ? null : p.id));
                                            }}>
                                                <span className="three-dots_icon">⋮</span>
                                            </div>

                                            {menuOpenId === p.id && (
                                                <div
                                                    className="options_menu"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        className="options_item"
                                                        onClick={() => {
                                                            setMenuOpenId(null);
                                                            navigate(`/editor/${p.id}`);
                                                        }}
                                                    >
                                                        Abrir
                                                    </button>



                                                    <button
                                                        className="options_item danger"
                                                        onClick={async () => {
                                                            setMenuOpenId(null);
                                                            const confirmed = window.confirm(
                                                                "Deseja realmente apagar este carrossel?"
                                                            );
                                                            if (!confirmed) return;

                                                            try {
                                                                // Tentativa best-effort de apagar arquivos no Storage
                                                                const prefix = `projects/${p.id}`;
                                                                const prefixRef = storageRef(storage, prefix);
                                                                try {
                                                                    const listed = await listAll(prefixRef);
                                                                    if (listed.items.length > 0) {
                                                                        await Promise.all(
                                                                            listed.items.map((it) => deleteObject(it))
                                                                        );
                                                                    }
                                                                } catch (storageErr) {
                                                                    // Falha em listar / apagar: pode ser regra de segurança ou outro erro.
                                                                    // Logamos e seguimos para apagar o documento Firestore.
                                                                    console.warn("Erro ao apagar arquivos no Storage:", storageErr);
                                                                }

                                                                await deleteDoc(doc(db, "projects", p.id));
                                                            } catch (err) {
                                                                console.error(err);
                                                                alert("Erro ao apagar projeto");
                                                            }
                                                        }}
                                                    >
                                                        Apagar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="project_preview">

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
