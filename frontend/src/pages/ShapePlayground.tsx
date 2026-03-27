import { useMemo, useState } from "react";
import { Canvas } from "../editor/canvas/Canvas";
import type { Carousel as CanvasCarousel } from "../editor/canvas/types";
import type { Carousel as LayoutCarousel } from "../types/caroussel";
import {
  buildLayeredTemplateCarousel,
  type ResolvedPalette,
  type TemplateId,
} from "../../../shared/templateEngine";
import "./ShapePlayground.css";

type LocalTemplateId = TemplateId;

const TEMPLATE_LABELS: Record<LocalTemplateId, string> = {
  streetwearPro: "Streetwear Pro",
  editorial3D: "Editorial 3D",
  luxuryMinimal: "Luxury Minimal",
  microBlogBold: "Micro Blog Bold",
  glassEditorial: "Glass Editorial",
};

type PaletteKey = "default" | "ocean" | "forest" | "sunset" | "lavender" | "rose" | "sand";

const PALETTE_PRESETS: Record<PaletteKey, { label: string; swatch: string; palette: Partial<ResolvedPalette> | null }> = {
  default: {
    label: "Default",
    swatch: "#888",
    palette: null,
  },
  ocean: {
    label: "Ocean",
    swatch: "#00B4D8",
    palette: { bg: "#0A1628", text: "#E8F4F8", muted: "#7BAFC4", accent: "#00B4D8", accent2: "#0077B6" },
  },
  forest: {
    label: "Forest",
    swatch: "#4CAF50",
    palette: { bg: "#0D1F0D", text: "#E8F5E9", muted: "#81C784", accent: "#4CAF50", accent2: "#2E7D32" },
  },
  sunset: {
    label: "Sunset",
    swatch: "#FF6B35",
    palette: { bg: "#1A0500", text: "#FFF8F0", muted: "#D4956A", accent: "#FF6B35", accent2: "#F7931A" },
  },
  lavender: {
    label: "Lavender",
    swatch: "#A855F7",
    palette: { bg: "#1A0A2E", text: "#F3E8FF", muted: "#C084FC", accent: "#A855F7", accent2: "#7C3AED" },
  },
  rose: {
    label: "Rose",
    swatch: "#F43F5E",
    palette: { bg: "#1A0508", text: "#FFF0F3", muted: "#F9A8B8", accent: "#F43F5E", accent2: "#E11D48" },
  },
  sand: {
    label: "Sand",
    swatch: "#D4883A",
    palette: { bg: "#F5EFE6", text: "#2C1A0E", muted: "#8B6A4E", accent: "#D4883A", accent2: "#9E5A1F" },
  },
};

const PLAYGROUND_IMAGE_BY_TEMPLATE: Record<LocalTemplateId, string> = {
  streetwearPro: "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/projects%2Fd4nMnxJKT5xBM773XnKQ%2Fslides%2Fslide2%2Fphoto_1.png?alt=media&token=1bbbcc65-340a-4caf-841e-12ea5d4171e7",
  editorial3D: "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/projects%2Fd4nMnxJKT5xBM773XnKQ%2Fslides%2Fslide2%2Fphoto_1.png?alt=media&token=1bbbcc65-340a-4caf-841e-12ea5d4171e7",
  luxuryMinimal: "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/projects%2Fd4nMnxJKT5xBM773XnKQ%2Fslides%2Fslide2%2Fphoto_1.png?alt=media&token=1bbbcc65-340a-4caf-841e-12ea5d4171e7",
  microBlogBold: "https://firebasestorage.googleapis.com/v0/b/carrosselize.firebasestorage.app/o/projects%2Fd4nMnxJKT5xBM773XnKQ%2Fslides%2Fslide2%2Fphoto_1.png?alt=media&token=1bbbcc65-340a-4caf-841e-12ea5d4171e7",
  glassEditorial: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1080&q=80",
};

function makeMockCarousel(themeToken: string): LayoutCarousel {
  return {
    meta: {
      objective: "engajar",
      format: "instagram_carousel",
      audience: "criadores e infoprodutores",
      cta: "salvar",
      theme: themeToken,
      language: "pt-BR",
      slideCount: 5,
      title: "Playground local de template",
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
}

function applyPreviewImage(carousel: CanvasCarousel, imageUrl: string): CanvasCarousel {
  return {
    ...carousel,
    slides: carousel.slides.map((slide) => ({
      ...slide,
      layers: {
        background: (slide.layers?.background ?? []).map((element: any) =>
          element.type === "image" || element.type === "backgroundImage"
            ? { ...element, src: imageUrl, url: imageUrl, status: "ready" }
            : element
        ),
        atmosphere: (slide.layers?.atmosphere ?? []).map((element: any) =>
          element.type === "image" || element.type === "backgroundImage"
            ? { ...element, src: imageUrl, url: imageUrl, status: "ready" }
            : element
        ),
        content: (slide.layers?.content ?? []).map((element: any) =>
          element.type === "image" || element.type === "backgroundImage"
            ? { ...element, src: imageUrl, url: imageUrl, status: "ready" }
            : element
        ),
        ui: slide.layers?.ui ?? [],
      },
    })),
  };
}

function buildLocalPreview(
  templateId: LocalTemplateId,
  mock: LayoutCarousel,
  paletteOverride: Partial<ResolvedPalette> | null
): CanvasCarousel {
  const carousel = buildLayeredTemplateCarousel(
    templateId,
    mock as any,
    paletteOverride ?? undefined
  ) as unknown as CanvasCarousel;
  return applyPreviewImage(carousel, PLAYGROUND_IMAGE_BY_TEMPLATE[templateId]);
}

export default function ShapePlayground() {
  const [template, setTemplate] = useState<LocalTemplateId>("microBlogBold");
  const [themeToken, setThemeToken] = useState("clean");
  const [paletteKey, setPaletteKey] = useState<PaletteKey>("default");
  const [slideIndex, setSlideIndex] = useState(0);
  const [mockCarousel, setMockCarousel] = useState<LayoutCarousel>(() => makeMockCarousel("clean"));

  function syncThemeToken(nextToken: string) {
    setThemeToken(nextToken);
    setMockCarousel((current) => ({
      ...current,
      meta: { ...current.meta, theme: nextToken },
    }));
  }

  function updateSlideField(field: "headline" | "body", value: string) {
    setMockCarousel((current) => ({
      ...current,
      slides: current.slides.map((slide, index) =>
        index === slideIndex ? { ...slide, [field]: value } : slide
      ),
    }));
  }

  function updateSlideBullets(value: string) {
    const bullets = value.split("\n").map((item) => item.trim()).filter(Boolean);
    setMockCarousel((current) => ({
      ...current,
      slides: current.slides.map((slide, index) =>
        index === slideIndex ? { ...slide, bullets } : slide
      ),
    }));
  }

  const selectedPreset = PALETTE_PRESETS[paletteKey];

  const carousel = useMemo(
    () => buildLocalPreview(template, mockCarousel, selectedPreset.palette),
    [template, mockCarousel, selectedPreset]
  );

  const slideCount = carousel.slides.length;
  const activeSlide = carousel.slides[slideIndex];
  const activeMockSlide = mockCarousel.slides[slideIndex];

  return (
    <div className="template_playground">
      <aside className="playground_panel">
        <h1>Template Playground Local</h1>
        <p>Preview instantâneo usando os templates oficiais do backend.</p>

        <label htmlFor="template_select">Template</label>
        <select
          id="template_select"
          value={template}
          onChange={(event) => {
            setTemplate(event.target.value as LocalTemplateId);
            setSlideIndex(0);
          }}
        >
          {(Object.keys(TEMPLATE_LABELS) as LocalTemplateId[]).map((id) => (
            <option key={id} value={id}>
              {TEMPLATE_LABELS[id]}
            </option>
          ))}
        </select>

        <label>Paleta de cores</label>
        <div className="palette_swatches">
          {(Object.entries(PALETTE_PRESETS) as [PaletteKey, typeof PALETTE_PRESETS[PaletteKey]][]).map(
            ([key, preset]) => (
              <button
                key={key}
                type="button"
                className={`palette_swatch${paletteKey === key ? " palette_swatch--active" : ""}`}
                style={{ "--swatch-color": preset.swatch } as React.CSSProperties}
                onClick={() => setPaletteKey(key)}
                title={preset.label}
              >
                <span className="swatch_dot" />
                <span className="swatch_label">{preset.label}</span>
              </button>
            )
          )}
        </div>

        {selectedPreset.palette && (
          <div className="palette_tokens">
            {(Object.entries(selectedPreset.palette) as [string, string][]).map(([token, color]) => (
              <div key={token} className="palette_token">
                <span className="token_dot" style={{ background: color }} />
                <span className="token_name">{token}</span>
                <span className="token_value">{color}</span>
              </div>
            ))}
          </div>
        )}

        <label htmlFor="theme_token">Token de tema</label>
        <input
          id="theme_token"
          value={themeToken}
          onChange={(event) => syncThemeToken(event.target.value)}
          placeholder="clean, luxury, dark, lavanda..."
        />

        <div className="slide_controls">
          <button
            type="button"
            onClick={() => setSlideIndex((index) => Math.max(0, index - 1))}
            disabled={slideIndex === 0}
          >
            Anterior
          </button>
          <span>
            Slide {slideIndex + 1} / {slideCount}
          </span>
          <button
            type="button"
            onClick={() => setSlideIndex((index) => Math.min(slideCount - 1, index + 1))}
            disabled={slideIndex >= slideCount - 1}
          >
            Próximo
          </button>
        </div>

        {activeMockSlide && (
          <div className="slide_editor">
            <label htmlFor="slide_headline">Headline</label>
            <textarea
              id="slide_headline"
              rows={3}
              value={activeMockSlide.headline}
              onChange={(event) => updateSlideField("headline", event.target.value)}
            />

            <label htmlFor="slide_body">Body</label>
            <textarea
              id="slide_body"
              rows={5}
              value={activeMockSlide.body}
              onChange={(event) => updateSlideField("body", event.target.value)}
            />

            <label htmlFor="slide_bullets">Bullets (1 por linha)</label>
            <textarea
              id="slide_bullets"
              rows={4}
              value={(activeMockSlide.bullets ?? []).join("\n")}
              onChange={(event) => updateSlideBullets(event.target.value)}
            />
          </div>
        )}

        <pre className="slide_json">{JSON.stringify(activeSlide, null, 2)}</pre>
      </aside>

      <main className="playground_stage">
        <Canvas carousel={carousel} slideIndex={slideIndex} zoom={0.41} />
      </main>
    </div>
  );
}
