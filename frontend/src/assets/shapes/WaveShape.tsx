import type { ShapeProps } from "../../types/shapes";

export function WaveShape({
    color = "currentColor",
    opacity = 0.08,
    scale = 1,
}: ShapeProps) {
    return (
        <svg
            viewBox="0 0 1440 590"
            preserveAspectRatio="none"
            style={{
                transform: `scale(${scale})`,
                opacity,
                pointerEvents: "none",
            }}
        >
            {/* wave de fundo */}
            <path
                d="M0,600 L0,150 C111.6,118.7 223.2,87.5 326,116 C428.7,144.4 522.7,232.5 604,222 C685.2,211.4 753.8,102.1 855,84 C956.2,65.8 1090,138.8 1193,165 C1295.9,191.1 1367.9,170.5 1440,150 L1440,600 L0,600 Z"
                fill={color}
                fillOpacity={0.53}
                strokeWidth={0}
            />

            {/* wave da frente */}
            <path
                d="M0,600 L0,350 C65.6,361.7 131.2,373.5 242,380 C352.7,386.4 508.6,387.4 614,401 C719.3,414.5 774.2,440.5 854,415 C933.7,389.4 1038.2,312.4 1140,293 C1241.7,273.5 1340.8,311.7 1440,350 L1440,600 L0,600 Z"
                fill={color}
                strokeWidth={0}
            />
        </svg>
    );
}
