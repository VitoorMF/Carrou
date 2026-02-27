import type { IconProps } from "../../types/iconprops";

export function LightbulbIcon({
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
      {/* lâmpada */}
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12c.6.6 1 1.6 1 2.5V18h6v-1.5c0-.9.4-1.9 1-2.5a7 7 0 0 0-4-12z" />
    </svg>
  );
}
