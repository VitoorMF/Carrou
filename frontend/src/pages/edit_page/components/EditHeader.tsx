import { useEffect, useRef, useState } from "react";

type EditHeaderProps = {
    projectName: string;
    zoom: number;
    isExportingAllSlides: boolean;
    hasServerCarousel: boolean;
    onBack: () => void;
    onProjectNameChange: (value: string) => void;
    onZoomOut: () => void;
    onResetZoom: () => void;
    onZoomIn: () => void;
    onExportAllSlides: () => void;
    onShareSlides: () => void;
};

export function EditHeader({
    projectName,
    zoom,
    isExportingAllSlides,
    hasServerCarousel,
    onBack,
    onProjectNameChange,
    onZoomOut,
    onResetZoom,
    onZoomIn,
    onExportAllSlides,
    onShareSlides,
}: EditHeaderProps) {
    const [isExportOpen, setIsExportOpen] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isExportOpen) return;
        function handleClickOutside(event: MouseEvent) {
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isExportOpen]);

    return (
        <header className="editor_topbar">
            <div className="topbar_group">
                <button className="back_button" onClick={onBack} type="button" aria-label="Voltar" title="Voltar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M5 12l7 7M5 12l7-7" />
                    </svg>
                </button>
                <input
                    className="project_title"
                    type="text"
                    value={projectName}
                    onChange={(event) => onProjectNameChange(event.target.value)}
                    onFocus={(e) => { const el = e.currentTarget; setTimeout(() => { el.setSelectionRange(el.value.length, el.value.length); el.scrollLeft = el.scrollWidth; }, 0); }}
                />
            </div>

            <div className="topbar_group topbar_center">
                <div className="topbar_zoom_cluster">
                    <button className="chip_button" type="button" onClick={onZoomOut}>
                        -
                    </button>
                    <button className="chip_button chip_button_value" type="button" onClick={onResetZoom}>
                        {Math.round(zoom * 100)}%
                    </button>
                    <button className="chip_button" type="button" onClick={onZoomIn}>
                        +
                    </button>
                </div>
            </div>

            <div className="topbar_group topbar_right" ref={exportRef}>
                <button
                    className="primary_button"
                    type="button"
                    onClick={() => setIsExportOpen((v) => !v)}
                    disabled={isExportingAllSlides || !hasServerCarousel}
                >
                    {isExportingAllSlides ? "Baixando..." : "Exportar Slides"}
                </button>
                {isExportOpen && (
                    <div className="export_dropdown">
                        <button
                            type="button"
                            className="export_option_btn"
                            onClick={() => { onExportAllSlides(); setIsExportOpen(false); }}
                            disabled={isExportingAllSlides}
                        >
                            <span className="export_option_icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            </span>
                            <div className="export_option_info">
                                <strong>{isExportingAllSlides ? "Gerando ZIP..." : "Baixar todos"}</strong>
                                <span>Todos os slides em PNG dentro de um ZIP</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            className="export_option_btn"
                            onClick={() => { onShareSlides(); setIsExportOpen(false); }}
                        >
                            <span className="export_option_icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                </svg>
                            </span>
                            <div className="export_option_info">
                                <strong>Compartilhar carrossel</strong>
                                <span>Abre o menu de compartilhamento do celular</span>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
