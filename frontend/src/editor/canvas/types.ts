type Vec2 = { x: number; y: number };

type El =
    | {
        type: "path";
        x: number;
        y: number;
        data: string;
        fill: string;
        draggable?: boolean;
        opacity?: number;
        stroke?: string;
        strokeWidth?: number;
        lineCap?: "butt" | "round" | "square";
        lineJoin?: "miter" | "round" | "bevel";
        shadowColor?: string;
        shadowBlur?: number;
        shadowOffsetX?: number;
        shadowOffsetY?: number;
        shadowOpacity?: number;
        listening?: boolean;
    }
    | {
        type: "text";
        x: number;
        y: number;
        text: string;
        fill: string;
        draggable?: boolean;
        fontSize?: number;
        fontFamily?: string;
        fontStyle?: string;
        width?: number;
        align?: "left" | "center" | "right" | "justify";
        lineHeight?: number;
        letterSpacing?: number;
        opacity?: number;
        listening?: boolean;

        // premium extras (opcional)
        shadowColor?: string;
        shadowBlur?: number;
        shadowOffsetX?: number;
        shadowOffsetY?: number;
        shadowOpacity?: number;
    }
    | {
        type: "image";
        x: number;
        y: number;
        width: number;
        height: number;
        url: string;
        radius?: number;
        rotate?: number;
        opacity?: number;
        cover?: "cover" | "contain";
        draggable?: boolean;
        listening?: boolean;

        // premium extras (opcional)
        shadowColor?: string;
        shadowBlur?: number;
        shadowOffsetX?: number;
        shadowOffsetY?: number;
        shadowOpacity?: number;
    }
    | {
        type: "gradientRect";
        x: number;
        y: number;
        width: number;
        height: number;
        kind: "linear" | "radial";
        start?: Vec2; // linear
        end?: Vec2;   // linear
        center?: Vec2; // radial
        radius?: number; // radial end radius
        stops: Array<[number, string]>;
        opacity?: number;
        listening?: boolean;
    }
    | {
        type: "glow";
        x: number;
        y: number;
        r: number;
        color: string;
        blur: number;
        opacity: number;
        listening?: boolean;
    }
    | {
        type: "glassCard";
        x: number;
        y: number;
        width: number;
        height: number;
        radius: number;
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        opacity?: number;
        shadow?: { blur: number; y: number; opacity: number };
        listening?: boolean;
    }
    | {
        type: "noise";
        x: number;
        y: number;
        width: number;
        height: number;
        url: "/noise.png";
        opacity: number;
        listening?: boolean;
    }
    | {
        type: "background";
        fill: string;
        x: number;
        y: number;
        width: number;
        height: number;
        opacity?: number;
        listening?: boolean;
    }
    | {
        type: "backgroundImage";
        x: number;
        y: number;
        width: number;
        height: number;
        url: string;
        opacity?: number;
        listening?: boolean;
    };

type Slide = {
    id?: string;
    layers: {
        background: El[];
        atmosphere: El[];
        content: El[];
        ui: El[];
    };
};

type Carousel = { meta: { theme: string; title: string }; slides: Slide[] };


export type { Vec2, El, Slide, Carousel };