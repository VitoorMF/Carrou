import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { db, storage } from "../../services/firebase";
import { useAuth } from "../../lib/hooks/useAuth";
import { AppSidebar } from "../../components/app_sidebar/AppSidebar";
import "./ProfilePage.css";

type UserProfileDoc = {
    displayName?: string;
    avatarUrl?: string;
    specialization?: string;
    tokensBalance?: number;
    email?: string;
};

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    const [displayName, setDisplayName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [tokensBalance, setTokensBalance] = useState(0);
    const [email, setEmail] = useState("");

    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const initials = useMemo(
        () => displayName?.[0]?.toUpperCase() || user?.displayName?.[0]?.toUpperCase() || "U",
        [displayName, user?.displayName]
    );

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            navigate("/auth");
            return;
        }

        setDisplayName(user.displayName ?? "");
        setAvatarUrl(user.photoURL ?? "");
        setEmail(user.email ?? "");

        const userRef = doc(db, "users", user.uid);
        const unsub = onSnapshot(userRef, (snap) => {
            if (!snap.exists()) {
                return;
            }

            const data = snap.data() as UserProfileDoc;
            setDisplayName(data.displayName ?? user.displayName ?? "");
            setAvatarUrl(data.avatarUrl ?? user.photoURL ?? "");
            setSpecialization(data.specialization ?? "");
            setTokensBalance(data.tokensBalance ?? 0);
            setEmail(data.email ?? user.email ?? "");
        });

        return () => unsub();
    }, [user, loading, navigate]);

    async function handleSaveProfile() {
        if (!user) {
            return;
        }

        try {
            setSaving(true);
            setErrorMessage(null);
            setStatusMessage(null);

            const userRef = doc(db, "users", user.uid);

            await setDoc(
                userRef,
                {
                    uid: user.uid,
                    email: user.email ?? email,
                    displayName: displayName.trim() || "User",
                    avatarUrl: avatarUrl.trim(),
                    specialization: specialization.trim(),
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );

            await updateProfile(user, {
                displayName: displayName.trim() || "User",
                photoURL: avatarUrl.trim() || null,
            });

            setStatusMessage("Perfil atualizado com sucesso.");
        } catch (err) {
            console.error(err);
            setErrorMessage("Não foi possível salvar o perfil.");
        } finally {
            setSaving(false);
        }
    }

    async function persistAvatar(nextAvatarUrl: string) {
        if (!user) {
            return;
        }

        const userRef = doc(db, "users", user.uid);
        await setDoc(
            userRef,
            {
                avatarUrl: nextAvatarUrl,
                updatedAt: serverTimestamp(),
            },
            { merge: true }
        );

        await updateProfile(user, {
            photoURL: nextAvatarUrl || null,
        });
    }

    async function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file || !user) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setErrorMessage("Selecione um arquivo de imagem.");
            return;
        }

        try {
            setUploadingAvatar(true);
            setErrorMessage(null);
            setStatusMessage(null);

            const ext = file.name.split(".").pop() || "jpg";
            const fileRef = storageRef(storage, `users/${user.uid}/avatar.${ext}`);
            await uploadBytes(fileRef, file, { contentType: file.type });
            const downloadUrl = await getDownloadURL(fileRef);

            setAvatarUrl(downloadUrl);
            await persistAvatar(downloadUrl);
            setStatusMessage("Avatar enviado com sucesso.");
        } catch (err) {
            console.error(err);
            setErrorMessage("Nao foi possivel enviar o avatar.");
        } finally {
            setUploadingAvatar(false);
            event.target.value = "";
        }
    }

    async function handleRemoveAvatar() {
        if (!user) {
            return;
        }

        try {
            setUploadingAvatar(true);
            setErrorMessage(null);
            setStatusMessage(null);

            setAvatarUrl("");
            await persistAvatar("");
            setStatusMessage("Avatar removido.");
        } catch (err) {
            console.error(err);
            setErrorMessage("Nao foi possivel remover o avatar.");
        } finally {
            setUploadingAvatar(false);
        }
    }

    return (
        <div className="app_shell">
            <AppSidebar avatarUrl={avatarUrl || user?.photoURL || null} initials={initials} />

            <main className="app_shell_main">
                <div className="profile_page">
                    <div className="profile_surface">
                        <header className="profile_header">
                            <div>
                                <p className="profile_kicker">Conta</p>
                                <h1>Editar perfil</h1>
                                <p>Atualize seus dados pessoais e como sua conta aparece no app.</p>
                            </div>
                        </header>

                        <section className="profile_body">
                            <div className="profile_avatar_card">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="profile_avatar" />
                                ) : (
                                    <div className="profile_avatar profile_avatar_fallback">{initials}</div>
                                )}

                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden_avatar_input"
                                    onChange={handleAvatarFileChange}
                                />

                                <div className="avatar_actions">
                                    <button
                                        type="button"
                                        className="avatar_upload_btn"
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={uploadingAvatar}
                                    >
                                        {uploadingAvatar ? "Enviando..." : "Enviar foto"}
                                    </button>

                                    {avatarUrl && (
                                        <button
                                            type="button"
                                            className="avatar_remove_btn"
                                            onClick={handleRemoveAvatar}
                                            disabled={uploadingAvatar}
                                        >
                                            Remover
                                        </button>
                                    )}
                                </div>

                                <div className="profile_balance">
                                    <span>Saldo de tokens</span>
                                    <strong>{tokensBalance}</strong>
                                </div>
                            </div>

                            <div className="profile_form">
                                <label>
                                    Nome de exibicao
                                    <input
                                        value={displayName}
                                        onChange={(event) => setDisplayName(event.target.value)}
                                        placeholder="Seu nome"
                                    />
                                </label>

                                <label>
                                    URL do avatar
                                    <input
                                        value={avatarUrl}
                                        onChange={(event) => setAvatarUrl(event.target.value)}
                                        placeholder="https://..."
                                    />
                                </label>

                                <label>
                                    Especializacao
                                    <input
                                        value={specialization}
                                        onChange={(event) => setSpecialization(event.target.value)}
                                        placeholder="Ex.: Social Media"
                                    />
                                </label>

                                <label>
                                    Email
                                    <input value={email} readOnly />
                                </label>

                                <div className="profile_actions">
                                    <button className="save_btn" type="button" onClick={handleSaveProfile} disabled={saving}>
                                        {saving ? "Salvando..." : "Salvar perfil"}
                                    </button>
                                </div>

                                {statusMessage && <p className="profile_status ok">{statusMessage}</p>}
                                {errorMessage && <p className="profile_status error">{errorMessage}</p>}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
