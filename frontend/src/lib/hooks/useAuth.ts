import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";

type AuthState = {
    user: User | null;
    loading: boolean;
};

export function useAuth(): AuthState {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    console.log("useAuth carregado");


    useEffect(() => {
        const auth = getAuth();

        const unsub = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    return { user, loading };
}
