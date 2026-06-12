"use client";

import { Component, Suspense, useEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { ModelAsset } from "@/lib/layout-3d/model-registry";

class ModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[ballroom-3d] GLB failed to load, using primitive fallback:", error);
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function GltfModel({
  asset,
  wx,
  wz,
  fx,
  fz,
  rotY,
  selected,
}: {
  asset: ModelAsset;
  wx: number;
  wz: number;
  fx: number;
  fz: number;
  rotY: number;
  selected: boolean;
}) {
  // Stock loader only — no DRACO / meshopt (assets are vendored & verified).
  const { scene } = useGLTF(asset.url, false, false);

  const cloned = useMemo(() => scene.clone(true), [scene]);

  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const ex = Math.max(size.x, 1e-4);
    const ez = Math.max(size.z, 1e-4);
    const mult = asset.scaleMultiplier ?? 1;
    // Either scale to a fixed real-world width (e.g. chairs) or fit the model
    // inside the object's 2D footprint.
    const s = asset.targetWidthMeters
      ? (asset.targetWidthMeters / Math.max(ex, ez)) * mult
      : Math.min(fx / ex, fz / ez) * mult;
    // Center horizontally on the object and rest the base on the floor,
    // regardless of where the model's local pivot sits.
    return {
      scale: s,
      offset: [-center.x * s, -box.min.y * s, -center.z * s] as [number, number, number],
    };
  }, [cloned, fx, fz, asset.scaleMultiplier, asset.targetWidthMeters]);

  useEffect(() => {
    cloned.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
  }, [cloned]);

  const yaw = rotY + (asset.yawOffset ?? 0);

  return (
    <group position={[wx, 0, wz]} rotation={[0, yaw, 0]}>
      <primitive object={cloned} scale={scale} position={offset} />
      {selected ? (
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(fx, fz) * 0.52, Math.max(fx, fz) * 0.66, 40]} />
          <meshBasicMaterial color="#caa15a" transparent opacity={0.85} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}

/**
 * Renders a vendored GLB for an object. If the model fails to load or suspends,
 * the provided primitive `fallback` is shown so the canvas never breaks.
 */
export function GltfLayoutObject({
  asset,
  wx,
  wz,
  fx,
  fz,
  rotY,
  selected,
  fallback,
}: {
  asset: ModelAsset;
  wx: number;
  wz: number;
  fx: number;
  fz: number;
  rotY: number;
  selected: boolean;
  fallback: ReactNode;
}) {
  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GltfModel asset={asset} wx={wx} wz={wz} fx={fx} fz={fz} rotY={rotY} selected={selected} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
