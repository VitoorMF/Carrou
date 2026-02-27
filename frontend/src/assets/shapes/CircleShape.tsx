import type { ShapeProps } from "../../types/shapes";

export function CircleShape({
    color = "currentColor",
    opacity = 0.08,
    scale = 1,
}: ShapeProps) {
    return (
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            style={{ transform: `scale(${scale})`, opacity }}
            fill={color}
        >
            <circle cx="50" cy="50" r="50" />
        </svg>
    );
}
