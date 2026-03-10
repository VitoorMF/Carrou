import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import cors from "cors";
import { defineSecret } from "firebase-functions/params";
import { randomUUID } from "crypto";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const bucket = admin.storage().bucket();
const corsHandler = cors({ origin: true });

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

export const generateImageForElement = onRequest(
    { secrets: [OPENAI_API_KEY], invoker: "public" },
    (req, res) => {
        return corsHandler(req, res, async () => {
            try {
                if (req.method === "OPTIONS") {
                    return res.status(204).send("");
                }

                if (req.method !== "POST") {
                    return res.status(405).json({ ok: false, error: "Use POST" });
                }

                const { projectId, slideId, elementId } = req.body ?? {};
                if (!projectId || !slideId || !elementId) {
                    return res.status(400).json({ ok: false, error: "Missing projectId/slideId/elementId" });
                }

                const ref = db.collection("projects").doc(projectId);
                const snap = await ref.get();
                if (!snap.exists) return res.status(404).json({ ok: false, error: "Project not found" });

                const project = snap.data() as any;
                const slides = project.slides ?? [];

                const sIndex = slides.findIndex((s: any) => s.id === slideId);
                if (sIndex < 0) return res.status(404).json({ ok: false, error: "Slide not found" });

                type ElementRef =
                    | { mode: "canvas"; elements: any[]; eIndex: number }
                    | { mode: "layer"; layerName: "background" | "atmosphere" | "content" | "ui"; elements: any[]; eIndex: number };

                function findElementRef(slide: any, targetId: string): ElementRef | null {
                    const canvasElements = slide?.canvas?.elements;
                    if (Array.isArray(canvasElements)) {
                        const eIndex = canvasElements.findIndex((e: any) => e?.id === targetId);
                        if (eIndex >= 0) {
                            return { mode: "canvas", elements: canvasElements, eIndex };
                        }
                    }

                    const layers = slide?.layers ?? {};
                    const layerNames: Array<"background" | "atmosphere" | "content" | "ui"> = [
                        "background",
                        "atmosphere",
                        "content",
                        "ui",
                    ];

                    for (const layerName of layerNames) {
                        const layerEls = layers?.[layerName];
                        if (!Array.isArray(layerEls)) continue;
                        const eIndex = layerEls.findIndex((e: any) => e?.id === targetId);
                        if (eIndex >= 0) {
                            return { mode: "layer", layerName, elements: layerEls, eIndex };
                        }
                    }

                    return null;
                }

                function writeElement(slide: any, refData: ElementRef, nextEl: any) {
                    if (refData.mode === "canvas") {
                        const nextElements = [...refData.elements];
                        nextElements[refData.eIndex] = nextEl;
                        slide.canvas = slide.canvas ?? {};
                        slide.canvas.elements = nextElements;
                        return;
                    }

                    const nextElements = [...refData.elements];
                    nextElements[refData.eIndex] = nextEl;

                    slide.layers = slide.layers ?? {};
                    slide.layers[refData.layerName] = nextElements;
                }

                const slide = slides[sIndex];
                const elRef = findElementRef(slide, elementId);
                if (!elRef) return res.status(404).json({ ok: false, error: "Element not found" });

                const el = elRef.elements[elRef.eIndex];
                if (el.type !== "image" && el.type !== "backgroundImage") {
                    return res.status(400).json({ ok: false, error: "Element is not image/backgroundImage" });
                }

                const path = `projects/${projectId}/slides/${slideId}/${elementId}.png`;
                const file = bucket.file(path);

                // idempotente
                if (el.url || el.src) {
                    const [exists] = await file.exists();
                    const currentSrc = String(el.url ?? el.src ?? "");

                    if (!exists) {
                        return res.json({ ok: true, src: currentSrc, cached: true });
                    }

                    const [meta] = await file.getMetadata();
                    const rawTokens = meta?.metadata?.firebaseStorageDownloadTokens as string | undefined;
                    const token = rawTokens?.split(",")[0]?.trim() || randomUUID();

                    if (!rawTokens) {
                        await file.setMetadata({
                            cacheControl: meta.cacheControl ?? "public, max-age=31536000",
                            metadata: {
                                ...(meta.metadata ?? {}),
                                firebaseStorageDownloadTokens: token,
                            },
                        });
                    }

                    const encodedPath = encodeURIComponent(path);
                    const stableSrc = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;

                    if (currentSrc !== stableSrc) {
                        writeElement(slide, elRef, {
                            ...el,
                            url: stableSrc,
                            src: stableSrc,
                            status: "ready",
                        });

                        await ref.update({
                            slides,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                    }

                    return res.json({ ok: true, src: stableSrc, cached: true });
                }

                if (!el.prompt) {
                    return res.status(400).json({ ok: false, error: "Missing prompt" });
                }

                // marca pending
                writeElement(slide, elRef, { ...el, status: "pending" });

                await ref.update({
                    slides,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // ✅ cria client com secret AQUI DENTRO
                const client = new OpenAI({ apiKey: OPENAI_API_KEY.value() });

                const result = await client.images.generate({
                    model: "gpt-image-1",
                    prompt: el.prompt,
                    size: "1024x1024",
                    output_format: "png",
                });

                const b64 = result.data?.[0]?.b64_json;
                if (!b64) throw new Error("No image b64_json returned");

                const buffer = Buffer.from(b64, "base64");

                const downloadToken = randomUUID();

                await file.save(buffer, {
                    resumable: false,
                    contentType: "image/png",
                    metadata: {
                        cacheControl: "public, max-age=31536000",
                        metadata: {
                            firebaseStorageDownloadTokens: downloadToken,
                        },
                    },
                });

                // Firebase download URL com token funciona mesmo com Storage Rules fechadas.
                const bucketName = bucket.name;
                const encodedPath = encodeURIComponent(path);
                const src = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${downloadToken}`;


                // status ready + src
                const refreshedRef = findElementRef(slides[sIndex], elementId);
                const currentEl = refreshedRef
                    ? refreshedRef.elements[refreshedRef.eIndex]
                    : el;

                if (refreshedRef) {
                    writeElement(slides[sIndex], refreshedRef, {
                        ...currentEl,
                        url: src,
                        src,
                        status: "ready",
                    });
                }

                await ref.update({
                    slides,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                return res.json({ ok: true, src });
            } catch (err: any) {
                logger.error("generateImageForElement error", err);
                return res.status(500).json({ ok: false, error: err?.message ?? "Unknown error" });
            }
        });
    }
);
