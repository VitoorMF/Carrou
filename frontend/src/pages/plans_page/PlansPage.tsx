import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "../../components/app_sidebar/AppSidebar";
import { useAuth } from "../../lib/hooks/useAuth";
import "./PlansPage.css";

type Plan = {
    id: string;
    name: string;
    price: string;
    tokens: number;
    highlight?: string;
};

const plans: Plan[] = [
    { id: "starter", name: "Starter", price: "R$ 29", tokens: 300 },
    { id: "pro", name: "Pro", price: "R$ 79", tokens: 1000, highlight: "Mais popular" },
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

    const initials = useMemo(
        () => user?.displayName?.[0]?.toUpperCase() ?? "U",
        [user?.displayName]
    );

    return (
        <div className="app_shell">
            <AppSidebar avatarUrl={user?.photoURL ?? null} initials={initials} />

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
                            <article className={`plan_card ${plan.highlight ? "highlight" : ""}`} key={plan.id}>
                                {plan.highlight && <span className="badge">{plan.highlight}</span>}
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
