import { auth } from "./firebase";

type GenerateCarouselPayload = {
    prompt: string;
};

type GenerateCarouselResponse = {
    ok: boolean;
    projectId: string;
};

const USE_FIREBASE_EMULATORS = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
const GENERATE_CAROUSEL_ENDPOINT = USE_FIREBASE_EMULATORS
    ? "http://127.0.0.1:5001/carrosselize/southamerica-east1/generateCarousel"
    : "https://southamerica-east1-carrosselize.cloudfunctions.net/generateCarousel";

export async function generateCarousel(
    payload: GenerateCarouselPayload
): Promise<GenerateCarouselResponse> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Usuário não autenticado.");
    }

    const idToken = await user.getIdToken(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000);

    let res: Response;
    try {
        res = await fetch(GENERATE_CAROUSEL_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
    } catch (error: any) {
        if (error?.name === "AbortError") {
            throw new Error("A geração demorou mais que o esperado. Tente novamente com um prompt mais curto.");
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }

    const contentType = res.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
        ? await res.json()
        : await res.text();

    if (!res.ok) {
        const message = typeof data === "string"
            ? data
            : data?.error ?? data?.message ?? "Falha ao gerar carrossel.";
        throw new Error(String(message));
    }

    if (!data?.ok || !data?.projectId) {
        throw new Error("Falha ao gerar carrossel.");
    }

    return data as GenerateCarouselResponse;
}
