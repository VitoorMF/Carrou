import { ArrowsShape } from "../assets/shapes/ArrowsShape";
import { BlobShape } from "../assets/shapes/BlobShape";
import { CircleShape } from "../assets/shapes/CircleShape";
import { DotsShape } from "../assets/shapes/DotsShape";
import { LineShape } from "../assets/shapes/LineShape";
import { PillBadgeShape } from "../assets/shapes/PillArrowShape";
import { WaveShape } from "../assets/shapes/WaveShape";
import type { ShapeProps } from "../types/shapes";

export type ShapeName =
    | "arrows"
    | "circle"
    | "blob"
    | "dots"
    | "wave"
    | "waves"
    | "line"
    | "pillBadge";

export type ShapeComponent = React.FC<ShapeProps>;

export const ShapeMap: Record<ShapeName, ShapeComponent> = {
    pillBadge: PillBadgeShape,
    arrows: ArrowsShape,
    blob: BlobShape,
    dots: DotsShape,
    circle: CircleShape,
    wave: WaveShape,
    waves: WaveShape,
    line: LineShape
};
