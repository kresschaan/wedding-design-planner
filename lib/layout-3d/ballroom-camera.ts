import { LAYOUT_SCENE_METERS_PER_PX } from "@/lib/layout-3d/scene-from-layout";
import type { BallroomCameraPreset } from "@/stores/layout-editor-store";

/**
 * Stable “overview” camera for the ballroom: always frames the full canvas floor from
 * inside the room (no drei Bounds — tight furniture bbox was zooming the camera into a mesh).
 */
export function ballroomPreviewCamera(
  canvasW: number,
  canvasH: number,
  preset: BallroomCameraPreset = "overview",
) {
  const mpp = LAYOUT_SCENE_METERS_PER_PX;
  const fw = canvasW * mpp;
  const fd = canvasH * mpp;
  const halfW = fw / 2;
  const halfD = fd / 2;
  const halfDiag = Math.hypot(halfW, halfD);

  if (halfDiag < 1e-4) {
    return {
      position: [2.2, 1.8, 2.2] as [number, number, number],
      far: 200 as const,
      fov: 40 as const,
      near: 0.08 as const,
      target: [0, 0.02, 0] as [number, number, number],
      minOrbitDist: 1.2,
      maxOrbitDist: 8,
    };
  }

  const ux = halfW / halfDiag;
  const uz = halfD / halfDiag;
  const target: [number, number, number] = [0, 0.08, 0];
  const maxOrbitDist = halfDiag * 1.55;
  const minOrbitDist = Math.max(0.9, halfDiag * 0.24);
  const far = Math.max(180, halfDiag * 9);

  if (preset === "top") {
    return {
      position: [0.001, Math.max(5.5, halfDiag * 1.08), 0.001] as [number, number, number],
      far,
      fov: 44 as const,
      near: 0.08 as const,
      target,
      minOrbitDist,
      maxOrbitDist,
    };
  }

  if (preset === "entrance") {
    return {
      position: [0, Math.min(2.35, Math.max(1.55, halfDiag * 0.28)), Math.max(fd * 0.42, 2.2)] as [
        number,
        number,
        number,
      ],
      far,
      fov: 45 as const,
      near: 0.08 as const,
      target,
      minOrbitDist,
      maxOrbitDist,
    };
  }

  /** Along diagonal from center toward (+x,+z), below the open ceiling. */
  const radial = halfDiag * 0.62;
  const y = Math.min(2.35, Math.max(1.55, halfDiag * 0.32));

  const position: [number, number, number] = [ux * radial, y, uz * radial];

  return {
    position,
    far,
    fov: 40 as const,
    near: 0.08 as const,
    target,
    minOrbitDist,
    maxOrbitDist,
  };
}
