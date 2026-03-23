import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import cors from "cors";
import JSZip from "jszip";
import sharp from "sharp";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const corsHandler = cors({ origin: true });

const DOC_W = 1080;
const DOC_H = 1350;

type AnyRecord = Record<string, any>;

const ARROW_PATHS = [
    "M 166.929688 33.597656 L 135.652344 2.300781 L 127.308594 10.660156 L 158.585938 41.960938 L 127.308594 73.257812 L 135.675781 81.621094 L 166.929688 50.320312 C 167.476562 49.773438 167.96875 49.175781 168.398438 48.527344 C 168.832031 47.882812 169.195312 47.203125 169.492188 46.484375 C 169.789062 45.769531 170.011719 45.027344 170.164062 44.265625 C 170.316406 43.503906 170.390625 42.734375 170.390625 41.960938 C 170.390625 41.183594 170.316406 40.414062 170.164062 39.652344 C 170.011719 38.890625 169.789062 38.152344 169.492188 37.433594 C 169.195312 36.71875 168.832031 36.035156 168.398438 35.390625 C 167.96875 34.746094 167.476562 34.148438 166.929688 33.597656 Z",
    "M 129.738281 37.777344 L 94.261719 2.300781 L 85.917969 10.660156 L 117.191406 41.960938 L 85.917969 73.257812 L 94.285156 81.621094 L 129.761719 46.140625 C 130.039062 45.867188 130.28125 45.566406 130.496094 45.242188 C 130.710938 44.917969 130.890625 44.578125 131.039062 44.21875 C 131.1875 43.859375 131.296875 43.488281 131.371094 43.109375 C 131.449219 42.726562 131.484375 42.34375 131.484375 41.953125 C 131.480469 41.566406 131.441406 41.183594 131.367188 40.800781 C 131.289062 40.421875 131.175781 40.050781 131.027344 39.695312 C 130.878906 39.335938 130.695312 38.996094 130.476562 38.671875 C 130.261719 38.351562 130.015625 38.054688 129.738281 37.777344 Z",
    "M 252.105469 33.597656 L 220.832031 2.300781 L 212.488281 10.660156 L 243.761719 41.960938 L 212.488281 73.257812 L 220.855469 81.621094 L 252.105469 50.320312 C 252.65625 49.773438 253.144531 49.175781 253.578125 48.527344 C 254.007812 47.882812 254.375 47.203125 254.671875 46.484375 C 254.96875 45.769531 255.191406 45.027344 255.34375 44.265625 C 255.496094 43.503906 255.570312 42.734375 255.570312 41.960938 C 255.570312 41.183594 255.496094 40.414062 255.34375 39.652344 C 255.191406 38.890625 254.96875 38.152344 254.671875 37.433594 C 254.375 36.71875 254.007812 36.035156 253.578125 35.390625 C 253.144531 34.746094 252.65625 34.148438 252.105469 33.597656 Z",
    "M 214.917969 37.777344 L 179.4375 2.300781 L 171.09375 10.660156 L 202.371094 41.960938 L 171.09375 73.257812 L 179.460938 81.621094 L 214.941406 46.140625 C 215.214844 45.867188 215.460938 45.566406 215.675781 45.242188 C 215.890625 44.917969 216.070312 44.578125 216.21875 44.21875 C 216.367188 43.859375 216.476562 43.488281 216.550781 43.109375 C 216.625 42.726562 216.664062 42.34375 216.660156 41.953125 C 216.660156 41.566406 216.621094 41.183594 216.542969 40.800781 C 216.46875 40.421875 216.355469 40.050781 216.207031 39.695312 C 216.054688 39.335938 215.871094 38.996094 215.65625 38.671875 C 215.441406 38.351562 215.195312 38.054688 214.917969 37.777344 Z",
    "M 84.113281 33.597656 L 52.839844 2.300781 L 44.496094 10.660156 L 75.769531 41.960938 L 44.496094 73.257812 L 52.863281 81.621094 L 84.113281 50.320312 C 84.664062 49.773438 85.152344 49.175781 85.585938 48.527344 C 86.015625 47.882812 86.378906 47.203125 86.675781 46.484375 C 86.976562 45.769531 87.199219 45.027344 87.351562 44.265625 C 87.5 43.503906 87.578125 42.734375 87.578125 41.960938 C 87.578125 41.183594 87.5 40.414062 87.351562 39.652344 C 87.199219 38.890625 86.976562 38.152344 86.675781 37.433594 C 86.378906 36.71875 86.015625 36.035156 85.585938 35.390625 C 85.152344 34.746094 84.664062 34.148438 84.113281 33.597656 Z",
    "M 46.925781 37.777344 L 11.445312 2.300781 L 3.101562 10.660156 L 34.378906 41.960938 L 3.101562 73.257812 L 11.46875 81.621094 L 46.949219 46.140625 C 47.222656 45.867188 47.46875 45.566406 47.683594 45.242188 C 47.898438 44.917969 48.078125 44.578125 48.226562 44.21875 C 48.375 43.859375 48.484375 43.488281 48.558594 43.109375 C 48.632812 42.726562 48.671875 42.34375 48.667969 41.953125 C 48.667969 41.566406 48.628906 41.183594 48.550781 40.800781 C 48.476562 40.421875 48.363281 40.050781 48.210938 39.695312 C 48.0625 39.335938 47.878906 38.996094 47.664062 38.671875 C 47.445312 38.351562 47.203125 38.054688 46.925781 37.777344 Z",
];

export const exportCarouselZip = onRequest(
    {
        region: "southamerica-east1",
        invoker: "public",
        timeoutSeconds: 300,
        memory: "1GiB",
    },
    (req, res) =>
        corsHandler(req, res, async () => {
            try {
                if (req.method === "OPTIONS") {
                    res.status(204).send("");
                    return;
                }

                if (req.method !== "POST") {
                    res.status(405).json({ ok: false, error: "Use POST" });
                    return;
                }

                const projectId = String(req.body?.projectId ?? "").trim();
                const slideIndex = req.body?.slideIndex;
                if (!projectId) {
                    res.status(400).json({ ok: false, error: "Missing projectId" });
                    return;
                }

                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    res.status(401).json({ ok: false, error: "Usuário não autenticado." });
                    return;
                }

                const idToken = authHeader.slice("Bearer ".length).trim();
                const decoded = await admin.auth().verifyIdToken(idToken);
                const uid = decoded.uid;

                const ref = db.collection("projects").doc(projectId);
                const snap = await ref.get();
                if (!snap.exists) {
                    res.status(404).json({ ok: false, error: "Projeto não encontrado." });
                    return;
                }

                const project = snap.data() as AnyRecord;
                if (project?.ownerId && project.ownerId !== uid) {
                    res.status(403).json({ ok: false, error: "Sem permissão para exportar esse projeto." });
                    return;
                }

                const renderCarousel = applyProfileCardIdentityServer(
                    project?.renderCarousel,
                    await getUserProfile(uid)
                );
                if (!renderCarousel?.slides || !Array.isArray(renderCarousel.slides)) {
                    res.status(400).json({ ok: false, error: "Projeto sem renderCarousel válido." });
                    return;
                }

                const assetCache = new Map<string, string>();
                const baseName = slugifyFileName(String(renderCarousel?.meta?.title ?? project?.meta?.title ?? "carrossel")) || "carrossel";

                if (typeof slideIndex === "number" && Number.isInteger(slideIndex)) {
                    const slide = renderCarousel.slides[slideIndex];
                    if (!slide) {
                        res.status(404).json({ ok: false, error: "Slide não encontrado." });
                        return;
                    }

                    const png = await renderSlideToPng(slide, assetCache);
                    res.setHeader("Content-Type", "image/png");
                    res.setHeader("Content-Disposition", `attachment; filename="${baseName}-slide-${String(slideIndex + 1).padStart(2, "0")}.png"`);
                    res.status(200).send(png);
                    return;
                }

                const zip = new JSZip();
                for (let index = 0; index < renderCarousel.slides.length; index += 1) {
                    const slide = renderCarousel.slides[index];
                    const png = await renderSlideToPng(slide, assetCache);
                    zip.file(`slide-${String(index + 1).padStart(2, "0")}.png`, png);
                }
                zip.file("caption.txt", String(renderCarousel?.meta?.title ?? project?.meta?.title ?? "Carrossel"));

                const buffer = await zip.generateAsync({ type: "nodebuffer" });
                const fileName = `${baseName}.zip`;

                res.setHeader("Content-Type", "application/zip");
                res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
                res.status(200).send(buffer);
            } catch (error: any) {
                logger.error("Erro ao exportar ZIP", {
                    message: error?.message ?? null,
                    stack: error?.stack ?? null,
                });
                res.status(500).json({ ok: false, error: "Não foi possível exportar o carrossel." });
            }
        })
);

async function renderSlideToPng(slide: AnyRecord, assetCache: Map<string, string>) {
    const elements = flattenSlideElements(slide);
    const svg = await renderSlideSvg(elements, assetCache);
    return sharp(Buffer.from(svg)).png().toBuffer();
}

function flattenSlideElements(slide: AnyRecord) {
    if (slide?.layers) {
        return [
            ...(Array.isArray(slide.layers.background) ? slide.layers.background : []),
            ...(Array.isArray(slide.layers.atmosphere) ? slide.layers.atmosphere : []),
            ...(Array.isArray(slide.layers.content) ? slide.layers.content : []),
            ...(Array.isArray(slide.layers.ui) ? slide.layers.ui : []),
        ];
    }

    return Array.isArray(slide?.elements) ? slide.elements : [];
}

async function renderSlideSvg(elements: AnyRecord[], assetCache: Map<string, string>) {
    const defs: string[] = [];
    const body: string[] = [];

    for (let index = 0; index < elements.length; index += 1) {
        const rendered = await renderElement(elements[index], index, defs, assetCache);
        if (rendered) body.push(rendered);
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${DOC_W}" height="${DOC_H}" viewBox="0 0 ${DOC_W} ${DOC_H}">
  <defs>${defs.join("")}</defs>
  ${body.join("")}
</svg>`;
}

async function renderElement(el: AnyRecord, index: number, defs: string[], assetCache: Map<string, string>) {
    switch (el?.type) {
        case "background":
            return `<rect x="${num(el.x)}" y="${num(el.y)}" width="${num(el.width ?? el.w ?? DOC_W)}" height="${num(el.height ?? el.h ?? DOC_H)}" fill="${escapeAttr(el.fill ?? "#FFFFFF")}" opacity="${num(el.opacity ?? 1)}" />`;
        case "text":
            return renderText(el);
        case "path":
            return `<path d="${escapeAttr(el.data ?? "")}" transform="translate(${num(el.x)}, ${num(el.y)})" fill="${escapeAttr(el.fill ?? "transparent")}" ${el.stroke ? `stroke="${escapeAttr(el.stroke)}"` : ""} ${el.strokeWidth ? `stroke-width="${num(el.strokeWidth)}"` : ""} opacity="${num(el.opacity ?? 1)}" />`;
        case "gradientRect":
            return renderGradientRect(el, index, defs);
        case "glow":
            return renderGlow(el, index, defs);
        case "shape":
            return renderShape(el);
        case "profileCard":
            return renderProfileCard(el, index, defs, assetCache);
        case "image":
        case "backgroundImage":
        case "noise":
            return renderImageElement(el, index, defs, assetCache);
        case "glassCard":
            return `<rect x="${num(el.x)}" y="${num(el.y)}" width="${num(el.width)}" height="${num(el.height)}" rx="${num(el.radius)}" fill="${escapeAttr(el.fill ?? "rgba(255,255,255,0.08)")}" ${el.stroke ? `stroke="${escapeAttr(el.stroke)}"` : ""} ${el.strokeWidth ? `stroke-width="${num(el.strokeWidth)}"` : ""} opacity="${num(el.opacity ?? 1)}" />`;
        default:
            return "";
    }
}

function renderText(el: AnyRecord) {
    const text = String(el.text ?? el.content ?? "");
    const x = num(el.x);
    const y = num(el.y);
    const width = num(el.width ?? DOC_W - 144);
    const fontSize = Math.max(14, num(el.fontSize ?? 32));
    const lineHeight = Math.max(0.88, Math.min(1.6, num(el.lineHeight ?? (fontSize >= 52 ? 1.05 : 1.35))));
    const fontFamily = normalizeFontFamily(el.fontFamily);
    const fontWeight = normalizeFontWeight(el.fontStyle, fontSize >= 52);
    const opacity = num(el.opacity ?? 1);
    const fill = escapeAttr(el.fill ?? "#FFFFFF");
    const align = el.align ?? "left";
    const lines = wrapText(text, width, fontSize, fontFamily, fontWeight);
    const anchor = align === "center" ? "middle" : align === "right" ? "end" : "start";
    const textX = align === "center" ? x + width / 2 : align === "right" ? x + width : x;

    const tspans = lines.map((line, lineIndex) => {
        const dy = lineIndex === 0 ? fontSize : fontSize * lineHeight;
        return `<tspan x="${num(textX)}" dy="${num(dy)}">${escapeText(line)}</tspan>`;
    }).join("");

    return `<text x="${num(textX)}" y="${num(y)}" fill="${fill}" font-size="${fontSize}" font-family="${escapeAttr(fontFamily)}" font-weight="${escapeAttr(fontWeight)}" text-anchor="${anchor}" opacity="${opacity}">${tspans}</text>`;
}

function renderGradientRect(el: AnyRecord, index: number, defs: string[]) {
    const id = `grad_${index}`;
    const stops = normalizeStops(el.stops);
    if (el.kind === "radial") {
        defs.push(`<radialGradient id="${id}" cx="${percent((el.center?.x ?? DOC_W / 2) / Math.max(1, el.width ?? DOC_W))}" cy="${percent((el.center?.y ?? DOC_H / 2) / Math.max(1, el.height ?? DOC_H))}" r="${percent((el.radius ?? 600) / Math.max(el.width ?? DOC_W, el.height ?? DOC_H, 1))}">${stops}</radialGradient>`);
    } else {
        defs.push(`<linearGradient id="${id}" x1="${percent((el.start?.x ?? 0) / Math.max(1, el.width ?? DOC_W))}" y1="${percent((el.start?.y ?? 0) / Math.max(1, el.height ?? DOC_H))}" x2="${percent((el.end?.x ?? DOC_W) / Math.max(1, el.width ?? DOC_W))}" y2="${percent((el.end?.y ?? DOC_H) / Math.max(1, el.height ?? DOC_H))}">${stops}</linearGradient>`);
    }

    return `<rect x="${num(el.x)}" y="${num(el.y)}" width="${num(el.width ?? DOC_W)}" height="${num(el.height ?? DOC_H)}" fill="url(#${id})" opacity="${num(el.opacity ?? 1)}" />`;
}

function renderGlow(el: AnyRecord, index: number, defs: string[]) {
    const filterId = `glow_${index}`;
    defs.push(`<filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${num((el.blur ?? 80) / 2)}" /></filter>`);
    return `<circle cx="${num(el.x)}" cy="${num(el.y)}" r="${num(el.r ?? 200)}" fill="${escapeAttr(el.color ?? "#FF5500")}" opacity="${num(el.opacity ?? 0.2)}" filter="url(#${filterId})" />`;
}

function renderShape(el: AnyRecord) {
    const x = num(el.x);
    const y = num(el.y);
    const w = Math.max(8, num(el.w ?? 120));
    const h = Math.max(8, num(el.h ?? 80));
    const color = escapeAttr(el.color ?? "#FFFFFF");
    const opacity = num(el.opacity ?? 1);
    const scale = Math.max(0.1, num(el.scale ?? 1));

    if (el.name === "arrows") {
        const vbW = 280;
        const vbH = 110;
        const vbX = -10;
        const vbY = -10;
        const sx = (w / vbW) * scale;
        const sy = (h / vbH) * scale;
        return `<g transform="translate(${num(x - vbX * sx)}, ${num(y - vbY * sy)}) scale(${num(sx)}, ${num(sy)})" opacity="${opacity}">${ARROW_PATHS.map((path) => `<path d="${escapeAttr(path)}" fill="${color}" />`).join("")}</g>`;
    }

    if (el.name === "line") {
        return `<rect x="${x}" y="${y}" width="${w}" height="${Math.max(2, h)}" rx="${num(Math.min(999, h / 2))}" fill="${color}" opacity="${opacity}" />`;
    }

    if (el.name === "circle") {
        return `<circle cx="${num(x + w / 2)}" cy="${num(y + h / 2)}" r="${num(Math.min(w, h) / 2)}" fill="${color}" opacity="${opacity}" />`;
    }

    if (el.name === "blob") {
        const path = `M${w * 0.15},${h * 0.25} C${w * 0.32},${-h * 0.08} ${w * 0.72},${-h * 0.02} ${w * 0.86},${h * 0.28} C${w * 1.02},${h * 0.58} ${w * 0.83},${h * 0.94} ${w * 0.52},${h * 0.96} C${w * 0.26},${h * 1.02} ${w * 0.02},${h * 0.74} ${w * 0.05},${h * 0.47} C${w * 0.08},${h * 0.36} ${w * 0.09},${h * 0.3} ${w * 0.15},${h * 0.25} Z`;
        return `<path d="${escapeAttr(path)}" transform="translate(${x}, ${y}) scale(${num(scale)})" fill="${color}" opacity="${opacity}" />`;
    }

    if (el.name === "wave") {
        const path = `M0,${h * 0.62} C${w * 0.2},${h * 0.45} ${w * 0.35},${h * 0.82} ${w * 0.52},${h * 0.62} C${w * 0.7},${h * 0.42} ${w * 0.84},${h * 0.78} ${w},${h * 0.6} L${w},${h} L0,${h} Z`;
        return `<path d="${escapeAttr(path)}" transform="translate(${x}, ${y}) scale(${num(scale)})" fill="${color}" opacity="${opacity}" />`;
    }

    if (el.name === "dots") {
        const cols = 6;
        const rows = 4;
        const gapX = w / (cols + 1);
        const gapY = h / (rows + 1);
        const dotR = Math.max(1.2, Math.min(4, Math.min(gapX, gapY) * 0.18));
        const dots = Array.from({ length: rows * cols }).map((_, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            return `<circle cx="${num(gapX * (col + 1))}" cy="${num(gapY * (row + 1))}" r="${num(dotR)}" fill="${color}" />`;
        }).join("");
        return `<g transform="translate(${x}, ${y}) scale(${num(scale)})" opacity="${opacity}">${dots}</g>`;
    }

    return "";
}

async function renderProfileCard(el: AnyRecord, index: number, defs: string[], assetCache: Map<string, string>) {
    const x = num(el.x);
    const y = num(el.y);
    const w = Math.max(180, num(el.w ?? 350));
    const h = Math.max(56, num(el.h ?? 92));
    const radius = Math.min(30, h / 2);
    const avatarSize = Math.max(40, Math.min(64, h - 10));
    const avatarX = x + 5;
    const avatarY = y + (h - avatarSize) / 2;
    const nameX = avatarX + avatarSize + 12;
    const roleY = y + h / 2 + 24;
    const clipId = `profile_avatar_${index}`;
    defs.push(`<clipPath id="${clipId}"><rect x="${num(avatarX)}" y="${num(avatarY)}" width="${num(avatarSize)}" height="${num(avatarSize)}" rx="${num(Math.min(25, avatarSize / 2))}" /></clipPath>`);

    const avatarUri = await getImageDataUri(
        el.user?.avatarSrc || buildAvatarFallbackSvg(avatarSize),
        assetCache
    );

    return `
        <g opacity="${num(el.opacity ?? 1)}">
            <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${num(radius)}" fill="${escapeAttr(el.accent ?? "#FFFFFF")}" />
            <image href="${avatarUri}" x="${num(avatarX)}" y="${num(avatarY)}" width="${num(avatarSize)}" height="${num(avatarSize)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />
            <text x="${num(nameX)}" y="${num(y + 34)}" fill="${escapeAttr(el.text ?? "#0F172A")}" font-size="20" font-family="Sora, Arial, sans-serif" font-weight="700">${escapeText(el.user?.name ?? "Username")}</text>
            <text x="${num(nameX)}" y="${num(roleY)}" fill="${escapeAttr(el.text ?? "#0F172A")}" font-size="16" font-family="Manrope, Arial, sans-serif">${escapeText(el.user?.role ?? "")}</text>
        </g>
    `;
}

async function renderImageElement(el: AnyRecord, index: number, defs: string[], assetCache: Map<string, string>) {
    const x = num(el.x);
    const y = num(el.y);
    const width = num(el.width ?? DOC_W);
    const height = num(el.height ?? DOC_H);
    const opacity = num(el.opacity ?? 1);
    const radius = num(el.radius ?? el.borderRadius ?? 0);
    const source = el.url ?? el.src;

    if (!source) {
        const label = String(el.prompt ?? "Sem imagem");
        return `
            <g opacity="${opacity}">
                <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="rgba(8,10,15,0.18)" stroke="rgba(255,255,255,0.28)" stroke-width="1.8" stroke-dasharray="10 7" />
                <text x="${num(x + 20)}" y="${num(y + 40)}" fill="rgba(255,255,255,0.92)" font-size="20" font-family="Sora, Arial, sans-serif" font-weight="700">AI IMAGE</text>
                <text x="${num(x + 20)}" y="${num(y + 82)}" fill="rgba(255,255,255,0.66)" font-size="15" font-family="Manrope, Arial, sans-serif">${escapeText(label.slice(0, 160))}</text>
            </g>
        `;
    }

    const dataUri = await getImageDataUri(String(source), assetCache);
    const clipId = `img_clip_${index}`;
    defs.push(`<clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" /></clipPath>`);
    const preserveAspectRatio = (el.cover ?? el.fit ?? "cover") === "contain" ? "xMidYMid meet" : "xMidYMid slice";

    return `<image href="${dataUri}" x="${x}" y="${y}" width="${width}" height="${height}" opacity="${opacity}" preserveAspectRatio="${preserveAspectRatio}" clip-path="url(#${clipId})" />`;
}

async function getImageDataUri(source: string, assetCache: Map<string, string>) {
    if (assetCache.has(source)) {
        return assetCache.get(source) as string;
    }

    if (source.startsWith("data:")) {
        assetCache.set(source, source);
        return source;
    }

    const response = await fetch(source);
    if (!response.ok) {
        throw new Error(`Falha ao baixar asset: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = Buffer.from(await response.arrayBuffer());
    const dataUri = `data:${contentType};base64,${buffer.toString("base64")}`;
    assetCache.set(source, dataUri);
    return dataUri;
}

function normalizeStops(stopsRaw: any) {
    const stopsFlat: Array<number | string> = Array.isArray(stopsRaw?.[0])
        ? stopsRaw.flat()
        : (Array.isArray(stopsRaw) ? stopsRaw : []);

    const parts: string[] = [];
    for (let i = 0; i < stopsFlat.length; i += 2) {
        const offset = Number(stopsFlat[i] ?? 0);
        const color = String(stopsFlat[i + 1] ?? "#000000");
        parts.push(`<stop offset="${percent(offset)}" stop-color="${escapeAttr(color)}" />`);
    }
    return parts.join("");
}

function wrapText(text: string, width: number, fontSize: number, _fontFamily: string, fontWeight: string) {
    const words = String(text ?? "").split(/\s+/).filter(Boolean);
    if (words.length === 0) return [""];

    const factor = fontWeight === "700" ? 0.58 : 0.54;
    const maxChars = Math.max(6, Math.floor(width / Math.max(1, fontSize * factor)));
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= maxChars) {
            current = candidate;
            continue;
        }

        if (current) lines.push(current);
        current = word;
    }

    if (current) lines.push(current);
    return lines;
}

function normalizeFontFamily(raw?: string) {
    if (!raw) return "Manrope, Arial, sans-serif";
    if (String(raw).includes(",")) return String(raw);
    return `${raw}, Arial, sans-serif`;
}

function normalizeFontWeight(raw?: string, isHeading?: boolean) {
    const value = String(raw ?? "").toLowerCase().trim();
    if (value === "bold" || value === "700" || value === "800" || isHeading) return "700";
    return "400";
}

function buildAvatarFallbackSvg(size: number) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
            <rect width="100%" height="100%" fill="#E5E7EB"/>
            <circle cx="${size / 2}" cy="${size / 2}" r="${size / 4}" fill="#9CA3AF"/>
        </svg>
    `)}`;
}

function escapeText(value: string) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function escapeAttr(value: string) {
    return escapeText(value).replace(/"/g, "&quot;");
}

function num(value: any) {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
}

function percent(value: number) {
    return `${Math.max(0, Math.min(1, value)) * 100}%`;
}

function slugifyFileName(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function getUserProfile(uid: string) {
    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
        return null;
    }

    const data = userSnap.data() as AnyRecord;
    return {
        displayName: String(data?.displayName ?? "").trim(),
        specialization: String(data?.specialization ?? "").trim(),
        avatarUrl: String(data?.avatarUrl ?? "").trim(),
    };
}

function applyProfileCardIdentityServer(carousel: AnyRecord, profile: AnyRecord | null) {
    if (!carousel || !profile) {
        return carousel;
    }

    const name = String(profile.displayName ?? "").trim();
    const role = String(profile.specialization ?? "").trim();
    const avatarUrl = String(profile.avatarUrl ?? "").trim();

    if (!name && !role && !avatarUrl) {
        return carousel;
    }

    return {
        ...carousel,
        slides: Array.isArray(carousel.slides)
            ? carousel.slides.map((slide: AnyRecord) => ({
                ...slide,
                layers: slide?.layers
                    ? {
                        background: mapProfileCardLayerServer(slide.layers.background, name, role, avatarUrl),
                        atmosphere: mapProfileCardLayerServer(slide.layers.atmosphere, name, role, avatarUrl),
                        content: mapProfileCardLayerServer(slide.layers.content, name, role, avatarUrl),
                        ui: mapProfileCardLayerServer(slide.layers.ui, name, role, avatarUrl),
                    }
                    : slide?.layers,
                elements: Array.isArray(slide?.elements)
                    ? mapProfileCardLayerServer(slide.elements, name, role, avatarUrl)
                    : slide?.elements,
            }))
            : carousel.slides,
    };
}

function mapProfileCardLayerServer(
    elements: any[] | undefined,
    displayName: string,
    specialization: string,
    avatarUrl: string
) {
    if (!Array.isArray(elements)) {
        return elements;
    }

    return elements.map((element) => {
        if (element?.type !== "profileCard") {
            return element;
        }

        return {
            ...element,
            user: {
                ...(element.user ?? {}),
                name: displayName || element.user?.name || "Username",
                role: specialization || element.user?.role || "",
                avatarSrc: avatarUrl || element.user?.avatarSrc || "",
            },
        };
    });
}
