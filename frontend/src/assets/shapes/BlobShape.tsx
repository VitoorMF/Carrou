import type { ShapeProps } from "../../types/shapes";

export function BlobShape({
    color = "currentColor",
    opacity = 0.08,
    scale = 1,
}: ShapeProps) {
    return (
        <svg
            preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 600 600"
            style={{
                transform: `scale(${scale})`,
                opacity,
            }}
            fill={color}
        >
            <path d="M46,-55.3C61,-42.1,75.6,-29,78.7,-13.6C81.8,1.9,73.3,19.7,62.3,33.5C51.4,47.3,37.9,57.1,23.3,61.3C8.7,65.4,-7,63.9,-22.7,59.4C-38.4,55,-54.1,47.7,-63.2,35C-72.2,22.3,-74.6,4.4,-72.6,-13.8C-70.5,-31.9,-64.1,-50.3,-51.2,-63.8C-38.4,-77.3,-19.2,-86,-1.9,-83.8C15.5,-81.5,30.9,-68.4,46,-55.3Z" />
        </svg>
    );
}
