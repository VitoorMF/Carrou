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

        function loadImage(withCrossOrigin: boolean) {
            return new Promise<HTMLImageElement>((resolve, reject) => {
                const image = new window.Image();
                if (withCrossOrigin) {
                    image.crossOrigin = "anonymous";
                }
                image.src = targetUrl;
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error("image load failed"));
            });
        }

        (async () => {
            try {
                const image = await loadImage(true);
                if (!cancelled) setImg(image);
            } catch {
                try {
                    const image = await loadImage(false);
                    if (!cancelled) setImg(image);
                } catch {
                    if (!cancelled) setImg(null);
                }
            }
        })();

        return () => {
            cancelled = true;
            setImg(null);
        };
    }, [url]);

    return img;
}
