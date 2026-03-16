import type { RefObject, TouchEventHandler } from "react";
import { Canvas, type CanvasRef } from "../../../editor/canvas/Canvas";
import type { Carousel } from "../../../editor/canvas/types";

type CanvasAreaProps = {
    slidesCount: number;
    activeSlideIndex: number;
    isLoadingProject: boolean;
    statusMessage: string | null;
    errorMessage: string | null;
    stageContainerRef: RefObject<HTMLDivElement | null>;
    canvasRef: RefObject<CanvasRef | null>;
    renderedCarousel: Carousel | null;
    zoom: number;
    selectedElementId: string | null;
    onTouchStart: TouchEventHandler<HTMLDivElement>;
    onTouchMove: TouchEventHandler<HTMLDivElement>;
    onTouchEnd: TouchEventHandler<HTMLDivElement>;
    onSelectElement: (elementId: string | null) => void;
    onElementLivePositionChange: (elementId: string, position: { x: number; y: number }) => void;
    onElementPositionChange: (elementId: string, position: { x: number; y: number }) => void;
    onExportPNG: () => void;
};

export function CanvasArea({
    slidesCount,
    activeSlideIndex,
    isLoadingProject,
    statusMessage,
    errorMessage,
    stageContainerRef,
    canvasRef,
    renderedCarousel,
    zoom,
    selectedElementId,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onSelectElement,
    onElementLivePositionChange,
    onElementPositionChange,
    onExportPNG,
}: CanvasAreaProps) {
    return (
        <main className="stage_section">
            <div>
                <div className="stage_status_bar">
                    <div>
                        Slide {activeSlideIndex + 1} de {slidesCount}
                    </div>
                    <div className="status_inline">
                        {isLoadingProject && <span>Carregando projeto...</span>}
                        {!isLoadingProject && statusMessage && <span>{statusMessage}</span>}
                        {errorMessage && <span className="status_error">{errorMessage}</span>}
                    </div>
                </div>
                <div className="mobile_swipe_hint">Deslize com um dedo para trocar de slide. Use dois dedos para zoom.</div>
            </div>
            <div
                className="stage_container"
                ref={stageContainerRef}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <Canvas
                    ref={canvasRef}
                    carousel={renderedCarousel}
                    slideIndex={activeSlideIndex}
                    zoom={zoom}
                    selectedElementId={selectedElementId}
                    onSelectElement={onSelectElement}
                    onElementLivePositionChange={onElementLivePositionChange}
                    onElementPositionChange={onElementPositionChange}
                    onExportPNG={onExportPNG}
                />
            </div>
        </main>
    );
}
