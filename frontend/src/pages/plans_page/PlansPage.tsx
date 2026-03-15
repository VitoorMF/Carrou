import { useEffect, useMemo, useState } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { AppSidebar } from "../../components/app_sidebar/AppSidebar";
import { useAuth } from "../../lib/hooks/useAuth";
import { db } from "../../services/firebase";
import type { UserData } from "../../types/userData";
import "./PlansPage.css";

type BillingPlan = {
    id: string;
    name: string;
    price: string;
    cadence: string;
    credits: number;
    valuePerCredit: string;
    description: string;
    highlights: string[];
    badge?: string;
    current?: boolean;
};

type TopUp = {
    id: string;
    name: string;
    price: string;
    credits: number;
    valuePerCredit: string;
};

const plans: BillingPlan[] = [
    {
        id: "free",
        name: "Free",
        price: "R$ 0",
        cadence: "uma vez",
        credits: 10,
        valuePerCredit: "Comece sem cartão",
        description: "Para experimentar o fluxo completo e validar o produto no seu ritmo.",
        highlights: [
            "10 créditos para começar",
            "Geração de carrosséis com IA",
            "Editor visual e export em PNG/ZIP",
        ],
        current: true,
    },
    {
        id: "starter",
        name: "Starter",
        price: "R$ 32",
        cadence: "/mês",
        credits: 40,
        valuePerCredit: "R$ 0,80/crédito",
        description: "Ideal para quem publica com frequência e quer previsibilidade de custo.",
        highlights: [
            "Até ~6 carrosséis completos",
            "Créditos renovados todo mês",
            "Mais econômico do que compra avulsa",
        ],
        badge: "Mais popular",
    },
    {
        id: "pro",
        name: "Pro",
        price: "R$ 67",
        cadence: "/mês",
        credits: 100,
        valuePerCredit: "R$ 0,67/crédito",
        description: "O melhor ponto de equilíbrio para creators, freelancers e times pequenos.",
        highlights: [
            "Até ~16 carrosséis completos",
            "Mais espaço para testar variações",
            "Plano mais equilibrado em custo e volume",
        ],
    },
];

const topUps: TopUp[] = [
    { id: "credits_14", name: "Top-up R$ 17", price: "R$ 17", credits: 14, valuePerCredit: "R$ 1,21/crédito" },
    { id: "credits_35", name: "Top-up R$ 39", price: "R$ 39", credits: 35, valuePerCredit: "R$ 1,11/crédito" },
    { id: "credits_100", name: "Top-up R$ 99", price: "R$ 99", credits: 100, valuePerCredit: "R$ 0,99/crédito" },
];

function ActionButton({ children }: { children: string }) {
    return (
        <button
            type="button"
            className="billing_action"
            onClick={() => alert("Checkout ainda não implementado. Esta tela já está pronta para receber Stripe.")}
        >
            {children}
        </button>
    );
}

export default function BillingPage() {
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

    const creditsBalance = useMemo(
        () => userData?.creditsBalance ?? userData?.tokensBalance ?? 0,
        [userData]
    );

    return (
        <div className="app_shell app_shell_locked">
            <AppSidebar
                avatarUrl={userData?.avatarUrl ?? user?.photoURL ?? null}
                initials={userData?.displayName?.[0]?.toUpperCase() ?? user?.displayName?.[0]?.toUpperCase() ?? "U"}
            />

            <main className="app_shell_main app_shell_main_scroll">
                <div className="billing_page">
                    <section className="billing_hero">
                        <div className="billing_hero_copy">
                            <p className="billing_kicker">Billing</p>
                            <h1>Planos, créditos e recarga</h1>
                            <p className="billing_lead">
                                Gerencie seu saldo e escolha a melhor forma de continuar gerando carrosséis e imagens
                                com IA. Assinaturas liberam créditos mensais, e top-ups cobrem picos de uso.
                            </p>

                            <div className="billing_rules">
                                <div className="billing_rule">
                                    <strong>1 crédito</strong>
                                    <span>para gerar um carrossel</span>
                                </div>
                                <div className="billing_rule">
                                    <strong>1 crédito</strong>
                                    <span>por imagem gerada</span>
                                </div>
                            </div>
                        </div>

                        <aside className="billing_balance_card" aria-label="Saldo atual">
                            <div className="billing_balance_card_intro">
                                <p className="billing_section_label">Conta</p>
                                <span className="billing_balance_label">Saldo atual</span>
                            </div>
                            <strong>{creditsBalance}</strong>
                            <span className="billing_balance_hint">créditos disponíveis</span>
                        </aside>
                    </section>

                    <section className="billing_section">
                        <div className="billing_section_head">
                            <div>
                                <p className="billing_section_kicker">Assinaturas</p>
                                <h2>Escolha um plano mensal</h2>
                            </div>
                            <p>
                                Os créditos mensais são ideais para quem usa o Carrosselize com frequência e quer
                                previsibilidade de custo.
                            </p>
                        </div>

                        <div className="billing_plans_grid">
                            {plans.map((plan) => (
                                <article className={`billing_plan_card ${plan.badge ? "featured" : ""}`} key={plan.id}>
                                    {(plan.badge || plan.current) && (
                                        <span className="billing_badge">
                                            {plan.current ? "Plano atual" : plan.badge}
                                        </span>
                                    )}
                                    <div className="billing_plan_head">
                                        <h3>{plan.name}</h3>
                                        <p className="billing_plan_description">{plan.description}</p>
                                    </div>

                                    <div className="billing_price_block">
                                        <strong>{plan.price}</strong>
                                        <span>{plan.cadence}</span>
                                    </div>

                                    <div className="billing_plan_meta">
                                        <div>
                                            <span>Créditos</span>
                                            <strong>{plan.credits}</strong>
                                        </div>
                                        <div>
                                            <span>Valor</span>
                                            <strong>{plan.valuePerCredit}</strong>
                                        </div>
                                    </div>

                                    <ul className="billing_feature_list">
                                        {plan.highlights.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>

                                    {plan.current ? (
                                        <button type="button" className="billing_action billing_action_current" disabled>
                                            Plano atual
                                        </button>
                                    ) : (
                                        <ActionButton>
                                            {plan.id === "free" ? "Começar grátis" : `Assinar ${plan.name}`}
                                        </ActionButton>
                                    )}
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="billing_section">
                        <div className="billing_section_head">
                            <div>
                                <p className="billing_section_kicker">Créditos avulsos</p>
                                <h2>Compre só quando precisar</h2>
                            </div>
                            <p>Ideal para complementar o saldo sem trocar de plano ou para uso pontual.</p>
                        </div>

                        <div className="billing_topups_grid">
                            {topUps.map((item) => (
                                <article className="billing_topup_card" key={item.id}>
                                    <div>
                                        <p>{item.credits} créditos</p>
                                    </div>

                                    <div className="billing_topup_meta">
                                        <strong>{item.price}</strong>
                                        <span>{item.valuePerCredit}</span>
                                    </div>

                                    <ActionButton>Comprar créditos</ActionButton>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="billing_faq">
                        <div className="billing_section_head">
                            <div>
                                <p className="billing_section_kicker">FAQ</p>
                                <h2>Como os créditos funcionam?</h2>
                            </div>
                        </div>

                        <div className="billing_faq_grid">
                            <article>
                                <h3>O editor gasta crédito?</h3>
                                <p>Não. Editar texto, posição, paleta e exportar não consome crédito.</p>
                            </article>
                            <article>
                                <h3>Preciso assinar para usar?</h3>
                                <p>Não. Você pode começar com o plano gratuito e depois comprar top-up ou assinar.</p>
                            </article>
                            <article>
                                <h3>Quando o saldo é consumido?</h3>
                                <p>Quando você gera um carrossel novo ou gera uma imagem com IA.</p>
                            </article>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
