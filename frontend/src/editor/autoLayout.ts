// autoLayout.ts
// Ctrl+C / Ctrl+V: medição de texto + flow vertical + applyAutoLayoutAsync
// - Reusa 1 único elemento DOM (bem mais leve)
// - Cache por chave (bem mais rápido)
// - Espera fontes carregarem (document.fonts.ready)
// - SSR-safe (não quebra em Node)

type MeasureOpts = {
    text: string;
    width: number;
    fontSize: number;
    fontFamily?: string;
    fontWeight?: number | string;
    lineHeight?: number; // ex: 1.2
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

    measure(opts: MeasureOpts) {
        const k = this.key(opts);
        const cached = this.cache.get(k);
        if (cached != null) return cached;

        const el = this.ensureEl();
        if (!el) {
            // SSR fallback: estimativa simples (não perfeita, mas evita quebrar)
            const lh = (opts.lineHeight ?? 1.2) * opts.fontSize;
            const approxCharsPerLine = Math.max(1, Math.floor(opts.width / (opts.fontSize * 0.55)));
            const raw = (opts.text ?? "").split("\n");
            let lines = 0;
            for (const part of raw) lines += Math.max(1, Math.ceil(part.length / approxCharsPerLine));
            if (opts.maxLines) lines = Math.min(lines, opts.maxLines);
            const h = Math.ceil(lines * lh);
            this.cache.set(k, h);
            return h;
        }

        // styles
        el.style.width = `${opts.width}px`;
        el.style.fontSize = `${opts.fontSize}px`;
        el.style.fontFamily = opts.fontFamily ?? "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial";
        el.style.fontWeight = String(opts.fontWeight ?? 700);
        el.style.lineHeight = String(opts.lineHeight ?? 1.15);

        // reset clamp
        el.style.display = "block";
        (el.style as any).webkitBoxOrient = "";
        (el.style as any).webkitLineClamp = "";
        el.style.overflow = "visible";

        // clamp (webkit)
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

function findById(slide: any, id: string) {
    return (slide?.canvas?.elements ?? []).find((e: any) => e?.id === id) ?? null;
}

/**
 * Flow vertical simples baseado em IDs fixos: "headline", "body", "bullets".
 * - Mede altura real e atualiza y/h.
 */
export function flow(
    slide: any,
    gap = 24,
    rules?: {
        headlineMaxLines?: number;
        bodyMaxLines?: number;
        bulletsMaxLines?: number;
    }
) {
    const headline = findById(slide, "headline");
    const body = findById(slide, "body");
    const bullets = findById(slide, "bullets");

    if (!headline || !body) return;

    const extra = 6;

    const headlineH =
        measureTextHeight({
            text: headline.text ?? "",
            width: headline.w,
            fontSize: headline.fontSize,
            fontWeight: headline.fontWeight,
            lineHeight: headline.lineHeight ?? 1.2,
            maxLines: rules?.headlineMaxLines ?? 2,
            fontFamily: headline.fontFamily,
        }) + extra;

    // você pode trocar por headline._h se não quiser "h" público
    headline.h = headlineH;

    body.y = (headline.y ?? 0) + headlineH + gap;

    const bodyH =
        measureTextHeight({
            text: body.text ?? "",
            width: body.w,
            fontSize: body.fontSize,
            fontWeight: body.fontWeight,
            lineHeight: body.lineHeight ?? 1.2,
            maxLines: rules?.bodyMaxLines,
            fontFamily: body.fontFamily,
        }) + extra;

    body.h = bodyH;

    if (bullets) {
        bullets.y = body.y + bodyH + gap;

        bullets.h =
            measureTextHeight({
                text: bullets.text ?? "",
                width: bullets.w,
                fontSize: bullets.fontSize,
                fontWeight: bullets.fontWeight,
                lineHeight: bullets.lineHeight ?? 1.3,
                maxLines: rules?.bulletsMaxLines,
                fontFamily: bullets.fontFamily,
            }) + extra;
    }
}

function applyAutoLayout(carousel: any) {
    // structuredClone é ótimo no browser moderno; se precisar suporte, troca por deep clone seu
    const next = structuredClone(carousel);

    for (const slide of next.slides ?? []) {
        if (slide?.role === "cover") flow(slide, 28, { headlineMaxLines: 3 });
        else if (slide?.role === "cta") flow(slide, 24, { headlineMaxLines: 2 });
        else flow(slide, 24, { headlineMaxLines: 2 });
    }

    return next;
}

/**
 * Espera as fontes carregarem antes de medir (evita layout “mudar sozinho” depois).
 */
export async function applyAutoLayoutAsync(carousel: any) {
    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
        try {
            await (document as any).fonts.ready;
        } catch {
            // ignora: se falhar, mede mesmo assim
        }
    }
    return applyAutoLayout(carousel);
}
