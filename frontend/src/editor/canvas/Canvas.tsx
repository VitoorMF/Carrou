import { Circle, Group, Image, Layer, Line, Path, Rect, Stage, Text } from "react-konva";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { Carousel, El, Slide } from "./types";
import { useKonvaImage } from "./hooks/useKonvaImage";
import { ShapeRenderer } from "./renderers/ShapeRenderer";
import { ProfileCardRenderer } from "./renderers/ProfileCardRenderer";
import "./Canvas.css";

const DOC_W = 1080;
const DOC_H = 1350;
const SNAP_THRESHOLD = 10;

export interface CanvasRef {
    exportPNG: () => void;
    getPNGDataUrl: () => string | null;
}

type CanvasProps = {
    carousel: Carousel | null;
    slideIndex?: number;
    zoom?: number;
    onExportPNG?: (dataUrl: string) => void;
    selectedElementId?: string | null;
    onSelectElement?: (elementId: string | null) => void;
    onElementLivePositionChange?: (elementId: string, position: { x: number; y: number }) => void;
    onElementPositionChange?: (elementId: string, position: { x: number; y: number }) => void;
};

type GuideLine = {
    axis: "x" | "y";
    position: number;
};

type CanvasImageElementProps = {
    el: Extract<El, { type: "image" | "backgroundImage" | "noise" }>;
    renderedPosition: { x: number; y: number };
    selected: boolean;
    isSelectable: boolean;
    isDraggable: boolean;
    onSelect: () => void;
    onDragMove: (event: any) => void;
    onDragEnd: (event: any) => void;
};

const MIN_ZOOM = 0.1;
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

function useLoadingPhase(active: boolean) {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        if (!active) {
            setPhase(0);
            return;
        }

        let frameId = 0;
        let start = performance.now();

        const tick = (now: number) => {
            const elapsed = now - start;
            setPhase((elapsed % 1800) / 1800);
            frameId = window.requestAnimationFrame(tick);
        };

        frameId = window.requestAnimationFrame(tick);

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [active]);

    return phase;
}

function CanvasImageElement({
    el,
    renderedPosition,
    selected,
    isSelectable,
    isDraggable,
    onSelect,
    onDragMove,
    onDragEnd,
}: CanvasImageElementProps) {
    const imageUrl = (el as any).url ?? (el as any).src;
    const img = useKonvaImage(imageUrl);
    const radius = (el as any).radius ?? (el as any).borderRadius ?? 0;
    const status = String((el as any).status ?? "idle");
    const isPending = status === "pending";
    const loadingPhase = useLoadingPhase(isPending);

    if (!img) {
        const isBackground = el.type === "backgroundImage";
        const boxWidth = isBackground ? (el.width ?? DOC_W) : (el.width ?? 400);
        const boxHeight = isBackground ? (el.height ?? DOC_H) : (el.height ?? 300);
        const cx = boxWidth / 2;
        const cy = boxHeight / 2;

        // Pulso suave: 0.18 → 0.42 → 0.18
        const pulse = 0.18 + Math.sin(loadingPhase * Math.PI) * 0.24;

        return (
            <Group
                x={renderedPosition.x}
                y={renderedPosition.y}
                listening={isSelectable}
                draggable={isDraggable}
                onClick={onSelect}
                onTap={onSelect}
                onDragMove={onDragMove}
                onDragEnd={onDragEnd}
            >
                {/* Base */}
                <Rect
                    x={0}
                    y={0}
                    width={boxWidth}
                    height={boxHeight}
                    fill={isPending ? "rgba(14,18,30,0.72)" : "rgba(14,18,30,0.52)"}
                    cornerRadius={radius || (isBackground ? 0 : 4)}
                    listening={isSelectable}
                />

                {/* Borda sutil — selecionado vira azul */}
                <Rect
                    x={0}
                    y={0}
                    width={boxWidth}
                    height={boxHeight}
                    fill="transparent"
                    cornerRadius={radius || (isBackground ? 0 : 4)}
                    stroke={
                        selected
                            ? "rgba(20,93,243,0.85)"
                            : isPending
                                ? `rgba(100,130,220,${0.22 + pulse * 0.6})`
                                : "rgba(255,255,255,0.10)"
                    }
                    strokeWidth={selected ? 2 : 1}
                    listening={false}
                />

                {isPending ? (
                    <>
                        {/* Três barras animadas — skeleton minimalista */}
                        <Rect
                            x={cx - 48}
                            y={cy - 28}
                            width={96}
                            height={6}
                            cornerRadius={3}
                            fill={`rgba(160,185,255,${pulse * 1.6})`}
                            listening={false}
                        />
                        <Rect
                            x={cx - 32}
                            y={cy - 12}
                            width={64}
                            height={4}
                            cornerRadius={2}
                            fill={`rgba(130,160,240,${pulse})`}
                            listening={false}
                        />
                        <Rect
                            x={cx - 20}
                            y={cy + 4}
                            width={40}
                            height={3}
                            cornerRadius={2}
                            fill={`rgba(110,140,220,${pulse * 0.7})`}
                            listening={false}
                        />
                    </>
                ) : (
                    <>
                        {/* Ícone de imagem — dois triângulos + círculo, estilo wireframe */}
                        <Circle
                            x={cx - 14}
                            y={cy - 14}
                            radius={7}
                            stroke="rgba(255,255,255,0.22)"
                            strokeWidth={1.5}
                            fill="transparent"
                            listening={false}
                        />
                        <Path
                            x={cx - 28}
                            y={cy - 2}
                            data="M0,24 L18,4 L30,16 L42,8 L56,24 Z"
                            fill="rgba(255,255,255,0.10)"
                            stroke="rgba(255,255,255,0.20)"
                            strokeWidth={1.2}
                            listening={false}
                        />
                    </>
                )}
            </Group>
        );
    }

    // — imagem carregada, igual ao original —
    const mode = (el as any).cover ?? (el as any).fit ?? "cover";
    const iw = (img as any).naturalWidth || (img as any).width || 1;
    const ih = (img as any).naturalHeight || (img as any).height || 1;
    const elW = el.width ?? DOC_W;
    const elH = el.height ?? DOC_H;
    const scale = mode === "contain" ? Math.min(elW / iw, elH / ih) : Math.max(elW / iw, elH / ih);
    const drawW = iw * scale;
    const drawH = ih * scale;
    const cropX = (drawW - elW) / 2 / scale;
    const cropY = (drawH - elH) / 2 / scale;
    const cropW = elW / scale;
    const cropH = elH / scale;

    return (
        <Group
            x={renderedPosition.x}
            y={renderedPosition.y}
            listening={isSelectable}
            draggable={isDraggable}
            onClick={onSelect}
            onTap={onSelect}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
        >
            <Image
                x={0}
                y={0}
                width={elW}
                height={elH}
                image={img}
                opacity={(el as any).opacity ?? 1}
                rotation={(el as any).rotate ?? 0}
                cornerRadius={radius}
                crop={{ x: cropX, y: cropY, width: cropW, height: cropH }}
                listening={isSelectable}
                shadowColor={(el as any).shadowColor}
                shadowBlur={(el as any).shadowBlur}
                shadowOffsetX={(el as any).shadowOffsetX}
                shadowOffsetY={(el as any).shadowOffsetY}
                shadowOpacity={(el as any).shadowOpacity}
            />
            {selected && (
                <Rect
                    x={0}
                    y={0}
                    width={elW}
                    height={elH}
                    cornerRadius={radius}
                    stroke="rgba(20,93,243,0.85)"
                    strokeWidth={2}
                    dash={[10, 8]}
                    listening={false}
                />
            )}
        </Group>
    );
}

function SelectableText({
    el,
    displayText,
    fontSize,
    fontFamily,
    fontStyle,
    textWidth,
    align,
    lineHeight,
    letterSpacing,
    position,
    selected,
    draggable,
    onSelect,
    onDragMove,
    onDragEnd,
}: {
    el: Extract<El, { type: "text" }>;
    displayText: string;
    fontSize: number;
    fontFamily: string;
    fontStyle: string;
    textWidth: number;
    align: string;
    lineHeight: number;
    letterSpacing: number;
    position: { x: number; y: number };
    selected: boolean;
    draggable: boolean;
    onSelect: () => void;
    onDragMove: (event: any) => void;
    onDragEnd: (event: any) => void;
}) {
    const [measuredHeight, setMeasuredHeight] = useState(0);

    const textRef = useCallback((node: any) => {
        if (node) {
            setMeasuredHeight(node.height());
        }
    }, [displayText, fontSize, fontFamily, textWidth, lineHeight, letterSpacing]);

    return (
        <Group
            x={position.x}
            y={position.y}
            draggable={draggable}
            onClick={onSelect}
            onTap={onSelect}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
        >
            <Text
                ref={textRef}
                text={displayText}
                fill={el.fill ?? "#FFFFFF"}
                fontSize={fontSize}
                fontFamily={fontFamily}
                fontStyle={fontStyle}
                width={textWidth}
                align={align}
                lineHeight={lineHeight}
                letterSpacing={letterSpacing}
                opacity={el.opacity ?? 1}
                shadowColor={el.shadowColor}
                shadowBlur={el.shadowBlur}
                shadowOffsetX={el.shadowOffsetX}
                shadowOffsetY={el.shadowOffsetY}
                shadowOpacity={el.shadowOpacity}
                listening
            />
            {selected && measuredHeight > 0 && (
                <Rect
                    x={0}
                    y={0}
                    width={textWidth}
                    height={measuredHeight}
                    stroke="rgba(20,93,243,0.85)"
                    strokeWidth={2}
                    dash={[10, 8]}
                    listening={false}
                />
            )}
        </Group>
    );
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
    ({
        carousel,
        slideIndex = 0,
        zoom = 0.56,
        onExportPNG,
        selectedElementId,
        onSelectElement,
        onElementLivePositionChange,
        onElementPositionChange,
    }, ref) => {
        const stageRef = useRef<any>(null);
        const [guideLines, setGuideLines] = useState<GuideLine[]>([]);
        const [dragPreviewPositions, setDragPreviewPositions] = useState<Record<string, { x: number; y: number }>>({});
        const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

        const activeSlide = useMemo(() => {
            const rawSlide = carousel?.slides[slideIndex] ?? null;
            return rawSlide ? toLayeredSlide(rawSlide as Slide & { elements?: El[] }) : null;
        }, [carousel, slideIndex]);

        const snapTargets = useMemo(() => {
            const elements = [
                ...(activeSlide?.layers?.content ?? []),
                ...(activeSlide?.layers?.ui ?? []),
            ];

            return elements
                .map((element) => {
                    const elementId = typeof (element as any).id === "string" ? (element as any).id : null;
                    if (!elementId) return null;

                    const bounds = getElementBounds(element);
                    if (!bounds) return null;

                    return {
                        id: elementId,
                        bounds,
                    };
                })
                .filter((entry): entry is { id: string; bounds: ElementBounds } => entry !== null);
        }, [activeSlide]);

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
            getPNGDataUrl() {
                return stageRef.current?.toDataURL({ pixelRatio: 2 }) ?? null;
            },
        }), [onExportPNG, slideIndex]);

        function isSelected(el: El) {
            return typeof (el as any).id === "string" && (el as any).id === selectedElementId;
        }

        function isMovable(el: El) {
            return el.type === "text" || el.type === "image";
        }

        function getElementId(el: El) {
            return typeof (el as any).id === "string" ? (el as any).id : null;
        }

        function getRenderedPosition(el: El) {
            const elementId = getElementId(el);
            if (!elementId) {
                return {
                    x: (el as any).x ?? 0,
                    y: (el as any).y ?? 0,
                };
            }

            const preview = dragPreviewPositions[elementId];
            if (preview) {
                return preview;
            }

            return {
                x: (el as any).x ?? 0,
                y: (el as any).y ?? 0,
            };
        }

        function selectElement(el: El) {
            const elementId = getElementId(el);
            onSelectElement?.(elementId);
        }

        function emitElementPosition(
            el: El,
            target: { x: () => number; y: () => number },
            mode: "live" | "commit"
        ) {
            const elementId = getElementId(el);
            if (!elementId) return;
            const position = {
                x: target.x(),
                y: target.y(),
            };

            if (mode === "live") {
                onElementLivePositionChange?.(elementId, position);
                return;
            }

            onElementPositionChange?.(elementId, position);
        }

        function handleDragMove(el: El, target: { x: () => number; y: () => number; position: (pos: { x: number; y: number }) => void }) {
            const elementId = getElementId(el);
            if (!elementId) return;

            const draggedBounds = getElementBounds(el, { x: target.x(), y: target.y() });
            if (!draggedBounds) {
                emitElementPosition(el, target, "live");
                return;
            }

            const snap = findSnapForBounds(
                draggedBounds,
                snapTargets.filter((entry) => entry.id !== elementId)
            );

            if (snap) {
                target.position({ x: snap.x, y: snap.y });
                setDragPreviewPositions((current) => ({
                    ...current,
                    [elementId]: { x: snap.x, y: snap.y },
                }));
                setGuideLines(snap.guides);
            } else {
                setDragPreviewPositions((current) => ({
                    ...current,
                    [elementId]: { x: target.x(), y: target.y() },
                }));
                setGuideLines([]);
            }

            emitElementPosition(el, target, "live");
        }

        function handleDragEnd(el: El, target: { x: () => number; y: () => number }) {
            const elementId = getElementId(el);
            if (elementId) {
                setDragPreviewPositions((current) => {
                    const next = { ...current };
                    delete next[elementId];
                    return next;
                });
            }
            setGuideLines([]);
            emitElementPosition(el, target, "commit");
        }

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
                    return (
                        <CanvasImageElement
                            key={`bgimg_${i}`}
                            el={el}
                            renderedPosition={getRenderedPosition(el)}
                            selected={isSelected(el)}
                            isSelectable={el.type === "backgroundImage"}
                            isDraggable={false}
                            onSelect={() => selectElement(el)}
                            onDragMove={(event) => handleDragMove(el, event.target)}
                            onDragEnd={(event) => handleDragEnd(el, event.target)}
                        />
                    );
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
                    const textEl = el as Extract<El, { type: "text" }>;
                    // Suporte a ambos os campos: text (novo normalize) e content (legado editor)
                    const displayText = textEl.text ?? (el as any).content ?? "";
                    const fontSize = Math.max(14, textEl.fontSize ?? 32);
                    const isHeading = fontSize >= 52;
                    const lineHeight = Math.max(0.88, Math.min(1.6, textEl.lineHeight ?? (isHeading ? 1.05 : 1.35)));
                    const letterSpacing = Math.max(-8, Math.min(8, textEl.letterSpacing ?? (isHeading ? -1 : 0)));

                    const textWidth = textEl.width ?? DOC_W - 144;

                    return (
                        <SelectableText
                            key={`text_${i}`}
                            el={textEl}
                            displayText={displayText}
                            fontSize={fontSize}
                            fontFamily={normalizeFontFamily(textEl.fontFamily)}
                            fontStyle={normalizeFontStyle(textEl.fontStyle, isHeading)}
                            textWidth={textWidth}
                            align={textEl.align ?? "left"}
                            lineHeight={lineHeight}
                            letterSpacing={letterSpacing}
                            position={getRenderedPosition(el)}
                            selected={isSelected(el)}
                            draggable={isMovable(el) && isSelected(el)}
                            onSelect={() => selectElement(el)}
                            onDragMove={(event) => handleDragMove(el, event.target)}
                            onDragEnd={(event) => handleDragEnd(el, event.target)}
                        />
                    );
                }

                // ── IMAGE ────────────────────────────────────────────────────
                if (el.type === "image") {
                    return (
                        <CanvasImageElement
                            key={`img_${i}`}
                            el={el}
                            renderedPosition={getRenderedPosition(el)}
                            selected={isSelected(el)}
                            isSelectable
                            isDraggable={isSelected(el)}
                            onSelect={() => selectElement(el)}
                            onDragMove={(event) => handleDragMove(el, event.target)}
                            onDragEnd={(event) => handleDragEnd(el, event.target)}
                        />
                    );
                }

                return null;
            });
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
            <div className="canvas-shell" onClick={(e) => { if (e.target === e.currentTarget) onSelectElement?.(null); }}>
                <div
                    className="canvas-viewport"
                    style={{ width: DOC_W * clampedZoom, height: DOC_H * clampedZoom }}
                >
                    <Stage
                        ref={stageRef}
                        width={DOC_W}
                        height={DOC_H}
                        style={{ transform: `scale(${clampedZoom})`, transformOrigin: "top left" }}
                        onMouseDown={(event) => {
                            if (event.target === event.target.getStage()) {
                                setGuideLines([]);
                                onSelectElement?.(null);
                            }
                        }}
                        onTouchStart={(event) => {
                            if (event.target === event.target.getStage()) {
                                setGuideLines([]);
                                onSelectElement?.(null);
                            }
                        }}
                    >
                        <Layer>
                            {/* Renderizar camadas em ordem: background → atmosphere → content → ui */}
                            {renderLayerElements(activeSlide.layers.background ?? [])}
                            {renderLayerElements(activeSlide.layers.atmosphere ?? [])}
                            {renderLayerElements(activeSlide.layers.content ?? [])}
                            {renderLayerElements(activeSlide.layers.ui ?? [])}

                            {guideLines.map((guide, index) => (
                                guide.axis === "x" ? (
                                    <Line
                                        key={`guide_x_${index}`}
                                        points={[guide.position, 0, guide.position, DOC_H]}
                                        stroke="rgba(20,93,243,0.72)"
                                        strokeWidth={1.5}
                                        dash={[10, 8]}
                                        listening={false}
                                    />
                                ) : (
                                    <Line
                                        key={`guide_y_${index}`}
                                        points={[0, guide.position, DOC_W, guide.position]}
                                        stroke="rgba(20,93,243,0.72)"
                                        strokeWidth={1.5}
                                        dash={[10, 8]}
                                        listening={false}
                                    />
                                )
                            ))}

                        </Layer>
                    </Stage>
                </div>
            </div>
        );
    }
);

type ElementBounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

function getElementBounds(el: El, positionOverride?: { x: number; y: number }): ElementBounds | null {
    const x = positionOverride?.x ?? (el as any).x ?? 0;
    const y = positionOverride?.y ?? (el as any).y ?? 0;

    if (el.type === "text") {
        const text = String((el as any).text ?? (el as any).content ?? "");
        const fontSize = Math.max(14, (el as any).fontSize ?? 32);
        const width = Math.max(40, (el as any).width ?? 320);
        const lineHeight = Math.max(0.88, Math.min(1.6, (el as any).lineHeight ?? (fontSize >= 52 ? 1.05 : 1.35)));
        const estimatedLines = Math.max(1, text.split("\n").length);
        return {
            x,
            y,
            width,
            height: Math.ceil(fontSize * lineHeight * estimatedLines),
        };
    }

    if (el.type === "image") {
        return {
            x,
            y,
            width: (el as any).width ?? 400,
            height: (el as any).height ?? 300,
        };
    }

    if (el.type === "shape" || el.type === "profileCard") {
        return {
            x,
            y,
            width: (el as any).w ?? 200,
            height: (el as any).h ?? 120,
        };
    }

    if (el.type === "glassCard") {
        return {
            x,
            y,
            width: (el as any).width ?? 200,
            height: (el as any).height ?? 120,
        };
    }

    return null;
}

function getGuidePoints(bounds: ElementBounds) {
    return {
        x: [
            { key: "left", value: bounds.x },
            { key: "center", value: bounds.x + bounds.width / 2 },
            { key: "right", value: bounds.x + bounds.width },
        ],
        y: [
            { key: "top", value: bounds.y },
            { key: "middle", value: bounds.y + bounds.height / 2 },
            { key: "bottom", value: bounds.y + bounds.height },
        ],
    };
}

function findSnapForBounds(
    draggedBounds: ElementBounds,
    targets: Array<{ id: string; bounds: ElementBounds }>
) {
    const draggedGuides = getGuidePoints(draggedBounds);
    let bestX: { delta: number; position: number } | null = null;
    let bestY: { delta: number; position: number } | null = null;

    for (const target of targets) {
        const targetGuides = getGuidePoints(target.bounds);

        for (const sourceGuide of draggedGuides.x) {
            for (const targetGuide of targetGuides.x) {
                const delta = targetGuide.value - sourceGuide.value;
                if (Math.abs(delta) > SNAP_THRESHOLD) continue;
                if (!bestX || Math.abs(delta) < Math.abs(bestX.delta)) {
                    bestX = { delta, position: targetGuide.value };
                }
            }
        }

        for (const sourceGuide of draggedGuides.y) {
            for (const targetGuide of targetGuides.y) {
                const delta = targetGuide.value - sourceGuide.value;
                if (Math.abs(delta) > SNAP_THRESHOLD) continue;
                if (!bestY || Math.abs(delta) < Math.abs(bestY.delta)) {
                    bestY = { delta, position: targetGuide.value };
                }
            }
        }
    }

    if (!bestX && !bestY) {
        return null;
    }

    return {
        x: draggedBounds.x + (bestX?.delta ?? 0),
        y: draggedBounds.y + (bestY?.delta ?? 0),
        guides: [
            ...(bestX ? [{ axis: "x" as const, position: bestX.position }] : []),
            ...(bestY ? [{ axis: "y" as const, position: bestY.position }] : []),
        ],
    };
}
