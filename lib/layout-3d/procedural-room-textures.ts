import * as THREE from "three";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/**
 * Tileable wood plank albedo (canvas). Caller sets repeat/wrap on the texture for room scale.
 */
export function createWoodPlankTexture(baseHex: string, size = 512): THREE.CanvasTexture {
  const { r: br, g: bg, b: bb } = hexToRgb(baseHex);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const planks = 10;
  const ph = size / planks;
  for (let row = 0; row < planks; row++) {
    const jitter = ((row * 17) % 9) - 4;
    const y0 = row * ph;
    const grad = ctx.createLinearGradient(0, y0, size, y0 + ph);
    const v = (row * 13) % 7;
    const dr = jitter + v * 3;
    const dg = jitter - v * 2;
    const db = jitter + (v % 3) * 2;
    grad.addColorStop(
      0,
      `rgb(${clamp255(br + dr - 18)}, ${clamp255(bg + dg - 14)}, ${clamp255(bb + db - 12)})`,
    );
    grad.addColorStop(
      0.45,
      `rgb(${clamp255(br + dr + 8)}, ${clamp255(bg + dg + 6)}, ${clamp255(bb + db + 4)})`,
    );
    grad.addColorStop(
      1,
      `rgb(${clamp255(br + dr - 12)}, ${clamp255(bg + dg - 10)}, ${clamp255(bb + db - 8)})`,
    );
    ctx.fillStyle = grad;
    ctx.fillRect(0, y0, size, ph);
    ctx.strokeStyle = `rgba(40, 32, 24, ${0.12 + (row % 3) * 0.02})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y0 + ph);
    ctx.lineTo(size, y0 + ph);
    ctx.stroke();
  }

  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = "#3a2a1a";
  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 1 + Math.random() * 2;
    const h = 6 + Math.random() * 28;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/** Subtle plaster / paint variation for walls. */
export function createPlasterTexture(baseHex: string, size = 384): THREE.CanvasTexture {
  const { r: br, g: bg, b: bb } = hexToRgb(baseHex);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const img = ctx.createImageData(size, size);
  const d = img.data;
  let seed = 2166136261;
  const rnd = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = (rnd() - 0.5) * 14;
      const m = (rnd() - 0.5) * 10;
      d[i] = clamp255(br + n + m * 0.3);
      d[i + 1] = clamp255(bg + n * 0.9 + m);
      d[i + 2] = clamp255(bb + n * 0.85 + m * 0.9);
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}
