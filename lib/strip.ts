"use client";

import { CODE_LENGTH, type Role } from "./room-protocol";

export type ShotPair = { you: string | null; me: string | null };

const COLORS = {
  bg: "#F8F9FB",
  ink: "#14161C",
  muted: "#6B7280",
  you: "#FF5C8A",
  youSoft: "#FFE6EF",
  me: "#3B7DFF",
  meSoft: "#E4EDFF",
};

function displayFont(px: number, weight = 600): string {
  let family = '"Georgia", serif';
  if (typeof document !== "undefined") {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-display")
      .trim();
    if (v) family = v;
  }
  return `${weight} ${px}px ${family}`;
}

function uiFont(px: number, weight = 500): string {
  let family = "system-ui, sans-serif";
  if (typeof document !== "undefined") {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-inter")
      .trim();
    if (v) family = v;
  }
  return `${weight} ${px}px ${family}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draw an image "cover"-fit and center-cropped into a box. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Composite the four captured pairs into one vertical duotone strip.
 * you → pink (left), me → blue (right). Returns a full-resolution PNG data URL.
 */
export async function buildStrip(
  code: string,
  shots: ShotPair[]
): Promise<string> {
  // Ensure branded fonts are ready before we paint text.
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }

  const W = 1200;
  const pad = 56;
  const gap = 24;
  const headerH = 150;
  const footerH = 110;
  const innerW = W - pad * 2;
  const cellW = (innerW - gap) / 2;
  const cellH = cellW; // square cells → tall strip
  const rows = 4;
  const H =
    pad + headerH + rows * cellH + (rows - 1) * gap + footerH + pad;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Card background.
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);
  roundRect(ctx, 16, 16, W - 32, H - 32, 40);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Header: ● you + ● me
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const headerY = pad + headerH / 2 - 12;
  ctx.font = displayFont(52, 600);
  const label = "you  +  me";
  const metrics = ctx.measureText(label);
  const startX = W / 2 - metrics.width / 2;
  drawDot(ctx, startX - 26, headerY, 11, COLORS.you);
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(label, W / 2, headerY);
  drawDot(ctx, W / 2 + metrics.width / 2 + 26, headerY, 11, COLORS.me);

  ctx.font = uiFont(24, 600);
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(`room ${code}`, W / 2, pad + headerH - 18);

  // Shot rows.
  const preloaded = await Promise.all(
    shots.map(async (pair) => ({
      you: pair.you ? await loadImage(pair.you).catch(() => null) : null,
      me: pair.me ? await loadImage(pair.me).catch(() => null) : null,
    }))
  );

  const drawCell = (
    img: HTMLImageElement | null,
    x: number,
    y: number,
    role: Role
  ) => {
    const tint = role === "you" ? COLORS.you : COLORS.me;
    const soft = role === "you" ? COLORS.youSoft : COLORS.meSoft;
    ctx.save();
    roundRect(ctx, x, y, cellW, cellH, 22);
    ctx.clip();
    if (img) {
      // "you" preview is mirrored on screen; keep the strip un-mirrored.
      drawCover(ctx, img, x, y, cellW, cellH);
      // Subtle duotone wash.
      ctx.fillStyle = tint;
      ctx.globalAlpha = 0.14;
      ctx.fillRect(x, y, cellW, cellH);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = soft;
      ctx.fillRect(x, y, cellW, cellH);
      ctx.fillStyle = tint;
      ctx.font = uiFont(22, 600);
      ctx.fillText("no camera", x + cellW / 2, y + cellH / 2);
    }
    ctx.restore();
    // Frame.
    ctx.save();
    roundRect(ctx, x + 1.5, y + 1.5, cellW - 3, cellH - 3, 22);
    ctx.strokeStyle = tint;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  };

  for (let i = 0; i < rows; i++) {
    const y = pad + headerH + i * (cellH + gap);
    drawCell(preloaded[i]?.you ?? null, pad, y, "you");
    drawCell(preloaded[i]?.me ?? null, pad + cellW + gap, y, "me");
  }

  // Footer branding.
  const footerY = H - pad - footerH / 2 + 8;
  ctx.font = displayFont(40, 600);
  ctx.fillStyle = COLORS.ink;
  ctx.fillText("mygurm", W / 2, footerY - 6);
  ctx.font = uiFont(22, 500);
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(
    `four cuts · ${code.padEnd(CODE_LENGTH, " ").trim()}`,
    W / 2,
    footerY + 30
  );

  return canvas.toDataURL("image/png");
}
