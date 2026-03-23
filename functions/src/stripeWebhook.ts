import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import Stripe from "stripe";

import { grantCreditsForPurchase } from "./payments/credits";

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

if (!getApps().length) {
    initializeApp();
}

const db = getFirestore();

export const stripeWebhook = onRequest(
    {
        region: "southamerica-east1",
        invoker: "public",
        timeoutSeconds: 60,
        secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET],
    },
    async (req, res) => {
        if (req.method !== "POST") {
            res.status(405).json({ ok: false, error: "Use POST" });
            return;
        }

        const sig = req.headers["stripe-signature"];
        if (!sig) {
            logger.warn("stripeWebhook sem assinatura");
            res.status(400).json({ ok: false, error: "Missing stripe-signature header." });
            return;
        }

        const stripe = new Stripe(STRIPE_SECRET_KEY.value());

        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(
                req.rawBody,
                sig,
                STRIPE_WEBHOOK_SECRET.value()
            );
        } catch (error: any) {
            logger.warn("stripeWebhook assinatura inválida", { message: error?.message });
            res.status(400).json({ ok: false, error: "Invalid signature." });
            return;
        }

        try {
            if (event.type === "checkout.session.completed") {
                const session = event.data.object as Stripe.Checkout.Session;

                const purchaseId = session.metadata?.purchaseId;
                if (!purchaseId) {
                    logger.warn("stripeWebhook sem purchaseId na sessão", { sessionId: session.id });
                    res.status(200).json({ ok: true, ignored: true });
                    return;
                }

                const stripePaymentIntentId = typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : session.payment_intent?.id ?? session.id;

                const purchaseRef = db.collection("creditPurchases").doc(purchaseId);
                await purchaseRef.set(
                    {
                        provider: "stripe",
                        providerPaymentId: stripePaymentIntentId,
                        providerSessionId: session.id,
                        status: "paid",
                        updatedAt: FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                );

                await grantCreditsForPurchase({
                    purchaseId,
                    providerPaymentId: stripePaymentIntentId,
                    status: "paid",
                });

                logger.info("stripeWebhook créditos concedidos", { purchaseId });
            } else if (event.type === "checkout.session.expired") {
                const session = event.data.object as Stripe.Checkout.Session;
                const purchaseId = session.metadata?.purchaseId;

                if (purchaseId) {
                    await db.collection("creditPurchases").doc(purchaseId).set(
                        { status: "failed", updatedAt: FieldValue.serverTimestamp() },
                        { merge: true }
                    );
                }
            } else if (event.type === "charge.refunded") {
                const charge = event.data.object as Stripe.Charge;
                const paymentIntentId = typeof charge.payment_intent === "string"
                    ? charge.payment_intent
                    : charge.payment_intent?.id;

                if (paymentIntentId) {
                    const snap = await db.collection("creditPurchases")
                        .where("providerPaymentId", "==", paymentIntentId)
                        .limit(1)
                        .get();

                    if (!snap.empty) {
                        await snap.docs[0].ref.set(
                            { status: "refunded", updatedAt: FieldValue.serverTimestamp() },
                            { merge: true }
                        );
                    }
                }
            }

            res.status(200).json({ ok: true });
        } catch (error: any) {
            logger.error("stripeWebhook falhou", {
                message: error?.message ?? null,
                stack: error?.stack ?? null,
            });
            res.status(500).json({ ok: false, error: "Webhook failed." });
        }
    }
);
