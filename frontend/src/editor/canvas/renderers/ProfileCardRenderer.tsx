import { Group, Image, Rect, Text } from "react-konva";
import type { El } from "../types";
import { useKonvaImage } from "../hooks/useKonvaImage";

function buildAvatarFallback(size: number) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
          <rect width="100%" height="100%" fill="#E5E7EB"/>
          <circle cx="${size / 2}" cy="${size / 2}" r="${size / 4}" fill="#9CA3AF"/>
        </svg>
    `);
}

export function ProfileCardRenderer({ el }: { el: Extract<El, { type: "profileCard" }> }) {
    const x = el.x ?? 0;
    const y = el.y ?? 0;
    const w = Math.max(180, el.w ?? 350);
    const h = Math.max(56, el.h ?? 92);
    const accent = el.accent ?? "#FFFFFF";
    const text = el.text ?? "#0F172A";
    const opacity = el.opacity ?? 1;
    const radius = Math.min(30, h / 2);
    const avatarSize = Math.max(40, Math.min(64, h - 10));
    const avatarX = x + 5;
    const avatarY = y + (h - avatarSize) / 2;
    const nameX = avatarX + avatarSize + 12;
    const roleY = y + h / 2 + 6;
    const avatarSrc = el.user?.avatarSrc || buildAvatarFallback(avatarSize);
    const avatarImage = useKonvaImage(avatarSrc);

    return (
        <Group listening={false} opacity={opacity}>
            <Rect
                x={x}
                y={y}
                width={w}
                height={h}
                cornerRadius={radius}
                fill={accent}
            />

            {avatarImage ? (
                <Image
                    x={avatarX}
                    y={avatarY}
                    width={avatarSize}
                    height={avatarSize}
                    image={avatarImage}
                    cornerRadius={Math.min(25, avatarSize / 2)}
                />
            ) : (
                <Rect
                    x={avatarX}
                    y={avatarY}
                    width={avatarSize}
                    height={avatarSize}
                    cornerRadius={Math.min(25, avatarSize / 2)}
                    fill="#E5E7EB"
                />
            )}

            <Text
                x={nameX}
                y={y + 14}
                width={Math.max(80, w - (nameX - x) - 12)}
                text={el.user?.name ?? "Username"}
                fill={text}
                fontSize={20}
                fontFamily="Sora"
                fontStyle="bold"
                lineHeight={1.15}
                align="left"
            />

            <Text
                x={nameX}
                y={roleY}
                width={Math.max(80, w - (nameX - x) - 12)}
                text={el.user?.role ?? ""}
                fill={text}
                fontSize={16}
                fontFamily="Manrope"
                fontStyle="normal"
                lineHeight={1.2}
                align="left"
            />
        </Group>
    );
}
