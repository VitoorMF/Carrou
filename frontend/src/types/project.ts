export type Project = {
  id: string;

  ownerId: string;
  status: "ready" | "generating" | "error";

  meta: {
    title: string;
    language: string;
    format: string;
    objective: string;
    audience: string;
    cta: string;
    style: string;
    slideCount: number;
  };

  slides: Slide[];

  createdAt: any;
  updatedAt: any;
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

  canvas: {
    background: {
      type: "solid" | "gradient" | "image";
      value: string;
    };
    elements: CanvasElement[];
  };
};

export type CanvasElement =
  | {
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
    color?: string; // opcional (se preferir hex)
  }
  | {
    id: string;
    type: "shape";
    x: number;
    y: number;
    w: number;
    h: number;
    name: "dots" | "blob" | "wave" | "line" | "circle" | "arrows" | "pillBadge";
    opacity?: number; // 0.03..0.22
    color?: string;   // opcional
    scale?: number;   // 0.8..2.5
  }
  | {
    id: string;
    type: "icon";
    x: number;
    y: number;
    name:
    | "check"
    | "arrow"
    | "star"
    | "lightbulb"
    | "chart"
    | "alert"
    | "idea"
    | "growth";
    size: number;     // px
    color?: string;   // opcional
  };
