export type Carousel = {
  meta: {
    objective: string;
    format: string;
    audience: string;
    cta: string;
    theme: string;
    language: string;
    slideCount: number;
    title: string; // obrigatório
  };
  slides: Array<{
    id: string;
    role: "cover" | "content" | "cta";
    headline: string;
    body: string;        // obrigatório
    bullets: string[];   // obrigatório (pode ser [])
    footer?: string;
    notes?: string;
    design?: {
      layout?: "center" | "left" | "split";
      emphasis?: string[];
    };
  }>;
};

export type GenerateCarouselPayload = {
  prompt: string;
  meta: {
    objective: string;
    format: string;
    audience: string;
    cta: string;
    theme: string;
    language: string;
    slideCount: number;
    title: string;
  };
};




