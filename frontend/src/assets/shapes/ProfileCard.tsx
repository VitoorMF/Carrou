import React from "react";
export type ProfileCardVariant = "neutral" | "filled";

export type CanvasProfileCardEl = {
    id: string;
    type: "profileCard";
    kind: "generated" | "complement" | "user";

    variant: ProfileCardVariant;

    // padrão do teu canvas
    x: number;
    y: number;
    w: number;
    h: number;



    user: {
        name: string;
        role?: string;
        avatarSrc?: string;
    };

    // estilo
    accent?: string;         // cor do pill
    text: string;
    opacity?: number;

    // controle do editor
    selectable?: boolean;    // default true
    draggable?: boolean;     // default true
};


export function ProfileCardElView({
    el,
    onSelect,
}: {
    el: CanvasProfileCardEl;
    onSelect?: (id: string) => void;
}) {
    const selectable = el.selectable !== false;
    const accent = el.accent ?? "#ffffff";
    const text = el.text ?? "#ffffff";

    // Não posicionamos absolute aqui — o renderer (`SlideRenderer`) já posiciona o wrapper.
    const baseStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "74px",
        opacity: el.opacity ?? 1,
        display: "flex",
        alignItems: "center",
        pointerEvents: selectable ? "auto" : "none",
        cursor: selectable ? "pointer" : "default",
        userSelect: "none",
        borderRadius: 30,
        backgroundColor: accent,
        paddingLeft: 5,
        paddingRight: 12,
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!selectable) return;
        e.stopPropagation();
        onSelect?.(el.id);
        // se você tem drag no editor, aqui você chama startDrag(...)
    };



    return (
        <div style={baseStyle} onMouseDown={handleMouseDown}>
            <Avatar src={el.user.avatarSrc} size={64} />
            <div style={{ marginLeft: 12, minWidth: 0, }}>
                <div
                    style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: text,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: el.w - 70,
                    }}
                >
                    {el.user.name}
                </div>
                {el.user.role ? (
                    <div
                        style={{
                            marginTop: 0,
                            fontSize: 16,
                            fontWeight: 500,
                            color: text,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: el.w - 70,
                        }}
                    >
                        {el.user.role}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function Avatar({
    src,
    size,
    ringColor,
}: {
    src?: string;
    size: number;
    ringColor?: string;
}) {
    const fallback = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="100%" height="100%" fill="#E5E7EB"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 4}" fill="#9CA3AF"/>
    </svg>
  `);

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: 25,
                overflow: "hidden",
                flex: "0 0 auto",
                boxShadow: ringColor ? `0 0 0 6px ${ringColor}` : undefined,
                background: "#E5E7EB",
            }}
        >
            <img
                src={src || fallback}
                alt=""
                draggable={false}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
        </div>
    );
}
