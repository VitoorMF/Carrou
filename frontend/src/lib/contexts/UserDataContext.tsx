import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../hooks/useAuth";

export type UserDataCtx = {
    avatarUrl?: string | null;
    displayName?: string | null;
    specialization?: string | null;
    creditsBalance?: number;
    trialUsed?: boolean;
    email?: string | null;
};

const UserDataContext = createContext<UserDataCtx | null>(null);

export function UserDataProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [userData, setUserData] = useState<UserDataCtx | null>(null);

    useEffect(() => {
        if (!user) {
            setUserData(null);
            return;
        }

        const unsub = onSnapshot(
            doc(db, "users", user.uid),
            (snap) => {
                if (snap.exists()) {
                    setUserData(snap.data() as UserDataCtx);
                } else {
                    // fallback com dados do Firebase Auth enquanto o doc não existe
                    setUserData({
                        displayName: user.displayName,
                        avatarUrl: user.photoURL,
                        email: user.email,
                        creditsBalance: 0,
                        trialUsed: false,
                    });
                }
            },
            (err) => console.error("UserDataContext:", err)
        );

        return () => unsub();
    }, [user]);

    return (
        <UserDataContext.Provider value={userData}>
            {children}
        </UserDataContext.Provider>
    );
}

export function useUserData() {
    return useContext(UserDataContext);
}
