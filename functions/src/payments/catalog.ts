export type CreditProduct = {
    id: "credits_14" | "credits_35" | "credits_100";
    name: string;
    amountCents: number;
    credits: number;
    active: boolean;
};

const CREDIT_PRODUCTS: Record<CreditProduct["id"], CreditProduct> = {
    credits_14: {
        id: "credits_14",
        name: "14 creditos",
        amountCents: 1700,
        credits: 14,
        active: true,
    },
    credits_35: {
        id: "credits_35",
        name: "35 creditos",
        amountCents: 3900,
        credits: 35,
        active: true,
    },
    credits_100: {
        id: "credits_100",
        name: "100 creditos",
        amountCents: 9900,
        credits: 100,
        active: true,
    },
};

export function getCreditProduct(productId: string): CreditProduct | null {
    if (!(productId in CREDIT_PRODUCTS)) {
        return null;
    }

    const product = CREDIT_PRODUCTS[productId as CreditProduct["id"]];
    return product.active ? product : null;
}

export function listCreditProducts(): CreditProduct[] {
    return Object.values(CREDIT_PRODUCTS).filter((product) => product.active);
}
