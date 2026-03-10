import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "../../components/app_sidebar/AppSidebar";
import { useAuth } from "../../lib/hooks/useAuth";
import "./PlansPage.css";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../../services/firebase";
import type { UserData } from "../../types/userData";

type Plan = {
    id: string;
    name: string;
    price: string;
    tokens: number;
    active?: string;
};

const plans: Plan[] = [
    { id: "starter", name: "Starter", price: "R$ 29", tokens: 300 },
    { id: "pro", name: "Pro", price: "R$ 79", tokens: 1000, active: "Mais popular" },
    { id: "business", name: "Business", price: "R$ 159", tokens: 2500 },
];

const recharges = [
    { id: "r100", label: "+100 tokens", price: "R$ 12" },
    { id: "r300", label: "+300 tokens", price: "R$ 29" },
    { id: "r700", label: "+700 tokens", price: "R$ 59" },
];


export default function PlansPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [userData, setUserData] = useState<UserData | null>(null);


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

    return (
        <div className="app_shell">
            <AppSidebar
                avatarUrl={userData?.avatarUrl ?? null}
                initials={userData?.displayName?.[0]?.toUpperCase() ?? user?.displayName?.[0]?.toUpperCase() ?? "U"}
            />

            <main className="app_shell_main">
                <div className="plans_page">
                    <section className="plans_header">
                        <div>
                            <p className="plans_kicker">Tokens</p>
                            <h1>Planos e recarga</h1>
                            <p>Escolha um plano mensal ou faça recarga avulsa para continuar gerando carrosséis.</p>
                        </div>

                        <button className="plans_back" onClick={() => navigate(-1)} type="button">
                            Voltar
                        </button>
                    </section>

                    <section className="plans_grid">
                        {plans.map((plan) => (
                            <article className={`plan_card ${plan.active ? "active" : ""}`} key={plan.id}>
                                {plan.active && <span className="badge">{plan.active}</span>}
                                <h2>{plan.name}</h2>
                                <p className="plan_price">{plan.price}<span>/mês</span></p>
                                <p className="plan_tokens">{plan.tokens} tokens</p>
                                <ul>
                                    <li>Geração de carrossel com IA</li>
                                    <li>Editor completo</li>
                                    <li>Export em PNG</li>
                                </ul>
                                <button type="button">Escolher plano</button>
                            </article>
                        ))}
                    </section>

                    <section className="recharge_section">
                        <div className="recharge_head">
                            <h3>Recarga rápida</h3>
                            <p>Para quando você só precisar de mais créditos agora.</p>
                        </div>

                        <div className="recharge_list">
                            {recharges.map((item) => (
                                <button key={item.id} className="recharge_item" type="button">
                                    <span>{item.label}</span>
                                    <strong>{item.price}</strong>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
