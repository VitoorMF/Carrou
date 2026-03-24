import { useEffect, useState } from "react";
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
    onDismissError: () => void;
    swipeHint: { direction: "left" | "right"; progress: number } | null;
};

function EditorSnackbar({
    isLoadingProject,
    statusMessage,
    errorMessage,
    onDismissError,
}: Pick<CanvasAreaProps, "isLoadingProject" | "statusMessage" | "errorMessage" | "onDismissError">) {
    const [visibleStatus, setVisibleStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!statusMessage) return;
        setVisibleStatus(statusMessage);
        const t = setTimeout(() => setVisibleStatus(null), 3000);
        return () => clearTimeout(t);
    }, [statusMessage]);

    if (isLoadingProject) {
        return (
            <div className="editor_snackbar editor_snackbar_loading">
                <span className="editor_snackbar_spinner" />
                <span>Carregando projeto...</span>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="editor_snackbar editor_snackbar_error">
                <span>{errorMessage}</span>
                <button className="editor_snackbar_close" onClick={onDismissError} aria-label="Fechar">✕</button>
            </div>
        );
    }

    if (visibleStatus) {
        return (
            <div className="editor_snackbar editor_snackbar_success">
                <span>{visibleStatus}</span>
            </div>
        );
    }

    return null;
}

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
    onDismissError,
    swipeHint,
}: CanvasAreaProps) {
    const [tutorialOpen, setTutorialOpen] = useState(() => {
        if (typeof window === "undefined") return false;
        const isMobile = window.innerWidth <= 720;
        const seen = localStorage.getItem("editor_tutorial_seen");
        return isMobile && !seen;
    });

    function closeTutorial() {
        localStorage.setItem("editor_tutorial_seen", "1");
        setTutorialOpen(false);
    }

    return (
        <main className="stage_section">
            <div
                className="stage_container"
                ref={stageContainerRef}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onClick={(e) => { if (e.target === e.currentTarget) onSelectElement(null); }}
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
                {swipeHint && (
                    <div
                        className={`swipe_chevron swipe_chevron_${swipeHint.direction}`}
                        style={{
                            opacity: swipeHint.progress,
                            transform: `translateY(-50%) scale(${0.5 + swipeHint.progress * 0.5})`,
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            {swipeHint.direction === "right"
                                ? <polyline points="9 18 15 12 9 6" />
                                : <polyline points="15 18 9 12 15 6" />
                            }
                        </svg>
                    </div>
                )}
            </div>
            <div className="slide_indicator_row">
                <div className="slide_indicator">
                    {slidesCount <= 12 ? (
                        Array.from({ length: slidesCount }, (_, i) => (
                            <span key={i} className={`slide_dot${i === activeSlideIndex ? " slide_dot_active" : ""}`} />
                        ))
                    ) : (
                        <span className="slide_dot_text">{activeSlideIndex + 1} / {slidesCount}</span>
                    )}
                </div>
            </div>

            <EditorSnackbar
                isLoadingProject={isLoadingProject}
                statusMessage={statusMessage}
                errorMessage={errorMessage}
                onDismissError={onDismissError}
            />

            <button
                className="stage_help_btn"
                onClick={() => setTutorialOpen(true)}
                aria-label="Ajuda — gestos e atalhos"
            >
                ?
            </button>

            {tutorialOpen && (
                <div className="stage_tutorial_backdrop" onClick={closeTutorial}>
                    <div className="stage_tutorial_dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="stage_tutorial_header">
                            <span className="stage_tutorial_title">Como usar o editor</span>
                            <button className="stage_tutorial_close" onClick={closeTutorial} aria-label="Fechar">✕</button>
                        </div>
                        <div className="stage_tutorial_sections">
                            <div className="stage_tutorial_section">
                                <span className="stage_tutorial_section_label">Gestos</span>
                                <ul className="stage_tutorial_list">
                                    <li>
                                        <span className="tutorial_icon">☝️</span>
                                        <div>
                                            <strong>1 dedo — deslizar</strong>
                                            <p>Troca de slide para o lado</p>
                                        </div>
                                    </li>
                                    <li>
                                        <span className="tutorial_icon">🤌</span>
                                        <div>
                                            <strong>2 dedos — pinça</strong>
                                            <p>Aproxima ou afasta o zoom do canvas</p>
                                        </div>
                                    </li>
                                    <li>
                                        <span className="tutorial_icon">👆</span>
                                        <div>
                                            <strong>Toque no elemento</strong>
                                            <p>Seleciona para editar no painel inferior</p>
                                        </div>
                                    </li>
                                    <li>
                                        <span className="tutorial_icon">✋</span>
                                        <div>
                                            <strong>Segurar e arrastar</strong>
                                            <p>Move o elemento pelo canvas</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="stage_tutorial_section">
                                <span className="stage_tutorial_section_label">Editor</span>
                                <ul className="stage_tutorial_list">
                                    <li>
                                        <span className="tutorial_icon">✏️</span>
                                        <div>
                                            <strong>Editar texto</strong>
                                            <p>Toque no elemento, depois edite o campo de texto no painel "Elemento"</p>
                                        </div>
                                    </li>
                                    <li>
                                        <span className="tutorial_icon">🎨</span>
                                        <div>
                                            <strong>Trocar cores</strong>
                                            <p>Abra "Paleta" no dock e escolha um preset ou ajuste as cores manualmente</p>
                                        </div>
                                    </li>
                                    <li>
                                        <span className="tutorial_icon">✨</span>
                                        <div>
                                            <strong>Gerar imagem com IA</strong>
                                            <p>Selecione um elemento de imagem e toque em "Gerar com IA" no painel</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="stage_tutorial_section">
                                <span className="stage_tutorial_section_label">Navegação</span>
                                <ul className="stage_tutorial_list">
                                    <li>
                                        <span className="tutorial_icon">📋</span>
                                        <div>
                                            <strong>Ver todos os slides</strong>
                                            <p>Toque em "Slides" no dock para abrir a lista e navegar diretamente</p>
                                        </div>
                                    </li>
                                    <li>
                                        <span className="tutorial_icon">🔵</span>
                                        <div>
                                            <strong>Indicador de slide</strong>
                                            <p>As bolinhas abaixo do canvas mostram em qual slide você está</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="stage_tutorial_section">
                                <span className="stage_tutorial_section_label">Exportar</span>
                                <ul className="stage_tutorial_list">
                                    <li>
                                        <span className="tutorial_icon">📦</span>
                                        <div>
                                            <strong>Exportar PNG</strong>
                                            <p>Baixa todos os slides em PNG dentro de um arquivo ZIP</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
