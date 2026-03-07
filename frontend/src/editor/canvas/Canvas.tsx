import { Circle, Group, Image, Layer, Path, Rect, Stage, Text } from "react-konva";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { Carousel, El, Slide } from "./types";
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
    if (/poppins|sora|montserrat|manrope/i.test(raw)) return raw;
    return `${raw}, Manrope`;
}

function toLayeredSlide(slide: Slide & { elements?: El[] }): Slide {
    if (slide?.layers) {
        return slide;
    }

    const background: El[] = [];
    const atmosphere: El[] = [];
    const content: El[] = [];
    const ui: El[] = [];

    for (const el of slide?.elements ?? []) {
        if (el.type === "background") {
            background.push(el);
        } else if (
            el.type === "backgroundImage"
            || el.type === "noise"
            || el.type === "gradientRect"
            || el.type === "glow"
        ) {
            atmosphere.push(el);
        } else if (el.type === "glassCard" || el.type === "image" || el.type === "path" || el.type === "text") {
            content.push(el);
        } else {
            ui.push(el);
        }
    }

    return {
        ...slide,
        layers: {
            background,
            atmosphere,
            content,
            ui,
        },
    };
}

export const Canvas = forwardRef<CanvasRef, CanvasProps>(({ carousel, slideIndex = 0, zoom = 0.56, onExportPNG }, ref) => {
    const stageRef = useRef<any>(null);
    const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

    const activeSlide = useMemo(() => {
        const rawSlide = carousel?.slides[slideIndex] ?? null;
        return rawSlide ? toLayeredSlide(rawSlide as Slide & { elements?: El[] }) : null;
    }, [carousel, slideIndex]);

    useImperativeHandle(ref, () => ({
        exportPNG() {
            const uri = stageRef.current?.toDataURL({ pixelRatio: 2 });
            if (!uri) {
                return;
            }

            const link = document.createElement("a");
            link.href = uri;
            link.download = `slide-${slideIndex + 1}.png`;
            link.click();

            onExportPNG?.(uri);
        },
    }), [onExportPNG, slideIndex]);

    function renderLayerElements(els: El[]) {
        return els.map((el, i) => {
            if (el.type === "background") {
                return (
                    <Rect
                        key={i}
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        fill={el.fill}
                        opacity={el.opacity ?? 1}
                        listening={el.listening ?? false}
                    />
                );
            }

            if (el.type === "backgroundImage" || el.type === "noise") {
                return <ImageElement key={i} el={el} />;
            }

            if (el.type === "gradientRect") {
                const stopsFlat = Array.isArray((el.stops as any[])[0])
                    ? (el.stops as Array<[number, string]>).flat()
                    : (el.stops as Array<number | string>);
                return (
                    <Rect
                        key={i}
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        opacity={el.opacity ?? 1}
                        fillLinearGradientStartPoint={el.kind === "linear" ? el.start : undefined}
                        fillLinearGradientEndPoint={el.kind === "linear" ? el.end : undefined}
                        fillRadialGradientStartPoint={el.kind === "radial" ? el.center : undefined}
                        fillRadialGradientEndPoint={el.kind === "radial" ? el.center : undefined}
                        fillRadialGradientStartRadius={el.kind === "radial" ? 0 : undefined}
                        fillRadialGradientEndRadius={el.kind === "radial" ? (el.radius ?? 600) : undefined}
                        fillLinearGradientColorStops={el.kind === "linear" ? stopsFlat : undefined}
                        fillRadialGradientColorStops={el.kind === "radial" ? stopsFlat : undefined}
                        listening={el.listening ?? false}
                    />
                );
            }

            if (el.type === "glow") {
                return (
                    <Circle
                        key={i}
                        x={el.x}
                        y={el.y}
                        radius={el.r}
                        fill={el.color}
                        opacity={el.opacity}
                        shadowColor={el.color}
                        shadowBlur={el.blur}
                        shadowOffsetX={0}
                        shadowOffsetY={0}
                        shadowOpacity={el.opacity}
                        listening={el.listening ?? false}
                    />
                );
            }

            if (el.type === "glassCard") {
                const sh = el.shadow ?? { blur: 30, y: 14, opacity: 0.22 };
                return (
                    <Rect
                        key={i}
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        cornerRadius={el.radius}
                        fill={el.fill ?? "rgba(255,255,255,0.08)"}
                        stroke={el.stroke ?? "rgba(255,255,255,0.14)"}
                        strokeWidth={el.strokeWidth ?? 1}
                        opacity={el.opacity ?? 1}
                        shadowColor="#000"
                        shadowBlur={sh.blur}
                        shadowOffsetX={0}
                        shadowOffsetY={sh.y}
                        shadowOpacity={sh.opacity}
                        listening={el.listening ?? false}
                    />
                );
            }

            if (el.type === "path") {
                return (
                    <Path
                        key={i}
                        x={el.x}
                        y={el.y}
                        data={el.data}
                        fill={el.fill}
                        draggable={el.draggable ?? false}
                        opacity={el.opacity ?? 1}
                        stroke={el.stroke}
                        strokeWidth={el.strokeWidth}
                        lineCap={el.lineCap}
                        lineJoin={el.lineJoin}
                        shadowColor={el.shadowColor}
                        shadowBlur={el.shadowBlur}
                        shadowOffsetX={el.shadowOffsetX}
                        shadowOffsetY={el.shadowOffsetY}
                        shadowOpacity={el.shadowOpacity}
                        listening={el.listening ?? false}
                    />
                );
            }

            if (el.type === "text") {
                const fontSize = Math.max(18, el.fontSize ?? 32);
                const isHeading = fontSize >= 56;
                const lineHeight = Math.max(1.05, Math.min(1.55, el.lineHeight ?? (isHeading ? 1.12 : 1.3)));
                const letterSpacing = Math.max(-1, Math.min(4, el.letterSpacing ?? (isHeading ? -0.1 : 0)));
                return (
                    <Text
                        key={i}
                        x={el.x}
                        y={el.y}
                        text={el.text}
                        fill={el.fill ?? "#111827"}
                        draggable={el.draggable ?? true}
                        fontSize={fontSize}
                        fontFamily={normalizeFontFamily(el.fontFamily)}
                        fontStyle={normalizeFontStyle(el.fontStyle, isHeading)}
                        width={el.width ?? 860}
                        align={el.align ?? "left"}
                        lineHeight={lineHeight}
                        letterSpacing={letterSpacing}
                        opacity={el.opacity ?? 1}
                        shadowColor={el.shadowColor}
                        shadowBlur={el.shadowBlur}
                        shadowOffsetX={el.shadowOffsetX}
                        shadowOffsetY={el.shadowOffsetY}
                        shadowOpacity={el.shadowOpacity}
                        listening={el.listening ?? true}
                    />
                );
            }

            if (el.type === "image") {
                return <ImageElement key={i} el={el} />;
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
            const promptLabel = prompt ? `Imagem IA\n${prompt}` : "Imagem pendente";
            const labelWidth = Math.max(32, el.width - 40);

            return (
                <Group listening={false}>
                    <Rect
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        fill="rgba(247, 126, 88, 0.08)"
                        stroke="rgba(247, 126, 88, 0.28)"
                        strokeWidth={1}
                        cornerRadius={radius}
                        dash={[12, 8]}
                    />
                    <Text
                        x={el.x + 20}
                        y={el.y + 20}
                        width={labelWidth}
                        text={promptLabel}
                        fill="rgba(17,24,39,0.75)"
                        fontFamily="Manrope"
                        fontStyle="normal"
                        fontSize={16}
                        lineHeight={1.35}
                        letterSpacing={0}
                    />
                </Group>
            );
        }

        const mode = (el as any).cover ?? (el as any).fit ?? "cover";
        const iw = (img as any).naturalWidth || (img as any).width;
        const ih = (img as any).naturalHeight || (img as any).height;

        const scale = mode === "contain"
            ? Math.min(el.width / iw, el.height / ih)
            : Math.max(el.width / iw, el.height / ih);

        const drawW = iw * scale;
        const drawH = ih * scale;

        const cropX = (drawW - el.width) / 2 / scale;
        const cropY = (drawH - el.height) / 2 / scale;
        const cropW = el.width / scale;
        const cropH = el.height / scale;

        return (
            <Image
                x={el.x}
                y={el.y}
                width={el.width}
                height={el.height}
                image={img}
                opacity={(el as any).opacity ?? 1}
                rotation={(el as any).rotate ?? 0}
                cornerRadius={radius}
                crop={{ x: cropX, y: cropY, width: cropW, height: cropH }}
                draggable={!!(el as any).draggable}
                listening={(el as any).listening ?? false}
                shadowColor={(el as any).shadowColor}
                shadowBlur={(el as any).shadowBlur}
                shadowOffsetX={(el as any).shadowOffsetX}
                shadowOffsetY={(el as any).shadowOffsetY}
                shadowOpacity={(el as any).shadowOpacity}
            />
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
                        {renderLayerElements(activeSlide?.layers.background ?? [])}
                        {renderLayerElements(activeSlide?.layers.atmosphere ?? [])}
                        {renderLayerElements(activeSlide?.layers.content ?? [])}
                        {renderLayerElements(activeSlide?.layers.ui ?? [])}

                        <Rect
                            x={40}
                            y={40}
                            width={DOC_W - 80}
                            height={DOC_H - 80}
                            stroke="rgba(16, 24, 40, 0.08)"
                            dash={[12, 10]}
                            strokeWidth={2}
                            listening={false}
                        />
                    </Layer>
                </Stage>
            </div>
        </div>
    );
});

export function useKonvaImage(url?: string) {
    const [img, setImg] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (!url) {
            setImg(null);
            return;
        }

        const image = new window.Image();
        image.crossOrigin = "anonymous";
        image.src = url;

        image.onload = () => setImg(image);
        image.onerror = () => setImg(null);

        return () => {
            setImg(null);
        };
    }, [url]);

    return img;
}
