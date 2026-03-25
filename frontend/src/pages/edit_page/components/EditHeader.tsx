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
}: EditHeaderProps) {
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

            <div className="topbar_group topbar_right">
                <button
                    className="primary_button"
                    type="button"
                    onClick={onExportAllSlides}
                    disabled={isExportingAllSlides || !hasServerCarousel}
                >
                    {isExportingAllSlides ? "Baixando..." : "Exportar Slides"}
                </button>
            </div>
        </header>
    );
}
