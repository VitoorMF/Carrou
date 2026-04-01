import {
    DOC_H,
    DOC_W,
    TemplateBuildParams,
    truncateText,
    type CarouselElement,
} from "../shared";


function buildImagePrompt(heading: string, accent: string, accent2: string) {
    return [
        `3D cartoon-style object representing ${heading || "creative topic"}`,
        "modern 3D illustration",
        "smooth rounded shapes",
        "realistic but stylized materials",
        "true-to-life object colors",
        "medium saturation",
        "vivid but balanced color palette",
        `use accents inspired by ${accent} and ${accent2}`,
        "neutral studio lighting (not soft editorial)",
        "clean but colorful",
        "no text",
        "transparent background",
        "avoid white-only objects",
        "avoid beige and pastel tones",
        "avoid washed-out or muted colors",
    ].join(", ");
}

function buildProfileCard(
    slideIndex: number,
    role: "hook" | "content" | "cta",
    bg: string,
    accent2: string
): CarouselElement {
    if (role === "hook") {
        return {
            id: `profile_${slideIndex}`,
            type: "profileCard",
            variant: "neutral",
            x: 30,
            y: DOC_H - 112,
            w: 350,
            h: 92,
            user: {
                name: "Username",
                role: "Cargo/função na empresa",
            },
            accent: bg,
            text: accent2,
            opacity: 1,
        };
    }

    if (role === "content") {
        return {
            id: `profile_${slideIndex}`,
            type: "profileCard",
            variant: "neutral",
            x: DOC_W / 2 - 175,
            y: 56,
            w: 350,
            h: 96,
            user: {
                name: "Username",
                role: "Cargo/função na empresa",
            },
            accent: bg,
            text: accent2,
            opacity: 1,
        };
    }

    return {
        id: `profile_${slideIndex}`,
        type: "profileCard",
        variant: "neutral",
        x: DOC_W / 2 - 175,
        y: DOC_H - 112,
        w: 350,
        h: 92,
        user: {
            name: "Username",
            role: "Cargo/função na empresa",
        },
        accent: bg,
        text: accent2,
        opacity: 1,
    };
}

export function buildEditorial3DTemplate(params: TemplateBuildParams): CarouselElement[] {
    const { slideIndex, role, copy, palette } = params;

    const bg = palette.bg;
    const text = palette.text;
    const muted = palette.muted;
    const accent = palette.accent;
    const accent2 = palette.accent2;

    const heading = truncateText(copy.heading || "Editorial 3D", role === "hook" ? 72 : 80);
    const headingWidth = role === "hook" ? 700 : role === "cta" ? 880 : 650;
    const fontSize = role === "hook" ? 84 : role === "cta" ? 72 : 60;
    const charsPerLine = Math.floor(headingWidth / (fontSize * 0.6));
    const lineCount = Math.ceil(heading.length / charsPerLine);
    const estimatedHeadingHeight = lineCount * fontSize * 1.12 * 1.3; // 1.3 de margem

    const headingY = role === "hook" ? 170 : role === "cta" ? 180 : 200;
    const supportY = headingY + estimatedHeadingHeight + 24;



    const support = truncateText(
        copy.support || "Layout com profundidade visual para chamar atenção sem perder legibilidade.",
        role === "cta" ? 200 : 220
    );

    const supportWidth = role === "cta" ? 880 : 650;
    const supportFontSize = role === "cta" ? 34 : 32;
    const supportLineHeight = 1.3;
    const supportHeight = Math.ceil(support.length / Math.floor(supportWidth / (supportFontSize * 0.55))) * supportFontSize * supportLineHeight;
    const extrasStartY = supportY + supportHeight + 24;

    const elements: CarouselElement[] = [
        {
            id: `bg_${slideIndex}`,
            type: "background",
            x: 0,
            y: 0,
            width: DOC_W,
            height: DOC_H,
            fill: bg,
            opacity: 1,
        },
    ];

    if (role === "hook") {
        elements.push(
            {
                id: `arrows_top_${slideIndex}`,
                type: "shape",
                name: "arrows",
                x: DOC_W - 175,
                y: 30,
                w: 350,
                h: 150,
                color: accent,
                opacity: 1,
                scale: 1,
            },
            buildProfileCard(slideIndex, "hook", bg, accent2),
            {
                id: `heading_${slideIndex}`,
                type: "text",
                x: 96,
                y: headingY,
                text: heading,
                fill: text,
                fontSize: 84,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: headingWidth,
                align: "left",
                lineHeight: 1.12,
                letterSpacing: -0.6,
                opacity: 1,
            },
            {
                id: `support_${slideIndex}`,
                type: "text",
                x: 96,
                y: supportY,
                text: support,
                fill: muted,
                fontSize: 34,
                fontFamily: "Manrope",
                fontStyle: "normal",
                width: 700,
                align: "left",
                lineHeight: 1.25,
                letterSpacing: 0,
                opacity: 1,
            },
            {
                id: `hero_${slideIndex}`,
                type: "image",
                x: DOC_W - 600,
                y: DOC_H - 600,
                width: 600,
                height: 600,
                prompt: buildImagePrompt(copy.heading, accent, accent2),
                promptContext: `${buildImagePrompt(copy.heading, accent, accent2)} | Content: ${copy.heading}. ${copy.support}`,
                fit: "contain",
                opacity: 1,
            }
        );
    } else if (role === "cta") {
        elements.push(
            {
                id: `arrows_${slideIndex}`,
                type: "shape",
                name: "arrows",
                x: -175,
                y: slideIndex % 2 !== 0 ? 30 : DOC_H - 150,
                w: 350,
                h: 150,
                color: accent,
                opacity: 1,
                scale: 1,
            },

            buildProfileCard(slideIndex, "cta", bg, accent2),
            {
                id: `heading_${slideIndex}`,
                type: "text",
                x: 96,
                y: headingY,
                text: heading,
                fill: text,
                fontSize: 72,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: 880,
                align: "left",
                lineHeight: 1.08,
                letterSpacing: -0.5,
                opacity: 1,
            },
            {
                id: `support_${slideIndex}`,
                type: "text",
                x: 96,
                y: supportY,
                text: support,
                fill: muted,
                fontSize: 34,
                fontFamily: "Manrope",
                fontStyle: "normal",
                width: 880,
                align: "left",
                lineHeight: 1.3,
                letterSpacing: 0,
                opacity: 1,
            }
        );

        copy.extras.slice(0, 3).forEach((extra, index) => {
            elements.push({
                id: `extra_${slideIndex}_${index}`,
                type: "text",
                x: 96,
                y: extrasStartY + index * 64,
                text: `✓ ${truncateText(extra, 76)}`,
                fill: muted,
                fontSize: 32,
                fontFamily: "Manrope",
                fontStyle: "bold",
                width: 880,
                align: "left",
                lineHeight: 1.25,
                letterSpacing: 0,
                opacity: 1,
            });
        });

        elements.push({
            id: `hero_${slideIndex}`,
            type: "image",
            x: DOC_W / 2 - 300,
            y: 560,
            width: 600,
            height: 600,
            prompt: buildImagePrompt(copy.heading, accent, accent2),
            fit: "contain",
            opacity: 1,
        });
    } else {
        const imageOnRight = slideIndex % 2 === 0;

        elements.push(
            {
                id: `arrows_top_${slideIndex}`,
                type: "shape",
                name: "arrows",
                x: imageOnRight ? DOC_W - 175 : -175,
                y: 30,
                w: 350,
                h: 150,
                color: accent,
                opacity: 1,
                scale: 1,
            },
            {
                id: `arrows_bottom_${slideIndex}`,
                type: "shape",
                name: "arrows",
                x: imageOnRight ? -175 : DOC_W - 175,
                y: DOC_H - 150,
                w: 350,
                h: 150,
                color: accent,
                opacity: 1,
                scale: 1,
            },
            buildProfileCard(slideIndex, "content", bg, accent2),
            {
                id: `heading_${slideIndex}`,
                type: "text",
                x: 96,
                y: headingY,
                text: heading,
                fill: text,
                fontSize: 60,
                fontFamily: "Sora",
                fontStyle: "bold",
                width: headingWidth,
                align: "left",
                lineHeight: 1.1,
                letterSpacing: -0.5,
                opacity: 1,
            },
            {
                id: `support_${slideIndex}`,
                type: "text",
                x: 96,
                y: supportY,
                text: support,
                fill: muted,
                fontSize: 32,
                fontFamily: "Manrope",
                fontStyle: "normal",
                width: 650,
                align: "left",
                lineHeight: 1.3,
                letterSpacing: 0,
                opacity: 1,
            }
        );

        copy.extras.slice(0, 3).forEach((extra, index) => {
            elements.push({
                id: `extra_${slideIndex}_${index}`,
                type: "text",
                x: 96,
                y: extrasStartY + index * 56,
                text: `• ${truncateText(extra, 70)}`,
                fill: accent,
                fontSize: 30,
                fontFamily: "Manrope",
                fontStyle: "normal",
                width: 650,
                align: "left",
                lineHeight: 1.2,
                letterSpacing: 0,
                opacity: 1,
            });
        });

        elements.push(
            {
                id: `hero_${slideIndex}`,
                type: "image",
                x: imageOnRight ? DOC_W - 600 : 0,
                y: DOC_H - 600,
                width: 600,
                height: 600,
                prompt: buildImagePrompt(copy.heading, accent, accent2),
                promptContext: `${buildImagePrompt(copy.heading, accent, accent2)} | Content: ${copy.heading}. ${copy.support}`,
                fit: "contain",
                opacity: 1,
            },
        );
    }

    return elements.slice(0, 20);
}

