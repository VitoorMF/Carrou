import type { Carousel, GenerateCarouselPayload } from "../types/caroussel";

const FUNCTIONS_BASE_URL =
    import.meta.env.DEV
        ? "http://127.0.0.1:5001/carrosselize/us-central1"
        : "https://us-central1-carrosselize.cloudfunctions.net";

export async function generateCarousel(payload: GenerateCarouselPayload): Promise<Carousel> {
    const resp = await fetch(`${FUNCTIONS_BASE_URL}/generateCarousel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => null);

    if (!resp.ok) throw new Error(data?.error ?? `HTTP ${resp.status}`);

    return data.carousel as Carousel;
}
