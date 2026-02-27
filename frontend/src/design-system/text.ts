export type TextVariant =
    | "headline"
    | "body"
    | "highlight"
    | "footer";

export const TextStyles: Record<TextVariant, any> = {
    headline: {
        fontSize: 64,
        fontWeight: 700,
        lineHeight: 1.1,
    },
    body: {
        fontSize: 36,
        fontWeight: 400,
    },
    highlight: {
        fontSize: 36,
        fontWeight: 600,
    },
    footer: {
        fontSize: 24,
        opacity: 0.7,
    },
};
