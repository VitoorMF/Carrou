import { useEffect, useMemo, useState } from "react";
import { onSnapshot, doc, collection, query, orderBy, limit } from "firebase/firestore";

import { useAuth } from "../../lib/hooks/useAuth";
import { db } from "../../services/firebase";
import { createCreditCheckout } from "../../services/functions";
import type { UserData } from "../../types/userData";
import "./PlansPage.css";

type CreditTransaction = {
    id: string;
    type: "purchase" | "debit";
    amount: number;
    reason: string;
    balanceAfter: number;
    createdAt: { toDate: () => Date } | null;
    productId?: string | null;
    projectId?: string | null;
};

function reasonLabel(reason: string) {
    switch (reason) {
        case "topup_purchase": return "Compra de créditos";
        case "generate_carousel": return "Carrossel gerado";
        case "generate_image": return "Imagem gerada";
        default: return reason;
    }
}

function formatDate(ts: CreditTransaction["createdAt"]) {
    if (!ts?.toDate) return "—";
    return ts.toDate().toLocaleDateString("pt-BR", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

type TopUp = {
    id: string;
    name: string;
    price: string;
    credits: number;
    valuePerCredit: string;
};

const topUps: TopUp[] = [
    { id: "credits_14", name: "Top-up R$ 17", price: "R$ 17", credits: 14, valuePerCredit: "R$ 1,21/crédito" },
    { id: "credits_35", name: "Top-up R$ 39", price: "R$ 39", credits: 35, valuePerCredit: "R$ 1,11/crédito" },
    { id: "credits_100", name: "Top-up R$ 99", price: "R$ 99", credits: 100, valuePerCredit: "R$ 0,99/crédito" },
];

function ActionButton({
    children,
    onClick,
    disabled = false,
}: {
    children: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            className="billing_action"
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}

export default function BillingPage() {
    const { user } = useAuth();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [checkoutLoadingId, setCheckoutLoadingId] = useState<string | null>(null);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [dateFilter, setDateFilter] = useState<"7d" | "30d" | "month" | "all">("all");

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
        if (!user) {
            setTransactions([]);
            return;
        }
        const q = query(
            collection(db, "users", user.uid, "creditTransactions"),
            orderBy("createdAt", "desc"),
            limit(50)
        );
        const unsub = onSnapshot(q, (snap) => {
            setTransactions(
                snap.docs.map(d => ({ id: d.id, ...d.data() } as CreditTransaction))
            );
        });
        return () => unsub();
    }, [user]);

    const creditsBalance = useMemo(
        () => userData?.creditsBalance ?? 0,
        [userData]
    );

    const filteredTransactions = useMemo(() => {
        if (dateFilter === "all") return transactions;
        const now = new Date();
        const cutoff = new Date();
        if (dateFilter === "7d") cutoff.setDate(now.getDate() - 7);
        else if (dateFilter === "30d") cutoff.setDate(now.getDate() - 30);
        else if (dateFilter === "month") cutoff.setDate(1), cutoff.setHours(0, 0, 0, 0);
        return transactions.filter(tx => {
            const d = tx.createdAt?.toDate();
            return d && d >= cutoff;
        });
    }, [transactions, dateFilter]);

    async function handleBuyCredits(productId: string) {
        try {
            setCheckoutLoadingId(productId);
            setCheckoutError(null);

            const { checkoutUrl } = await createCreditCheckout(productId);
            window.location.href = checkoutUrl;
        } catch (error: any) {
            setCheckoutError(error?.message ?? "Não foi possível iniciar a compra.");
        } finally {
            setCheckoutLoadingId(null);
        }
    }

    return (
                <div className="billing_page">
                    <section className="billing_hero">
                        <div className="billing_hero_copy">
                            <p className="billing_kicker">Billing</p>
                            <h1>Créditos e recarga</h1>
                            <p className="billing_lead">
                                Gerencie seu saldo e escolha a melhor forma de continuar gerando carrosséis e imagens
                                com IA.
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
                                <p className="billing_section_kicker">Créditos avulsos</p>
                                <h2>Compre só quando precisar</h2>
                            </div>
                        </div>

                        <div className="billing_topups_grid">
                            {topUps.map((item) => (
                                <article className="billing_topup_card" key={item.id}>
                                    <div>
                                        <p>{item.credits} créditos</p>
                                    </div>

                                    <div className="billing_topup_meta">
                                        <strong>{item.price}</strong>
                                    </div>

                                    <ActionButton
                                        onClick={() => handleBuyCredits(item.id)}
                                        disabled={checkoutLoadingId === item.id}
                                    >
                                        {checkoutLoadingId === item.id ? "Abrindo checkout..." : "Comprar créditos"}
                                    </ActionButton>
                                </article>
                            ))}
                        </div>

                        {checkoutError && <p className="errorText">{checkoutError}</p>}
                    </section>

                    {transactions.length > 0 && (
                        <section className="billing_section">
                            <div className="billing_section_head">
                                <div>
                                    <p className="billing_section_kicker">Histórico</p>
                                    <h2>Extrato de créditos</h2>
                                </div>
                                {/* Date filters */}
                                <div className="billing_date_filters">
                                    {(["7d", "30d", "month", "all"] as const).map((f) => (
                                        <button
                                            key={f}
                                            type="button"
                                            className={`billing_date_filter ${dateFilter === f ? "is-active" : ""}`}
                                            onClick={() => setDateFilter(f)}
                                        >
                                            {{ "7d": "7 dias", "30d": "30 dias", "month": "Este mês", "all": "Tudo" }[f]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Summary card */}
                            <div className="billing_summary">
                                <div className="billing_summary_stat">
                                    <strong>
                                        {filteredTransactions.filter(t => t.type === "debit").reduce((acc, t) => acc + Math.abs(t.amount), 0)}
                                    </strong>
                                    <span>créditos usados</span>
                                </div>
                                <div className="billing_summary_divider" />
                                <div className="billing_summary_stat">
                                    <strong>
                                        {filteredTransactions.filter(t => t.reason === "generate_carousel").length}
                                    </strong>
                                    <span>carrosseis gerados</span>
                                </div>
                                <div className="billing_summary_divider" />
                                <div className="billing_summary_stat">
                                    <strong>
                                        {filteredTransactions.filter(t => t.reason === "generate_image").length}
                                    </strong>
                                    <span>imagens geradas</span>
                                </div>
                            </div>

                            {/* Toggle */}
                            {filteredTransactions.length > 0 ? (
                                <>
                                    <button
                                        type="button"
                                        className="billing_history_toggle"
                                        onClick={() => setShowHistory(v => !v)}
                                    >
                                        {showHistory ? "Ocultar extrato" : "Ver extrato completo"}
                                        <span className={`billing_toggle_chevron ${showHistory ? "is-open" : ""}`}>›</span>
                                    </button>

                                    {/* Collapsible list */}
                                    {showHistory && (
                                        <div className="billing_history">
                                            {filteredTransactions.map((tx) => (
                                                <div key={tx.id} className="billing_history_row">
                                                    <div className={`billing_history_dot billing_history_dot_${tx.type}`} />
                                                    <div className="billing_history_info">
                                                        <span className="billing_history_reason">{reasonLabel(tx.reason)}</span>
                                                        <span className="billing_history_date">{formatDate(tx.createdAt)}</span>
                                                    </div>
                                                    <div className="billing_history_amount_col">
                                                        <span className={`billing_history_amount billing_history_amount_${tx.type}`}>
                                                            {tx.type === "purchase" ? "+" : ""}{tx.amount}
                                                        </span>
                                                        <span className="billing_history_balance">saldo: {tx.balanceAfter}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="billing_empty">Nenhum registro neste período.</p>
                            )}
                        </section>
                    )}

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
                                <h3>Preciso de assinatura para usar?</h3>
                                <p>Não. Você pode usar seus créditos atuais e comprar mais sempre que precisar.</p>
                            </article>
                            <article>
                                <h3>Quando o saldo é consumido?</h3>
                                <p>Quando você gera um carrossel novo ou gera uma imagem com IA.</p>
                            </article>
                        </div>
                    </section>
                </div>
    );
}
