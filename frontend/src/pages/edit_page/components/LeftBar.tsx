import type { EditorSlide, MobilePanel } from "../types";

type LeftBarProps = {
    mobilePanel: MobilePanel;
    slides: EditorSlide[];
    activeSlideId: string;
    getSlideLabel: (slide: EditorSlide, index: number) => string;
    onSelectSlide: (index: number) => void;
    onCloseMobilePanel: () => void;
};

export function LeftBar({
    mobilePanel,
    slides,
    activeSlideId,
    getSlideLabel,
    onSelectSlide,
    onCloseMobilePanel,
}: LeftBarProps) {
    return (
        <aside className={`panel panel_left ${mobilePanel === "slides" ? "is_mobile_open" : ""}`}>
            <div className="panel_title_row">
                <h3>Páginas</h3>
                <span>{slides.length}</span>
            </div>

            <div className="slides_list">
                {slides.map((slide, index) => (
                    <button
                        key={slide.id}
                        className={`slide_item ${slide.id === activeSlideId ? "active" : ""}`}
                        onClick={() => {
                            onSelectSlide(index);
                            onCloseMobilePanel();
                        }}
                        type="button"
                    >
                        <span className="slide_index">{index + 1}</span>
                        <span className="slide_text">{getSlideLabel(slide, index)}</span>
                    </button>
                ))}
            </div>
        </aside>
    );
}
