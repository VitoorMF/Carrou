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
        image.src = targetUrl;
        image.onload = () => {
            if (!cancelled) setImg(image);
        };
        image.onerror = () => {
            if (!cancelled) setImg(null);
        };

        return () => {
            cancelled = true;
            setImg(null);
        };
    }, [url]);

    return img;
}
