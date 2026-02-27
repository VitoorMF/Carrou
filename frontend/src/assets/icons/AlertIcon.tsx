import type { IconProps } from "../../types/iconprops";

export function AlertIcon({
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
      {/* triângulo */}
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      {/* exclamação */}
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r="0.2" />
    </svg>
  );
}
