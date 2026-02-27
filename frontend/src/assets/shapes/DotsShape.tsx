import type { ShapeProps } from "../../types/shapes";

export function DotsShape({
    color = "currentColor",
    opacity = 0.08,
    scale = 1,
}: ShapeProps) {
    return (
        <svg
            viewBox="0 0 15 15"
            style={{
                transform: `scale(${scale})`,
                opacity,
            }}
            fill={color}
        >
            <circle cx="4.5" cy="2.5" r=".3" fill="#000000" />
            <circle cx="4.5" cy="4.5" r=".3" fill="#000000" />
            <circle cx="4.5" cy="6.499" r=".3" fill="#000000" />
            <circle cx="4.5" cy="8.499" r=".3" fill="#000000" />
            <circle cx="4.5" cy="10.498" r=".3" fill="#000000" />
            <circle cx="4.5" cy="12.498" r=".3" fill="#000000" />
            <circle cx="6.5" cy="2.5" r=".3" fill="#000000" />
            <circle cx="6.5" cy="4.5" r=".3" fill="#000000" />
            <circle cx="6.5" cy="6.499" r=".3" fill="#000000" />
            <circle cx="6.5" cy="8.499" r=".3" fill="#000000" />
            <circle cx="6.5" cy="10.498" r=".3" fill="#000000" />
            <circle cx="6.5" cy="12.498" r=".3" fill="#000000" />
            <circle cx="8.499" cy="2.5" r=".3" fill="#000000" />
            <circle cx="8.499" cy="4.5" r=".3" fill="#000000" />
            <circle cx="8.499" cy="6.499" r=".3" fill="#000000" />
            <circle cx="8.499" cy="8.499" r=".3" fill="#000000" />
            <circle cx="8.499" cy="10.498" r=".3" fill="#000000" />
            <circle cx="8.499" cy="12.498" r=".3" fill="#000000" />
            <circle cx="10.499" cy="2.5" r=".3" fill="#000000" />
            <circle cx="10.499" cy="4.5" r=".3" fill="#000000" />
            <circle cx="10.499" cy="6.499" r=".3" fill="#000000" />
            <circle cx="10.499" cy="8.499" r=".3" fill="#000000" />
            <circle cx="10.499" cy="10.498" r=".3" fill="#000000" />
            <circle cx="10.499" cy="12.498" r=".3" fill="#000000" />
        </svg>
    );
}
