export type Background = {
    type: "solid" | "gradient"; // (image fica pra depois)
    value: string;
};

export type IconName =
    | "check"
    | "arrow"
    | "star"
    | "lightbulb"
    | "chart"
    | "alert"
    | "idea"
    | "growth";

export type ShapeName = "dots" | "blob" | "wave" | "line" | "circle" | "arrows" | "pillBadge";

export type CanvasTextElement = {
    id: string;
    type: "text";
    x: number;
    y: number;
    w: number;
    h: number;
    text: string;
    fontSize: number;
    fontWeight?: number;
    align?: "left" | "center" | "right";
    color?: string;
};

export type CanvasIconElement = {
    id: string;
    type: "icon";
    x: number;
    y: number;
    name: IconName;
    size: number;
    color?: string;
};

export type CanvasShapeElement = {
    id: string;
    type: "shape";
    x: number;
    y: number;
    w: number;
    h: number;
    name: ShapeName;
    opacity?: number;
    color?: string;
    scale?: number;
};

export type CanvasElement = CanvasTextElement | CanvasIconElement | CanvasShapeElement;

export type SlideCanvas = {
    background: Background;
    elements: CanvasElement[];
};

export type Slide = {
    id: string;
    role: "cover" | "content" | "cta";
    headline: string;
    body: string;
    bullets: string[];
    footer?: string;
    design?: {
        layout?: "center" | "text-left" | "text-right";
        emphasis?: string[];
    };
    canvas: SlideCanvas;
};

export type Carousel = {
    meta: {
        title: string;
        language: string;
        format: string;
        objective: string;
        audience: string;
        cta: string;
        style: "clean" | "bold" | "playful";
        slideCount: number;
    };
    slides: Slide[];
};
