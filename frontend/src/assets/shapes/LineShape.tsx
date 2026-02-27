type LineProps = {
  length?: number; // px
  thickness?: number; // px
  color?: string;
  opacity?: number;
  direction?: "horizontal" | "vertical";
};

export function LineShape({
  length = 900,
  thickness = 5,
  color = "currentColor",
  opacity = 0.2,
  direction = "horizontal",
}: LineProps) {
  return (
    <div
      style={{
        width: direction === "horizontal" ? length : thickness,
        height: direction === "vertical" ? length : thickness,
        backgroundColor: color,
        opacity,
        borderRadius: thickness,
      }}
    />
  );
}
