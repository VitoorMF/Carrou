import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import cors from "cors";
import { defineSecret } from "firebase-functions/params";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const bucket = admin.storage().bucket();
const corsHandler = cors({ origin: true });

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

export const generateImageForElement = onRequest(
    { secrets: [OPENAI_API_KEY] },
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

                const elements = slides[sIndex]?.canvas?.elements ?? [];
                const eIndex = elements.findIndex((e: any) => e.id === elementId);
                if (eIndex < 0) return res.status(404).json({ ok: false, error: "Element not found" });

                const el = elements[eIndex];
                if (el.type !== "image") return res.status(400).json({ ok: false, error: "Element is not image" });

                // idempotente
                if (el.src) {
                    return res.json({ ok: true, src: el.src, cached: true });
                }

                if (!el.prompt) {
                    return res.status(400).json({ ok: false, error: "Missing prompt" });
                }

                // marca pending
                elements[eIndex] = { ...el, status: "pending" };
                slides[sIndex].canvas = slides[sIndex].canvas ?? {};
                slides[sIndex].canvas.elements = elements;

                await ref.update({
                    slides,
                    updatedAt: new Date(),
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

                const path = `projects/${projectId}/slides/${slideId}/${elementId}.png`;
                const file = bucket.file(path);

                await file.save(buffer, {
                    resumable: false,
                    contentType: "image/png",
                    metadata: { cacheControl: "public, max-age=31536000" },
                });

                // Try to return a publicly accessible URL. Prefer signed URL, fallback to making file public,
                // finally fallback to the storage REST URL (may be blocked by rules).
                let src = "";

                try {
                    const [signedUrl] = await file.getSignedUrl({ action: "read", expires: "03-01-2505" });
                    src = signedUrl;
                } catch (e) {
                    try {
                        await file.makePublic();
                        src = `https://storage.googleapis.com/${bucket.name}/${path}`;
                    } catch (e2) {
                        const bucketName = bucket.name;
                        const encodedPath = encodeURIComponent(path);
                        src = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
                    }
                }


                // status ready + src
                elements[eIndex] = { ...elements[eIndex], src, status: "ready" };
                slides[sIndex].canvas.elements = elements;

                await ref.update({
                    slides,
                    updatedAt: new Date(),
                });

                return res.json({ ok: true, src });
            } catch (err: any) {
                logger.error("generateImageForElement error", err);
                return res.status(500).json({ ok: false, error: err?.message ?? "Unknown error" });
            }
        });
    }
);
