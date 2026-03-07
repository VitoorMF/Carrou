import { Circle, Image, Layer, Path, Rect, Stage, Text } from "react-konva";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type { Carousel, El } from "./types";
import { useRef, } from "react";
import "./Canvas.css";

const DOC_W = 1080;
const DOC_H = 1350;

export interface CanvasRef {
    exportPNG: () => void;
}

type CanvasProps = {
    carousel: Carousel | null;
    slideIndex?: number;
    onExportPNG?: (dataUrl: string) => void;
};

export const Canvas = forwardRef<CanvasRef, CanvasProps>(({ carousel, slideIndex, onExportPNG }, ref) => {
    const stageRef = useRef<any>(null);
    const activeSlide = carousel?.slides[slideIndex ?? 0] ?? null;

    useImperativeHandle(ref, () => ({
        exportPNG() {
            const uri = stageRef.current?.toDataURL({ pixelRatio: 2 });
            if (!uri) return;

            // Faz o download da imagem localmente
            const a = document.createElement("a");
            a.href = uri;
            a.download = "export.png";
            a.click();

            // Manda o base64 para o pai (EditPage) caso ele queira fazer algo, como salvar no Firebase
            if (onExportPNG) {
                onExportPNG(uri);
            }
        }
    }));

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
                const stopsFlat = el.stops.flat();
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
                const isHeading = (el.fontSize ?? 0) >= 72;
                return (
                    <Text
                        key={i}
                        x={el.x}
                        y={el.y}
                        text={el.text}
                        fill={el.fill}
                        draggable={el.draggable ?? true}
                        fontSize={el.fontSize ?? 32}
                        fontFamily={el.fontFamily ?? "Inter"}
                        fontStyle={el.fontStyle ?? (isHeading ? "600" : "500")}
                        width={el.width}
                        align={el.align ?? "left"}
                        lineHeight={el.lineHeight ?? (isHeading ? 1.06 : 1.25)}
                        letterSpacing={el.letterSpacing ?? (isHeading ? -0.6 : -0.2)}
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
        const img = useKonvaImage(el.url);

        if (!img) {
            return <Rect x={el.x} y={el.y} width={el.width} height={el.height} fill="rgba(255,255,255,0.06)" listening={false} />;
        }

        // cover/contain
        const mode = (el as any).cover ?? "cover";
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

        const radius = (el as any).radius ?? 0;

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

    const previewScale = 0.5;
    const previewW = DOC_W * previewScale;
    const previewH = DOC_H * previewScale;

    return (
        <div className="page-wrapper">
            <div
                className="canvas-container"
                style={{
                    width: previewW,
                    height: previewH,
                }}
            >
                <Stage
                    ref={stageRef}
                    width={previewW}
                    height={previewH}
                >
                    <Layer scaleX={previewScale} scaleY={previewScale}>
                        {renderLayerElements(activeSlide?.layers.background ?? [])}
                        {renderLayerElements(activeSlide?.layers.atmosphere ?? [])}
                        {renderLayerElements(activeSlide?.layers.content ?? [])}
                        {renderLayerElements(activeSlide?.layers.ui ?? [])}
                    </Layer>
                </Stage>
            </div>

            {/* <button onClick={exportPNG}>Export PNG</button>
            <button onClick={navigateToPrevSlide}>{"<"}</button>
            <button onClick={navigateToNextSlide}>{">"}</button> */}
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
        image.crossOrigin = "anonymous"; // importante p/ export (se o servidor permitir)
        image.src = url;

        image.onload = () => setImg(image);
        image.onerror = () => setImg(null);

        return () => {
            // não dá pra "cancelar" load 100%, mas pelo menos solta referência
            setImg(null);
        };
    }, [url]);

    return img;
}