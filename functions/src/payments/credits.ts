import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";

if (!getApps().length) {
    initializeApp();
}

const db = getFirestore();

type GrantCreditsForPurchaseInput = {
    purchaseId: string;
    providerPaymentId: string;
    status: string;
};

type DebitCreditsInput = {
    uid: string;
    amount: number;
    reason: "generate_carousel" | "generate_image";
    transactionId?: string;
    projectId?: string | null;
    slideId?: string | null;
    elementId?: string | null;
};

export async function assertHasCredits(uid: string, minimum = 1): Promise<number> {
    const userSnap = await db.collection("users").doc(uid).get();
    const balance = (userSnap.data() as { creditsBalance?: number } | undefined)?.creditsBalance ?? 0;

    if (balance < minimum) {
        throw new Error("Créditos insuficientes.");
    }

    return balance;
}

export async function grantCreditsForPurchase({
    purchaseId,
    providerPaymentId,
    status,
}: GrantCreditsForPurchaseInput): Promise<{
    ok: boolean;
    alreadyGranted: boolean;
}> {
    const purchaseRef = db.collection("creditPurchases").doc(purchaseId);

    return db.runTransaction(async (tx) => {
        const purchaseSnap = await tx.get(purchaseRef);
        if (!purchaseSnap.exists) {
            throw new Error("Purchase not found.");
        }

        const purchase = purchaseSnap.data() as {
            uid?: string;
            credits?: number;
            amountCents?: number;
            productId?: string;
            creditGranted?: boolean;
            status?: string;
        };

        if (!purchase.uid) {
            throw new Error("Purchase is missing uid.");
        }

        if (!purchase.credits || purchase.credits <= 0) {
            throw new Error("Purchase has invalid credits.");
        }

        if (purchase.creditGranted) {
            tx.update(purchaseRef, {
                status,
                providerPaymentId,
                updatedAt: FieldValue.serverTimestamp(),
            });

            return { ok: true, alreadyGranted: true };
        }

        const userRef = db.collection("users").doc(purchase.uid);
        const userSnap = await tx.get(userRef);
        const userData = userSnap.data() as { creditsBalance?: number } | undefined;
        const nextBalance = (userData?.creditsBalance ?? 0) + purchase.credits;

        tx.set(
            userRef,
            {
                creditsBalance: nextBalance,
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        const transactionRef = userRef.collection("creditTransactions").doc();
        tx.set(transactionRef, {
            type: "purchase",
            amount: purchase.credits,
            reason: "topup_purchase",
            balanceAfter: nextBalance,
            purchaseId,
            productId: purchase.productId ?? null,
            providerPaymentId,
            amountCents: purchase.amountCents ?? null,
            createdAt: FieldValue.serverTimestamp(),
            createdAtClient: Timestamp.now(),
        });

        tx.update(purchaseRef, {
            status,
            providerPaymentId,
            creditGranted: true,
            processedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return { ok: true, alreadyGranted: false };
    });
}

export async function debitCredits({
    uid,
    amount,
    reason,
    transactionId,
    projectId = null,
    slideId = null,
    elementId = null,
}: DebitCreditsInput): Promise<{
    ok: boolean;
    alreadyProcessed: boolean;
    balanceAfter: number;
}> {
    if (amount <= 0) {
        throw new Error("Debit amount must be positive.");
    }

    const userRef = db.collection("users").doc(uid);
    const txRef = transactionId
        ? userRef.collection("creditTransactions").doc(transactionId)
        : userRef.collection("creditTransactions").doc();

    return db.runTransaction(async (tx) => {
        const [userSnap, existingTxSnap] = await Promise.all([
            tx.get(userRef),
            tx.get(txRef),
        ]);

        if (existingTxSnap.exists) {
            const existing = existingTxSnap.data() as { balanceAfter?: number } | undefined;
            return {
                ok: true,
                alreadyProcessed: true,
                balanceAfter: existing?.balanceAfter ?? (userSnap.data()?.creditsBalance ?? 0),
            };
        }

        const currentBalance = (userSnap.data() as { creditsBalance?: number } | undefined)?.creditsBalance ?? 0;
        if (currentBalance < amount) {
            throw new Error("Créditos insuficientes.");
        }

        const nextBalance = currentBalance - amount;

        tx.set(
            userRef,
            {
                creditsBalance: nextBalance,
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        tx.set(txRef, {
            type: "debit",
            amount: -amount,
            reason,
            balanceAfter: nextBalance,
            projectId,
            slideId,
            elementId,
            createdAt: FieldValue.serverTimestamp(),
            createdAtClient: Timestamp.now(),
        });

        return {
            ok: true,
            alreadyProcessed: false,
            balanceAfter: nextBalance,
        };
    });
}
