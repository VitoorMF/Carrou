import { useId } from "react";

export type ShapeProps = {
  color?: string;   // cor principal (bg)
  opacity?: number;
  scale?: number;
  label?: string;   // texto editável
};

export function PillBadgeShape({
  color = "#006884",
  opacity = 1,
  scale = 1,
  label = "CONTINUE",
}: ShapeProps) {
  const uid = useId();

  // uid para ids únicos (usado no filtro)

  // se você quiser, pode derivar fg automaticamente (ex: sempre claro)
  const bgColor = color;
  const fgColor = "#eff8f8";

  // viewBox adapted from provided SVG
  const vbW = 215;
  const vbH = 85;

  // Referências do retângulo/pill e do ícone à esquerda (do SVG)
  const pillX = 6.20001;
  const pillY = 5.2002;
  const pillW = 200;
  const pillH = 70;

  const leftIconX = 11.2;
  const leftIconW = 60;

  // Calcula a região direita disponível (com um pequeno padding) e centraliza o label nela
  const rightStart = leftIconX + leftIconW + 8; // deixa um gap após o ícone
  const rightEnd = pillX + pillW - 12; // deixa um pequeno padding à direita
  const textX = (rightStart + rightEnd) / 2;
  const textY = pillY + pillH / 2; // centro vertical do pill

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ opacity }}>
      {/* escala opcional, centralizada */}
      <g transform={`translate(${vbW / 2} ${vbH / 2}) scale(${scale}) translate(${-vbW / 2} ${-vbH / 2})`}>
        <g filter={`url(#${uid}-filter)`}>
          <rect x="6.20001" y="5.2002" width="200" height="70" rx="30" fill={bgColor} />

          <rect x="11.2" y="10.2002" width="60" height="60" rx="25" fill="white" />
          <path d="M30.2909 21.2716C28.8364 22.7002 28.8364 24.8431 30.2909 26.2716L44.4727 40.2002L30.2909 54.1288C28.8364 55.5573 28.8364 57.7002 30.2909 59.1288C31.7455 60.5573 33.9273 60.5573 35.3818 59.1288L52.1091 42.7002C53.5637 41.2716 53.5637 39.1288 52.1091 37.7002L35.3818 21.2716C33.9273 19.8431 31.7455 19.8431 30.2909 21.2716Z" fill={bgColor} />
        </g>

        {/* Texto EDITÁVEL */}
        {label ? (
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={fgColor}
            fontFamily="Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial"
            fontSize={16}
            fontWeight={900}
            letterSpacing={2}
            pointerEvents="none"
          >
            {label}
          </text>
        ) : null}

        <defs>
          <filter id={`${uid}-filter`} x="1.23978e-05" y="0.000195503" width="214.4" height="84.4" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feOffset dx="1" dy="2" />
            <feGaussianBlur stdDeviation="3.6" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_124_14" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_124_14" result="shape" />
          </filter>
        </defs>
      </g>
    </svg>
  );
}
