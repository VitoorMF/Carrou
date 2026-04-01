import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Canvas } from "../../editor/canvas/Canvas";
import type { Carousel as CanvasCarousel } from "../../editor/canvas/types";
import type { Carousel as LayoutCarousel } from "../../types/caroussel";
import {
  buildLayeredTemplateCarousel,
  type ResolvedPalette,
  type TemplateId,
} from "../../../../shared/templateEngine";
import "./TemplatePreview.css";
import logo from "../../assets/page/landing/logo.svg";

type PaletteKey = "default" | "ocean" | "forest" | "sunset" | "lavender" | "rose" | "sand";

const TEMPLATE_OPTIONS: { id: TemplateId; label: string }[] = [
  { id: "microBlogBold", label: "Micro Blog Bold" },
  { id: "editorial3D", label: "Editorial 3D" },
  { id: "luxuryMinimal", label: "Luxury Minimal" },
  { id: "streetwearPro", label: "Streetwear Pro" },
  { id: "glassEditorial", label: "Glass Editorial" },
];

const PALETTE_PRESETS: Record<PaletteKey, { label: string; swatch: string; palette: Partial<ResolvedPalette> | null }> = {
  default: { label: "Default", swatch: "#888", palette: null },
  ocean: { label: "Ocean", swatch: "#00B4D8", palette: { bg: "#0A1628", text: "#E8F4F8", muted: "#7BAFC4", accent: "#00B4D8", accent2: "#0077B6" } },
  forest: { label: "Forest", swatch: "#4CAF50", palette: { bg: "#0D1F0D", text: "#E8F5E9", muted: "#81C784", accent: "#4CAF50", accent2: "#2E7D32" } },
  sunset: { label: "Sunset", swatch: "#FF6B35", palette: { bg: "#1A0500", text: "#FFF8F0", muted: "#D4956A", accent: "#FF6B35", accent2: "#F7931A" } },
  lavender: { label: "Lavender", swatch: "#A855F7", palette: { bg: "#1A0A2E", text: "#F3E8FF", muted: "#C084FC", accent: "#A855F7", accent2: "#7C3AED" } },
  rose: { label: "Rose", swatch: "#F43F5E", palette: { bg: "#1A0508", text: "#FFF0F3", muted: "#F9A8B8", accent: "#F43F5E", accent2: "#E11D48" } },
  sand: { label: "Sand", swatch: "#D4883A", palette: { bg: "#F5EFE6", text: "#2C1A0E", muted: "#8B6A4E", accent: "#D4883A", accent2: "#9E5A1F" } },
};

// string = mesma imagem em todos os slides; string[] = uma por slide
const DEMO_IMAGE_BY_TEMPLATE: Record<TemplateId, string | string[]> = {
  streetwearPro: [
    "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/images%2FstreetWear%2Fprojects-Y1TNivb24RAtw1qawLQU-slides-s3-hero_2.png?alt=media&token=0ed89ea8-2c34-4ad4-802a-5311a5a4e1eb",
    "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/images%2FstreetWear%2Fprojects-Y1TNivb24RAtw1qawLQU-slides-s3-hero_2.png?alt=media&token=0ed89ea8-2c34-4ad4-802a-5311a5a4e1eb",
    "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/images%2FstreetWear%2Fprojects-Y1TNivb24RAtw1qawLQU-slides-s1-hero_0.png?alt=media&token=76489979-7c66-4ffd-88b1-64f59282b765",
    "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/images%2FstreetWear%2Fprojects-Y1TNivb24RAtw1qawLQU-slides-s1-hero_0.png?alt=media&token=76489979-7c66-4ffd-88b1-64f59282b765",
    "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/images%2FstreetWear%2Fprojects-Y1TNivb24RAtw1qawLQU-slides-s1-hero_0.png?alt=media&token=76489979-7c66-4ffd-88b1-64f59282b765",
  ],
  editorial3D: [
    "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/images%2Feditorial3d%2Fs1%2Fprojects-AaqWwXPqVJJqRKGCjuCg-slides-s3-hero_2.png?alt=media&token=d76298f5-e229-4309-8987-ba5ae1c127b1",
    "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/images%2Feditorial3d%2Fs3%2Fprojects-OzxmbqNwYak5BABBU2jg-slides-s3-hero_2.png?alt=media&token=145186ef-1831-49e7-8329-a5f9ecae5474",
    "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/images%2Feditorial3d%2Fs2%2Fprojects-hGA5PByvoiJUiS9c9AaV-slides-s5-hero_4.png?alt=media&token=af6d9476-185f-4210-9fd6-e6ee86344b17",
    "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/images%2Feditorial3d%2Fs4%2Fprojects-AaqWwXPqVJJqRKGCjuCg-slides-s6-hero_5.png?alt=media&token=8516b057-91e5-4b71-bc7d-5ed65f329393",
    "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/images%2Feditorial3d%2Fs5%2Fprojects-AaqWwXPqVJJqRKGCjuCg-slides-s7-hero_6.png?alt=media&token=8897191c-ad85-4cf7-a655-224bd45a6519",
  ],
  luxuryMinimal: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1080&q=80",
  microBlogBold: [
    "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/images%2FmicroBlogBold%2Fprojects-v0fyM9S9e4eru3ia3MrU-slides-s1-hero_0.png?alt=media&token=3bd11fcc-a1f0-403c-97b5-7760a5a6675d",
    "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/images%2FmicroBlogBold%2Fprojects-v0fyM9S9e4eru3ia3MrU-slides-s1-hero_0.png?alt=media&token=3bd11fcc-a1f0-403c-97b5-7760a5a6675d",
    "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/images%2FmicroBlogBold%2Fprojects-v0fyM9S9e4eru3ia3MrU-slides-s3-hero_2.png?alt=media&token=fbb51651-6abc-4087-b04e-b3919f82db50",
    "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/images%2FmicroBlogBold%2Fprojects-v0fyM9S9e4eru3ia3MrU-slides-s1-hero_0.png?alt=media&token=3bd11fcc-a1f0-403c-97b5-7760a5a6675d",
    "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/images%2FmicroBlogBold%2Fprojects-v0fyM9S9e4eru3ia3MrU-slides-s1-hero_0.png?alt=media&token=3bd11fcc-a1f0-403c-97b5-7760a5a6675d",
  ],
  glassEditorial: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1080&q=80",
};

const MOCK_CAROUSEL: LayoutCarousel = {
  meta: {
    objective: "engajar",
    format: "instagram_carousel",
    audience: "criadores e infoprodutores",
    cta: "salvar",
    theme: "clean",
    language: "pt-BR",
    slideCount: 5,
    title: "3 ajustes simples para elevar seu design",
  },
  slides: [
    {
      id: "s1",
      role: "cover",
      headline: "3 ajustes simples para elevar seu design",
      body: "Você não precisa reinventar o layout. Só precisa hierarquia, ritmo e contraste bem controlados.",
      bullets: [],
    },
    {
      id: "s2",
      role: "content",
      headline: "1) Hierarquia tipográfica",
      body: "Defina 1 título dominante, 1 texto de apoio e 1 detalhe secundário. Sem isso, tudo compete por atenção.",
      bullets: ["Título com peso alto", "Corpo com respiro", "Detalhes discretos"],
    },
    {
      id: "s3",
      role: "content",
      headline: "2) Ritmo visual entre slides",
      body: "Alterne composições para evitar repetição cansativa, mantendo consistência de identidade.",
      bullets: ["Alternar blocos", "Manter paleta", "Preservar alinhamentos"],
    },
    {
      id: "s4",
      role: "content",
      headline: "3) Contraste com intenção",
      body: "Use contraste para guiar leitura, não só para enfeitar. Tudo deve servir ao entendimento.",
      bullets: ["Fundo x texto", "Ênfase no CTA", "Redução de ruído"],
    },
    {
      id: "s5",
      role: "cta",
      headline: "Quer mais exemplos práticos?",
      body: "Salva esse post e me chama que eu monto outro breakdown.",
      bullets: ["Salve", "Compartilhe", "Aplique hoje"],
    },
  ],
};

function applyPreviewImage(carousel: CanvasCarousel, images: string | string[]): CanvasCarousel {
  return {
    ...carousel,
    slides: carousel.slides.map((slide, index) => {
      const url = Array.isArray(images) ? (images[index] ?? images[0]) : images;
      return {
        ...slide,
        layers: {
          background: (slide.layers?.background ?? []).map((element: any) =>
            element.type === "image" || element.type === "backgroundImage"
              ? { ...element, src: url, url, status: "ready" }
              : element
          ),
          atmosphere: (slide.layers?.atmosphere ?? []).map((element: any) =>
            element.type === "image" || element.type === "backgroundImage"
              ? { ...element, src: url, url, status: "ready" }
              : element
          ),
          content: (slide.layers?.content ?? []).map((element: any) =>
            element.type === "image" || element.type === "backgroundImage"
              ? { ...element, src: url, url, status: "ready" }
              : element
          ),
          ui: slide.layers?.ui ?? [],
        },
      };
    }),
  };
}

function useCanvasZoom(isMobile: boolean) {
  function calc() {
    if (isMobile) {
      // mobile: full width minus nav buttons and padding
      const byWidth = (window.innerWidth - 96) / 1080;
      // ~160px for header + controls bar
      const byHeight = (window.innerHeight - 220) / 1350;
      return Math.min(0.45, Math.max(0.18, Math.min(byWidth, byHeight)));
    }
    const panelWidth = 280;
    const byWidth = (window.innerWidth - panelWidth - 80) / 1080;
    const byHeight = (window.innerHeight - 120) / 1350;
    return Math.min(0.52, Math.max(0.2, Math.min(byWidth, byHeight)));
  }
  const [zoom, setZoom] = useState(calc);
  useEffect(() => {
    function update() { setZoom(calc()); }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);
  return zoom;
}

export default function TemplatePreview() {
  const [templateId, setTemplateId] = useState<TemplateId>("microBlogBold");
  const [paletteKey, setPaletteKey] = useState<PaletteKey>("default");
  const [slideIndex, setSlideIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    function update() { setIsMobile(window.innerWidth <= 768); }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const zoom = useCanvasZoom(isMobile);
  const selectedPalette = PALETTE_PRESETS[paletteKey];

  const carousel = useMemo(() => {
    const built = buildLayeredTemplateCarousel(
      templateId,
      MOCK_CAROUSEL as any,
      selectedPalette.palette ?? undefined
    ) as unknown as CanvasCarousel;
    return applyPreviewImage(built, DEMO_IMAGE_BY_TEMPLATE[templateId]);
  }, [templateId, selectedPalette]);

  const slideCount = carousel.slides.length;

  function handleTemplateChange(id: TemplateId) {
    setTemplateId(id);
    setSlideIndex(0);
  }

  const controls = (
    <>
      <div className="tp_template_list">
        {TEMPLATE_OPTIONS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tp_template_item${templateId === t.id ? " tp_template_item--active" : ""}`}
            onClick={() => handleTemplateChange(t.id)}
          >
            <span className="tp_template_dot" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="tp_palette_row">
        {(Object.entries(PALETTE_PRESETS) as [PaletteKey, (typeof PALETTE_PRESETS)[PaletteKey]][]).map(
          ([key, preset]) => (
            <button
              key={key}
              type="button"
              className={`tp_palette_dot${paletteKey === key ? " tp_palette_dot--active" : ""}`}
              style={{ "--dot-color": preset.swatch } as React.CSSProperties}
              onClick={() => setPaletteKey(key)}
              title={preset.label}
              aria-label={preset.label}
            />
          )
        )}
      </div>
    </>
  );

  return (
    <div className="tp">
      {isMobile ? (
        <>
          {/* Mobile: slim top bar */}
          <header className="tp_mobile_header">
            <Link to="/" className="tp_logo">
              <img src={logo} alt="Carrou" />
            </Link>
            <Link to="/" className="tp_cta_mobile">Criar agora</Link>
          </header>

          {/* Mobile: horizontal controls */}
          <div className="tp_mobile_controls">
            {controls}
          </div>

          {/* Mobile: canvas */}
          <main className="tp_stage tp_stage--mobile">
            <div className="tp_canvas_wrap">
              <Canvas carousel={carousel} slideIndex={slideIndex} zoom={zoom} />
            </div>

            <div className="tp_mobile_nav">
              <button
                type="button"
                className="tp_nav_btn"
                onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                disabled={slideIndex === 0}
                aria-label="Slide anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="tp_slide_dots">
                {Array.from({ length: slideCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`tp_dot${slideIndex === i ? " tp_dot--active" : ""}`}
                    onClick={() => setSlideIndex(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className="tp_nav_btn"
                onClick={() => setSlideIndex((i) => Math.min(slideCount - 1, i + 1))}
                disabled={slideIndex >= slideCount - 1}
                aria-label="Próximo slide"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </main>
        </>
      ) : (
        <>
          {/* Desktop: sidebar */}
          <aside className="tp_panel">
            <Link to="/" className="tp_logo">
              <img src={logo} alt="Carrou" />
            </Link>

            <div className="tp_panel_body">
              <div>
                <h1 className="tp_title">Explore os templates</h1>
                <p className="tp_subtitle">Teste estilos e paletas sem criar conta.</p>
              </div>

              <div className="tp_section">
                <span className="tp_label">Template</span>
                {controls}
              </div>
            </div>

            <Link to="/" className="tp_cta">Criar o meu agora</Link>
          </aside>

          {/* Desktop: canvas */}
          <main className="tp_stage">
            <button
              type="button"
              className="tp_nav_btn"
              onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
              disabled={slideIndex === 0}
              aria-label="Slide anterior"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="tp_canvas_col">
              <div className="tp_canvas_wrap">
                <Canvas carousel={carousel} slideIndex={slideIndex} zoom={zoom} />
              </div>
              <div className="tp_slide_dots">
                {Array.from({ length: slideCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`tp_dot${slideIndex === i ? " tp_dot--active" : ""}`}
                    onClick={() => setSlideIndex(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              className="tp_nav_btn"
              onClick={() => setSlideIndex((i) => Math.min(slideCount - 1, i + 1))}
              disabled={slideIndex >= slideCount - 1}
              aria-label="Próximo slide"
            >
              <ChevronRight size={20} />
            </button>
          </main>
        </>
      )}
    </div>
  );
}
