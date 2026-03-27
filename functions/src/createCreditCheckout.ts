import { onRequest } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import cors from "cors";
import { z } from "zod";
import Stripe from "stripe";

import { getCreditProduct } from "./payments/catalog";

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const APP_BASE_URL = defineString("APP_BASE_URL", { default: "" });
const corsHandler = cors({ origin: true });

if (!getApps().length) {
    initializeApp();
}

const db = getFirestore();

const payloadSchema = z.object({
    productId: z.string().trim().min(1),
});

type RequestLike = {
    headers: Record<string, unknown>;
    get(name: string): string | undefined;
};

function resolveAppBaseUrl(req: RequestLike): string {
    const configuredBaseUrl = APP_BASE_URL.value().trim();
    if (configuredBaseUrl) {
        return configuredBaseUrl.replace(/\/+$/, "");
    }

    const originHeader = req.headers.origin;
    const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
    if (typeof origin === "string" && origin) {
        return origin.replace(/\/+$/, "");
    }

    return "http://127.0.0.1:5002";
}

export const createCreditCheckout = onRequest(
    {
        region: "southamerica-east1",
        invoker: "public",
        timeoutSeconds: 60,
        secrets: [STRIPE_SECRET_KEY],
    },
    (req, res) =>
        corsHandler(req, res, async () => {
            if (req.method === "OPTIONS") {
                res.status(204).send("");
                return;
            }

            if (req.method !== "POST") {
                res.status(405).json({ ok: false, error: "Use POST" });
                return;
            }

            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                res.status(401).json({ ok: false, error: "Usuário não autenticado." });
                return;
            }

            let uid: string;
            let email = "";
            try {
                const decoded = await getAuth().verifyIdToken(authHeader.slice("Bearer ".length).trim());
                uid = decoded.uid;
                email = decoded.email ?? "";
            } catch (error) {
                logger.warn("createCreditCheckout token inválido", { error });
                res.status(401).json({ ok: false, error: "Usuário não autenticado." });
                return;
            }

            const parsed = payloadSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ ok: false, error: "Payload inválido." });
                return;
            }

            const product = getCreditProduct(parsed.data.productId);
            if (!product) {
                res.status(400).json({ ok: false, error: "Pacote de créditos inválido." });
                return;
            }

            const purchaseRef = db.collection("creditPurchases").doc();
            const appBaseUrl = resolveAppBaseUrl(req);

            try {
                await purchaseRef.set({
                    uid,
                    productId: product.id,
                    provider: "stripe",
                    status: "pending",
                    credits: product.credits,
                    amountCents: product.amountCents,
                    currency: "BRL",
                    creditGranted: false,
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });

                const stripe = new Stripe(STRIPE_SECRET_KEY.value());

                const session = await stripe.checkout.sessions.create({
                    mode: "payment",
                    currency: "brl",
                    payment_method_types: ["card"],
                    customer_email: email || undefined,
                    line_items: [
                        {
                            quantity: 1,
                            price_data: {
                                currency: "brl",
                                unit_amount: product.amountCents,
                                product_data: {
                                    name: `Carrou — ${product.name}`,
                                },
                            },
                        },
                    ],
                    metadata: {
                        purchaseId: purchaseRef.id,
                        uid,
                        productId: product.id,
                        credits: String(product.credits),
                    },
                    success_url: `${appBaseUrl}/billing?payment=success&purchaseId=${purchaseRef.id}`,
                    cancel_url: `${appBaseUrl}/billing?payment=cancelled&purchaseId=${purchaseRef.id}`,
                });

                if (!session.url) {
                    throw new Error("Stripe não retornou URL de checkout.");
                }

                await purchaseRef.update({
                    providerSessionId: session.id,
                    providerCheckoutUrl: session.url,
                    updatedAt: FieldValue.serverTimestamp(),
                });

                res.status(200).json({
                    ok: true,
                    purchaseId: purchaseRef.id,
                    checkoutUrl: session.url,
                });
            } catch (error: any) {
                logger.error("createCreditCheckout falhou", {
                    message: error?.message ?? null,
                    stack: error?.stack ?? null,
                });

                await purchaseRef.set(
                    {
                        status: "failed",
                        failureReason: error?.message ?? "create_checkout_failed",
                        updatedAt: FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                );

                res.status(500).json({
                    ok: false,
                    error: "Não foi possível iniciar o checkout agora.",
                });
            }
        })
);
