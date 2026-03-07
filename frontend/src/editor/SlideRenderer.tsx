import { useMemo, useEffect, useState } from "react";
import type { IconName } from "../design-system/icons"; // ajuste o path
import { IconMap } from "../design-system/icons"; // ajuste o path
import type { ShapeName } from "../design-system/shapes"; // ajuste o path
import { ShapeMap } from "../design-system/shapes"; // ajuste o path
import { ProfileCardElView } from "../assets/shapes/ProfileCard";
import { measureTextHeight, clearMeasureCache } from "./autoLayout";

type TextElement = {
    id: string;
    type: "text";
    x: number;
    y: number;
    content: string;
    w?: number;
    h?: number;
    fontSize?: number;
    fontWeight?: number;
    align?: "left" | "center" | "right";
    color?: string;
};

type IconElement = {
    id: string;
    type: "icon";
    x: number;
    y: number;
    name: IconName;
    size?: number; // px
    color?: string; // css color (ou depois ColorRole)
};

export type ImageElement = {
    id: string;
    type: "image";
    x: number;
    y: number;
    w: number;
    h: number;

    // pode ser URL (Storage, CDN, etc) ou caminho local ("/assets/...")
    src: string;
    prompt?: string;
    // como recorta a imagem dentro do retângulo
    fit?: "cover" | "contain";

    // posição do recorte
    pos?: { x: number; y: number }; // 0..1 (default 0.5, 0.5)

    // visual
    opacity?: number; // default 1
    radius?: number;  // borda arredondada
    rotate?: number;  // graus
};

type ShapeElement = {
    id: string;
    type: "shape";
    x: number;
    y: number;
    name: ShapeName;
    w?: number;
    h?: number;
    opacity?: number;
    color?: string;
    scale?: number;
};

type ProfileCardElement = {
    id: string;
    type: "profileCard";
    x: number;
    y: number;
    w: number;
    h: number;
    variant?: "neutral" | "filled";
    user?: { name: string; role?: string; avatarSrc?: string };
    accent?: string;
    opacity?: number;
};


export type SlideElement =
    | TextElement
    | IconElement
    | ShapeElement
    | ImageElement
    | ProfileCardElement;

export type Slide = {
    id: string;
    name: string;
    elements: SlideElement[];
};

type Props = {
    slide: Slide;
    selectedElementId: string | null;
    onSelectElement: (id: string | null) => void;
};

/**
 * Render puro do slide (sem Firebase, sem sidebar, sem scale).
 * O scale continua sendo aplicado no "stage" do EditPage, como você já faz.
 */

export function SlideRenderer({ slide, selectedElementId, onSelectElement }: Props) {
    // Recompute measurements after fonts load to avoid under-measuring when custom fonts are async
    const [fontReadyTick, setFontReadyTick] = useState(0);

    useEffect(() => {
        if (typeof document !== "undefined" && (document as any).fonts?.ready) {
            (document as any).fonts.ready
                .then(() => {
                    // clear cache and trigger recompute
                    try {
                        clearMeasureCache();
                    } catch (e) {
                        // ignore
                    }
                    setFontReadyTick((t) => t + 1);
                })
                .catch(() => {
                    /* ignore */
                });
        }
    }, []);
    // compute an auto layout for main text blocks to avoid overlap
    const computedElements = useMemo(() => {
        // clone elements so we don't mutate props
        const els = (slide.elements ?? []).map((e) => ({ ...e })) as any[];

        function findById(id: string) {
            return els.find((x) => x?.id === id) ?? null;
        }

        const headline = findById("headline");
        const body = findById("body");
        const bullets = findById("bullets");

        if (!headline || !body) return els;

        const extra = 6;
        const gap = 24;

        // account for the element's horizontal padding (CSS .element has 10px left+right)
        const PAD_H = 20; // left+right padding used in .element
        const hWidth = Math.max(8, (headline.w ?? 650) - PAD_H);
        const bWidth = Math.max(8, (body.w ?? 650) - PAD_H);
        const bulletsWidth = Math.max(8, (bullets?.w ?? bWidth) - PAD_H);

        const computedFontFamily =
            typeof document !== "undefined"
                ? getComputedStyle(document.body).fontFamily
                : headline.fontFamily;

        const headlineH =
            measureTextHeight({
                text: (headline.text ?? headline.content) ?? "",
                width: hWidth,
                fontSize: headline.fontSize ?? 48,
                fontWeight: headline.fontWeight ?? 800,
                lineHeight: headline.lineHeight ?? 1.15,
                // allow headline to expand (no artificial clamp here)
                maxLines: (headline as any).maxLines ?? undefined,
                fontFamily: headline.fontFamily ?? computedFontFamily,
            }) + extra;

        headline.h = headlineH;

        body.y = (headline.y ?? 0) + headlineH + gap;

        const bodyH =
            measureTextHeight({
                text: (body.text ?? body.content) ?? "",
                width: bWidth,
                fontSize: body.fontSize ?? 32,
                fontWeight: body.fontWeight ?? 450,
                lineHeight: body.lineHeight ?? 1.2,
                maxLines: (body as any).maxLines ?? undefined,
                fontFamily: body.fontFamily ?? computedFontFamily,
            }) + extra;

        body.h = bodyH;

        if (bullets) {
            bullets.y = body.y + bodyH + gap;
            bullets.h =
                measureTextHeight({
                    text: (bullets.text ?? bullets.content) ?? "",
                    width: bulletsWidth,
                    fontSize: bullets.fontSize ?? 30,
                    fontWeight: bullets.fontWeight ?? 450,
                    lineHeight: bullets.lineHeight ?? 1.3,
                    maxLines: (bullets as any).maxLines ?? undefined,
                    fontFamily: bullets.fontFamily ?? computedFontFamily,
                }) + extra;
        }

        return els;
    }, [slide, fontReadyTick]);

    return (
        <>
            {computedElements.map((el) => {
                if (el.type === "text") {
                    return (
                        <div
                            key={el.id}
                            className={`element ${el.id === selectedElementId ? "selected" : ""}`}
                            style={{
                                position: "absolute",
                                left: el.x,
                                top: el.y,
                                width: el.w,
                                height: el.h,
                                fontSize: el.fontSize,
                                fontWeight: el.fontWeight,
                                textAlign: el.align,
                                whiteSpace: "pre-wrap",
                                lineHeight: el.lineHeight ?? 1.2,
                                color: (el as any).color ?? "inherit",
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                onSelectElement(el.id);
                            }}
                        >
                            {"text" in el ? (el as any).text : (el as any).content}
                        </div>
                    );
                }

                if (el.type === "icon") {
                    const Icon = IconMap[el.name as IconName];

                    if (!Icon) {
                        console.warn("Icon não encontrado:", el.name, IconMap);
                        return null;
                    }

                    const size = el.size ?? 96;

                    return (
                        <div
                            key={el.id}
                            className={`element ${el.id === selectedElementId ? "selected" : ""}`}
                            style={{
                                position: "absolute",
                                left: el.x,
                                top: el.y,
                                width: size,
                                height: size,
                                display: "grid",
                                placeItems: "center",
                                color: el.color ?? "currentColor",
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                onSelectElement(el.id);
                            }}
                        >
                            <Icon size={size} color={el.color ?? "currentColor"} />
                        </div>
                    );
                }

                if (el.type === "shape") {
                    const Shape = ShapeMap[el.name as ShapeName];
                    const w = el.w ?? 240;
                    const h = el.h;

                    return (
                        <div
                            key={el.id}
                            className={`element ${el.id === selectedElementId ? "selected" : ""}`}
                            style={{
                                position: "absolute",
                                left: el.x,
                                top: el.y,
                                width: w,
                                height: h,
                                overflow: "hidden", // importante pra cortar dots/wave no canto
                                color: el.color ?? "currentColor",
                                pointerEvents: "auto",
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                onSelectElement(el.id);
                            }}
                        >
                            <Shape
                                color={el.color ?? "currentColor"}
                                opacity={el.opacity ?? 0.08}
                                scale={el.scale ?? 1}
                            />
                        </div>
                    );
                }

                // dentro do map do SlideRenderer, add antes do return null:

                if (el.type === "image") {
                    const fit = el.cover ?? "cover";
                    const opacity = el.opacity ?? 1;
                    const radius = el.radius ?? 0;
                    const rotate = el.rotate ?? 0;
                    const posX = el.pos?.x ?? 0.5;
                    const posY = el.pos?.y ?? 0.5;

                    return (
                        <div
                            key={el.id}
                            className={`element ${el.id === selectedElementId ? "selected" : ""}`}
                            style={{
                                position: "absolute",
                                left: el.x,
                                top: el.y,
                                width: el.w,
                                height: el.h,
                                overflow: "hidden",
                                borderRadius: radius,
                                opacity,
                                transform: `rotate(${rotate}deg)`,
                                transformOrigin: "center",
                                background: el.src ? "transparent" : "#EEF0F6", // placeholder
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                onSelectElement(el.id);
                            }}
                        >
                            {el.src ? (
                                <img
                                    src={el.src}
                                    alt=""
                                    draggable={false}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: fit,
                                        objectPosition: `${posX * 100}% ${posY * 100}%`,
                                        display: "block",
                                        userSelect: "none",
                                        pointerEvents: "none",
                                    }}
                                />
                            ) : null}
                        </div>
                    );
                }

                if (el.type === "profileCard") {
                    return (
                        <div
                            key={el.id}
                            className={`element ${el.id === selectedElementId ? "selected" : ""}`}
                            style={{
                                position: "absolute",
                                left: el.x,
                                top: el.y,
                                width: el.w,
                                height: el.h,
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                onSelectElement(el.id);
                            }}
                        >
                            <ProfileCardElView el={el as any} onSelect={(id) => onSelectElement(id)} />
                        </div>
                    );
                }



                return null;
            })}
        </>
    );
}
