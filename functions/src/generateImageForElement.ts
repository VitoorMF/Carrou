import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import cors from "cors";
import { defineSecret } from "firebase-functions/params";
import { randomUUID } from "crypto";
import { assertHasCredits, debitCredits } from "./payments/credits";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const bucket = admin.storage().bucket();
const corsHandler = cors({ origin: true });

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
const STREETWEAR_SHARED_PROMPT_HINT = "consistent framing for carousel diptych";

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

                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return res.status(401).json({ ok: false, error: "Usuário não autenticado." });
                }

                const idToken = authHeader.slice("Bearer ".length).trim();
                let uid = "";
                try {
                    const decoded = await admin.auth().verifyIdToken(idToken);
                    uid = decoded.uid;
                } catch (error) {
                    logger.warn("generateImageForElement token inválido", { error });
                    return res.status(401).json({ ok: false, error: "Usuário não autenticado." });
                }

                const { projectId, slideId, elementId } = req.body ?? {};
                if (!projectId || !slideId || !elementId) {
                    return res.status(400).json({ ok: false, error: "Missing projectId/slideId/elementId" });
                }

                const ref = db.collection("projects").doc(projectId);
                const snap = await ref.get();
                if (!snap.exists) return res.status(404).json({ ok: false, error: "Project not found" });

                const project = snap.data() as any;
                if (project?.ownerId !== uid) {
                    return res.status(403).json({ ok: false, error: "Você não tem acesso a este projeto." });
                }

                const isTrialProject = project?.isTrial === true;

                const renderCarousel = project?.renderCarousel ?? null;
                const slides = Array.isArray(renderCarousel?.slides)
                    ? renderCarousel.slides
                    : (project.slides ?? []);

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

                function getProjectTemplateId(projectData: any) {
                    return String(
                        projectData?.ai?.templateId
                        ?? projectData?.renderCarousel?.meta?.style
                        ?? projectData?.meta?.style
                        ?? ""
                    ).trim();
                }

                function findStreetwearSharedPair(slidesList: any[], slideIndex: number, element: any) {
                    const templateId = getProjectTemplateId(project);
                    const prompt = String(element?.prompt ?? "").trim().toLowerCase();
                    const isSharedStreetwearHero = templateId === "streetwearPro"
                        && slideIndex >= 0
                        && slideIndex <= 3
                        && (element?.type === "image" || element?.type === "backgroundImage")
                        && prompt.includes(STREETWEAR_SHARED_PROMPT_HINT);

                    if (!isSharedStreetwearHero) {
                        return null;
                    }

                    const pairSlideIndex = slideIndex % 2 === 0 ? slideIndex + 1 : slideIndex - 1;
                    const pairSlide = slidesList[pairSlideIndex];

                    if (!pairSlide) {
                        return null;
                    }

                    const pairRef = findElementRef(pairSlide, String(element.id).replace(`_${slideIndex}`, `_${pairSlideIndex}`));
                    if (pairRef) {
                        const pairEl = pairRef.elements[pairRef.eIndex];
                        if (
                            (pairEl?.type === "image" || pairEl?.type === "backgroundImage")
                            && String(pairEl?.prompt ?? "").trim().toLowerCase().includes(STREETWEAR_SHARED_PROMPT_HINT)
                        ) {
                            return { pairSlideIndex, pairRef, pairEl };
                        }
                    }

                    const pairCandidates = [
                        ...(Array.isArray(pairSlide?.canvas?.elements) ? pairSlide.canvas.elements : []),
                        ...(Array.isArray(pairSlide?.layers?.background) ? pairSlide.layers.background : []),
                        ...(Array.isArray(pairSlide?.layers?.atmosphere) ? pairSlide.layers.atmosphere : []),
                        ...(Array.isArray(pairSlide?.layers?.content) ? pairSlide.layers.content : []),
                        ...(Array.isArray(pairSlide?.layers?.ui) ? pairSlide.layers.ui : []),
                    ];

                    const fallbackPairEl = pairCandidates.find((candidate: any) =>
                        (candidate?.type === "image" || candidate?.type === "backgroundImage")
                        && String(candidate?.prompt ?? "").trim().toLowerCase().includes(STREETWEAR_SHARED_PROMPT_HINT)
                    );

                    if (!fallbackPairEl?.id) {
                        return null;
                    }

                    const fallbackPairRef = findElementRef(pairSlide, fallbackPairEl.id);
                    if (!fallbackPairRef) {
                        return null;
                    }

                    return { pairSlideIndex, pairRef: fallbackPairRef, pairEl: fallbackPairEl };
                }

                const slide = slides[sIndex];
                const elRef = findElementRef(slide, elementId);
                if (!elRef) return res.status(404).json({ ok: false, error: "Element not found" });

                const el = elRef.elements[elRef.eIndex];
                if (el.type !== "image" && el.type !== "backgroundImage") {
                    return res.status(400).json({ ok: false, error: "Element is not image/backgroundImage" });
                }

                const sharedPair = findStreetwearSharedPair(slides, sIndex, el);

                if (sharedPair?.pairEl?.url || sharedPair?.pairEl?.src) {
                    const sharedSrc = String(sharedPair.pairEl.url ?? sharedPair.pairEl.src ?? "");

                    writeElement(slide, elRef, {
                        ...el,
                        url: sharedSrc,
                        src: sharedSrc,
                        status: "ready",
                    });

                    await ref.update({
                        ...(renderCarousel ? { renderCarousel: { ...renderCarousel, slides } } : {}),
                        slides,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });

                    return res.json({ ok: true, src: sharedSrc, cached: true, shared: true });
                }

                const path = `projects/${projectId}/slides/${slideId}/${elementId}.png`;
                const file = bucket.file(path);
                const imageDebitTransactionId = `generate_image_${projectId}_${slideId}_${elementId}`;

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

                        if (sharedPair) {
                            writeElement(slides[sharedPair.pairSlideIndex], sharedPair.pairRef, {
                                ...sharedPair.pairEl,
                                url: stableSrc,
                                src: stableSrc,
                                status: "ready",
                            });
                        }

                        const nextRenderCarousel = renderCarousel
                            ? { ...renderCarousel, slides }
                            : null;

                        await ref.update({
                            ...(nextRenderCarousel ? { renderCarousel: nextRenderCarousel } : {}),
                            // Compat legado
                            slides,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                    }

                    return res.json({ ok: true, src: stableSrc, cached: true });
                }

                if (!el.prompt) {
                    return res.status(400).json({ ok: false, error: "Missing prompt" });
                }

                if (!isTrialProject) {
                    await assertHasCredits(uid, 1);
                }

                // marca pending
                writeElement(slide, elRef, { ...el, status: "pending" });

                if (sharedPair) {
                    writeElement(slides[sharedPair.pairSlideIndex], sharedPair.pairRef, {
                        ...sharedPair.pairEl,
                        status: "pending",
                    });
                }

                await ref.update({
                    ...(renderCarousel ? { renderCarousel: { ...renderCarousel, slides } } : {}),
                    // Compat legado
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

                if (!isTrialProject) {
                    await debitCredits({
                        uid,
                        amount: 1,
                        reason: "generate_image",
                        transactionId: imageDebitTransactionId,
                        projectId,
                        slideId,
                        elementId,
                    });
                }


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

                if (sharedPair) {
                    const refreshedPairRef = findElementRef(slides[sharedPair.pairSlideIndex], sharedPair.pairEl.id);
                    const currentPairEl = refreshedPairRef
                        ? refreshedPairRef.elements[refreshedPairRef.eIndex]
                        : sharedPair.pairEl;

                    if (refreshedPairRef) {
                        writeElement(slides[sharedPair.pairSlideIndex], refreshedPairRef, {
                            ...currentPairEl,
                            url: src,
                            src,
                            status: "ready",
                        });
                    }
                }

                await ref.update({
                    ...(renderCarousel ? { renderCarousel: { ...renderCarousel, slides } } : {}),
                    // Compat legado
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
