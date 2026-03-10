import { Circle, Group, Image, Layer, Path, Rect, Stage, Text } from "react-konva";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import type { Carousel, El, Slide } from "./types";
import { useKonvaImage } from "./hooks/useKonvaImage";
import { ShapeRenderer } from "./renderers/ShapeRenderer";
import { ProfileCardRenderer } from "./renderers/ProfileCardRenderer";
import "./Canvas.css";

const DOC_W = 1080;
const DOC_H = 1350;

export interface CanvasRef {
    exportPNG: () => void;
}

type CanvasProps = {
    carousel: Carousel | null;
    slideIndex?: number;
    zoom?: number;
    onExportPNG?: (dataUrl: string) => void;
};

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 1;

function normalizeFontStyle(raw?: string, isHeading?: boolean): "normal" | "bold" | "italic" | "bold italic" {
    if (!raw) return isHeading ? "bold" : "normal";
    const value = raw.toLowerCase().trim();
    if (value === "normal" || value === "regular" || value === "400" || value === "500") return "normal";
    if (value === "bold" || value === "600" || value === "700" || value === "800") return "bold";
    if (value === "italic") return "italic";
    if (value === "bold italic" || value === "italic bold") return "bold italic";
    return isHeading ? "bold" : "normal";
}

function normalizeFontFamily(raw?: string) {
    if (!raw) return "Manrope";
    // Fontes permitidas — retornar diretamente
    if (/^(poppins|sora|montserrat|manrope)$/i.test(raw.trim())) return raw.trim();
    // Fonte composta que já inclui fallback
    if (raw.includes(",")) return raw;
    return `${raw}, Manrope`;
}

function toLayeredSlide(slide: Slide & { elements?: El[] }): Slide {
    if (slide?.layers) return slide;

    const background: El[] = [];
    const atmosphere: El[] = [];
    const content: El[] = [];
    const ui: El[] = [];

    for (const el of slide?.elements ?? []) {
        if (el.type === "background") {
            background.push(el);
        } else if (
            el.type === "backgroundImage" ||
            el.type === "noise" ||
            el.type === "gradientRect" ||
            el.type === "glow"
        ) {
            atmosphere.push(el);
        } else if (
            el.type === "glassCard" ||
            el.type === "image" ||
            el.type === "path" ||
            el.type === "text" ||
            el.type === "shape" ||
            el.type === "profileCard"
        ) {
            content.push(el);
        } else {
            ui.push(el);
        }
    }

    return { ...slide, layers: { background, atmosphere, content, ui } };
}

export const Canvas = forwardRef<CanvasRef, CanvasProps>(
    ({ carousel, slideIndex = 0, zoom = 0.56, onExportPNG }, ref) => {
        const stageRef = useRef<any>(null);
        const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

        const activeSlide = useMemo(() => {
            const rawSlide = carousel?.slides[slideIndex] ?? null;
            return rawSlide ? toLayeredSlide(rawSlide as Slide & { elements?: El[] }) : null;
        }, [carousel, slideIndex]);

        useImperativeHandle(ref, () => ({
            exportPNG() {
                const uri = stageRef.current?.toDataURL({ pixelRatio: 2 });
                if (!uri) return;
                const link = document.createElement("a");
                link.href = uri;
                link.download = `slide-${slideIndex + 1}.png`;
                link.click();
                onExportPNG?.(uri);
            },
        }), [onExportPNG, slideIndex]);

        function renderLayerElements(els: El[]) {
            return els.map((el, i) => {

                // ── BACKGROUND ──────────────────────────────────────────────
                if (el.type === "background") {
                    return (
                        <Rect
                            key={`bg_${i}`}
                            x={el.x ?? 0}
                            y={el.y ?? 0}
                            width={el.width ?? DOC_W}
                            height={el.height ?? DOC_H}
                            fill={el.fill ?? "#0A0A0A"}
                            opacity={el.opacity ?? 1}
                            listening={false}
                        />
                    );
                }

                // ── BACKGROUND IMAGE / NOISE ─────────────────────────────────
                if (el.type === "backgroundImage" || el.type === "noise") {
                    return <ImageElement key={`bgimg_${i}`} el={el} />;
                }

                // ── GRADIENT RECT ────────────────────────────────────────────
                if (el.type === "gradientRect") {
                    const stopsRaw = el.stops ?? [];
                    const stopsFlat: Array<number | string> = Array.isArray(stopsRaw[0])
                        ? (stopsRaw as Array<[number, string]>).flat()
                        : (stopsRaw as Array<number | string>);

                    return (
                        <Rect
                            key={`grad_${i}`}
                            x={el.x ?? 0}
                            y={el.y ?? 0}
                            width={el.width ?? DOC_W}
                            height={el.height ?? DOC_H}
                            opacity={el.opacity ?? 1}
                            fillLinearGradientStartPoint={el.kind === "linear" ? (el.start ?? { x: 0, y: 0 }) : undefined}
                            fillLinearGradientEndPoint={el.kind === "linear" ? (el.end ?? { x: DOC_W, y: DOC_H }) : undefined}
                            fillRadialGradientStartPoint={el.kind === "radial" ? (el.center ?? { x: DOC_W / 2, y: DOC_H / 2 }) : undefined}
                            fillRadialGradientEndPoint={el.kind === "radial" ? (el.center ?? { x: DOC_W / 2, y: DOC_H / 2 }) : undefined}
                            fillRadialGradientStartRadius={el.kind === "radial" ? 0 : undefined}
                            fillRadialGradientEndRadius={el.kind === "radial" ? (el.radius ?? 600) : undefined}
                            fillLinearGradientColorStops={el.kind === "linear" ? stopsFlat : undefined}
                            fillRadialGradientColorStops={el.kind === "radial" ? stopsFlat : undefined}
                            listening={false}
                        />
                    );
                }

                // ── GLOW ─────────────────────────────────────────────────────
                if (el.type === "glow") {
                    return (
                        <Circle
                            key={`glow_${i}`}
                            x={el.x}
                            y={el.y}
                            radius={el.r ?? 200}
                            fill={el.color ?? "#FF5500"}
                            opacity={el.opacity ?? 0.2}
                            shadowColor={el.color ?? "#FF5500"}
                            shadowBlur={el.blur ?? 80}
                            shadowOffsetX={0}
                            shadowOffsetY={0}
                            shadowOpacity={el.opacity ?? 0.2}
                            listening={false}
                        />
                    );
                }

                // ── GLASS CARD ───────────────────────────────────────────────
                if (el.type === "glassCard") {
                    const sh = el.shadow ?? { blur: 24, y: 10, opacity: 0.18 };
                    return (
                        <Rect
                            key={`glass_${i}`}
                            x={el.x}
                            y={el.y}
                            width={el.width}
                            height={el.height}
                            cornerRadius={el.radius ?? 16}
                            fill={el.fill ?? "rgba(255,255,255,0.08)"}
                            stroke={el.stroke ?? "rgba(255,255,255,0.14)"}
                            strokeWidth={el.strokeWidth ?? 1}
                            opacity={el.opacity ?? 1}
                            shadowColor="#000"
                            shadowBlur={sh.blur}
                            shadowOffsetX={0}
                            shadowOffsetY={sh.y}
                            shadowOpacity={sh.opacity}
                            listening={false}
                        />
                    );
                }

                // ── SHAPE ASSET ──────────────────────────────────────────────
                if (el.type === "shape") {
                    return <ShapeRenderer key={`shape_${i}`} el={el} />;
                }

                // ── PROFILE CARD ─────────────────────────────────────────────
                if (el.type === "profileCard") {
                    return <ProfileCardRenderer key={`pc_${i}`} el={el} />;
                }

                // ── PATH ─────────────────────────────────────────────────────
                if (el.type === "path") {
                    return (
                        <Path
                            key={`path_${i}`}
                            x={el.x ?? 0}
                            y={el.y ?? 0}
                            data={el.data ?? ""}
                            fill={el.fill ?? "transparent"}
                            stroke={el.stroke}
                            strokeWidth={el.strokeWidth}
                            opacity={el.opacity ?? 1}
                            lineCap={el.lineCap}
                            lineJoin={el.lineJoin}
                            shadowColor={el.shadowColor}
                            shadowBlur={el.shadowBlur}
                            shadowOffsetX={el.shadowOffsetX}
                            shadowOffsetY={el.shadowOffsetY}
                            shadowOpacity={el.shadowOpacity}
                            listening={false}
                        />
                    );
                }

                // ── TEXT ─────────────────────────────────────────────────────
                if (el.type === "text") {
                    // Suporte a ambos os campos: text (novo normalize) e content (legado editor)
                    const displayText = el.text ?? (el as any).content ?? "";
                    const fontSize = Math.max(14, el.fontSize ?? 32);
                    const isHeading = fontSize >= 52;
                    const lineHeight = Math.max(0.88, Math.min(1.6, el.lineHeight ?? (isHeading ? 1.05 : 1.35)));
                    const letterSpacing = Math.max(-8, Math.min(8, el.letterSpacing ?? (isHeading ? -1 : 0)));

                    return (
                        <Text
                            key={`text_${i}`}
                            x={el.x ?? 0}
                            y={el.y ?? 0}
                            text={displayText}
                            fill={el.fill ?? "#FFFFFF"}
                            fontSize={fontSize}
                            fontFamily={normalizeFontFamily(el.fontFamily)}
                            fontStyle={normalizeFontStyle(el.fontStyle, isHeading)}
                            width={el.width ?? DOC_W - 144}
                            align={el.align ?? "left"}
                            lineHeight={lineHeight}
                            letterSpacing={letterSpacing}
                            opacity={el.opacity ?? 1}
                            shadowColor={el.shadowColor}
                            shadowBlur={el.shadowBlur}
                            shadowOffsetX={el.shadowOffsetX}
                            shadowOffsetY={el.shadowOffsetY}
                            shadowOpacity={el.shadowOpacity}
                            listening={false}
                            draggable={false}
                        />
                    );
                }

                // ── IMAGE ────────────────────────────────────────────────────
                if (el.type === "image") {
                    return <ImageElement key={`img_${i}`} el={el} />;
                }

                return null;
            });
        }

        function ImageElement({ el }: { el: Extract<El, { type: "image" | "backgroundImage" | "noise" }> }) {
            const imageUrl = (el as any).url ?? (el as any).src;
            const img = useKonvaImage(imageUrl);
            const radius = (el as any).radius ?? (el as any).borderRadius ?? 0;

            if (!img) {
                const prompt = String((el as any).prompt ?? "").trim();
                const isBackground = el.type === "backgroundImage";

                // Para backgroundImage sem src: renderizar gradiente placeholder
                if (isBackground) {
                    return (
                        <Rect
                            x={el.x ?? 0}
                            y={el.y ?? 0}
                            width={el.width ?? DOC_W}
                            height={el.height ?? DOC_H}
                            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                            fillLinearGradientEndPoint={{ x: el.width ?? DOC_W, y: el.height ?? DOC_H }}
                            fillLinearGradientColorStops={[0, "rgba(80,80,80,0.3)", 1, "rgba(20,20,20,0.1)"]}
                            opacity={el.opacity ?? 0.6}
                            listening={false}
                        />
                    );
                }

                // Para image sem src: placeholder com borda tracejada e label do prompt
                const labelWidth = Math.max(32, (el.width ?? 400) - 40);
                const previewPrompt = prompt.length > 180 ? `${prompt.slice(0, 180).trimEnd()}...` : prompt;
                const promptLabel = previewPrompt || "Sem prompt definido";
                return (
                    <Group listening={false}>
                        <Rect
                            x={el.x ?? 0}
                            y={el.y ?? 0}
                            width={el.width ?? 400}
                            height={el.height ?? 300}
                            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                            fillLinearGradientEndPoint={{ x: 0, y: el.height ?? 300 }}
                            fillLinearGradientColorStops={[0, "rgba(255,255,255,0.09)", 1, "rgba(255,255,255,0.03)"]}
                            cornerRadius={radius}
                            listening={false}
                        />
                        <Rect
                            x={el.x ?? 0}
                            y={el.y ?? 0}
                            width={el.width ?? 400}
                            height={el.height ?? 300}
                            fill="rgba(8,10,15,0.18)"
                            stroke="rgba(255,255,255,0.28)"
                            strokeWidth={1.8}
                            cornerRadius={radius}
                            dash={[10, 7]}
                        />
                        <Circle
                            x={(el.x ?? 0) + 28}
                            y={(el.y ?? 0) + 32}
                            radius={10}
                            fill="rgba(255,255,255,0.22)"
                        />
                        <Path
                            x={(el.x ?? 0) + 22}
                            y={(el.y ?? 0) + 26}
                            data="M0,10 L6,4 L11,9 L16,3 L22,9 L22,18 L0,18 Z"
                            fill="rgba(255,255,255,0.82)"
                            opacity={0.85}
                        />
                        <Rect
                            x={(el.x ?? 0) + 48}
                            y={(el.y ?? 0) + 18}
                            width={84}
                            height={28}
                            cornerRadius={14}
                            fill="rgba(255,255,255,0.18)"
                        />
                        <Text
                            x={(el.x ?? 0) + 48}
                            y={(el.y ?? 0) + 25}
                            width={84}
                            text="AI IMAGE"
                            fill="rgba(255,255,255,0.92)"
                            fontFamily="Sora"
                            fontStyle="bold"
                            fontSize={11}
                            align="center"
                            letterSpacing={1}
                        />
                        <Text
                            x={(el.x ?? 0) + 20}
                            y={(el.y ?? 0) + 58}
                            width={labelWidth}
                            text={promptLabel}
                            fill="rgba(255,255,255,0.66)"
                            fontFamily="Manrope"
                            fontStyle="normal"
                            fontSize={15}
                            lineHeight={1.42}
                            letterSpacing={0}
                        />
                    </Group>
                );
            }

            const mode = (el as any).cover ?? (el as any).fit ?? "cover";
            const iw = (img as any).naturalWidth || (img as any).width || 1;
            const ih = (img as any).naturalHeight || (img as any).height || 1;
            const elW = el.width ?? DOC_W;
            const elH = el.height ?? DOC_H;

            const scale = mode === "contain"
                ? Math.min(elW / iw, elH / ih)
                : Math.max(elW / iw, elH / ih);

            const drawW = iw * scale;
            const drawH = ih * scale;
            const cropX = (drawW - elW) / 2 / scale;
            const cropY = (drawH - elH) / 2 / scale;
            const cropW = elW / scale;
            const cropH = elH / scale;

            return (
                <Image
                    x={el.x ?? 0}
                    y={el.y ?? 0}
                    width={elW}
                    height={elH}
                    image={img}
                    opacity={(el as any).opacity ?? 1}
                    rotation={(el as any).rotate ?? 0}
                    cornerRadius={radius}
                    crop={{ x: cropX, y: cropY, width: cropW, height: cropH }}
                    draggable={false}
                    listening={false}
                    shadowColor={(el as any).shadowColor}
                    shadowBlur={(el as any).shadowBlur}
                    shadowOffsetX={(el as any).shadowOffsetX}
                    shadowOffsetY={(el as any).shadowOffsetY}
                    shadowOpacity={(el as any).shadowOpacity}
                />
            );
        }

        if (!activeSlide) {
            return (
                <div className="canvas-shell">
                    <div
                        className="canvas-viewport"
                        style={{ width: DOC_W * clampedZoom, height: DOC_H * clampedZoom }}
                    >
                        <Stage
                            ref={stageRef}
                            width={DOC_W}
                            height={DOC_H}
                            style={{ transform: `scale(${clampedZoom})`, transformOrigin: "top left" }}
                        >
                            <Layer>
                                <Rect x={0} y={0} width={DOC_W} height={DOC_H} fill="#0A0A0A" />
                            </Layer>
                        </Stage>
                    </div>
                </div>
            );
        }

        return (
            <div className="canvas-shell">
                <div
                    className="canvas-viewport"
                    style={{ width: DOC_W * clampedZoom, height: DOC_H * clampedZoom }}
                >
                    <Stage
                        ref={stageRef}
                        width={DOC_W}
                        height={DOC_H}
                        style={{ transform: `scale(${clampedZoom})`, transformOrigin: "top left" }}
                    >
                        <Layer>
                            {/* Renderizar camadas em ordem: background → atmosphere → content → ui */}
                            {renderLayerElements(activeSlide.layers.background ?? [])}
                            {renderLayerElements(activeSlide.layers.atmosphere ?? [])}
                            {renderLayerElements(activeSlide.layers.content ?? [])}
                            {renderLayerElements(activeSlide.layers.ui ?? [])}

                            {/* Borda de safe area (guia visual) */}
                            <Rect
                                x={40}
                                y={40}
                                width={DOC_W - 80}
                                height={DOC_H - 80}
                                stroke="rgba(255,255,255,0.06)"
                                dash={[10, 8]}
                                strokeWidth={1.5}
                                listening={false}
                            />
                        </Layer>
                    </Stage>
                </div>
            </div>
        );
    }
);
