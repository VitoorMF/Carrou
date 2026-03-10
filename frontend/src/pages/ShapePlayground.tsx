import { useMemo, useState } from "react";
import { Canvas } from "../editor/canvas/Canvas";
import type { Carousel as CanvasCarousel } from "../editor/canvas/types";
import type { Carousel as LayoutCarousel } from "../types/caroussel";
import {
  buildTemplateElements,
  resolvePaletteByTemplate,
  resolveSlideRole,
  sanitizeImageElements,
  truncateText,
  type SlideCopy,
  type TemplateId,
} from "../../../shared/templateEngine";
import "./ShapePlayground.css";

type LocalTemplateId = TemplateId;

const TEMPLATE_LABELS: Record<LocalTemplateId, string> = {
  streetwearPro: "Streetwear Pro",
  editorial3D: "Editorial 3D",
  luxuryMinimal: "Luxury Minimal",
  microBlogBold: "Micro Blog Bold",
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

function toCopy(slide: LayoutCarousel["slides"][number]): SlideCopy {
  const extras = Array.isArray(slide.bullets)
    ? slide.bullets.map((item) => truncateText(item, 90)).filter(Boolean)
    : [];

  return {
    heading: truncateText(slide.headline, 140),
    support: truncateText(slide.body ?? "", 320),
    extras,
  };
}

function toLayeredSlide(slide: { id: string; elements: Array<{ type: string;[key: string]: unknown }> }) {
  const background: Array<{ type: string;[key: string]: unknown }> = [];
  const atmosphere: Array<{ type: string;[key: string]: unknown }> = [];
  const content: Array<{ type: string;[key: string]: unknown }> = [];
  const ui: Array<{ type: string;[key: string]: unknown }> = [];

  for (const el of slide.elements ?? []) {
    if (el.type === "background") {
      background.push(el);
      continue;
    }

    if (
      el.type === "backgroundImage" ||
      el.type === "noise" ||
      el.type === "gradientRect" ||
      el.type === "glow"
    ) {
      atmosphere.push(el);
      continue;
    }

    content.push(el);
  }

  return { id: slide.id, layers: { background, atmosphere, content, ui } };
}

function buildLocalPreview(templateId: LocalTemplateId, mock: LayoutCarousel): CanvasCarousel {
  const palette = resolvePaletteByTemplate(templateId);

  const slides = mock.slides.slice(0, 8).map((slide, index, all) => {
    const role =
      slide.role === "cover"
        ? "hook"
        : slide.role === "cta"
          ? "cta"
          : resolveSlideRole(index, all.length);

    const elements = buildTemplateElements({
      templateId,
      slideIndex: index,
      slideCount: all.length,
      role,
      copy: toCopy(slide),
      palette,
    });

    const imagePrompt = slide.notes?.trim();
    const withImagePrompt = imagePrompt
      ? sanitizeImageElements(
        elements.map((element) => {
          if (element.type === "image" || element.type === "backgroundImage") {
            return { ...element, prompt: imagePrompt };
          }
          return element;
        })
      )
      : sanitizeImageElements(elements);

    return toLayeredSlide({
      id: slide.id || `s${index + 1}`,
      elements: withImagePrompt,
    });
  });

  return {
    meta: {
      title: mock.meta.title ?? "Playground",
      style: templateId,
      palette,
      objective: mock.meta.objective,
      theme: mock.meta.theme,
    },
    slides: slides as any,
  };
}

export default function ShapePlayground() {
  const [template, setTemplate] = useState<LocalTemplateId>("microBlogBold");
  const [themeToken, setThemeToken] = useState("clean");
  const [slideIndex, setSlideIndex] = useState(0);
  const [mockCarousel, setMockCarousel] = useState<LayoutCarousel>(() => makeMockCarousel("clean"));

  function syncThemeToken(nextToken: string) {
    setThemeToken(nextToken);
    setMockCarousel((current) => ({
      ...current,
      meta: {
        ...current.meta,
        theme: nextToken,
      },
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
    const bullets = value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    setMockCarousel((current) => ({
      ...current,
      slides: current.slides.map((slide, index) =>
        index === slideIndex ? { ...slide, bullets } : slide
      ),
    }));
  }

  const carousel = useMemo(
    () => buildLocalPreview(template, mockCarousel),
    [template, mockCarousel]
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
