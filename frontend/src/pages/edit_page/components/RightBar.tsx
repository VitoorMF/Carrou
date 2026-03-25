import type { ReactNode } from "react";
import token from "../../../assets/icons/token_icon.svg";

import type { EditorElement, EditorPalette, EditorSlide, InspectorElementEntry, MobilePanel, PaletteKey, PalettePreset } from "../types";

type RightBarProps = {
    mobilePanel: MobilePanel;
    editableSelectedElement: EditorElement | null;
    selectedElementPosition: { x: number; y: number } | null;
    isGeneratingImages: boolean;
    activePalette: EditorPalette;
    originalPalette: EditorPalette | null;
    palettePresets: PalettePreset[];
    activePalettePresetId: string | null;
    isAdvancedPaletteOpen: boolean;
    activeInspectorElements: InspectorElementEntry[];
    selectedElementId: string | null;
    activeSlide: EditorSlide | undefined;
    onTextContentChange: (value: string) => void;
    onGenerateSelectedImage: () => void;
    onOpenImagePicker: () => void;
    onRemoveSelectedImage: () => void | Promise<void>;
    onElementCoordinateChange: (axis: "x" | "y" | "w" | "h" | "fontSize", value: string) => void;
    onApplyPalettePreset: (palette: EditorPalette, presetId: string) => void;
    onToggleAdvancedPalette: () => void;
    onPaletteChange: (key: PaletteKey, value: string) => void;
    onSelectInspectorElement: (elementId: string) => void;
    getInspectorElementPreview: (element: InspectorElementEntry, slide?: EditorSlide) => string;
    renderInspectorElementIcon: (type: string) => ReactNode;
};

export function RightBar({
    mobilePanel,
    editableSelectedElement,
    selectedElementPosition,
    isGeneratingImages,
    activePalette,
    originalPalette,
    palettePresets,
    activePalettePresetId,
    isAdvancedPaletteOpen,
    activeInspectorElements,
    selectedElementId,
    activeSlide,
    onTextContentChange,
    onGenerateSelectedImage,
    onOpenImagePicker,
    onRemoveSelectedImage,
    onElementCoordinateChange,
    onApplyPalettePreset,
    onToggleAdvancedPalette,
    onPaletteChange,
    onSelectInspectorElement,
    getInspectorElementPreview,
    renderInspectorElementIcon,
}: RightBarProps) {
    return (
        <aside className={`panel panel_right ${mobilePanel === "inspector" ? "is_mobile_open" : ""}`}>
            {editableSelectedElement ? (
                <div className="inspector_card">
                    <label>Ajustes</label>
                    <div className="editor_fields">
                        {editableSelectedElement.type === "text" && (
                            <>
                                <span className="field_caption">Texto</span>
                                <textarea
                                    className="editor_textarea"
                                    value={String(editableSelectedElement.content ?? "")}
                                    onChange={(event) => onTextContentChange(event.target.value)}
                                />
                            </>
                        )}

                        {editableSelectedElement.type === "text" && editableSelectedElement.fontSize != null && (
                            <div className="editor_grid editor_grid_single">
                                <label className="editor_field">
                                    <span>Fonte</span>
                                    <input
                                        type="number"
                                        min={8}
                                        value={Math.round(Number(editableSelectedElement.fontSize))}
                                        onChange={(event) => onElementCoordinateChange("fontSize", event.target.value)}
                                    />
                                </label>
                            </div>
                        )}

                        {(editableSelectedElement.type === "image"
                            || editableSelectedElement.type === "backgroundImage") && (
                                <div className="image_actions_block">
                                    <span className="field_caption">Imagem</span>
                                    <div className="image_actions_row">
                                        <button
                                            type="button"
                                            className="secondary_button image_action_button"
                                            onClick={onGenerateSelectedImage}
                                            disabled={isGeneratingImages}
                                        >
                                            <span className="image_action_icon" aria-hidden="true">
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="m18 9.064a3.049 3.049 0 0 0 -.9-2.164 3.139 3.139 0 0 0 -4.334 0l-11.866 11.869a3.064 3.064 0 0 0 4.33 4.331l11.87-11.869a3.047 3.047 0 0 0 .9-2.167zm-14.184 12.624a1.087 1.087 0 0 1 -1.5 0 1.062 1.062 0 0 1 0-1.5l7.769-7.77 1.505 1.505zm11.872-11.872-2.688 2.689-1.5-1.505 2.689-2.688a1.063 1.063 0 1 1 1.5 1.5zm-10.825-6.961 1.55-.442.442-1.55a1.191 1.191 0 0 1 2.29 0l.442 1.55 1.55.442a1.191 1.191 0 0 1 0 2.29l-1.55.442-.442 1.55a1.191 1.191 0 0 1 -2.29 0l-.442-1.55-1.55-.442a1.191 1.191 0 0 1 0-2.29zm18.274 14.29-1.55.442-.442 1.55a1.191 1.191 0 0 1 -2.29 0l-.442-1.55-1.55-.442a1.191 1.191 0 0 1 0-2.29l1.55-.442.442-1.55a1.191 1.191 0 0 1 2.29 0l.442 1.55 1.55.442a1.191 1.191 0 0 1 0 2.29zm-5.382-14.645 1.356-.387.389-1.358a1.042 1.042 0 0 1 2 0l.387 1.356 1.356.387a1.042 1.042 0 0 1 0 2l-1.356.387-.387 1.359a1.042 1.042 0 0 1 -2 0l-.387-1.355-1.358-.389a1.042 1.042 0 0 1 0-2z" />
                                                </svg>
                                            </span>
                                            <div>{
                                                isGeneratingImages ?
                                                    "Gerando..."
                                                    :
                                                    <div className="btnLabel">
                                                        <span>Gerar com IA</span>

                                                        <div className="credit_indicator">
                                                            <span className="credit_count">-1</span>
                                                            <img className="credit_icon" src={token} alt="Crédito" />
                                                        </div>
                                                    </div>

                                            }</div>
                                        </button>
                                        <button
                                            type="button"
                                            className="secondary_button image_action_button"
                                            onClick={onOpenImagePicker}
                                        >
                                            <span className="image_action_icon" aria-hidden="true">
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M19,3H12.472a1.019,1.019,0,0,1-.447-.1L8.869,1.316A3.014,3.014,0,0,0,7.528,1H5A5.006,5.006,0,0,0,0,6V18a5.006,5.006,0,0,0,5,5H19a5.006,5.006,0,0,0,5-5V8A5.006,5.006,0,0,0,19,3ZM5,3H7.528a1.019,1.019,0,0,1,.447.1l3.156,1.579A3.014,3.014,0,0,0,12.472,5H19a3,3,0,0,1,2.779,1.882L2,6.994V6A3,3,0,0,1,5,3ZM19,21H5a3,3,0,0,1-3-3V8.994l20-.113V18A3,3,0,0,1,19,21Z" />
                                                </svg>
                                            </span>
                                            <span>Galeria</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="secondary_button image_action_button"
                                            onClick={() => void onRemoveSelectedImage()}
                                            disabled={!editableSelectedElement.src}
                                        >
                                            <span className="image_action_icon" aria-hidden="true">
                                                <svg viewBox="0 0 24 24" fill="#d92d20">
                                                    <path d="M21,4H17.9A5.009,5.009,0,0,0,13,0H11A5.009,5.009,0,0,0,6.1,4H3A1,1,0,0,0,3,6H4V19a5.006,5.006,0,0,0,5,5h6a5.006,5.006,0,0,0,5-5V6h1a1,1,0,0,0,0-2ZM11,2h2a3.006,3.006,0,0,1,2.829,2H8.171A3.006,3.006,0,0,1,11,2Zm7,17a3,3,0,0,1-3,3H9a3,3,0,0,1-3-3V6H18Z" />
                                                    <path d="M10,18a1,1,0,0,0,1-1V11a1,1,0,0,0-2,0v6A1,1,0,0,0,10,18Z" />
                                                    <path d="M14,18a1,1,0,0,0,1-1V11a1,1,0,0,0-2,0v6A1,1,0,0,0,14,18Z" />
                                                </svg>
                                            </span>
                                            <span className="del_icn">Remover</span>
                                        </button>
                                    </div>
                                    {typeof editableSelectedElement.prompt === "string"
                                        && editableSelectedElement.prompt.trim().length > 0 ? (
                                        <p className="image_prompt_hint">{editableSelectedElement.prompt}</p>
                                    ) : null}
                                </div>
                            )}

                        {editableSelectedElement.w != null && editableSelectedElement.h != null && (
                            <div className="editor_grid editor_grid_dimensions">
                                <label className="editor_field">
                                    <span>W</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={Math.round(Number(editableSelectedElement.w))}
                                        onChange={(event) => onElementCoordinateChange("w", event.target.value)}
                                    />
                                </label>

                                <label className="editor_field">
                                    <span>H</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={Math.round(Number(editableSelectedElement.h))}
                                        onChange={(event) => onElementCoordinateChange("h", event.target.value)}
                                    />
                                </label>
                            </div>
                        )}

                        <div className="editor_grid editor_grid_coordinates">
                            <label className="editor_field">
                                <span>X</span>
                                <input
                                    type="number"
                                    value={Math.round(Number(selectedElementPosition?.x ?? 0))}
                                    onChange={(event) => onElementCoordinateChange("x", event.target.value)}
                                />
                            </label>

                            <label className="editor_field">
                                <span>Y</span>
                                <input
                                    type="number"
                                    value={Math.round(Number(selectedElementPosition?.y ?? 0))}
                                    onChange={(event) => onElementCoordinateChange("y", event.target.value)}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="inspector_card">
                    <label>Paleta global</label>
                    <div className="editor_fields">
                        <div className="palette_preset_grid">
                            <button
                                type="button"
                                className={`palette_preset_card ${activePalettePresetId === "original" ? "is_active" : ""}`}
                                onClick={() => onApplyPalettePreset(originalPalette ?? activePalette, "original")}
                            >
                                <span className="palette_preset_title">Original</span>
                                <span className="palette_preset_description">Como veio do template</span>
                                <span className="palette_preset_swatches">
                                    {renderPaletteSwatches(originalPalette ?? activePalette)}
                                </span>
                            </button>

                            {palettePresets.map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    className={`palette_preset_card ${activePalettePresetId === preset.id ? "is_active" : ""}`}
                                    onClick={() => onApplyPalettePreset(preset.palette, preset.id)}
                                >
                                    <span className="palette_preset_title">{preset.label}</span>
                                    <span className="palette_preset_description">{preset.description}</span>
                                    <span className="palette_preset_swatches">
                                        {renderPaletteSwatches(preset.palette)}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="advanced_palette_toggle"
                            onClick={onToggleAdvancedPalette}
                        >
                            {isAdvancedPaletteOpen ? "Fechar personalização" : "Personalizar cores"}
                        </button>

                        {isAdvancedPaletteOpen ? (
                            <div className="palette_grid">
                                <label className="editor_field">
                                    <span>Background</span>
                                    <div className="palette_input_row">
                                        <input
                                            className="palette_swatch"
                                            type="color"
                                            value={activePalette.bg}
                                            onChange={(event) => onPaletteChange("bg", event.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={activePalette.bg}
                                            onChange={(event) => onPaletteChange("bg", event.target.value)}
                                        />
                                    </div>
                                </label>

                                <label className="editor_field">
                                    <span>Text</span>
                                    <div className="palette_input_row">
                                        <input
                                            className="palette_swatch"
                                            type="color"
                                            value={activePalette.text}
                                            onChange={(event) => onPaletteChange("text", event.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={activePalette.text}
                                            onChange={(event) => onPaletteChange("text", event.target.value)}
                                        />
                                    </div>
                                </label>

                                <label className="editor_field">
                                    <span>Muted</span>
                                    <div className="palette_input_row">
                                        <input
                                            className="palette_swatch"
                                            type="color"
                                            value={activePalette.muted}
                                            onChange={(event) => onPaletteChange("muted", event.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={activePalette.muted}
                                            onChange={(event) => onPaletteChange("muted", event.target.value)}
                                        />
                                    </div>
                                </label>

                                <label className="editor_field">
                                    <span>Accent</span>
                                    <div className="palette_input_row">
                                        <input
                                            className="palette_swatch"
                                            type="color"
                                            value={activePalette.accent}
                                            onChange={(event) => onPaletteChange("accent", event.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={activePalette.accent}
                                            onChange={(event) => onPaletteChange("accent", event.target.value)}
                                        />
                                    </div>
                                </label>

                                <label className="editor_field">
                                    <span>Accent 2</span>
                                    <div className="palette_input_row">
                                        <input
                                            className="palette_swatch"
                                            type="color"
                                            value={activePalette.accent2}
                                            onChange={(event) => onPaletteChange("accent2", event.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={activePalette.accent2}
                                            onChange={(event) => onPaletteChange("accent2", event.target.value)}
                                        />
                                    </div>
                                </label>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

            <div className="elements_list">
                {activeInspectorElements.slice(0, 10).map((element) => (
                    <button
                        className={`element_row ${selectedElementId === element.id ? "active" : ""}`}
                        key={element.id}
                        onClick={() => onSelectInspectorElement(element.id)}
                        type="button"
                    >
                        <span className="element_row_icon" aria-hidden="true">
                            {renderInspectorElementIcon(element.type)}
                        </span>
                        <span className="element_row_label">{getInspectorElementPreview(element, activeSlide)}</span>
                    </button>
                ))}
                {activeInspectorElements.length > 10 && (
                    <div className="elements_more">+ {activeInspectorElements.length - 10} elementos</div>
                )}
            </div>

        </aside>
    );
}

function renderPaletteSwatches(palette: EditorPalette) {
    return [
        palette.bg,
        palette.text,
        palette.muted,
        palette.accent,
        palette.accent2,
    ].map((color, index) => (
        <span
            key={`${color}-${index}`}
            className="palette_preset_swatch"
            style={{ background: color }}
        />
    ));
}
