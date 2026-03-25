import { useEffect, useState } from "react";
import { DOC_H, DOC_W, MAX_ZOOM, MIN_ZOOM, STAGE_PADDING, ZOOM_STEP } from "../constants";

function computeResponsiveZoom(container: HTMLElement) {
    const widthRatio = Math.max(0.1, (container.clientWidth - STAGE_PADDING) / DOC_W);
    const heightRatio = Math.max(0.1, (container.clientHeight - STAGE_PADDING) / DOC_H);
    const fitted = Math.min(widthRatio, heightRatio);
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(fitted.toFixed(2))));
}

export function useZoom({ stageContainerRef }: { stageContainerRef: React.RefObject<HTMLDivElement | null> }) {
    const [zoom, setZoom] = useState(0.56);
    const [hasManualZoom, setHasManualZoom] = useState(false);

    useEffect(() => {
        const container = stageContainerRef.current;
        if (!container) {
            return;
        }

        function applyResponsiveZoom() {
            if (hasManualZoom) {
                return;
            }

            const nextZoom = computeResponsiveZoom(container as HTMLElement);
            setZoom((current) => (
                Math.abs(current - nextZoom) < 0.01 ? current : nextZoom
            ));
        }

        applyResponsiveZoom();

        const observer = new ResizeObserver(() => {
            applyResponsiveZoom();
        });

        observer.observe(container);
        window.addEventListener("resize", applyResponsiveZoom);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", applyResponsiveZoom);
        };
    }, [hasManualZoom]);

    function zoomIn() {
        setHasManualZoom(true);
        setZoom((prev) => Math.min(MAX_ZOOM, Number((prev + ZOOM_STEP).toFixed(2))));
    }

    function zoomOut() {
        setHasManualZoom(true);
        setZoom((prev) => Math.max(MIN_ZOOM, Number((prev - ZOOM_STEP).toFixed(2))));
    }

    function resetZoom() {
        setHasManualZoom(false);
        if (stageContainerRef.current) {
            setZoom(computeResponsiveZoom(stageContainerRef.current));
            return;
        }
        setZoom(0.56);
    }

    return { zoom, setZoom, hasManualZoom, setHasManualZoom, zoomIn, zoomOut, resetZoom };
}
