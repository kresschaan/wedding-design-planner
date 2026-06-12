"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { useShallow } from "zustand/react/shallow";
import { useLayoutEditorStore } from "@/stores/layout-editor-store";
import { ballroomPreviewCamera } from "@/lib/layout-3d/ballroom-camera";
import { Ballroom3DScene } from "./Ballroom3DScene";

export function LayoutBallroom3DCanvas() {
  const {
    objects,
    canvasWidth,
    canvasHeight,
    venueSetting,
    selectedIds,
    cameraPreset,
    showWalls,
    showChandeliers,
    showFloorZones,
    navMode,
    showPerson,
    autoChairs,
  } = useLayoutEditorStore(
    useShallow((s) => ({
      objects: s.document.objects,
      canvasWidth: s.canvasWidth,
      canvasHeight: s.canvasHeight,
      venueSetting: s.venueSetting,
      selectedIds: s.selectedIds,
      cameraPreset: s.ballroomCameraPreset,
      showWalls: s.ballroomShowWalls,
      showChandeliers: s.ballroomShowChandeliers,
      showFloorZones: s.ballroomShowFloorZones,
      navMode: s.ballroomNavMode,
      showPerson: s.ballroomShowPerson,
      autoChairs: s.ballroomAutoChairs,
    })),
  );

  const cam = useMemo(
    () => ballroomPreviewCamera(canvasWidth, canvasHeight, cameraPreset),
    [canvasWidth, canvasHeight, cameraPreset],
  );

  return (
    <Canvas
      key={`${cameraPreset}-${canvasWidth}-${canvasHeight}`}
      className="h-full w-full min-h-[min(70vh,560px)] touch-none bg-[#e8dfd6]"
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      camera={{
        position: cam.position,
        fov: cam.fov,
        near: cam.near,
        far: cam.far,
      }}
    >
      <Ballroom3DScene
        objects={objects}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        venueSetting={venueSetting}
        selectedIds={selectedIds}
        cameraPreset={cameraPreset}
        showWalls={showWalls}
        showChandeliers={showChandeliers}
        showFloorZones={showFloorZones}
        navMode={navMode}
        showPerson={showPerson}
        autoChairs={autoChairs}
      />
    </Canvas>
  );
}
