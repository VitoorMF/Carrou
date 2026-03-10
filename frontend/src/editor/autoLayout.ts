// autoLayout.ts — v2
// Compatível com os IDs gerados pelo novo normalize.ts (heading_0, support_0, etc.)
// e também com os IDs legados (headline, body, bullets)

type MeasureOpts = {
    text: string;
    width: number;
    fontSize: number;
    fontFamily?: string;
    fontWeight?: number | string;
    lineHeight?: number;
    maxLines?: number;
};

class TextMeasurer {
    private el: HTMLDivElement | null = null;
    private cache = new Map<string, number>();

    private canUseDom() {
        return typeof document !== "undefined" && !!document.body;
    }

    private ensureEl() {
        if (!this.canUseDom()) return null;
        if (this.el) return this.el;

        const el = document.createElement("div");
        el.style.position = "absolute";
        el.style.visibility = "hidden";
        el.style.left = "-99999px";
        el.style.top = "0";
        el.style.whiteSpace = "pre-wrap";
        el.style.wordBreak = "break-word";
        el.style.pointerEvents = "none";
        document.body.appendChild(el);
        this.el = el;
        return el;
    }

    private key(opts: MeasureOpts) {
        return [
            opts.text ?? "",
            opts.width,
            opts.fontSize,
            opts.fontFamily ?? "",
            String(opts.fontWeight ?? ""),
            String(opts.lineHeight ?? ""),
            String(opts.maxLines ?? ""),
        ].join("|");
    }

    measure(opts: MeasureOpts): number {
        const k = this.key(opts);
        const cached = this.cache.get(k);
        if (cached != null) return cached;

        const el = this.ensureEl();
        if (!el) {
            // SSR fallback
            const lh = (opts.lineHeight ?? 1.2) * opts.fontSize;
            const charsPerLine = Math.max(1, Math.floor(opts.width / (opts.fontSize * 0.55)));
            const raw = (opts.text ?? "").split("\n");
            let lines = 0;
            for (const part of raw) lines += Math.max(1, Math.ceil(part.length / charsPerLine));
            if (opts.maxLines) lines = Math.min(lines, opts.maxLines);
            const h = Math.ceil(lines * lh);
            this.cache.set(k, h);
            return h;
        }

        el.style.width = `${opts.width}px`;
        el.style.fontSize = `${opts.fontSize}px`;
        el.style.fontFamily = opts.fontFamily ?? "Sora, Manrope, system-ui";
        el.style.fontWeight = String(opts.fontWeight ?? 700);
        el.style.lineHeight = String(opts.lineHeight ?? 1.1);
        el.style.display = "block";
        (el.style as any).webkitBoxOrient = "";
        (el.style as any).webkitLineClamp = "";
        el.style.overflow = "visible";

        if (opts.maxLines) {
            el.style.display = "-webkit-box";
            (el.style as any).webkitBoxOrient = "vertical";
            (el.style as any).webkitLineClamp = String(opts.maxLines);
            el.style.overflow = "hidden";
        }

        el.textContent = opts.text ?? "";
        const h = el.scrollHeight;
        this.cache.set(k, h);
        return h;
    }

    clearCache() {
        this.cache.clear();
    }

    destroy() {
        this.cache.clear();
        if (this.el?.parentNode) this.el.parentNode.removeChild(this.el);
        this.el = null;
    }
}

const measurer = new TextMeasurer();

export function measureTextHeight(opts: MeasureOpts) {
    return measurer.measure(opts);
}

export function clearMeasureCache() {
    measurer.clearCache();
}

// ─── Element finders ──────────────────────────────────────────────────────────

function getAllElements(slide: any): any[] {
    // Suporte a estrutura layered (novo) e flat (legado)
    if (slide?.layers) {
        return [
            ...(Array.isArray(slide.layers.background) ? slide.layers.background : []),
            ...(Array.isArray(slide.layers.atmosphere) ? slide.layers.atmosphere : []),
            ...(Array.isArray(slide.layers.content) ? slide.layers.content : []),
            ...(Array.isArray(slide.layers.ui) ? slide.layers.ui : []),
        ];
    }
    if (Array.isArray(slide?.elements)) return slide.elements;
    if (Array.isArray(slide?.canvas?.elements)) return slide.canvas.elements;
    return [];
}

/**
 * Encontra elemento de texto por:
 * 1. ID exato (legado: "headline", "body", "bullets")
 * 2. Padrão de ID do novo normalize (heading_N, support_N, etc.)
 * 3. Fallback: primeiro/segundo elemento de texto por posição Y
 */
function findHeadingElement(slide: any, slideIndex: number): any | null {
    const els = getAllElements(slide);
    const texts = els.filter((e: any) => e?.type === "text").sort((a: any, b: any) => (a.y ?? 0) - (b.y ?? 0));

    // Legado
    const legacy = texts.find((e: any) => e?.id === "headline");
    if (legacy) return legacy;

    // Novo normalize: heading_N
    const modern = texts.find((e: any) =>
        e?.id === `heading_${slideIndex}` ||
        e?.id?.startsWith("heading_") ||
        e?.id?.startsWith("t_heading_")
    );
    if (modern) return modern;

    // Fallback: maior fontSize entre os textos
    if (texts.length > 0) {
        return texts.reduce((prev: any, curr: any) =>
            (curr.fontSize ?? 0) > (prev.fontSize ?? 0) ? curr : prev
        );
    }

    return null;
}

function findSupportElement(slide: any, slideIndex: number): any | null {
    const els = getAllElements(slide);
    const texts = els.filter((e: any) => e?.type === "text").sort((a: any, b: any) => (a.y ?? 0) - (b.y ?? 0));

    // Legado
    const legacy = texts.find((e: any) => e?.id === "body");
    if (legacy) return legacy;

    // Novo normalize: support_N
    const modern = texts.find((e: any) =>
        e?.id === `support_${slideIndex}` ||
        e?.id?.startsWith("support_") ||
        e?.id?.startsWith("t_support_")
    );
    if (modern) return modern;

    // Fallback: segundo texto por posição Y (depois do heading)
    const heading = findHeadingElement(slide, slideIndex);
    if (heading && texts.length > 1) {
        return texts.find((e: any) => e !== heading && (e.y ?? 0) > (heading.y ?? 0)) ?? null;
    }

    return texts[1] ?? null;
}

function findExtrasElements(slide: any, slideIndex: number): any[] {
    const els = getAllElements(slide);
    const texts = els.filter((e: any) => e?.type === "text").sort((a: any, b: any) => (a.y ?? 0) - (b.y ?? 0));

    const heading = findHeadingElement(slide, slideIndex);
    const support = findSupportElement(slide, slideIndex);

    return texts.filter((e: any) => e !== heading && e !== support && (e.fontSize ?? 0) < 40);
}

// ─── Flow Engine ──────────────────────────────────────────────────────────────

const GAP_HEADING_SUPPORT = 28;
const GAP_SUPPORT_EXTRAS = 20;
const GAP_BETWEEN_EXTRAS = 12;
const PADDING_EXTRA = 6;

function flowSlide(slide: any, slideIndex: number) {
    const heading = findHeadingElement(slide, slideIndex);
    const support = findSupportElement(slide, slideIndex);
    const extras = findExtrasElements(slide, slideIndex);

    if (!heading) return; // Sem heading, nada a fazer

    // Medir heading
    const headingH = measureTextHeight({
        text: heading.text ?? heading.content ?? "",
        width: heading.width ?? heading.w ?? 800,
        fontSize: heading.fontSize ?? 72,
        fontFamily: heading.fontFamily ?? "Sora",
        fontWeight: 700,
        lineHeight: heading.lineHeight ?? 1.0,
        maxLines: 3,
    }) + PADDING_EXTRA;

    // Atualizar h do heading
    heading.h = headingH;

    if (!support) return;

    // Posicionar support abaixo do heading
    const newSupportY = (heading.y ?? 0) + headingH + GAP_HEADING_SUPPORT;

    // Só mover para baixo, nunca para cima (evitar sobreposição com heading)
    if (newSupportY > (support.y ?? 0)) {
        support.y = newSupportY;
    }

    // Medir support
    const supportH = measureTextHeight({
        text: support.text ?? support.content ?? "",
        width: support.width ?? support.w ?? 800,
        fontSize: support.fontSize ?? 28,
        fontFamily: support.fontFamily ?? "Manrope",
        fontWeight: 400,
        lineHeight: support.lineHeight ?? 1.38,
    }) + PADDING_EXTRA;

    support.h = supportH;

    // Posicionar extras abaixo do support
    let currentY = support.y + supportH + GAP_SUPPORT_EXTRAS;

    for (const extra of extras) {
        const extraH = measureTextHeight({
            text: extra.text ?? extra.content ?? "",
            width: extra.width ?? extra.w ?? 800,
            fontSize: extra.fontSize ?? 24,
            fontFamily: extra.fontFamily ?? "Manrope",
            fontWeight: 400,
            lineHeight: extra.lineHeight ?? 1.3,
        }) + PADDING_EXTRA;

        if (currentY > (extra.y ?? 0)) {
            extra.y = currentY;
        }

        extra.h = extraH;
        currentY = extra.y + extraH + GAP_BETWEEN_EXTRAS;
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

function applyAutoLayout(carousel: any): any {
    const next = structuredClone(carousel);

    for (let i = 0; i < (next.slides ?? []).length; i++) {
        const slide = next.slides[i];
        flowSlide(slide, i);
    }

    return next;
}

export async function applyAutoLayoutAsync(carousel: any): Promise<any> {
    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
        try {
            await (document as any).fonts.ready;
        } catch {
            // ignorar falha no carregamento de fontes
        }
    }
    return applyAutoLayout(carousel);
}

// Exportar também a versão síncrona para uso interno
export { applyAutoLayout };