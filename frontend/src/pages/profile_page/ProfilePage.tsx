import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { updateProfile, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../../services/firebase";
import { useAuth } from "../../lib/hooks/useAuth";

import "./ProfilePage.css";
import type { UserData } from "../../types/userData";

type UserProfileDoc = {
    displayName?: string;
    avatarUrl?: string;
    specialization?: string;
    creditsBalance?: number;
    email?: string;
};

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    const [displayName, setDisplayName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [specFocused, setSpecFocused] = useState(false);
    const [creditsBalance, setCreditsBalance] = useState(0);
    const [email, setEmail] = useState("");
    const [, setUserData] = useState<UserData | null>(null);

    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!statusMessage) return;
        const t = setTimeout(() => setStatusMessage(null), 3000);
        return () => clearTimeout(t);
    }, [statusMessage]);
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
            setCreditsBalance(data.creditsBalance ?? 0);
            setEmail(data.email ?? user.email ?? "");
        });

        return () => unsub();
    }, [user, loading, navigate]);

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
        <>
            <div className="profile_page">
                <div className="profile_surface">
                    <header className="profile_header">
                        <div>
                            <p className="profile_kicker">Conta</p>
                            <h1>Editar perfil</h1>
                            <p>Atualize seus dados pessoais e como sua conta aparece no app.</p>
                        </div>
                        <div className="profile_header_badge">
                            <span>Perfil público</span>
                            <strong>{displayName.trim() || "Seu nome"}</strong>
                        </div>
                    </header>

                    <section className="profile_body">
                        <div className="profile_avatar_card">
                            <div className="profile_avatar_intro">
                                <p className="profile_section_label">Identidade</p>
                                <h2>Sua presença no app</h2>
                                <p>Foto, nome e especialização ajudam a personalizar seus carrosséis e seu perfil.</p>
                            </div>

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

                            <p className="profile_avatar_hint">Use uma foto nítida para o avatar aparecer melhor nos templates.</p>

                            <div className="profile_balance">
                                <span>Saldo de créditos</span>
                                <strong>{creditsBalance}</strong>
                                <small>Disponíveis para gerar e iterar mais rápido</small>
                            </div>
                        </div>

                        <div className="profile_form">
                            <div className="profile_form_intro">
                                <p className="profile_section_label">Dados da conta</p>
                                <h2>Informações básicas</h2>
                            </div>

                            <label>
                                Nome de exibicao
                                <input
                                    value={displayName}
                                    onChange={(event) => setDisplayName(event.target.value)}
                                    placeholder="Seu nome"
                                />
                            </label>

                            <label>
                                Especializacao
                                <div className="spec_input_wrap">
                                    <input
                                        value={specialization}
                                        onChange={(event) => setSpecialization(event.target.value)}
                                        placeholder="Ex.: Social Media"
                                        onFocus={() => setSpecFocused(true)}
                                        onBlur={() => setSpecFocused(false)}
                                    />
                                    {!specFocused && specialization === "" && (
                                        <span className="spec_badge">Preencher</span>
                                    )}
                                </div>
                            </label>

                            <label>
                                Email
                                <input value={email} readOnly />
                            </label>

                            <div className="profile_actions">
                                <button className="save_btn" type="button" onClick={handleSaveProfile} disabled={saving}>
                                    {saving ? "Salvando..." : "Salvar perfil"}
                                </button>
                                <button
                                    className="logout_btn"
                                    type="button"
                                    onClick={async () => {
                                        await signOut(auth);
                                        navigate("/");
                                    }}
                                >
                                    Sair
                                </button>
                            </div>

                            {errorMessage && <p className="profile_status error">{errorMessage}</p>}
                        </div>
                    </section>
                </div>
            </div>

            {statusMessage && (
                <div className="profile_snackbar">
                    <span>✓ {statusMessage}</span>
                </div>
            )}
        </>
    );
}
