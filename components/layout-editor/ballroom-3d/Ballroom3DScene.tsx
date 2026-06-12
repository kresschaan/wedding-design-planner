"use client";

import { Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  Sky,
  useGLTF,
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { CanvasObject, VenueSetting } from "@/types/layout";
import { isTableLikeType } from "@/types/layout";
import { ballroomPreviewCamera } from "@/lib/layout-3d/ballroom-camera";
import { computeChairRingPositions } from "@/lib/chair-ring-layout";
import { defaultObjectForType } from "@/lib/sample-layout";
import { GltfLayoutObject } from "./GltfLayoutObject";
import { allModelAssets, getModelAsset } from "@/lib/layout-3d/model-registry";
import type { BallroomNavMode } from "@/stores/layout-editor-store";
import {
  createPlasterTexture,
  createWoodPlankTexture,
} from "@/lib/layout-3d/procedural-room-textures";
import type { BallroomCameraPreset } from "@/stores/layout-editor-store";
import {
  LAYOUT_SCENE_METERS_PER_PX,
  layoutObjectCenterXZ,
  meshHeightForType,
  meshMetalRough,
  objectFloorFootprint,
  objectIsLargeFloorZone,
  parseLayoutColor,
} from "@/lib/layout-3d/scene-from-layout";

for (const asset of allModelAssets()) {
  useGLTF.preload(asset.url, false, false);
}

function BallroomRoom({
  canvasW,
  canvasH,
  venueSetting,
  showWalls,
}: {
  canvasW: number;
  canvasH: number;
  venueSetting: VenueSetting;
  showWalls: boolean;
}) {
  const mpp = LAYOUT_SCENE_METERS_PER_PX;
  const fw = canvasW * mpp;
  const fd = canvasH * mpp;
  const wallH = venueSetting === "outdoor_garden" ? 2.2 : 2.95;
  const wallT = 0.12;
  const { wallHex, floorHex, woodWalls } = useMemo(() => {
    if (venueSetting === "church") {
      return { wallHex: "#d8d2ca", floorHex: "#c9c2b8", woodWalls: false };
    }
    if (venueSetting === "outdoor_garden") {
      return { wallHex: "#dfe8df", floorHex: "#b8c9a8", woodWalls: false };
    }
    // Warm honey wood-slat walls (resort ballroom look).
    return { wallHex: "#a06f3e", floorHex: "#caa978", woodWalls: true };
  }, [venueSetting]);

  const floorTex = useMemo(() => createWoodPlankTexture(floorHex), [floorHex]);
  const wallTex = useMemo(
    () => (woodWalls ? createWoodPlankTexture(wallHex) : createPlasterTexture(wallHex)),
    [woodWalls, wallHex],
  );

  useEffect(() => {
    return () => {
      floorTex.dispose();
      wallTex.dispose();
    };
  }, [floorTex, wallTex]);

  useEffect(() => {
    const nx = Math.max(6, Math.round(fw / 0.32));
    const nz = Math.max(6, Math.round(fd / 0.32));
    floorTex.repeat.set(nx, nz);
    floorTex.rotation = 0;
    floorTex.needsUpdate = true;
  }, [floorTex, fw, fd]);

  useEffect(() => {
    if (woodWalls) {
      // Horizontal slats: stretch planks across the width, ~10 slats per tile
      // so the wall reads as fine warm timber boards.
      wallTex.repeat.set(Math.max(2, Math.round(fw / 5)), Math.max(2, Math.round(wallH / 1.5)));
    } else {
      wallTex.repeat.set(Math.max(2, Math.round(fw / 1.4)), Math.max(2, Math.round(wallH / 1.1)));
    }
    wallTex.needsUpdate = true;
  }, [wallTex, woodWalls, fw, wallH]);

  const wallRadius = Math.min(0.045, wallT / 2 - 0.001);
  const backWallGeo = useMemo(
    () => new RoundedBoxGeometry(fw + wallT * 2, wallH, wallT, 2, wallRadius),
    [fw, wallH, wallT, wallRadius],
  );
  const sideWallGeo = useMemo(
    () => new RoundedBoxGeometry(wallT, wallH, fd, 2, wallRadius),
    [fd, wallH, wallT, wallRadius],
  );

  useEffect(() => {
    return () => {
      backWallGeo.dispose();
      sideWallGeo.dispose();
    };
  }, [backWallGeo, sideWallGeo]);

  const wallMatProps = woodWalls
    ? {
        map: wallTex,
        color: "#f4e3cf" as const,
        roughness: 0.68,
        metalness: 0.04,
        clearcoat: 0.12,
        clearcoatRoughness: 0.45,
        envMapIntensity: 0.7,
      }
    : {
        map: wallTex,
        color: "#ffffff" as const,
        roughness: 0.82,
        metalness: 0.02,
        clearcoat: 0.06,
        clearcoatRoughness: 0.55,
        envMapIntensity: 0.55,
      };

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[fw + wallT * 2, fd + wallT * 2]} />
        <meshPhysicalMaterial
          map={floorTex}
          color="#ffffff"
          roughness={0.58}
          metalness={0.04}
          clearcoat={0.08}
          clearcoatRoughness={0.42}
          envMapIntensity={0.65}
        />
      </mesh>
      {showWalls && venueSetting !== "outdoor_garden" ? (
        <>
          <mesh position={[0, wallH / 2, -fd / 2 - wallT / 2]} receiveShadow castShadow geometry={backWallGeo}>
            <meshPhysicalMaterial {...wallMatProps} />
          </mesh>
          <mesh position={[-fw / 2 - wallT / 2, wallH / 2, 0]} receiveShadow castShadow geometry={sideWallGeo}>
            <meshPhysicalMaterial {...wallMatProps} />
          </mesh>
          <mesh position={[fw / 2 + wallT / 2, wallH / 2, 0]} receiveShadow castShadow geometry={sideWallGeo}>
            <meshPhysicalMaterial {...wallMatProps} />
          </mesh>
        </>
      ) : null}
    </group>
  );
}

type AntlerBone = { x: number; y: number; len: number; ang: number; r0: number; r1: number };

/** One antler arm laid out in a local vertical plane (x = outward, y = up). */
function buildAntlerArm(): { bones: AntlerBone[]; tips: { x: number; y: number }[] } {
  const bones: AntlerBone[] = [];
  const joints: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  let x = 0;
  let y = 0;
  const segs = [
    { len: 0.3, ang: 0.22, r0: 0.04, r1: 0.032 },
    { len: 0.26, ang: 0.62, r0: 0.032, r1: 0.024 },
    { len: 0.22, ang: 1.02, r0: 0.024, r1: 0.013 },
  ];
  for (const s of segs) {
    bones.push({ x, y, ...s });
    x += Math.cos(s.ang) * s.len;
    y += Math.sin(s.ang) * s.len;
    joints.push({ x, y });
  }
  const tips: { x: number; y: number }[] = [{ x, y }];
  const tineDefs = [
    { j: 1, len: 0.19, ang: 1.18, r0: 0.02, r1: 0.011 },
    { j: 2, len: 0.15, ang: 1.38, r0: 0.016, r1: 0.01 },
  ];
  for (const t of tineDefs) {
    const b = joints[t.j];
    bones.push({ x: b.x, y: b.y, len: t.len, ang: t.ang, r0: t.r0, r1: t.r1 });
    tips.push({ x: b.x + Math.cos(t.ang) * t.len, y: b.y + Math.sin(t.ang) * t.len });
  }
  return { bones, tips };
}

const ANTLER_BONE = "#b79a6b";

function AntlerChandelier({ scale = 1.25 }: { scale?: number }) {
  const arms = 8;
  const { bones, tips } = useMemo(() => buildAntlerArm(), []);

  const boneMat = (
    <meshPhysicalMaterial
      color={ANTLER_BONE}
      emissive="#3a2c18"
      emissiveIntensity={0.12}
      roughness={0.52}
      metalness={0.18}
      clearcoat={0.3}
      clearcoatRoughness={0.4}
      envMapIntensity={0.8}
    />
  );

  return (
    <group scale={scale}>
      {/* downrod + central hub */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.016, 0.016, 0.4, 8]} />
        <meshPhysicalMaterial color="#43321d" roughness={0.5} metalness={0.5} envMapIntensity={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.1, 20, 16]} />
        {boneMat}
      </mesh>

      {Array.from({ length: arms }).map((_, ai) => {
        const az = (ai / arms) * Math.PI * 2;
        return (
          <group key={ai} rotation={[0, az, 0]}>
            {bones.map((b, bi) => (
              <mesh
                key={bi}
                castShadow
                position={[b.x + (Math.cos(b.ang) * b.len) / 2, b.y + (Math.sin(b.ang) * b.len) / 2, 0]}
                rotation={[0, 0, b.ang - Math.PI / 2]}
              >
                <cylinderGeometry args={[b.r1, b.r0, b.len, 8]} />
                {boneMat}
              </mesh>
            ))}
            {tips.map((t, ti) => (
              <group key={ti} position={[t.x, t.y + 0.02, 0]}>
                <mesh>
                  <sphereGeometry args={[0.026, 14, 12]} />
                  <meshStandardMaterial
                    color="#fff3d6"
                    emissive="#ffcf86"
                    emissiveIntensity={2.6}
                    toneMapped={false}
                  />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}

      <pointLight position={[0, 0.1, 0]} intensity={16} distance={0} decay={1.9} color="#ffe2b0" />
    </group>
  );
}

function ChandelierGroup({ roomSpan }: { roomSpan: number }) {
  const positions = useMemo(() => {
    const s = Math.min(roomSpan * 0.32, 4.2);
    return [
      [s, 2.5, s],
      [-s, 2.5, s],
      [s, 2.5, -s],
      [-s, 2.5, -s],
      [0, 2.58, 0],
    ] as [number, number, number][];
  }, [roomSpan]);

  return (
    <group>
      {positions.map((p, i) => (
        <group key={i} position={p}>
          <AntlerChandelier scale={i === 4 ? 1.4 : 1.2} />
        </group>
      ))}
    </group>
  );
}

function CameraLookAt({
  position,
  target,
}: {
  position: [number, number, number];
  target: [number, number, number];
}) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.position.set(...position);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }, [camera, position, target]);
  return null;
}

/** A simple stylized guest for scale / presence. Faces -Z (into the room). */
function Person({
  position,
  color = "#5b6b86",
  heightMeters = 1.0,
}: {
  position: [number, number, number];
  color?: string;
  heightMeters?: number;
}) {
  const skin = "#e8c4a0";
  // The figure is modeled ~1.635 m tall intrinsically; scale it to the desired
  // height so it reads proportionally next to the (sub-scale) chairs & tables.
  const s = heightMeters / 1.635;
  return (
    <group position={position} scale={s}>
      {/* legs */}
      <mesh position={[-0.07, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.05, 0.68, 12]} />
        <meshPhysicalMaterial color="#2f3645" roughness={0.7} envMapIntensity={0.5} />
      </mesh>
      <mesh position={[0.07, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.05, 0.68, 12]} />
        <meshPhysicalMaterial color="#2f3645" roughness={0.7} envMapIntensity={0.5} />
      </mesh>
      {/* torso */}
      <mesh position={[0, 0.98, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.62, 16]} />
        <meshPhysicalMaterial color={color} roughness={0.62} sheen={0.4} envMapIntensity={0.6} />
      </mesh>
      {/* arms */}
      <mesh position={[-0.18, 0.98, 0]} rotation={[0, 0, 0.18]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.56, 12]} />
        <meshPhysicalMaterial color={color} roughness={0.62} envMapIntensity={0.6} />
      </mesh>
      <mesh position={[0.18, 0.98, 0]} rotation={[0, 0, -0.18]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.56, 12]} />
        <meshPhysicalMaterial color={color} roughness={0.62} envMapIntensity={0.6} />
      </mesh>
      {/* neck + head */}
      <mesh position={[0, 1.34, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.05, 0.08, 10]} />
        <meshPhysicalMaterial color={skin} roughness={0.6} envMapIntensity={0.5} />
      </mesh>
      <mesh position={[0, 1.46, 0]} castShadow>
        <sphereGeometry args={[0.11, 24, 24]} />
        <meshPhysicalMaterial color={skin} roughness={0.55} envMapIntensity={0.5} />
      </mesh>
      <mesh position={[0, 1.52, -0.01]} castShadow>
        <sphereGeometry args={[0.115, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshPhysicalMaterial color="#3a2f28" roughness={0.7} envMapIntensity={0.4} />
      </mesh>
    </group>
  );
}

/**
 * First-person drag navigation (no pointer lock): left-drag to look around,
 * scroll wheel to glide forward / back, WASD / arrows to walk & strafe.
 */
function WalkControls({
  startX,
  startZ,
  halfX,
  halfZ,
}: {
  startX: number;
  startZ: number;
  halfX: number;
  halfZ: number;
}) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const keys = useRef<Record<string, boolean>>({});
  const drag = useRef({ active: false, x: 0, y: 0 });
  const yaw = useRef(0);
  const pitch = useRef(0);
  const EYE = 1.55;
  const margin = 0.4;

  const clampPos = useMemo(
    () => (cam: THREE.Camera) => {
      cam.position.x = Math.max(-halfX + margin, Math.min(halfX - margin, cam.position.x));
      cam.position.z = Math.max(-halfZ + margin, Math.min(halfZ - margin, cam.position.z));
      cam.position.y = EYE;
    },
    [halfX, halfZ],
  );

  // Position the camera at eye height and aim it toward the room centre.
  useEffect(() => {
    camera.position.set(startX, EYE, startZ);
    yaw.current = Math.atan2(-(0 - startX), -(0 - startZ));
    pitch.current = 0;
    camera.rotation.order = "YXZ";
    camera.rotation.set(0, yaw.current, 0);
  }, [camera, startX, startZ]);

  // Keyboard movement state.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Mouse drag to look + wheel to move.
  useEffect(() => {
    const el = gl.domElement;
    const LOOK = 0.0042;
    const PITCH_LIMIT = Math.PI / 2 - 0.06;
    const fwd = new THREE.Vector3();

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      drag.current = { active: true, x: e.clientX, y: e.clientY };
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      el.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
      yaw.current -= dx * LOOK;
      pitch.current = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch.current - dy * LOOK));
      camera.rotation.set(pitch.current, yaw.current, 0);
    };
    const onUp = (e: PointerEvent) => {
      drag.current.active = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      el.style.cursor = "grab";
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.getWorldDirection(fwd);
      fwd.y = 0;
      if (fwd.lengthSq() < 1e-6) return;
      fwd.normalize();
      camera.position.addScaledVector(fwd, -e.deltaY * 0.01);
      clampPos(camera);
    };

    el.style.cursor = "grab";
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("wheel", onWheel);
      el.style.cursor = "";
    };
  }, [gl, camera, clampPos]);

  const fwd = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const k = keys.current;
    const speed = 2.8 * delta;
    let f = 0;
    let r = 0;
    if (k["KeyW"] || k["ArrowUp"]) f += speed;
    if (k["KeyS"] || k["ArrowDown"]) f -= speed;
    if (k["KeyD"] || k["ArrowRight"]) r += speed;
    if (k["KeyA"] || k["ArrowLeft"]) r -= speed;
    if (f !== 0 || r !== 0) {
      camera.getWorldDirection(fwd);
      fwd.y = 0;
      fwd.normalize();
      right.crossVectors(fwd, camera.up).normalize();
      camera.position.addScaledVector(fwd, f);
      camera.position.addScaledVector(right, r);
    }
    clampPos(camera);
  });

  return null;
}

/**
 * Adds keyboard travel to Orbit mode: mouse still rotates/zooms, but W/A/S/D or
 * arrows glide the camera (and its orbit pivot) through the room so you can move
 * around instead of only circling a fixed point.
 */
function OrbitKeyboardMove({
  controlsRef,
  halfX,
  halfZ,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.MutableRefObject<any>;
  halfX: number;
  halfZ: number;
}) {
  const camera = useThree((s) => s.camera);
  const keys = useRef<Record<string, boolean>>({});
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((_, delta) => {
    const c = controlsRef.current;
    if (!c) return;
    const k = keys.current;
    const speed = 3.4 * delta;
    let f = 0;
    let r = 0;
    if (k["KeyW"] || k["ArrowUp"]) f += speed;
    if (k["KeyS"] || k["ArrowDown"]) f -= speed;
    if (k["KeyD"] || k["ArrowRight"]) r += speed;
    if (k["KeyA"] || k["ArrowLeft"]) r -= speed;
    if (f === 0 && r === 0) return;

    camera.getWorldDirection(fwd);
    fwd.y = 0;
    if (fwd.lengthSq() < 1e-6) return;
    fwd.normalize();
    right.crossVectors(fwd, camera.up).normalize();

    const dx = fwd.x * f + right.x * r;
    const dz = fwd.z * f + right.z * r;
    // Move the pivot, clamped to the room, then shift the camera by the same
    // amount so the orbit framing is preserved while travelling.
    const ntx = Math.max(-halfX, Math.min(halfX, c.target.x + dx));
    const ntz = Math.max(-halfZ, Math.min(halfZ, c.target.z + dz));
    const adx = ntx - c.target.x;
    const adz = ntz - c.target.z;
    camera.position.x += adx;
    camera.position.z += adz;
    c.target.x = ntx;
    c.target.z = ntz;
    c.update();
  });

  return null;
}

function Chair3D({
  wx,
  wz,
  fx,
  fz,
  rotY,
  color,
  selected,
}: {
  wx: number;
  wz: number;
  fx: number;
  fz: number;
  rotY: number;
  color: string;
  selected: boolean;
}) {
  const seatY = 0.44;
  const legH = seatY - 0.04;
  const legInsetX = fx * 0.34;
  const legInsetZ = fz * 0.34;
  const legR = Math.min(0.016, Math.min(fx, fz) * 0.065);
  const seatGeo = useMemo(
    () =>
      new RoundedBoxGeometry(
        fx * 0.9,
        0.055,
        fz * 0.88,
        2,
        Math.min(0.024, Math.min(fx, fz) * 0.07),
      ),
    [fx, fz],
  );
  const backGeo = useMemo(
    () =>
      new RoundedBoxGeometry(fx * 0.92, 0.38, 0.065, 2, Math.min(0.02, fx * 0.055)),
    [fx],
  );

  useEffect(() => {
    return () => {
      seatGeo.dispose();
      backGeo.dispose();
    };
  }, [seatGeo, backGeo]);

  const emissive = selected ? "#6b4c1a" : "#000000";
  const emissiveIntensity = selected ? 0.26 : 0;
  const upholstery = {
    color,
    roughness: 0.52,
    metalness: 0.05,
    clearcoat: 0.32,
    clearcoatRoughness: 0.38,
    envMapIntensity: 1.05,
    emissive,
    emissiveIntensity,
  } as const;

  const legPositions: [number, number, number][] = [
    [-legInsetX, legH / 2, -legInsetZ],
    [legInsetX, legH / 2, -legInsetZ],
    [-legInsetX, legH / 2, legInsetZ],
    [legInsetX, legH / 2, legInsetZ],
  ];

  return (
    <group position={[wx, 0, wz]} rotation={[0, rotY, 0]}>
      {legPositions.map((p, i) => (
        <mesh key={i} position={p} castShadow receiveShadow>
          <cylinderGeometry args={[legR, legR * 0.82, legH, 12]} />
          <meshPhysicalMaterial
            color="#3f332c"
            roughness={0.58}
            metalness={0.14}
            clearcoat={0.12}
            clearcoatRoughness={0.45}
            envMapIntensity={0.45}
          />
        </mesh>
      ))}
      <mesh position={[0, seatY, 0]} castShadow receiveShadow geometry={seatGeo}>
        <meshPhysicalMaterial {...upholstery} />
      </mesh>
      <mesh position={[0, seatY + 0.2, -fz * 0.3]} castShadow receiveShadow geometry={backGeo}>
        <meshPhysicalMaterial {...upholstery} />
      </mesh>
    </group>
  );
}

const LINEN_HEX = "#f3ecdd";
const TABLETOP_HEX = "#fbf7ee";
const BLOOM_PALETTE = ["#f3c4d2", "#fbe8ee", "#ffffff", "#e7a9bd", "#f6d6b8", "#efc6d6"];
const LEAF_HEX = "#6f8f5e";

function SelectionRing({ radius }: { radius: number }) {
  return (
    <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.98, radius * 1.16, 44]} />
      <meshBasicMaterial color="#caa15a" transparent opacity={0.85} depthWrite={false} />
    </mesh>
  );
}

/** Draped floor-length linen table — round or rectangular — for receptions. */
function ElegantTable({
  wx,
  wz,
  fx,
  fz,
  h,
  rotY,
  accent,
  round,
  withCenterpiece,
  selected,
}: {
  wx: number;
  wz: number;
  fx: number;
  fz: number;
  h: number;
  rotY: number;
  accent: string;
  round: boolean;
  withCenterpiece: boolean;
  selected: boolean;
}) {
  const linen = (
    <meshPhysicalMaterial
      color={LINEN_HEX}
      roughness={0.82}
      metalness={0.02}
      sheen={0.5}
      sheenColor="#ffffff"
      sheenRoughness={0.6}
      clearcoat={0.04}
      envMapIntensity={0.6}
    />
  );

  if (round) {
    const r = Math.min(fx, fz) / 2;
    // Banquet tables read wide-and-low: keep height below the diameter so it
    // never looks like a bucket, even when the 2D footprint is small.
    const th = Math.min(0.62, Math.max(0.32, r * 1.0));
    return (
      <group position={[wx, 0, wz]} rotation={[0, rotY, 0]}>
        {/* floor-length linen skirt — straight drop with a soft puddle at the floor */}
        <mesh position={[0, th / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[r, r * 1.06, th, 56]} />
          {linen}
        </mesh>
        {/* wide flat tabletop with a slight overhang */}
        <mesh position={[0, th + 0.018, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[r * 1.04, r * 1.04, 0.04, 56]} />
          <meshPhysicalMaterial color={TABLETOP_HEX} roughness={0.68} metalness={0.02} envMapIntensity={0.6} />
        </mesh>
        {/* accent border around the tabletop edge */}
        <mesh position={[0, th + 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r * 1.0, 0.012, 10, 56]} />
          <meshPhysicalMaterial color={accent} roughness={0.5} metalness={0.08} sheen={0.5} envMapIntensity={0.7} />
        </mesh>
        {withCenterpiece ? (
          <group position={[0, th + 0.04, 0]}>
            <FloralArrangement variant="low" accent={accent} />
          </group>
        ) : null}
        {selected ? <SelectionRing radius={r * 1.1} /> : null}
      </group>
    );
  }

  // Rectangular draped table — keep it lower than it is long
  const rth = Math.min(0.7, Math.max(0.34, Math.min(fx, fz) * 0.9 + 0.18));
  const topR = Math.min(0.03, Math.min(fx, fz) * 0.06);
  return (
    <group position={[wx, 0, wz]} rotation={[0, rotY, 0]}>
      <mesh position={[0, rth / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[fx * 0.94, rth, fz * 0.94]} />
        {linen}
      </mesh>
      <mesh position={[0, rth + 0.012, 0]} castShadow receiveShadow>
        <RoundedBoxFitted w={fx} d={fz} radius={topR} />
        <meshPhysicalMaterial color={TABLETOP_HEX} roughness={0.7} metalness={0.02} envMapIntensity={0.6} />
      </mesh>
      {/* table runner down the longer axis */}
      <mesh position={[0, rth + 0.03, 0]}>
        <boxGeometry args={fx >= fz ? [fx * 0.96, 0.012, fz * 0.32] : [fx * 0.32, 0.012, fz * 0.96]} />
        <meshPhysicalMaterial color={accent} roughness={0.5} metalness={0.06} sheen={0.55} envMapIntensity={0.75} />
      </mesh>
      {withCenterpiece
        ? (() => {
            const longLen = Math.max(fx, fz);
            const n = longLen > 2.2 ? 3 : longLen > 1.3 ? 2 : 1;
            const along = fx >= fz;
            const span = longLen * 0.62;
            return Array.from({ length: n }).map((_, i) => {
              const t = n === 1 ? 0 : (i / (n - 1) - 0.5) * span;
              return (
                <group key={`cp-${i}`} position={[along ? t : 0, rth + 0.04, along ? 0 : t]}>
                  <FloralArrangement variant="low" accent={accent} />
                </group>
              );
            });
          })()
        : null}
      {selected ? <SelectionRing radius={Math.max(fx, fz) / 2} /> : null}
    </group>
  );
}

/** Thin rounded tabletop slab geometry, created+disposed per size. */
function RoundedBoxFitted({ w, d, radius }: { w: number; d: number; radius: number }) {
  const geo = useMemo(() => new RoundedBoxGeometry(w, 0.03, d, 2, radius), [w, d, radius]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <primitive object={geo} attach="geometry" />;
}

/** A rounded dome of blooms (roses) with greenery filler, modeled at local origin. */
function FlowerBlooms({ radius, count }: { radius: number; count: number }) {
  const blooms = useMemo(() => {
    const ga = Math.PI * (3 - Math.sqrt(5));
    const arr: { p: [number, number, number]; s: number; c: string }[] = [];
    for (let i = 0; i < count; i++) {
      const yy = 1 - (i / Math.max(1, count - 1)) * 0.82; // top -> sides of a dome
      const rr = Math.sqrt(Math.max(0, 1 - yy * yy));
      const theta = ga * i;
      arr.push({
        p: [Math.cos(theta) * rr * radius, yy * radius * 0.85 + radius * 0.08, Math.sin(theta) * rr * radius],
        s: radius * (0.24 + ((i * 7) % 5) * 0.018),
        c: BLOOM_PALETTE[i % BLOOM_PALETTE.length],
      });
    }
    return arr;
  }, [radius, count]);

  return (
    <group>
      {blooms.map((b, i) => (
        <mesh key={i} position={b.p} castShadow>
          <icosahedronGeometry args={[b.s, 1]} />
          <meshPhysicalMaterial
            color={b.c}
            roughness={0.6}
            metalness={0.02}
            sheen={0.6}
            sheenColor="#ffffff"
            sheenRoughness={0.5}
            envMapIntensity={0.6}
          />
        </mesh>
      ))}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={`leaf-${i}`}
            position={[Math.cos(a) * radius * 0.96, radius * 0.06, Math.sin(a) * radius * 0.96]}
            rotation={[Math.PI / 2.4, 0, -a]}
            castShadow
          >
            <coneGeometry args={[radius * 0.16, radius * 0.55, 6]} />
            <meshPhysicalMaterial color={LEAF_HEX} roughness={0.72} metalness={0.02} envMapIntensity={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Procedural floral display, modeled with its base at local y=0.
 * "stand" = tall footed-vase arrangement (decor); "low" = table centerpiece.
 */
function FloralArrangement({ variant, accent }: { variant: "stand" | "low"; accent: string }) {
  const vaseMat = (
    <meshPhysicalMaterial
      color="#efe7d6"
      roughness={0.28}
      metalness={0.06}
      clearcoat={0.5}
      clearcoatRoughness={0.25}
      envMapIntensity={0.9}
    />
  );

  if (variant === "stand") {
    const vaseH = 0.5;
    return (
      <group>
        <mesh position={[0, 0.025, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.13, 0.05, 20]} />
          {vaseMat}
        </mesh>
        <mesh position={[0, vaseH * 0.5 + 0.03, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.045, vaseH, 20]} />
          {vaseMat}
        </mesh>
        <mesh position={[0, vaseH + 0.09, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.07, 0.13, 24]} />
          {vaseMat}
        </mesh>
        {/* accent ribbon at the bowl rim */}
        <mesh position={[0, vaseH + 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.16, 0.012, 8, 32]} />
          <meshPhysicalMaterial color={accent} roughness={0.5} metalness={0.1} sheen={0.5} envMapIntensity={0.7} />
        </mesh>
        <group position={[0, vaseH + 0.2, 0]}>
          <FlowerBlooms radius={0.24} count={30} />
        </group>
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.08, 0.06, 24]} />
        {vaseMat}
      </mesh>
      <mesh position={[0, 0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.009, 8, 28]} />
        <meshPhysicalMaterial color={accent} roughness={0.5} metalness={0.1} sheen={0.5} envMapIntensity={0.7} />
      </mesh>
      <group position={[0, 0.085, 0]}>
        <FlowerBlooms radius={0.155} count={20} />
      </group>
    </group>
  );
}

/**
 * The couple's head table: a wide draped table with a floral garland along the
 * front, centerpieces, and two chairs behind it facing the room / stage.
 */
function SweetheartTable({
  wx,
  wz,
  fx,
  fz,
  rotY,
  accent,
  selected,
}: {
  wx: number;
  wz: number;
  fx: number;
  fz: number;
  rotY: number;
  accent: string;
  selected: boolean;
}) {
  const w = Math.max(fx, 1.45);
  const d = Math.max(fz, 0.58);
  // A real banquet table: thin top on visible legs with a lap-length cloth, so
  // it reads as a table (not a floor-to-ceiling counter block). Kept low to
  // match the short chair model (~0.43 m).
  const topH = 0.45;
  const clothH = 0.3;
  const legH = topH - 0.02;
  const legR = 0.022;
  const legInsetX = w / 2 - 0.1;
  const legInsetZ = d / 2 - 0.09;

  const clothGeo = useMemo(() => new RoundedBoxGeometry(w, clothH, d, 2, 0.03), [w, d]);
  const topGeo = useMemo(() => new RoundedBoxGeometry(w + 0.06, 0.045, d + 0.06, 2, 0.025), [w, d]);
  useEffect(() => {
    return () => {
      clothGeo.dispose();
      topGeo.dispose();
    };
  }, [clothGeo, topGeo]);

  const linen = (
    <meshPhysicalMaterial
      color={LINEN_HEX}
      roughness={0.82}
      metalness={0.02}
      sheen={0.5}
      sheenColor="#ffffff"
      sheenRoughness={0.6}
      clearcoat={0.04}
      envMapIntensity={0.6}
    />
  );

  const chairAsset = getModelAsset("chair");
  const chairBase = defaultObjectForType("chair");
  const chairOffset = Math.min(0.42, w * 0.24);
  const chairs = [
    { x: -chairOffset, z: d / 2 + 0.3 },
    { x: chairOffset, z: d / 2 + 0.3 },
  ];
  const legs: [number, number, number][] = [
    [-legInsetX, legH / 2, -legInsetZ],
    [legInsetX, legH / 2, -legInsetZ],
    [-legInsetX, legH / 2, legInsetZ],
    [legInsetX, legH / 2, legInsetZ],
  ];

  // Floral garland draping along the front (-Z) top edge.
  const garlandN = Math.max(4, Math.round(w / 0.26));

  return (
    // +PI so the couple's seats face the dance floor / room rather than the
    // stage behind the head table (rotate further in the 2D editor if needed).
    <group position={[wx, 0, wz]} rotation={[0, rotY + Math.PI, 0]}>
      {/* legs */}
      {legs.map((p, i) => (
        <mesh key={`leg-${i}`} position={p} castShadow receiveShadow>
          <cylinderGeometry args={[legR, legR * 0.85, legH, 12]} />
          <meshPhysicalMaterial color="#5a4632" roughness={0.55} metalness={0.18} envMapIntensity={0.5} />
        </mesh>
      ))}
      {/* lap-length cloth (top at topH, drapes partway so the legs show) */}
      <mesh position={[0, topH - clothH / 2, 0]} castShadow receiveShadow geometry={clothGeo}>
        {linen}
      </mesh>
      {/* tabletop surface */}
      <mesh position={[0, topH, 0]} castShadow receiveShadow geometry={topGeo}>
        <meshPhysicalMaterial color={TABLETOP_HEX} roughness={0.68} metalness={0.02} envMapIntensity={0.6} />
      </mesh>
      {/* runner down the length */}
      <mesh position={[0, topH + 0.03, 0]}>
        <boxGeometry args={[w * 0.92, 0.012, d * 0.34]} />
        <meshPhysicalMaterial color={accent} roughness={0.5} metalness={0.06} sheen={0.55} envMapIntensity={0.75} />
      </mesh>
      {/* floral garland along the front edge */}
      {Array.from({ length: garlandN }).map((_, i) => {
        const x = (i / (garlandN - 1) - 0.5) * w * 0.92;
        return (
          <group key={`g-${i}`} position={[x, topH - 0.04, -d / 2 + 0.02]} scale={[1, 0.85, 0.7]}>
            <FlowerBlooms radius={0.085} count={8} />
          </group>
        );
      })}
      {/* two low centerpieces on the table */}
      <group position={[-w * 0.22, topH + 0.02, 0]}>
        <FloralArrangement variant="low" accent={accent} />
      </group>
      <group position={[w * 0.22, topH + 0.02, 0]}>
        <FloralArrangement variant="low" accent={accent} />
      </group>
      {/* the couple's chairs, behind the table, facing the room */}
      {chairs.map((c, i) => {
        const fallback = (
          <Chair3D wx={c.x} wz={c.z} fx={0.52} fz={0.52} rotY={0} color={chairBase.color} selected={false} />
        );
        return chairAsset ? (
          <GltfLayoutObject
            key={`c-${i}`}
            asset={chairAsset}
            wx={c.x}
            wz={c.z}
            fx={0.52}
            fz={0.52}
            rotY={0}
            selected={false}
            fallback={fallback}
          />
        ) : (
          <group key={`c-${i}`}>{fallback}</group>
        );
      })}
      {selected ? <SelectionRing radius={Math.max(w, d) / 2} /> : null}
    </group>
  );
}

/** Ceremony arch / garden arbor — posts, arched top, floral accents. */
function CeremonyArch({
  wx,
  wz,
  fx,
  h,
  rotY,
  accent,
  greenery,
  selected,
}: {
  wx: number;
  wz: number;
  fx: number;
  h: number;
  rotY: number;
  accent: string;
  greenery: boolean;
  selected: boolean;
}) {
  const span = fx * 0.42;
  const postH = h * 0.8;
  const frameHex = greenery ? "#8a6f4f" : "#efe9dd";
  const leaf = "#6f8f5e";
  const florals: [number, number, number, string][] = [
    [-span, postH, 0, accent],
    [span, postH, 0, accent],
    [-span * 0.5, postH + span * 0.7, 0, greenery ? leaf : "#f3d9e2"],
    [span * 0.5, postH + span * 0.7, 0, greenery ? leaf : "#f3d9e2"],
    [0, postH + span, 0, accent],
  ];
  return (
    <group position={[wx, 0, wz]} rotation={[0, rotY, 0]}>
      {[-span, span].map((x, i) => (
        <mesh key={i} position={[x, postH / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.055, 0.06, postH, 18]} />
          <meshPhysicalMaterial color={frameHex} roughness={0.6} metalness={0.05} envMapIntensity={0.6} />
        </mesh>
      ))}
      <mesh position={[0, postH, 0]} castShadow>
        <torusGeometry args={[span, 0.055, 16, 40, Math.PI]} />
        <meshPhysicalMaterial color={frameHex} roughness={0.6} metalness={0.05} envMapIntensity={0.6} />
      </mesh>
      {florals.map((f, i) => (
        <mesh key={`f${i}`} position={[f[0], f[1], f[2]]} castShadow>
          <icosahedronGeometry args={[0.13, 1]} />
          <meshPhysicalMaterial color={f[3]} roughness={0.65} metalness={0.03} sheen={0.4} envMapIntensity={0.6} />
        </mesh>
      ))}
      {selected ? <SelectionRing radius={span * 1.2} /> : null}
    </group>
  );
}

/** Low carpeted stage / riser with skirt, gold trim and front steps. */
function Stage({
  wx,
  wz,
  fx,
  fz,
  rotY,
  accent,
  selected,
}: {
  wx: number;
  wz: number;
  fx: number;
  fz: number;
  rotY: number;
  accent: string;
  selected: boolean;
}) {
  // Keep risers low so they read as a platform, not a tall block.
  const th = Math.min(0.34, Math.max(0.16, Math.min(fx, fz) * 0.18));
  const deck = useMemo(() => new RoundedBoxGeometry(fx, th, fz, 2, 0.04), [fx, fz, th]);
  useEffect(() => () => deck.dispose(), [deck]);
  const carpet = "#6e1f2a";
  return (
    <group position={[wx, 0, wz]} rotation={[0, rotY, 0]}>
      {/* riser body (skirt) */}
      <mesh position={[0, th / 2, 0]} castShadow receiveShadow geometry={deck}>
        <meshPhysicalMaterial color="#3b332e" roughness={0.62} metalness={0.06} envMapIntensity={0.55} />
      </mesh>
      {/* carpet covering the deck */}
      <mesh position={[0, th + 0.01, 0]} receiveShadow>
        <boxGeometry args={[fx * 0.96, 0.02, fz * 0.96]} />
        <meshPhysicalMaterial color={carpet} roughness={0.86} metalness={0.02} sheen={0.3} envMapIntensity={0.4} />
      </mesh>
      {/* gold trim along the top edge */}
      <mesh position={[0, th + 0.002, 0]}>
        <boxGeometry args={[fx, 0.02, fz]} />
        <meshPhysicalMaterial color={accent} roughness={0.4} metalness={0.5} envMapIntensity={1.1} />
      </mesh>
      {/* two front steps */}
      <mesh position={[0, th * 0.34, fz / 2 + 0.07]} castShadow receiveShadow>
        <boxGeometry args={[fx * 0.46, th * 0.68, 0.14]} />
        <meshPhysicalMaterial color="#3b332e" roughness={0.62} metalness={0.06} envMapIntensity={0.55} />
      </mesh>
      <mesh position={[0, th * 0.5, fz / 2 + 0.07]} receiveShadow>
        <boxGeometry args={[fx * 0.46, 0.016, 0.14]} />
        <meshPhysicalMaterial color={carpet} roughness={0.86} metalness={0.02} envMapIntensity={0.4} />
      </mesh>
      {selected ? <SelectionRing radius={Math.max(fx, fz) / 2} /> : null}
    </group>
  );
}

/** PA speaker on a tripod stand with woofer + tweeter cones. */
function SpeakerStand({
  wx,
  wz,
  fx,
  fz,
  h,
  rotY,
  selected,
}: {
  wx: number;
  wz: number;
  fx: number;
  fz: number;
  h: number;
  rotY: number;
  selected: boolean;
}) {
  const cabW = Math.max(0.3, Math.min(fx, fz) * 1.1);
  const cabD = cabW * 0.8;
  const cabH = Math.min(0.66, Math.max(0.42, cabW * 1.7));
  const standH = Math.max(0.55, h - cabH);
  const cab = useMemo(() => new RoundedBoxGeometry(cabW, cabH, cabD, 2, 0.03), [cabW, cabH, cabD]);
  useEffect(() => () => cab.dispose(), [cab]);
  const cabHex = "#2c2c30";
  return (
    <group position={[wx, 0, wz]} rotation={[0, rotY, 0]}>
      {/* base */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[cabW * 0.42, cabW * 0.46, 0.04, 24]} />
        <meshPhysicalMaterial color="#1f1f22" roughness={0.6} metalness={0.3} envMapIntensity={0.6} />
      </mesh>
      {/* pole */}
      <mesh position={[0, standH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.026, standH, 16]} />
        <meshPhysicalMaterial color="#3a3a3e" roughness={0.45} metalness={0.6} envMapIntensity={0.8} />
      </mesh>
      {/* cabinet */}
      <mesh position={[0, standH + cabH / 2, 0]} castShadow receiveShadow geometry={cab}>
        <meshPhysicalMaterial color={cabHex} roughness={0.55} metalness={0.18} clearcoat={0.12} envMapIntensity={0.7} />
      </mesh>
      {/* woofer + tweeter on the front (+Z) face */}
      <mesh position={[0, standH + cabH * 0.38, cabD / 2 + 0.001]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[cabW * 0.3, cabW * 0.3, 0.02, 24]} />
        <meshPhysicalMaterial color="#141416" roughness={0.7} metalness={0.2} envMapIntensity={0.5} />
      </mesh>
      <mesh position={[0, standH + cabH * 0.72, cabD / 2 + 0.001]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[cabW * 0.12, cabW * 0.12, 0.02, 20]} />
        <meshPhysicalMaterial color="#141416" roughness={0.6} metalness={0.3} envMapIntensity={0.6} />
      </mesh>
      {selected ? <SelectionRing radius={cabW * 0.7} /> : null}
    </group>
  );
}

/** Projector / presentation screen on two legs with a thin frame. */
function ProjectorScreen({
  wx,
  wz,
  fx,
  h,
  rotY,
  selected,
}: {
  wx: number;
  wz: number;
  fx: number;
  h: number;
  rotY: number;
  selected: boolean;
}) {
  const screenW = Math.max(0.9, fx);
  const screenH = screenW * 0.62;
  const bottom = Math.max(0.5, h - screenH);
  const frame = useMemo(
    () => new RoundedBoxGeometry(screenW + 0.06, screenH + 0.06, 0.04, 2, 0.02),
    [screenW, screenH],
  );
  useEffect(() => () => frame.dispose(), [frame]);
  const legX = screenW * 0.42;
  return (
    <group position={[wx, 0, wz]} rotation={[0, rotY, 0]}>
      {[-legX, legX].map((x, i) => (
        <mesh key={i} position={[x, bottom / 2, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.028, bottom, 14]} />
          <meshPhysicalMaterial color="#3a3a3e" roughness={0.45} metalness={0.6} envMapIntensity={0.8} />
        </mesh>
      ))}
      {/* foot bar */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[screenW * 0.96, 0.04, 0.16]} />
        <meshPhysicalMaterial color="#2f2f33" roughness={0.5} metalness={0.4} envMapIntensity={0.6} />
      </mesh>
      {/* frame */}
      <mesh position={[0, bottom + screenH / 2, -0.012]} castShadow receiveShadow geometry={frame}>
        <meshPhysicalMaterial color="#2a2a2e" roughness={0.5} metalness={0.3} envMapIntensity={0.7} />
      </mesh>
      {/* screen surface */}
      <mesh position={[0, bottom + screenH / 2, 0.012]} receiveShadow>
        <boxGeometry args={[screenW, screenH, 0.012]} />
        <meshPhysicalMaterial color="#f4f4f0" roughness={0.55} metalness={0.0} envMapIntensity={0.5} />
      </mesh>
      {selected ? <SelectionRing radius={screenW * 0.5} /> : null}
    </group>
  );
}

/** Draped doorway frame for entrance / exit. */
function Doorway({
  wx,
  wz,
  fx,
  h,
  rotY,
  accent,
  selected,
}: {
  wx: number;
  wz: number;
  fx: number;
  h: number;
  rotY: number;
  accent: string;
  selected: boolean;
}) {
  const half = fx * 0.45;
  const postT = Math.min(0.1, fx * 0.12);
  return (
    <group position={[wx, 0, wz]} rotation={[0, rotY, 0]}>
      {[-half, half].map((x, i) => (
        <mesh key={i} position={[x, h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[postT, h, postT]} />
          <meshPhysicalMaterial color="#efe9dd" roughness={0.6} metalness={0.04} envMapIntensity={0.6} />
        </mesh>
      ))}
      <mesh position={[0, h - postT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[fx * 0.9 + postT, postT, postT]} />
        <meshPhysicalMaterial color="#efe9dd" roughness={0.6} metalness={0.04} envMapIntensity={0.6} />
      </mesh>
      {/* sheer drape swag */}
      <mesh position={[0, h * 0.62, 0]}>
        <boxGeometry args={[fx * 0.84, h * 0.66, 0.02]} />
        <meshPhysicalMaterial
          color={accent}
          roughness={0.7}
          metalness={0.02}
          transparent
          opacity={0.4}
          sheen={0.5}
          envMapIntensity={0.5}
        />
      </mesh>
      {selected ? <SelectionRing radius={half * 1.1} /> : null}
    </group>
  );
}

/** Photo booth: draped backdrop, side posts, valance, and a floral hoop. */
function PhotoBooth({
  wx,
  wz,
  fx,
  fz,
  rotY,
  accent,
  selected,
}: {
  wx: number;
  wz: number;
  fx: number;
  fz: number;
  rotY: number;
  accent: string;
  selected: boolean;
}) {
  const w = Math.max(1.0, fx);
  const boothH = 2.2;
  const postT = Math.min(0.12, w * 0.08);
  const backZ = -Math.max(0.3, fz) / 2;
  const backdrop = useMemo(() => new RoundedBoxGeometry(w, boothH * 0.92, 0.06, 2, 0.03), [w]);
  useEffect(() => () => backdrop.dispose(), [backdrop]);
  return (
    <group position={[wx, 0, wz]} rotation={[0, rotY, 0]}>
      {/* curtain backdrop */}
      <mesh position={[0, boothH * 0.46, backZ]} castShadow receiveShadow geometry={backdrop}>
        <meshPhysicalMaterial color={accent} roughness={0.7} metalness={0.02} sheen={0.6} sheenColor="#ffffff" envMapIntensity={0.5} />
      </mesh>
      {/* side posts */}
      {[-w / 2, w / 2].map((x, i) => (
        <mesh key={i} position={[x, boothH / 2, backZ]} castShadow>
          <cylinderGeometry args={[postT * 0.5, postT * 0.5, boothH, 14]} />
          <meshPhysicalMaterial color="#d9b25a" roughness={0.4} metalness={0.5} envMapIntensity={1.0} />
        </mesh>
      ))}
      {/* top valance bar */}
      <mesh position={[0, boothH, backZ]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[postT * 0.5, postT * 0.5, w + postT, 14]} />
        <meshPhysicalMaterial color="#d9b25a" roughness={0.4} metalness={0.5} envMapIntensity={1.0} />
      </mesh>
      {/* floral hoop in front of the backdrop */}
      <mesh position={[0, boothH * 0.55, backZ + 0.18]} castShadow>
        <torusGeometry args={[Math.min(0.5, w * 0.32), 0.05, 14, 36]} />
        <meshPhysicalMaterial color="#7d9b6a" roughness={0.7} metalness={0.03} envMapIntensity={0.5} />
      </mesh>
      {/* little floral accents on the hoop */}
      {[0.2, 1.6, 3.0, 4.6].map((a, i) => {
        const rr = Math.min(0.5, w * 0.32);
        return (
          <mesh key={i} position={[Math.cos(a) * rr, boothH * 0.55 + Math.sin(a) * rr, backZ + 0.18]} castShadow>
            <icosahedronGeometry args={[0.07, 1]} />
            <meshPhysicalMaterial color={accent} roughness={0.65} envMapIntensity={0.5} />
          </mesh>
        );
      })}
      {selected ? <SelectionRing radius={w * 0.55} /> : null}
    </group>
  );
}

const ROUND_TABLE_TYPES = new Set<CanvasObject["type"]>([
  "round_table",
  "gift_table",
  "dessert_table",
]);
const RECT_TABLE_TYPES = new Set<CanvasObject["type"]>(["rectangular_table", "buffet_table"]);

function LayoutObject3D({
  o,
  canvasW,
  canvasH,
  selected,
  floorOverlay = false,
}: {
  o: CanvasObject;
  canvasW: number;
  canvasH: number;
  selected: boolean;
  /** Large reserved / dance / aisle zones — thin decal so tables & chairs stay visible. */
  floorOverlay?: boolean;
}) {
  const [wx, wz] = useMemo(() => layoutObjectCenterXZ(o, canvasW, canvasH), [o, canvasW, canvasH]);
  const { fx, fz } = useMemo(() => objectFloorFootprint(o), [o]);
  const h = meshHeightForType(o.type);
  const rotY = (o.rotation * Math.PI) / 180;
  const color = parseLayoutColor(o.color);
  const { metalness, roughness } = meshMetalRough(o.type);
  const emissive = selected ? "#6b4c1a" : "#000000";
  const emissiveIntensity = selected ? 0.22 : 0;

  const roundedGeo = useMemo(() => {
    const r = Math.min(0.045, Math.max(0.012, Math.min(fx, h, fz) * 0.095));
    return new RoundedBoxGeometry(fx, h, fz, 2, r);
  }, [fx, h, fz]);

  const floorDecalH = 0.014;
  const floorDecalGeo = useMemo(
    () =>
      new RoundedBoxGeometry(fx, floorDecalH, fz, 1, Math.min(0.008, floorDecalH * 0.45)),
    [fx, fz],
  );

  useEffect(() => {
    return () => {
      roundedGeo.dispose();
      floorDecalGeo.dispose();
    };
  }, [roundedGeo, floorDecalGeo]);

  if (floorOverlay) {
    const hh = floorDecalH;
    return (
      <mesh position={[wx, hh / 2 + 0.002, wz]} rotation={[0, rotY, 0]} receiveShadow geometry={floorDecalGeo}>
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.34}
          depthWrite={false}
          roughness={0.78}
          metalness={0.04}
          clearcoat={0.04}
          envMapIntensity={0.35}
        />
      </mesh>
    );
  }

  if (o.type === "text_label") {
    return (
      <mesh position={[wx, h / 2 + 0.01, wz]} rotation={[0, rotY, 0]} receiveShadow geometry={roundedGeo}>
        <meshPhysicalMaterial
          color={color}
          roughness={0.88}
          metalness={0.02}
          transparent
          opacity={0.88}
          clearcoat={0.06}
          envMapIntensity={0.45}
        />
      </mesh>
    );
  }

  if (o.type === "sweetheart_table") {
    return (
      <SweetheartTable wx={wx} wz={wz} fx={fx} fz={fz} rotY={rotY} accent={color} selected={selected} />
    );
  }

  if (ROUND_TABLE_TYPES.has(o.type) || RECT_TABLE_TYPES.has(o.type)) {
    return (
      <ElegantTable
        wx={wx}
        wz={wz}
        fx={fx}
        fz={fz}
        h={h}
        rotY={rotY}
        accent={color}
        round={ROUND_TABLE_TYPES.has(o.type)}
        withCenterpiece={o.type === "round_table" || o.type === "rectangular_table"}
        selected={selected}
      />
    );
  }

  if (o.type === "ceremony_arch" || o.type === "garden_arbor") {
    return (
      <CeremonyArch
        wx={wx}
        wz={wz}
        fx={fx}
        h={h}
        rotY={rotY}
        accent={color}
        greenery={o.type === "garden_arbor"}
        selected={selected}
      />
    );
  }

  if (o.type === "stage") {
    return <Stage wx={wx} wz={wz} fx={fx} fz={fz} rotY={rotY} accent={color} selected={selected} />;
  }

  if (o.type === "speaker") {
    return <SpeakerStand wx={wx} wz={wz} fx={fx} fz={fz} h={h} rotY={rotY} selected={selected} />;
  }

  if (o.type === "projector_screen") {
    return <ProjectorScreen wx={wx} wz={wz} fx={fx} h={h} rotY={rotY} selected={selected} />;
  }

  if (o.type === "entrance" || o.type === "exit") {
    return <Doorway wx={wx} wz={wz} fx={fx} h={h} rotY={rotY} accent={color} selected={selected} />;
  }

  if (o.type === "photo_booth") {
    return <PhotoBooth wx={wx} wz={wz} fx={fx} fz={fz} rotY={rotY} accent={color} selected={selected} />;
  }

  if (o.type === "plant_decor" || o.type === "flower_stand") {
    const s = o.type === "plant_decor" ? 1 : 0.82;
    return (
      <group position={[wx, 0, wz]} rotation={[0, rotY, 0]} scale={s}>
        <FloralArrangement variant="stand" accent={color} />
        {selected ? <SelectionRing radius={0.32} /> : null}
      </group>
    );
  }

  // Reserved / VIP area (when small enough to be furniture, not a floor zone):
  // present it as an elegant draped VIP table rather than a plain block.
  if (o.type === "reserved_area") {
    const round = Math.abs(fx - fz) < Math.max(fx, fz) * 0.3;
    return (
      <ElegantTable
        wx={wx}
        wz={wz}
        fx={fx}
        fz={fz}
        h={h}
        rotY={rotY}
        accent={color}
        round={round}
        withCenterpiece
        selected={selected}
      />
    );
  }

  let primitive: ReactNode;
  if (o.type === "chair") {
    primitive = <Chair3D wx={wx} wz={wz} fx={fx} fz={fz} rotY={rotY} color={color} selected={selected} />;
  } else if (o.type === "aisle") {
    primitive = (
      <mesh position={[wx, h / 2, wz]} rotation={[0, rotY, 0]} receiveShadow geometry={roundedGeo}>
        <meshPhysicalMaterial
          color="#a8a29e"
          roughness={0.88}
          metalness={0.02}
          transparent
          opacity={0.45}
          depthWrite={false}
          envMapIntensity={0.35}
        />
      </mesh>
    );
  } else {
    primitive = (
      <mesh position={[wx, h / 2, wz]} rotation={[0, rotY, 0]} castShadow receiveShadow geometry={roundedGeo}>
        <meshPhysicalMaterial
          color={color}
          roughness={roughness * 0.9}
          metalness={metalness}
          clearcoat={0.18}
          clearcoatRoughness={0.48}
          envMapIntensity={0.88}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    );
  }

  const modelAsset = getModelAsset(o.type);
  if (modelAsset) {
    return (
      <GltfLayoutObject
        asset={modelAsset}
        wx={wx}
        wz={wz}
        fx={fx}
        fz={fz}
        rotY={rotY}
        selected={selected}
        fallback={primitive}
      />
    );
  }

  return primitive;
}

/** Visual-only chairs ringed around a table that has a seat count but no placed chairs. */
function AutoTableChairs({
  table,
  canvasW,
  canvasH,
}: {
  table: CanvasObject;
  canvasW: number;
  canvasH: number;
}) {
  const seat = table.meta.seatCount ?? 0;
  const chairBase = useMemo(() => defaultObjectForType("chair"), []);
  const asset = getModelAsset("chair");
  // Footprint used for both ring spacing and (fallback) sizing, matched to the
  // real-world chair width so 3D chairs don't overlap around the table.
  const chairWorldW = asset?.targetWidthMeters ?? 0.5;
  const chairPx = Math.max(chairBase.width, Math.round(chairWorldW / LAYOUT_SCENE_METERS_PER_PX));
  const fx = chairWorldW;
  const fz = chairWorldW;

  const chairs = useMemo(() => {
    if (seat <= 0) return [];
    const positions = computeChairRingPositions(
      table,
      Math.min(24, seat),
      chairPx,
      chairPx,
    );
    const [tcx, tcz] = layoutObjectCenterXZ(table, canvasW, canvasH);
    return positions.map((p, i) => {
      const chairObj = { ...chairBase, id: "", x: p.x, y: p.y, width: chairPx, height: chairPx } as CanvasObject;
      const [cx, cz] = layoutObjectCenterXZ(chairObj, canvasW, canvasH);
      // Face the seat toward the table center (model front + yawOffset point
      // away by default, so add PI to turn the chair inward).
      const yaw = Math.atan2(tcx - cx, tcz - cz) + Math.PI;
      return { id: `${table.id}-ac-${i}`, cx, cz, yaw };
    });
  }, [seat, table, chairBase, chairPx, canvasW, canvasH]);

  return (
    <>
      {chairs.map((c) => {
        const fallback = (
          <Chair3D wx={c.cx} wz={c.cz} fx={fx} fz={fz} rotY={c.yaw} color={chairBase.color} selected={false} />
        );
        return asset ? (
          <GltfLayoutObject
            key={c.id}
            asset={asset}
            wx={c.cx}
            wz={c.cz}
            fx={fx}
            fz={fz}
            rotY={c.yaw}
            selected={false}
            fallback={fallback}
          />
        ) : (
          <group key={c.id}>{fallback}</group>
        );
      })}
    </>
  );
}

export function Ballroom3DScene({
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
}: {
  objects: CanvasObject[];
  canvasWidth: number;
  canvasHeight: number;
  venueSetting: VenueSetting;
  selectedIds: string[];
  cameraPreset: BallroomCameraPreset;
  showWalls: boolean;
  showChandeliers: boolean;
  showFloorZones: boolean;
  navMode: BallroomNavMode;
  showPerson: boolean;
  autoChairs: boolean;
}) {
  const sel = useMemo(() => new Set(selectedIds), [selectedIds]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orbitControlsRef = useRef<any>(null);
  const mpp = LAYOUT_SCENE_METERS_PER_PX;
  const fw = canvasWidth * mpp;
  const fd = canvasHeight * mpp;
  const halfDiag = Math.hypot(fw / 2, fd / 2);
  const roomSpan = Math.max(canvasWidth, canvasHeight) * mpp;
  const orbit = useMemo(
    () => ballroomPreviewCamera(canvasWidth, canvasHeight, cameraPreset),
    [canvasWidth, canvasHeight, cameraPreset],
  );

  const { floorZones, furniture } = useMemo(() => {
    const fz: CanvasObject[] = [];
    const fur: CanvasObject[] = [];
    for (const o of objects) {
      if (objectIsLargeFloorZone(o, canvasWidth, canvasHeight)) fz.push(o);
      else fur.push(o);
    }
    return { floorZones: fz, furniture: fur };
  }, [objects, canvasWidth, canvasHeight]);

  const autoChairTables = useMemo(() => {
    if (!autoChairs) return [] as CanvasObject[];
    const ringed = new Set<string>();
    for (const o of objects) {
      if (o.type === "chair" && o.meta.chairRingForTableId) ringed.add(o.meta.chairRingForTableId);
    }
    return objects.filter(
      (o) =>
        isTableLikeType(o.type) &&
        o.type !== "sweetheart_table" &&
        (o.meta.seatCount ?? 0) > 0 &&
        !ringed.has(o.id),
    );
  }, [objects, autoChairs]);

  const personZ = fd * 0.34;

  return (
    <>
      <color attach="background" args={["#e8dfd6"]} />
      <fog attach="fog" args={["#d4c9bf", Math.max(4, halfDiag * 1.45), Math.max(18, halfDiag * 5.2)]} />

      <hemisphereLight intensity={0.62} color="#fff8ef" groundColor="#5c4d3f" />
      <directionalLight
        position={[roomSpan * 0.85, roomSpan * 0.95, roomSpan * 0.42]}
        intensity={0.95}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={roomSpan * 4}
        shadow-camera-left={-roomSpan * 1.2}
        shadow-camera-right={roomSpan * 1.2}
        shadow-camera-top={roomSpan * 1.2}
        shadow-camera-bottom={-roomSpan * 1.2}
        shadow-bias={-0.00025}
        color="#fff5e6"
      />

      {venueSetting === "outdoor_garden" ? (
        <Sky sunPosition={[50, 32, 40]} turbidity={6} mieCoefficient={0.005} />
      ) : null}

      {navMode === "orbit" ? (
        <CameraLookAt position={orbit.position} target={orbit.target} />
      ) : null}

      <BallroomRoom
        canvasW={canvasWidth}
        canvasH={canvasHeight}
        venueSetting={venueSetting}
        showWalls={showWalls}
      />

      {showPerson && navMode === "orbit" ? <Person position={[0, 0, personZ]} /> : null}
      {showChandeliers && venueSetting !== "outdoor_garden" ? (
        <ChandelierGroup roomSpan={roomSpan} />
      ) : null}

      {showFloorZones ? floorZones.map((o) => (
        <LayoutObject3D
          key={o.id}
          o={o}
          canvasW={canvasWidth}
          canvasH={canvasHeight}
          selected={sel.has(o.id)}
          floorOverlay
        />
      )) : null}

      {furniture.length > 0 ? (
        <group name="layout-furniture">
          {furniture.map((o) => (
            <LayoutObject3D
              key={o.id}
              o={o}
              canvasW={canvasWidth}
              canvasH={canvasHeight}
              selected={sel.has(o.id)}
            />
          ))}
        </group>
      ) : null}

      {autoChairTables.length > 0 ? (
        <group name="auto-table-chairs">
          {autoChairTables.map((t) => (
            <AutoTableChairs key={t.id} table={t} canvasW={canvasWidth} canvasH={canvasHeight} />
          ))}
        </group>
      ) : null}

      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.38}
        scale={roomSpan * 1.8}
        blur={2.2}
        far={8}
      />

      <Suspense fallback={null}>
        {venueSetting === "outdoor_garden" ? (
          <Environment preset="park" environmentIntensity={0.52} />
        ) : (
          <Environment preset="lobby" environmentIntensity={0.48} />
        )}
      </Suspense>

      {navMode === "walk" ? (
        <WalkControls startX={0} startZ={personZ} halfX={fw / 2} halfZ={fd / 2} />
      ) : (
        <>
          <OrbitControls
            ref={orbitControlsRef}
            makeDefault
            minPolarAngle={0.12}
            maxPolarAngle={Math.PI / 2 - 0.06}
            minDistance={orbit.minOrbitDist}
            maxDistance={orbit.maxOrbitDist}
            target={orbit.target}
            enablePan
            screenSpacePanning={false}
            panSpeed={0.9}
            enableDamping
            dampingFactor={0.08}
          />
          <OrbitKeyboardMove controlsRef={orbitControlsRef} halfX={fw / 2} halfZ={fd / 2} />
        </>
      )}
    </>
  );
}
