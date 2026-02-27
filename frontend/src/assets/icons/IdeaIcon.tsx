import type { IconProps } from "../../types/iconprops";

export function IdeaIcon({
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
      {/* bulb simples */}
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12c.5.6 1 1.4 1 2h6c0-.6.5-1.4 1-2a7 7 0 0 0-4-12z" />

      {/* spark pequeno */}
      <line x1="18" y1="4" x2="20" y2="2" />
      <line x1="20" y1="6" x2="22" y2="4" />
    </svg>
  );
}
