// import type { Carousel, CanvasElement, IconName, ShapeName } from "../types/canvas";

// const DOC_W = 1080;
// const DOC_H = 1080;
// const SAFE_PAD = 80;

// function clamp(n: number, a: number, b: number) {
//     return Math.max(a, Math.min(b, n));
// }

// function asInt(n: any, fallback: number) {
//     const x = Number(n);
//     return Number.isFinite(x) ? Math.round(x) : fallback;
// }

// function isHexColor(s: any) {
//     return typeof s === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
// }

// const ICONS: IconName[] = ["check", "arrow", "star", "lightbulb", "chart", "alert", "idea", "growth"];
// const SHAPES: ShapeName[] = ["dots", "blob", "wave", "line", "circle"];

// function safeId(prefix: string, idx: number) {
//     return `${prefix}${idx + 1}`;
// }

// function normalizeBackground(bg: any) {
//     const type = bg?.type === "gradient" ? "gradient" : "solid";
//     const value =
//         typeof bg?.value === "string" && bg.value.trim()
//             ? bg.value.trim()
//             : type === "gradient"
//                 ? "linear-gradient(135deg, #E0E7FF, #FCE7F3)"
//                 : "#F6F7FB";

//     return { type, value };
// }

// function normalizeText(el: any, idx: number): CanvasElement {
//     const x = asInt(el?.x, SAFE_PAD);
//     const y = asInt(el?.y, SAFE_PAD);
//     const w = asInt(el?.w, 920);
//     const h = asInt(el?.h, 140);

//     const fontSize = clamp(asInt(el?.fontSize, 40), 18, 96);
//     const fontWeight = el?.fontWeight != null ? clamp(asInt(el.fontWeight, 600), 100, 900) : undefined;

//     const align = el?.align === "center" || el?.align === "right" ? el.align : "left";
//     const color = isHexColor(el?.color) ? el.color : undefined;

//     const text = typeof el?.text === "string" ? el.text : typeof el?.content === "string" ? el.content : "";

//     return {
//         id: typeof el?.id === "string" && el.id ? el.id : safeId("t", idx),
//         type: "text",
//         x: clamp(x, 0, DOC_W - 1),
//         y: clamp(y, 0, DOC_H - 1),
//         w: clamp(w, 10, DOC_W),
//         h: clamp(h, 10, DOC_H),
//         text,
//         fontSize,
//         fontWeight,
//         align,
//         color,
//     };
// }

// function normalizeIcon(el: any, idx: number): CanvasElement {
//     const x = asInt(el?.x, SAFE_PAD);
//     const y = asInt(el?.y, SAFE_PAD);
//     const size = clamp(asInt(el?.size, 96), 24, 240);

//     const name: IconName = ICONS.includes(el?.name) ? el.name : "star";
//     const color = isHexColor(el?.color) ? el.color : undefined;

//     return {
//         id: typeof el?.id === "string" && el.id ? el.id : safeId("i", idx),
//         type: "icon",
//         x: clamp(x, 0, DOC_W - 1),
//         y: clamp(y, 0, DOC_H - 1),
//         name,
//         size,
//         color,
//     };
// }

// function normalizeShape(el: any, idx: number): CanvasElement {
//     const x = asInt(el?.x, 0);
//     const y = asInt(el?.y, 0);
//     const w = clamp(asInt(el?.w, 260), 40, 2000);
//     const h = clamp(asInt(el?.h, 260), 40, 2000);

//     const name: ShapeName = SHAPES.includes(el?.name) ? el.name : "dots";
//     const color = isHexColor(el?.color) ? el.color : undefined;

//     // opacidade segura por shape
//     const defaultOpacity =
//         name === "wave" ? 0.18 : name === "blob" ? 0.10 : name === "dots" ? 0.06 : 0.12;

//     const opacity = clamp(Number(el?.opacity ?? defaultOpacity), 0.02, 0.28);
//     const scale = clamp(Number(el?.scale ?? 1), 0.6, 3);

//     return {
//         id: typeof el?.id === "string" && el.id ? el.id : safeId("s", idx),
//         type: "shape",
//         x: clamp(x, -1000, DOC_W + 1000), // shapes podem “vazar” de propósito
//         y: clamp(y, -1000, DOC_H + 1000),
//         w,
//         h,
//         name,
//         opacity,
//         color,
//         scale,
//     };
// }

// function normalizeImage(el: any, idx: number): CanvasElement {
//     const x = asInt(el?.x, SAFE_PAD);
//     const y = asInt(el?.y, SAFE_PAD);
//     const w = clamp(asInt(el?.w, 380), 10, DOC_W);
//     const h = clamp(asInt(el?.h, 380), 10, DOC_H);

//     const fit = el?.fit === "contain" ? "contain" : "cover";
//     const opacity = clamp(Number(el?.opacity ?? 1), 0, 1);

//     // seu payload de IA usa "prompt" e não usa "src" (ainda)
//     const prompt = typeof el?.prompt === "string" ? el.prompt : undefined;
//     const src = typeof el?.src === "string" ? el.src : undefined;

//     return {
//         id: typeof el?.id === "string" && el.id ? el.id : safeId("img", idx),
//         type: "image",
//         x: clamp(x, 0, DOC_W - 1),
//         y: clamp(y, 0, DOC_H - 1),
//         w,
//         h,
//         fit,
//         opacity,
//         // depende do seu tipo CanvasElement: inclua pelo menos um deles
//         ...(prompt ? { prompt } : {}),
//         ...(src ? { src } : {}),
//         // extras opcionais que você já usa
//         ...(el?.bg ? { bg: el.bg } : {}),
//         ...(el?.kind ? { kind: el.kind } : {}),
//     } as any;
// }


// function normalizeElement(el: any, idx: number): CanvasElement | null {
//     const t = el?.type;

//     if (t === "text") return normalizeText(el, idx);
//     if (t === "icon") return normalizeIcon(el, idx);
//     if (t === "shape") return normalizeShape(el, idx);
//     if (t === "image") return normalizeImage(el, idx);


//     // fallback: se vier um objeto com 'text', trata como text
//     if (typeof el?.text === "string" || typeof el?.content === "string") return normalizeText(el, idx);

//     return null;
// }



// export function normalizeCarousel(input: any): Carousel {
//     const meta = input?.meta ?? {};
//     const slidesIn = Array.isArray(input?.slides) ? input.slides : [];

//     const style =
//         meta?.style === "bold" || meta?.style === "playful" ? meta.style : "clean";

//     const slideCount = clamp(asInt(meta?.slideCount, slidesIn.length || 6), 1, 20);

//     const out: Carousel = {
//         meta: {
//             title: String(meta?.title ?? "Sem título"),
//             language: String(meta?.language ?? "pt-BR"),
//             format: String(meta?.format ?? "dicas"),
//             objective: String(meta?.objective ?? "educacional"),
//             audience: String(meta?.audience ?? "iniciante"),
//             cta: String(meta?.cta ?? "salvar"),
//             style,
//             slideCount,
//         },
//         slides: [],
//     };

//     // normaliza slides (e garante quantidade)
//     const take = slidesIn.slice(0, slideCount);

//     out.slides = take.map((s: any, idx: number) => {
//         const canvasIn = s?.canvas ?? {};
//         const elementsIn = Array.isArray(canvasIn?.elements) ? canvasIn.elements : [];

//         const elements = elementsIn
//             .map(normalizeElement)
//             .filter(Boolean) as CanvasElement[];

//         // >>> injeta texto SEMPRE (não só quando vazio)
//         if (s?.headline) {
//             elements.unshift(
//                 normalizeText(
//                     { type: "text", x: SAFE_PAD, y: SAFE_PAD, w: 920, h: 140, text: String(s.headline), fontSize: 64, fontWeight: 800 },
//                     1000
//                 )
//             );
//         }

//         if (s?.body) {
//             elements.push(
//                 normalizeText(
//                     { type: "text", x: SAFE_PAD, y: 240, w: 740, h: 200, text: String(s.body), fontSize: 30, fontWeight: 500 },
//                     1001
//                 )
//             );
//         }


//         if (Array.isArray(s?.bullets) && s.bullets.length) {
//             const startY = 460;
//             const lineH = 56;

//             s.bullets.forEach((bullet: string, i: number) => {
//                 const id = `bullet_${i}`;

//                 const exists = elements.some((el) => el.id === id);
//                 if (exists) return;

//                 elements.push(
//                     normalizeText(
//                         {
//                             type: "text",
//                             id,
//                             x: SAFE_PAD + 64, // espaço pra ícone se quiser depois
//                             y: startY + i * lineH,
//                             w: 740,
//                             h: lineH,
//                             text: String(bullet),
//                             fontSize: 28,
//                             fontWeight: 500,
//                             align: "left",
//                         },
//                         2000 + i
//                     )
//                 );
//             });
//         }



//         return {
//             id: typeof s?.id === "string" && s.id ? s.id : `s${idx + 1}`,
//             role: s?.role === "cta" || s?.role === "content" ? s.role : "cover",
//             headline: String(s?.headline ?? ""),
//             body: String(s?.body ?? ""),
//             bullets: Array.isArray(s?.bullets) ? s.bullets.map(String) : [],
//             footer: s?.footer != null ? String(s.footer) : undefined,
//             design: s?.design && typeof s.design === "object" ? s.design : undefined,
//             canvas: {
//                 background: normalizeBackground(canvasIn?.background),
//                 elements,
//             },
//         };
//     });

//     return out;
// }
