import { useEffect, useState } from "react";

export function useKonvaImage(url?: string) {
    const [img, setImg] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (!url) {
            setImg(null);
            return;
        }

        const targetUrl = url;
        let cancelled = false;

        const image = new window.Image();
        image.crossOrigin = "anonymous";
        image.src = targetUrl;
        image.onload = () => {
            if (!cancelled) setImg(image);
        };
        image.onerror = () => {
            // CORS attempt failed — retry without crossOrigin so the image
            // still renders on screen (canvas will be tainted for this element,
            // but that's acceptable for non-exportable images like avatars).
            if (cancelled) return;
            const fallback = new window.Image();
            fallback.src = targetUrl;
            fallback.onload = () => {
                if (!cancelled) setImg(fallback);
            };
            fallback.onerror = () => {
                if (!cancelled) setImg(null);
            };
        };

        return () => {
            cancelled = true;
            setImg(null);
        };
    }, [url]);

    return img;
}
