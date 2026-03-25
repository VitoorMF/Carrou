import { useRef, useState, type TouchEvent } from "react";
import { MAX_ZOOM, MIN_ZOOM } from "../constants";

function getTouchDistance(
    first: { clientX: number; clientY: number },
    second: { clientX: number; clientY: number }
) {
    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}

export function useSwipeNavigation({
    zoom,
    setZoom,
    activeSlideIndex,
    goToSlide,
    setHasManualZoom,
}: {
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    activeSlideIndex: number;
    goToSlide: (index: number) => void;
    setHasManualZoom: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);
    const isSwipingRef = useRef(false);
    const [swipeHint, setSwipeHint] = useState<{ direction: "left" | "right"; progress: number } | null>(null);

    function handleStageTouchStart(event: TouchEvent<HTMLDivElement>) {
        if (event.touches.length === 2) {
            pinchStartRef.current = {
                distance: getTouchDistance(event.touches[0], event.touches[1]),
                zoom,
            };
            swipeStartRef.current = null;
            return;
        }

        pinchStartRef.current = null;

        const touch = event.touches[0];
        if (!touch || event.touches.length !== 1) {
            swipeStartRef.current = null;
            return;
        }

        isSwipingRef.current = false;
        swipeStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
        };
    }

    function handleStageTouchMove(event: TouchEvent<HTMLDivElement>) {
        if (event.touches.length === 2 && pinchStartRef.current) {
            const distance = getTouchDistance(event.touches[0], event.touches[1]);
            const scaleFactor = distance / pinchStartRef.current.distance;
            const nextZoom = Math.min(
                MAX_ZOOM,
                Math.max(MIN_ZOOM, Number((pinchStartRef.current.zoom * scaleFactor).toFixed(2)))
            );
            setHasManualZoom(true);
            setZoom((current) => (Math.abs(current - nextZoom) < 0.01 ? current : nextZoom));
            return;
        }

        if (event.touches.length === 1 && swipeStartRef.current) {
            const touch = event.touches[0];
            const deltaX = touch.clientX - swipeStartRef.current.x;
            const deltaY = touch.clientY - swipeStartRef.current.y;
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
                isSwipingRef.current = true;
                const progress = Math.min(Math.abs(deltaX) / 80, 1);
                setSwipeHint({ direction: deltaX < 0 ? "right" : "left", progress });
                return;
            }
        }

        setSwipeHint(null);
    }

    function handleStageTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
        if (event.touches.length < 2) {
            pinchStartRef.current = null;
        }

        const start = swipeStartRef.current;
        swipeStartRef.current = null;
        isSwipingRef.current = false;

        if (!start || event.changedTouches.length !== 1) {
            return;
        }

        setSwipeHint(null);

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - start.x;
        const deltaY = touch.clientY - start.y;
        const elapsed = Date.now() - start.time;

        const isHorizontalSwipe = Math.abs(deltaX) > 56 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3;
        const isFastEnough = elapsed < 700;

        if (!isHorizontalSwipe || !isFastEnough) {
            return;
        }

        if (deltaX < 0) {
            goToSlide(activeSlideIndex + 1);
            return;
        }

        goToSlide(activeSlideIndex - 1);
    }

    return { swipeHint, isSwipingRef, handleStageTouchStart, handleStageTouchMove, handleStageTouchEnd };
}
