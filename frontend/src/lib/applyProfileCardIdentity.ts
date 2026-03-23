import type { Carousel } from "../editor/canvas/types";
import type { UserData } from "../types/userData";

type IdentityProfile = {
    displayName?: string | null;
    specialization?: string | null;
    avatarUrl?: string | null;
};

export function applyProfileCardIdentity(
    carousel: Carousel | null,
    profile: IdentityProfile | null
): Carousel | null {
    if (!carousel || !profile) {
        return carousel;
    }

    const name = String(profile.displayName ?? "").trim();
    const role = String(profile.specialization ?? "").trim();
    const avatarUrl = String(profile.avatarUrl ?? "").trim();

    if (!name && !role && !avatarUrl) {
        return carousel;
    }

    return {
        ...carousel,
        slides: carousel.slides.map((slide: any) => ({
            ...slide,
            layers: slide?.layers
                ? {
                    background: mapProfileCardLayer(slide.layers.background, name, role, avatarUrl),
                    atmosphere: mapProfileCardLayer(slide.layers.atmosphere, name, role, avatarUrl),
                    content: mapProfileCardLayer(slide.layers.content, name, role, avatarUrl),
                    ui: mapProfileCardLayer(slide.layers.ui, name, role, avatarUrl),
                }
                : slide?.layers,
            elements: Array.isArray(slide?.elements)
                ? mapProfileCardLayer(slide.elements, name, role, avatarUrl)
                : slide?.elements,
        })),
    };
}

function mapProfileCardLayer(
    elements: any[] | undefined,
    displayName: string,
    specialization: string,
    avatarUrl: string
) {
    if (!Array.isArray(elements)) {
        return elements;
    }

    return elements.map((element) => {
        if (element?.type === "profileCard") {
            return {
                ...element,
                user: {
                    ...(element.user ?? {}),
                    name: displayName || element.user?.name || "Username",
                    role: specialization || element.user?.role || "",
                    avatarSrc: avatarUrl || element.user?.avatarSrc || "",
                },
            };
        }

        // Assinatura de texto (microBlogBold): id começa com "signature_"
        if (
            element?.type === "text" &&
            typeof element?.id === "string" &&
            element.id.startsWith("signature_") &&
            displayName
        ) {
            const sig = specialization
                ? `${displayName.toUpperCase()}  |  ${specialization.toUpperCase()}`
                : displayName.toUpperCase();
            return { ...element, text: sig };
        }

        return element;
    });
}

export type { IdentityProfile, UserData };
