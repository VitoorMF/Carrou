import type { IconProps } from "../../types/iconprops";

export function ChartIcon({
  size = 96,
  color = "currentColor",
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* eixos */}
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="3" y1="21" x2="3" y2="3" />

      {/* linha do gráfico */}
      <polyline points="5 17 9 13 13 15 18 9" />
      <circle cx="5" cy="17" r="1" />
      <circle cx="9" cy="13" r="1" />
      <circle cx="13" cy="15" r="1" />
      <circle cx="18" cy="9" r="1" />
    </svg>
  );
}
